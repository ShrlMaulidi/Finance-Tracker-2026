<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Debt;
use App\Models\Target;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Helper to gather all report data and summaries based on filters.
     */
    protected function getReportData(Request $request): array
    {
        Carbon::setLocale('id');
        $user = Auth::user();
        $user_id = $user->id;

        $filterType = $request->input('filter_type', 'month'); // month, year, all
        $filterMonth = (int) $request->input('filter_month', Carbon::now()->month);
        $filterYear = (int) $request->input('filter_year', Carbon::now()->year);

        $query = Transaction::where('user_id', $user_id);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        if ($filterType === 'month') {
            $query->whereMonth('date', $filterMonth)->whereYear('date', $filterYear);
            $monthName = $monthNames[$filterMonth] ?? 'Bulan '.$filterMonth;
            $periodLabel = "{$monthName} {$filterYear}";
            $fileSlug = "Bulan_{$monthName}_{$filterYear}";
        } elseif ($filterType === 'year') {
            $query->whereYear('date', $filterYear);
            $periodLabel = "Tahun {$filterYear}";
            $fileSlug = "Tahun_{$filterYear}";
        } else {
            $periodLabel = 'Semua Periode';
            $fileSlug = 'Semua_Periode';
        }

        $transactions = $query->orderBy('date', 'desc')->get();

        // 1. Total Pemasukan & Pengeluaran (Filtered)
        $totalPemasukan = (float) $transactions->where('type', 'pemasukan')->sum('amount');
        $totalPengeluaran = (float) $transactions->where('type', 'pengeluaran')->sum('amount');
        $totalTabunganTrx = (float) $transactions->where('type', 'tabungan')->sum('amount');
        $netCashflow = $totalPemasukan - $totalPengeluaran - $totalTabunganTrx;

        // 2. Breakdown by Payment Method (Filtered)
        $pemasukanByMethod = $transactions->where('type', 'pemasukan')->groupBy('payment_method')->map->sum('amount');
        $pengeluaranByMethod = $transactions->where('type', 'pengeluaran')->groupBy('payment_method')->map->sum('amount');

        // 3. All-time Balance & Balance by Method (All Time) - dioptimasi via SQL Agregasi
        $methodTotals = Transaction::where('user_id', $user_id)
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, type, SUM(amount) as total')
            ->groupBy('payment_method', 'type')
            ->get();

        $typeTotals = Transaction::where('user_id', $user_id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $allPemasukan = (float) $typeTotals->get('pemasukan', 0);
        $allPengeluaran = (float) $typeTotals->get('pengeluaran', 0);
        $allTabungan = (float) $typeTotals->get('tabungan', 0);
        $totalSaldoAktif = $allPemasukan - $allPengeluaran - $allTabungan;

        $uniqueMethods = $methodTotals->pluck('payment_method')->unique()->values();
        $saldoByMethod = [];
        foreach ($uniqueMethods as $method) {
            $in = (float) $methodTotals->where('payment_method', $method)->where('type', 'pemasukan')->sum('total');
            $out = (float) $methodTotals->where('payment_method', $method)->where('type', 'pengeluaran')->sum('total');
            $tab = (float) $methodTotals->where('payment_method', $method)->where('type', 'tabungan')->sum('total');
            $saldoByMethod[$method] = $in - $out - $tab;
        }

        // 4. Breakdown by Category (Filtered)
        $pengeluaranByCat = $transactions->where('type', 'pengeluaran')
            ->groupBy('category')
            ->map(function ($items, $cat) use ($totalPengeluaran) {
                $sum = (float) $items->sum('amount');

                return [
                    'category' => $cat ?: 'Lainnya',
                    'amount' => $sum,
                    'count' => $items->count(),
                    'percentage' => $totalPengeluaran > 0 ? round(($sum / $totalPengeluaran) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('amount')
            ->values()
            ->take(6);

        $pemasukanByCat = $transactions->where('type', 'pemasukan')
            ->groupBy('category')
            ->map(function ($items, $cat) use ($totalPemasukan) {
                $sum = (float) $items->sum('amount');

                return [
                    'category' => $cat ?: 'Lainnya',
                    'amount' => $sum,
                    'count' => $items->count(),
                    'percentage' => $totalPemasukan > 0 ? round(($sum / $totalPemasukan) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('amount')
            ->values()
            ->take(6);

        // 5. Total Hutang & Piutang (All Time Active)
        $totalHutang = (float) Debt::where('user_id', $user_id)->where('type', 'hutang')->where('status', 'belum_lunas')->sum('remaining_amount');
        $totalPiutang = (float) Debt::where('user_id', $user_id)->where('type', 'piutang')->where('status', 'belum_lunas')->sum('remaining_amount');

        // 6. Total Tabungan & Target (All Time) + Rincian Pos Tabungan
        $targets = Target::where('user_id', $user_id)->orderBy('current_amount', 'desc')->get();
        $tabunganItems = $targets->map(function ($target) {
            $curr = (float) $target->current_amount;
            $tgt = (float) $target->target_amount;

            return [
                'id' => $target->id,
                'name' => $target->name,
                'category' => $target->category ?: 'Tabungan Impian',
                'current' => $curr,
                'target' => $tgt,
                'status' => $target->status ?: 'Berjalan',
                'percentage' => $tgt > 0 ? min(100, round(($curr / $tgt) * 100, 1)) : 0,
            ];
        });

        // Cek jika ada transaksi tabungan di luar nama target via SQL aggregate
        $targetNames = $targets->pluck('name')->toArray();
        $extraTabunganQuery = Transaction::where('user_id', $user_id)->where('type', 'tabungan');
        if (! empty($targetNames)) {
            $extraTabunganQuery->whereNotIn('category', $targetNames);
        }
        $extraTabungan = $extraTabunganQuery->selectRaw('category, SUM(amount) as current')
            ->groupBy('category')
            ->get()
            ->map(function ($row) {
                $sum = (float) $row->current;

                return [
                    'id' => null,
                    'name' => $row->category ?: 'Tabungan Lainnya',
                    'category' => 'Tabungan',
                    'current' => $sum,
                    'target' => $sum,
                    'status' => 'Berjalan',
                    'percentage' => 100,
                ];
            });

        $allTabunganList = $tabunganItems->concat($extraTabungan)->sortByDesc('current')->values();
        $totalDanaTabungan = (float) $allTabunganList->sum('current');
        if ($totalDanaTabungan == 0 && $allTabungan > 0) {
            $totalDanaTabungan = $allTabungan;
        }

        // Tiga Pilar Saldo Keuangan:
        // 1. Sisa Saldo Kas Siap Pakai (yang sudah dikurangi tabungan)
        $saldoKasBebas = $allPemasukan - $allPengeluaran - $totalDanaTabungan;

        // 2. Total Dana Tabungan (Tersimpan)
        // $totalDanaTabungan

        // 3. Total Saldo Gabungan (Kas Siap Pakai + Tabungan) = All Pemasukan - All Pengeluaran
        $totalSaldoGabungan = $saldoKasBebas + $totalDanaTabungan;

        // 7. Tagihan Rutin Summary (Bills) for this period
        $monthStr = sprintf('%04d-%02d', $filterYear, $filterMonth);
        $activeBills = Bill::where('user_id', $user_id)->where('is_active', true);
        $totalBillsCount = $activeBills->count();
        $totalBillsAmount = (float) $activeBills->sum('amount');
        $paidBillsQuery = BillPayment::where('user_id', $user_id);
        if ($filterType === 'month') {
            $paidBillsQuery->where('month', $monthStr);
        } elseif ($filterType === 'year') {
            $paidBillsQuery->where('month', 'like', "{$filterYear}-%");
        }
        $paidBillsCount = (int) $paidBillsQuery->count();
        $paidBillsAmount = (float) $paidBillsQuery->sum('amount');
        $unpaidBillsAmount = max(0, $totalBillsAmount - $paidBillsAmount);

        // 8. Financial Health Metrics & Net Worth
        $savingsRate = $totalPemasukan > 0 ? round((($totalPemasukan - $totalPengeluaran) / $totalPemasukan) * 100, 1) : 0;
        $expenseRatio = $totalPemasukan > 0 ? min(100, round(($totalPengeluaran / $totalPemasukan) * 100, 1)) : 0;
        $totalAssets = $totalSaldoGabungan + $totalPiutang;
        $totalLiabilities = $totalHutang;
        $netWorth = $totalAssets - $totalLiabilities;

        // Available options for filter
        $availableYears = Transaction::where('user_id', $user_id)
            ->selectRaw('YEAR(date) as year')
            ->distinct()
            ->pluck('year')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [Carbon::now()->year];
        }
        rsort($availableYears);

        return [
            'user' => $user,
            'filterType' => $filterType,
            'filterMonth' => $filterMonth,
            'filterYear' => $filterYear,
            'periodLabel' => $periodLabel,
            'fileSlug' => $fileSlug,
            'availableYears' => $availableYears,
            'generatedAt' => Carbon::now('Asia/Jakarta')->translatedFormat('d F Y, H:i').' WIB',
            'summary' => [
                'pemasukan' => $totalPemasukan,
                'pengeluaran' => $totalPengeluaran,
                'tabungan_trx' => $totalTabunganTrx,
                'net' => $netCashflow,
                'savings_rate' => $savingsRate,
                'expense_ratio' => $expenseRatio,
                'is_surplus' => $netCashflow >= 0,
                'total_assets' => $totalAssets,
                'total_liabilities' => $totalLiabilities,
                'net_worth' => $netWorth,
                'top_pengeluaran_categories' => $pengeluaranByCat,
                'top_pemasukan_categories' => $pemasukanByCat,
                'bills' => [
                    'total_count' => $totalBillsCount,
                    'total_amount' => $totalBillsAmount,
                    'paid_count' => $paidBillsCount,
                    'paid_amount' => $paidBillsAmount,
                    'unpaid_amount' => $unpaidBillsAmount,
                ],
                'pemasukan_by_method' => $pemasukanByMethod,
                'pengeluaran_by_method' => $pengeluaranByMethod,
                'saldo_aktif' => $saldoKasBebas, // Sisa Saldo Kas Siap Pakai (dikurangi tabungan)
                'saldo_bebas' => $saldoKasBebas, // Alias eksplisit
                'total_tabungan' => $totalDanaTabungan, // Total dana tabungan
                'total_saldo_gabungan' => $totalSaldoGabungan, // Total saldo ditambah tabungan (Kas + Tabungan)
                'rincian_tabungan' => $allTabunganList, // Rincian daftar isi tabungan
                'saldo_by_method' => $saldoByMethod,
                'hutang' => $totalHutang,
                'piutang' => $totalPiutang,
                'tabungan' => $totalDanaTabungan,
            ],
            'transactions' => $transactions,
        ];
    }

    public function index(Request $request)
    {
        if (! Auth::user()->canAccess('report')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'laporan',
                'title' => 'Menu Laporan Keuangan Terkunci',
                'subtitle' => 'Analisis Finansial Komprehensif & Ekspor Resmi Khusus Member Pro',
                'description' => 'Pantau kesehatan arus kas masuk-keluar, rasio belanja, struktur saldo siap pakai vs tabungan, neraca kekayaan bersih, serta ekspor dokumen resmi PDF & Excel.',
                'benefits' => [
                    'Laporan arus kas komprehensif (Per Bulan, Per Tahun, Semua Waktu)',
                    'Indikator visual rasio belanja vs surplus tabungan',
                    '3 Pilar Struktur Saldo (Kas Siap Pakai, Tabungan, Total Riil)',
                    'Neraca Aset vs Liabilitas & Kekayaan Bersih (Net Worth)',
                    'Download dokumen resmi format PDF berstandar akuntansi',
                    'Ekspor data lengkap ke Spreadsheet Excel rapi & siap cetak',
                ],
            ]);
        }

        $data = $this->getReportData($request);

        return Inertia::render('Laporan/Index', [
            'filters' => [
                'type' => $data['filterType'],
                'month' => $data['filterMonth'],
                'year' => $data['filterYear'],
            ],
            'periodLabel' => $data['periodLabel'],
            'availableYears' => $data['availableYears'],
            'summary' => $data['summary'],
            'transactions' => $data['transactions']->values()->take(100),
            'totalTransactionsCount' => $data['transactions']->count(),
        ]);
    }

    public function exportPdf(Request $request)
    {
        if (! Auth::user()->canAccess('report_export')) {
            abort(403, 'Fitur ekspor PDF hanya tersedia untuk member Pro.');
        }

        $data = $this->getReportData($request);

        $pdf = Pdf::loadView('reports.finance_pdf', $data);
        $pdf->getDomPDF()->getOptions()->set('isPhpEnabled', true);
        $pdf->setPaper('a4', 'portrait');
        $filename = 'Laporan_Keuangan_'.$data['fileSlug'].'.pdf';

        return $pdf->download($filename);
    }

    public function exportExcel(Request $request)
    {
        if (! Auth::user()->canAccess('report_export')) {
            abort(403, 'Fitur ekspor Excel hanya tersedia untuk member Pro.');
        }

        $data = $this->getReportData($request);
        $summary = $data['summary'];
        $transactions = $data['transactions'];

        $spreadsheet = new Spreadsheet;
        $spreadsheet->getDefaultStyle()->getFont()->setName('Segoe UI');
        $spreadsheet->getDefaultStyle()->getFont()->setSize(10);

        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Keuangan');
        $sheet->setShowGridLines(true);

        $currencyFormat = '"Rp "#,##0;-"Rp "#,##0;"Rp "0';

        // 1. Top Header Banner (Row 1-2 merged)
        $sheet->mergeCells('A1:H2');
        $sheet->setCellValue('A1', "FINANCETRACK — LAPORAN KEUANGAN\n".strtoupper($data['periodLabel']));
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(13)->setColor(new Color('FFFFFFFF'));
        $sheet->getStyle('A1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0F172A');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
        $sheet->getRowDimension(1)->setRowHeight(22);
        $sheet->getRowDimension(2)->setRowHeight(22);

        // 2. Metadata Block (Row 4)
        $sheet->setCellValue('A4', 'Periode Laporan:');
        $sheet->setCellValue('B4', $data['periodLabel']);
        $sheet->setCellValue('D4', 'Nama Pengguna:');
        $sheet->setCellValue('E4', $data['user']->name.' ('.$data['user']->email.')');
        $sheet->setCellValue('G4', 'Waktu Unduh:');
        $sheet->setCellValue('H4', $data['generatedAt']);

        $sheet->getStyle('A4')->getFont()->setBold(true)->setColor(new Color('FF64748B'));
        $sheet->getStyle('B4')->getFont()->setBold(true)->setColor(new Color('FF0F172A'));
        $sheet->getStyle('D4')->getFont()->setBold(true)->setColor(new Color('FF64748B'));
        $sheet->getStyle('E4')->getFont()->setBold(true)->setColor(new Color('FF0F172A'));
        $sheet->getStyle('G4')->getFont()->setBold(true)->setColor(new Color('FF64748B'));
        $sheet->getStyle('H4')->getFont()->setBold(true)->setColor(new Color('FF0F172A'));

        // 3. Side-by-Side Executive Summary Tables (Rows 6-10)
        // Box 1: Arus Kas Periode Ini (Col A:C)
        $sheet->mergeCells('A6:C6');
        $sheet->setCellValue('A6', 'RINGKASAN ARUS KAS (PERIODE INI)');
        $sheet->getStyle('A6')->getFont()->setBold(true)->setSize(10)->setColor(new Color('FF0369A1'));
        $sheet->getStyle('A6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFE0F2FE');
        $sheet->getStyle('A6')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(6)->setRowHeight(22);

        $sheet->mergeCells('A7:B7');
        $sheet->setCellValue('A7', 'Total Pemasukan');
        $sheet->setCellValue('C7', $summary['pemasukan']);
        $sheet->getStyle('C7')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('C7')->getFont()->setBold(true)->setColor(new Color('FF059669'));

        $sheet->mergeCells('A8:B8');
        $sheet->setCellValue('A8', 'Total Pengeluaran');
        $sheet->setCellValue('C8', $summary['pengeluaran']);
        $sheet->getStyle('C8')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('C8')->getFont()->setBold(true)->setColor(new Color('FFE11D48'));

        $sheet->mergeCells('A9:B9');
        $sheet->setCellValue('A9', 'Total Tabungan');
        $sheet->setCellValue('C9', $summary['tabungan_trx'] ?? 0);
        $sheet->getStyle('C9')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('C9')->getFont()->setBold(true)->setColor(new Color('FF0284C7'));

        $sheet->mergeCells('A10:B10');
        $sheet->setCellValue('A10', 'Arus Kas Bersih (Net)');
        $sheet->setCellValue('C10', $summary['net']);
        $sheet->getStyle('C10')->getNumberFormat()->setFormatCode($currencyFormat);
        $netColor = $summary['net'] >= 0 ? 'FF059669' : 'FFE11D48';
        $sheet->getStyle('C10')->getFont()->setBold(true)->setColor(new Color($netColor));

        $sheet->getStyle('A7:A10')->getFont()->setBold(true)->setColor(new Color('FF334155'));
        $sheet->getStyle('A6:C10')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFCBD5E1'));

        // Box 2: Status Keuangan Keseluruhan (Col E:H)
        $sheet->mergeCells('E6:H6');
        $sheet->setCellValue('E6', 'STRUKTUR SALDO & KEUANGAN (ALL-TIME)');
        $sheet->getStyle('E6')->getFont()->setBold(true)->setSize(10)->setColor(new Color('FF6B21A8'));
        $sheet->getStyle('E6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF3E8FF');
        $sheet->getStyle('E6')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->mergeCells('E7:G7');
        $sheet->setCellValue('E7', 'Sisa Saldo Kas Siap Pakai (Bebas)');
        $sheet->setCellValue('H7', $summary['saldo_bebas']);
        $sheet->getStyle('H7')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('H7')->getFont()->setBold(true)->setColor(new Color('FF0284C7'));

        $sheet->mergeCells('E8:G8');
        $sheet->setCellValue('E8', 'Total Dana Tabungan Tersimpan');
        $sheet->setCellValue('H8', $summary['total_tabungan']);
        $sheet->getStyle('H8')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('H8')->getFont()->setBold(true)->setColor(new Color('FFD97706'));

        $sheet->mergeCells('E9:G9');
        $sheet->setCellValue('E9', 'Total Saldo Gabungan (Kas + Tabungan)');
        $sheet->setCellValue('H9', $summary['total_saldo_gabungan']);
        $sheet->getStyle('H9')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('H9')->getFont()->setBold(true)->setColor(new Color('FF059669'));

        $sheet->mergeCells('E10:G10');
        $sheet->setCellValue('E10', 'Kekayaan Bersih (Aset - Hutang)');
        $sheet->setCellValue('H10', $summary['net_worth']);
        $sheet->getStyle('H10')->getNumberFormat()->setFormatCode($currencyFormat);
        $sheet->getStyle('H10')->getFont()->setBold(true)->setColor(new Color('FF7C3AED'));

        $sheet->getStyle('E7:E10')->getFont()->setBold(true)->setColor(new Color('FF334155'));
        $sheet->getStyle('E6:H10')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFCBD5E1'));

        // 4. Transactions Table Header (Row 13)
        $sheet->setCellValue('A12', 'DAFTAR TRANSAKSI RINCI ('.$data['periodLabel'].')');
        $sheet->getStyle('A12')->getFont()->setBold(true)->setSize(11)->setColor(new Color('FF0F172A'));

        $tableHeaderRow = 13;
        $headers = [
            'A' => 'No',
            'B' => 'Tanggal',
            'C' => 'Judul Transaksi',
            'D' => 'Keterangan / Catatan',
            'E' => 'Kategori',
            'F' => 'Metode Pembayaran',
            'G' => 'Tipe',
            'H' => 'Nominal (Rp)',
        ];

        foreach ($headers as $col => $headerText) {
            $cell = "{$col}{$tableHeaderRow}";
            $sheet->setCellValue($cell, $headerText);
            $sheet->getStyle($cell)->getFont()->setBold(true)->setColor(new Color('FFFFFFFF'));
            $sheet->getStyle($cell)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0F172A');
            $sheet->getStyle($cell)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            if (in_array($col, ['A', 'B', 'G'])) {
                $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            } elseif ($col === 'H') {
                $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            } else {
                $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            }
        }
        $sheet->getRowDimension($tableHeaderRow)->setRowHeight(25);

        // 5. Data Rows
        $currentRow = $tableHeaderRow + 1;
        foreach ($transactions as $index => $trx) {
            $sheet->setCellValue("A{$currentRow}", $index + 1);
            $sheet->setCellValue("B{$currentRow}", Carbon::parse($trx->date)->format('Y-m-d'));
            $sheet->setCellValue("C{$currentRow}", $trx->title ?? '-');
            $sheet->setCellValue("D{$currentRow}", $trx->description ?? '-');
            $sheet->setCellValue("E{$currentRow}", $trx->category ?? '-');
            $sheet->setCellValue("F{$currentRow}", $trx->payment_method ?? '-');
            $sheet->setCellValue("G{$currentRow}", ucfirst($trx->type));
            $sheet->setCellValue("H{$currentRow}", (float) $trx->amount);

            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$currentRow}")->getNumberFormat()->setFormatCode($currencyFormat);
            $sheet->getStyle("H{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Styling per type
            if ($trx->type === 'pemasukan') {
                $sheet->getStyle("G{$currentRow}")->getFont()->setColor(new Color('FF059669'))->setBold(true);
                $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FF059669'))->setBold(true);
            } elseif ($trx->type === 'pengeluaran') {
                $sheet->getStyle("G{$currentRow}")->getFont()->setColor(new Color('FFE11D48'))->setBold(true);
                $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FFE11D48'))->setBold(true);
            } else {
                $sheet->getStyle("G{$currentRow}")->getFont()->setColor(new Color('FF0284C7'))->setBold(true);
                $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FF0284C7'))->setBold(true);
            }

            // Alternating Zebra Background
            if ($index % 2 === 1) {
                $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
            }

            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFE2E8F0'));
            $sheet->getRowDimension($currentRow)->setRowHeight(20);
            $currentRow++;
        }

        // 6. Summary Rows at Bottom of Table
        if (count($transactions) > 0) {
            $sheet->mergeCells("A{$currentRow}:G{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'Subtotal Pemasukan:');
            $sheet->setCellValue("H{$currentRow}", $summary['pemasukan']);
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFont()->setBold(true);
            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$currentRow}")->getNumberFormat()->setFormatCode($currencyFormat);
            $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FF059669'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFCBD5E1'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF1F5F9');
            $currentRow++;

            $sheet->mergeCells("A{$currentRow}:G{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'Subtotal Pengeluaran:');
            $sheet->setCellValue("H{$currentRow}", $summary['pengeluaran']);
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFont()->setBold(true);
            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$currentRow}")->getNumberFormat()->setFormatCode($currencyFormat);
            $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FFE11D48'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFCBD5E1'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF1F5F9');
            $currentRow++;

            if (isset($summary['tabungan_trx']) && $summary['tabungan_trx'] > 0) {
                $sheet->mergeCells("A{$currentRow}:G{$currentRow}");
                $sheet->setCellValue("A{$currentRow}", 'Subtotal Tabungan:');
                $sheet->setCellValue("H{$currentRow}", $summary['tabungan_trx']);
                $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFont()->setBold(true);
                $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("H{$currentRow}")->getNumberFormat()->setFormatCode($currencyFormat);
                $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color('FF0284C7'));
                $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FFCBD5E1'));
                $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF1F5F9');
                $currentRow++;
            }

            $sheet->mergeCells("A{$currentRow}:G{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'Arus Kas Bersih (Surplus / Defisit):');
            $sheet->setCellValue("H{$currentRow}", $summary['net']);
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFont()->setBold(true);
            $sheet->getStyle("A{$currentRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$currentRow}")->getNumberFormat()->setFormatCode($currencyFormat);
            $sheet->getStyle("H{$currentRow}")->getFont()->setColor(new Color($netColor));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('FF0F172A'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_DOUBLE)->setColor(new Color('FF0F172A'));
            $sheet->getStyle("A{$currentRow}:H{$currentRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFE2E8F0');
            $sheet->getRowDimension($currentRow)->setRowHeight(24);
        }

        // Enable AutoFilter on transaction table rows only (excluding bottom summary rows)
        if (count($transactions) > 0) {
            $lastDataRow = $tableHeaderRow + count($transactions);
            $sheet->setAutoFilter("A{$tableHeaderRow}:H{$lastDataRow}");
        }

        // Column Auto-width with padding
        foreach (array_keys($headers) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Laporan_Keuangan_'.$data['fileSlug'].'.xlsx';
        $writer = new Xlsx($spreadsheet);

        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment;filename="'.$filename.'"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}
