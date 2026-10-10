<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class NewsController extends Controller
{
    public function index()
    {
        // Fetch IHSG
        $ihsg = Cache::remember('ihsg_data', 300, function () {
            try {
                $response = Http::withHeaders(['User-Agent' => 'Mozilla/5.0'])
                    ->get('https://query1.finance.yahoo.com/v8/finance/chart/^JKSE');
                if ($response->successful()) {
                    $data = $response->json();
                    $meta = $data['chart']['result'][0]['meta'] ?? null;
                    if ($meta) {
                        return [
                            'price' => $meta['regularMarketPrice'] ?? 0,
                            'previous_close' => $meta['previousClose'] ?? 0,
                            'change' => ($meta['regularMarketPrice'] ?? 0) - ($meta['previousClose'] ?? 0),
                        ];
                    }
                }
            } catch (\Exception $e) {}
            return null;
        });

        // Fetch USD to IDR
        $exchange = Cache::remember('usd_idr_data', 3600, function () {
            try {
                $response = Http::get('https://api.exchangerate-api.com/v4/latest/USD');
                if ($response->successful()) {
                    return $response->json()['rates']['IDR'] ?? null;
                }
            } catch (\Exception $e) {}
            return null;
        });

        // Fetch News (CNBC Indonesia RSS)
        $news = Cache::remember('cnbc_news', 1800, function () {
            try {
                $response = Http::get('https://www.cnbcindonesia.com/market/rss');
                if ($response->successful()) {
                    $xml = simplexml_load_string($response->body(), 'SimpleXMLElement', LIBXML_NOCDATA);
                    $items = [];
                    $count = 0;
                    foreach ($xml->channel->item as $item) {
                        if ($count >= 15) break;
                        
                        // Extract image from description or enclosure
                        $image = null;
                        if (isset($item->enclosure) && isset($item->enclosure['url'])) {
                            $image = (string)$item->enclosure['url'];
                        } else if (preg_match('/<img[^>]+src="([^">]+)"/', (string)$item->description, $matches)) {
                            $image = $matches[1];
                        }
                        
                        $description = strip_tags((string)$item->description);
                        
                        $items[] = [
                            'title' => (string)$item->title,
                            'link' => (string)$item->link,
                            'pubDate' => date('d M Y, H:i', strtotime((string)$item->pubDate)),
                            'description' => $description,
                            'image' => $image,
                        ];
                        $count++;
                    }
                    return $items;
                }
            } catch (\Exception $e) {}
            return [];
        });

        return Inertia::render('News/Index', [
            'ihsg' => $ihsg,
            'usdToIdr' => $exchange,
            'news' => $news
        ]);
    }
}
