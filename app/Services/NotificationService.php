<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Target;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    /**
     * Savings targets start showing up as reminders this many days before their target date.
     */
    private const TARGET_REMINDER_DAYS = 30;

    /**
     * Get upcoming, due, and overdue reminders for a user (Bills & Savings Goals),
     * cached to provide fast zero-latency SPA page transitions.
     *
     * @return array{
     *     urgent_count: int,
     *     total_count: int,
     *     bills_count: int,
     *     targets_count: int,
     *     all: array<int, array<string, mixed>>,
     *     bills: array<int, array<string, mixed>>,
     *     targets: array<int, array<string, mixed>>
     * }
     */
    public static function getRemindersForUser(User $user, bool $forceRefresh = false): array
    {
        $cacheKey = "user_{$user->id}_reminders_v1";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 60, function () use ($user) {
            return self::buildRemindersForUser($user);
        });
    }

    /**
     * Clear cached reminders for a user when bills or targets change.
     */
    public static function clearUserReminderCache(int|User $user): void
    {
        $userId = $user instanceof User ? $user->id : $user;
        Cache::forget("user_{$userId}_reminders_v1");
    }

    /**
     * Build reminders from database.
     *
     * @return array<string, mixed>
     */
    public static function buildRemindersForUser(User $user): array
    {
        Carbon::setLocale('id');
        $today = Carbon::today();
        $currentMonth = $today->format('Y-m');

        // 1. Tagihan Rutin (Bills)
        $rawBills = Bill::where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['payments' => function ($query) use ($currentMonth) {
                $query->where('month', $currentMonth);
            }])
            ->get();

        $billReminders = [];

        foreach ($rawBills as $bill) {
            $payment = $bill->payments->first();
            $isPaid = $payment && ((float) $payment->amount >= (float) $bill->amount);

            // Skip bills that are completely paid for the current month
            if ($isPaid) {
                continue;
            }

            $clampedDay = min((int) $bill->due_day, $today->daysInMonth);
            $dueDate = Carbon::create($today->year, $today->month, $clampedDay)->startOfDay();
            $diffDays = (int) $today->diffInDays($dueDate, false); // negative if past due

            $paidAmount = $payment ? (float) $payment->amount : 0.0;
            $remainingBill = max(0.0, (float) $bill->amount - $paidAmount);

            // Status and urgency resolution
            if ($diffDays < 0) {
                $status = 'terlambat';
                $urgency = 'danger';
                $absDiff = abs($diffDays);
                $statusLabel = "Terlambat {$absDiff} hari";
                $message = "Tagihan {$bill->name} jatuh tempo pada {$dueDate->translatedFormat('d M Y')}".($paidAmount > 0 ? ' (Kurang Rp '.number_format($remainingBill, 0, ',', '.').')' : ' dan belum dibayar.');
            } elseif ($diffDays === 0) {
                $status = 'hari_ini';
                $urgency = 'warning';
                $statusLabel = 'Jatuh tempo Hari Ini!';
                $message = "Tagihan {$bill->name} jatuh tempo hari ini! Segera lakukan pembayaran.";
            } elseif ($diffDays <= max(7, (int) ($bill->reminder_days ?? 3))) {
                $status = 'segera';
                $urgency = $diffDays <= 3 ? 'warning' : 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "Tagihan {$bill->name} jatuh tempo dalam {$diffDays} hari ({$dueDate->translatedFormat('d M')}).";
            } else {
                $status = 'mendatang';
                $urgency = 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "Tagihan {$bill->name} jatuh tempo pada {$dueDate->translatedFormat('d M Y')}.";
            }

            $billReminders[] = [
                'id' => "bill_{$bill->id}",
                'item_id' => $bill->id,
                'type' => 'bill',
                'title' => $bill->name,
                'category' => $bill->category_name ?: 'Tagihan Rutin',
                'amount' => (float) $bill->amount,
                'amount_formatted' => 'Rp '.number_format((float) $bill->amount, 0, ',', '.'),
                'remaining_amount' => $remainingBill,
                'remaining_formatted' => 'Rp '.number_format($remainingBill, 0, ',', '.'),
                'is_partially_paid' => $paidAmount > 0,
                'due_date' => $dueDate->format('Y-m-d'),
                'due_date_formatted' => $dueDate->translatedFormat('d M Y'),
                'diff_days' => $diffDays,
                'status' => $status,
                'status_label' => $statusLabel,
                'urgency' => $urgency,
                'message' => $message,
                'url' => route('tagihan.index'),
            ];
        }

        // 2. Tabungan & Target: remind from H-30 onwards, and keep reminding once the target date has passed
        $rawTargets = Target::where('user_id', $user->id)
            ->where('status', '!=', 'Tercapai')
            ->whereDate('target_date', '<=', $today->copy()->addDays(self::TARGET_REMINDER_DAYS))
            ->get();

        $targetReminders = [];

        foreach ($rawTargets as $target) {
            $targetDate = Carbon::parse($target->target_date)->startOfDay();
            $diffDays = (int) $today->diffInDays($targetDate, false);

            $targetAmount = (float) $target->target_amount;
            $currentAmount = (float) $target->current_amount;
            $remainingTarget = max(0.0, $targetAmount - $currentAmount);
            $progress = $targetAmount > 0 ? min(100, (int) round(($currentAmount / $targetAmount) * 100)) : 0;
            $remainingFormatted = 'Rp '.number_format($remainingTarget, 0, ',', '.');

            // Fully saved targets need no reminder, even before the Target page flips them to Tercapai
            if ($remainingTarget <= 0) {
                continue;
            }

            if ($diffDays < 0) {
                $status = 'terlambat';
                $urgency = 'danger';
                $absDiff = abs($diffDays);
                $statusLabel = "Terlewat {$absDiff} hari";
                $message = "Target {$target->name} telah melewati batas waktu ({$targetDate->translatedFormat('d M Y')}). Terkumpul {$progress}% (Kurang {$remainingFormatted}).";
            } elseif ($diffDays === 0) {
                $status = 'hari_ini';
                $urgency = 'warning';
                $statusLabel = 'Batas Waktu Hari Ini!';
                $message = "Target {$target->name} mencapai tanggal batas hari ini! Terkumpul {$progress}% (Kurang {$remainingFormatted}).";
            } elseif ($diffDays <= 14) {
                $status = 'segera';
                $urgency = $diffDays <= 5 ? 'warning' : 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "Target {$target->name} tersisa {$diffDays} hari lagi ({$targetDate->translatedFormat('d M Y')}). Terkumpul {$progress}%.";
            } else {
                $status = 'mendatang';
                $urgency = 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "Target {$target->name} berakhir pada {$targetDate->translatedFormat('d M Y')}. Terkumpul {$progress}%.";
            }

            $targetReminders[] = [
                'id' => "target_{$target->id}",
                'item_id' => $target->id,
                'type' => 'target',
                'title' => $target->name,
                'category' => $target->category ?: 'Target Tabungan',
                'amount' => $targetAmount,
                'amount_formatted' => 'Rp '.number_format($targetAmount, 0, ',', '.'),
                'current_amount' => $currentAmount,
                'remaining_amount' => $remainingTarget,
                'remaining_formatted' => $remainingFormatted,
                'progress' => $progress,
                'due_date' => $targetDate->format('Y-m-d'),
                'due_date_formatted' => $targetDate->translatedFormat('d M Y'),
                'diff_days' => $diffDays,
                'status' => $status,
                'status_label' => $statusLabel,
                'urgency' => $urgency,
                'message' => $message,
                'url' => route('tabungan.target'),
            ];
        }

        // Combine and prioritize:
        // Priority weight: terlambat = 1, hari_ini = 2, segera = 3, mendatang = 4
        $priorityMap = [
            'terlambat' => 1,
            'hari_ini' => 2,
            'segera' => 3,
            'mendatang' => 4,
        ];

        $allReminders = array_merge($billReminders, $targetReminders);

        usort($allReminders, function ($a, $b) use ($priorityMap) {
            $weightA = $priorityMap[$a['status']] ?? 99;
            $weightB = $priorityMap[$b['status']] ?? 99;

            if ($weightA !== $weightB) {
                return $weightA <=> $weightB;
            }

            // Inside same priority, sort by diff_days ascending (most overdue or closest first)
            return $a['diff_days'] <=> $b['diff_days'];
        });

        // Count urgent reminders (terlambat, hari_ini, segera)
        $urgentCount = count(array_filter($allReminders, function ($item) {
            return in_array($item['status'], ['terlambat', 'hari_ini', 'segera'], true);
        }));

        return [
            'urgent_count' => $urgentCount,
            'total_count' => count($allReminders),
            'bills_count' => count($billReminders),
            'targets_count' => count($targetReminders),
            'all' => $allReminders,
            'bills' => $billReminders,
            'targets' => $targetReminders,
        ];
    }
}
