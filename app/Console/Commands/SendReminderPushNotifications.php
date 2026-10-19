<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationService;
use App\Services\WebPushService;
use Illuminate\Console\Command;

class SendReminderPushNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminders:send-push';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim Web Push Notifications untuk pengingat jatuh tempo tagihan rutin dan target tabungan';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai pengecekan pengingat tempo untuk Push Notification...');

        $users = User::whereHas('pushSubscriptions')->get();

        if ($users->isEmpty()) {
            $this->info('Tidak ada user yang mendaftarkan perangkat Push Notification.');

            return Command::SUCCESS;
        }

        $totalSent = 0;

        foreach ($users as $user) {
            $reminders = NotificationService::getRemindersForUser($user);
            $urgentItems = array_filter($reminders['all'], function ($item) {
                // Urgent: overdue, today, or due tomorrow (diff_days <= 1)
                return in_array($item['status'], ['terlambat', 'hari_ini'], true) ||
                    ($item['status'] === 'segera' && $item['diff_days'] <= 1);
            });

            if (empty($urgentItems)) {
                continue;
            }

            $count = count($urgentItems);
            $firstItem = reset($urgentItems);

            if ($count === 1) {
                $iconPrefix = $firstItem['status'] === 'terlambat' ? '🚨' : ($firstItem['status'] === 'hari_ini' ? '⏰' : '🔔');
                $title = "{$iconPrefix} Pengingat: {$firstItem['title']}";
                $body = "{$firstItem['status_label']} • {$firstItem['amount_formatted']}. {$firstItem['message']}";
                $url = $firstItem['url'];
            } else {
                $title = "⏰ {$count} Pengingat Tempo Memerlukan Perhatian";
                $body = "Ada {$reminders['bills_count']} tagihan & {$reminders['targets_count']} target mendekati atau melewati tempo.";
                $url = route('dashboard');
            }

            $delivered = WebPushService::sendToUser(
                user: $user,
                title: $title,
                body: $body,
                url: $url,
                tag: 'financetrack-daily-reminders-'.now()->format('Ymd')
            );

            if ($delivered > 0) {
                $totalSent += $delivered;
                $this->line("✓ Push terkirim ke user #{$user->id} ({$user->name}): {$delivered} perangkat");
            }
        }

        $this->info("Selesai! Total {$totalSent} push notification berhasil dikirimkan.");

        return Command::SUCCESS;
    }
}
