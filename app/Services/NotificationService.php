<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Debt;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    /**
     * Unpaid debts and receivables start showing up as reminders this many days before their due date.
     */
    private const DEBT_REMINDER_DAYS = 7;

    /**
     * Get due-soon and overdue reminders for a user (recurring bills, debts & receivables),
     * cached to provide fast zero-latency SPA page transitions.
     *
     * @return array{
     *     urgent_count: int,
     *     total_count: int,
     *     bills_count: int,
     *     debts_count: int,
     *     all: array<int, array<string, mixed>>,
     *     bills: array<int, array<string, mixed>>,
     *     debts: array<int, array<string, mixed>>
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
     * Clear cached reminders for a user when bills or debts change.
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

            // Only remind once the due date is near (or already passed)
            if ($diffDays > max(7, (int) ($bill->reminder_days ?? 3))) {
                continue;
            }

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
            } else {
                $status = 'segera';
                $urgency = $diffDays <= 3 ? 'warning' : 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "Tagihan {$bill->name} jatuh tempo dalam {$diffDays} hari ({$dueDate->translatedFormat('d M')}).";
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

        // 2. Hutang & Piutang: remind from H-7 onwards, and keep reminding once the due date has passed
        $rawDebts = Debt::where('user_id', $user->id)
            ->where('status', 'belum_lunas')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', $today->copy()->addDays(self::DEBT_REMINDER_DAYS))
            ->get();

        $debtReminders = [];

        foreach ($rawDebts as $debt) {
            $remainingDebt = $debt->remaining_amount !== null ? (float) $debt->remaining_amount : (float) $debt->amount;
            if ($remainingDebt <= 0) {
                continue;
            }

            $dueDate = Carbon::parse($debt->due_date)->startOfDay();
            $diffDays = (int) $today->diffInDays($dueDate, false);
            $isReceivable = $debt->type === 'piutang';
            $label = $isReceivable ? 'Piutang' : 'Hutang';
            $remainingFormatted = 'Rp '.number_format($remainingDebt, 0, ',', '.');
            $action = $isReceivable ? 'Tagih sisa' : 'Sisa yang harus dibayar';

            if ($diffDays < 0) {
                $status = 'terlambat';
                $urgency = 'danger';
                $absDiff = abs($diffDays);
                $statusLabel = "Terlambat {$absDiff} hari";
                $message = "{$label} {$debt->name} sudah lewat jatuh tempo ({$dueDate->translatedFormat('d M Y')}). {$action} {$remainingFormatted}.";
            } elseif ($diffDays === 0) {
                $status = 'hari_ini';
                $urgency = 'warning';
                $statusLabel = 'Jatuh tempo Hari Ini!';
                $message = "{$label} {$debt->name} jatuh tempo hari ini! {$action} {$remainingFormatted}.";
            } else {
                $status = 'segera';
                $urgency = $diffDays <= 3 ? 'warning' : 'info';
                $statusLabel = "{$diffDays} hari lagi";
                $message = "{$label} {$debt->name} jatuh tempo dalam {$diffDays} hari ({$dueDate->translatedFormat('d M')}). {$action} {$remainingFormatted}.";
            }

            $debtReminders[] = [
                'id' => "debt_{$debt->id}",
                'item_id' => $debt->id,
                'type' => 'debt',
                'debt_type' => $debt->type,
                'title' => $debt->name,
                'category' => $label,
                'amount' => (float) $debt->amount,
                'amount_formatted' => 'Rp '.number_format((float) $debt->amount, 0, ',', '.'),
                'remaining_amount' => $remainingDebt,
                'remaining_formatted' => $remainingFormatted,
                'due_date' => $dueDate->format('Y-m-d'),
                'due_date_formatted' => $dueDate->translatedFormat('d M Y'),
                'diff_days' => $diffDays,
                'status' => $status,
                'status_label' => $statusLabel,
                'urgency' => $urgency,
                'message' => $message,
                'url' => route('hutang-piutang.index'),
            ];
        }

        // Combine and prioritize:
        // Priority weight: terlambat = 1, hari_ini = 2, segera = 3
        $priorityMap = [
            'terlambat' => 1,
            'hari_ini' => 2,
            'segera' => 3,
        ];

        $allReminders = array_merge($billReminders, $debtReminders);

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
            'debts_count' => count($debtReminders),
            'all' => $allReminders,
            'bills' => $billReminders,
            'debts' => $debtReminders,
        ];
    }
}
