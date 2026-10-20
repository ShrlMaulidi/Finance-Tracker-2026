<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Debt;
use App\Models\Target;
use App\Models\Transaction;
use Carbon\Carbon;

/**
 * Keeps savings targets, debts and recurring-bill payments consistent with a transaction.
 *
 * Shared by the web transaction screens and the WhatsApp AI Agent, so creating, editing or
 * deleting a transaction updates the linked balances the same way everywhere.
 */
class TransactionEffects
{
    /**
     * Apply a transaction's effect on its savings target or debt.
     */
    public function apply(Transaction $transaction): void
    {
        $amount = (float) $transaction->amount;

        if ($transaction->type === 'tabungan') {
            $this->adjustTarget($transaction->user_id, $transaction->category, $amount);
        } elseif ($transaction->debt_id) {
            $this->applyDebtPayment($transaction->user_id, $transaction->debt_id, $amount);
        } elseif (in_array($transaction->type, ['pengeluaran', 'pemasukan'])) {
            $this->syncDebtAmount($transaction->user_id, $transaction->category, $amount, $transaction->type);
        }
    }

    /**
     * Undo a transaction's effect on its savings target or debt (before editing or deleting it).
     */
    public function revert(Transaction $transaction): void
    {
        $amount = (float) $transaction->amount;

        if ($transaction->type === 'tabungan') {
            $this->adjustTarget($transaction->user_id, $transaction->category, -$amount);
        } elseif ($transaction->debt_id) {
            $this->revertDebtPayment($transaction->user_id, $transaction->debt_id, $amount);
        } elseif (in_array($transaction->type, ['pengeluaran', 'pemasukan'])) {
            $this->syncDebtAmount($transaction->user_id, $transaction->category, $amount, $transaction->type, true);
        }
    }

    /**
     * Add (or subtract, with a negative amount) savings on the target named after the category.
     */
    private function adjustTarget(int $userId, string $targetName, float $amount): void
    {
        $target = Target::where('user_id', $userId)->where('name', $targetName)->first();
        if (! $target) {
            return;
        }

        $target->current_amount += $amount;
        if ($amount > 0 && $target->current_amount >= $target->target_amount) {
            $target->status = 'Tercapai';
        } elseif ($amount < 0 && $target->current_amount < $target->target_amount) {
            $target->status = 'Berjalan';
        }
        $target->save();
    }

    /**
     * Deduct payment from linked debt, supporting partial payments (cicilan).
     */
    private function applyDebtPayment(int $userId, int $debtId, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $debt = Debt::where('user_id', $userId)->find($debtId);
        if (! $debt) {
            return;
        }

        $currentRemaining = $debt->remaining_amount !== null ? (float) $debt->remaining_amount : (float) $debt->amount;
        $newRemaining = $currentRemaining - $amount;

        if ($newRemaining <= 0) {
            $debt->remaining_amount = 0;
            $debt->status = 'lunas';
        } else {
            $debt->remaining_amount = $newRemaining;
            $debt->status = 'belum_lunas';
        }

        $debt->save();
    }

    /**
     * Restore payment back to linked debt when a transaction is edited or deleted.
     */
    private function revertDebtPayment(int $userId, int $debtId, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $debt = Debt::where('user_id', $userId)->find($debtId);
        if (! $debt) {
            return;
        }

        $currentRemaining = $debt->remaining_amount !== null ? (float) $debt->remaining_amount : (float) $debt->amount;
        $newRemaining = min($currentRemaining + $amount, (float) $debt->amount);

        $debt->remaining_amount = $newRemaining;
        $debt->status = ($newRemaining <= 0) ? 'lunas' : 'belum_lunas';
        $debt->save();
    }

    /**
     * Legacy debt sync for transactions whose category equals a debt name (no debt_id link).
     */
    private function syncDebtAmount(int $userId, string $category, float $amount, string $type, bool $isRevert = false): void
    {
        $debt = Debt::where('user_id', $userId)
            ->where('name', $category)
            ->first();

        if (! $debt) {
            return;
        }

        if ($type === 'pengeluaran' && $debt->type === 'hutang') {
            $debt->remaining_amount += $isRevert ? $amount : -$amount;
        } elseif ($type === 'pemasukan' && $debt->type === 'piutang') {
            $debt->remaining_amount += $isRevert ? $amount : -$amount;
        }

        // Prevent negative remaining amount and update status
        if ($debt->remaining_amount <= 0) {
            $debt->remaining_amount = 0;
            $debt->status = 'lunas';
        } else {
            $debt->status = 'belum_lunas';
        }

        // Prevent remaining amount from exceeding original amount
        if ($debt->remaining_amount > $debt->amount) {
            $debt->remaining_amount = $debt->amount;
        }

        $debt->save();
    }

    public function syncBillPayment(int $userId, string $category, string $date, ?int $billId = null, ?Transaction $transaction = null): void
    {
        $normalizedCategory = strtolower(trim($category));
        $monthStr = Carbon::parse($date)->format('Y-m');

        if ($billId) {
            $matchingBills = Bill::where('user_id', $userId)
                ->where('id', $billId)
                ->where('is_active', true)
                ->get();
        } elseif ($normalizedCategory === 'tagihan rutin') {
            if ($transaction) {
                $titleDesc = strtolower(($transaction->title ?? '').' '.($transaction->description ?? ''));
                $matchingBills = Bill::where('user_id', $userId)
                    ->where('is_active', true)
                    ->get()
                    ->filter(function ($b) use ($titleDesc) {
                        return stripos($titleDesc, strtolower(trim($b->name))) !== false;
                    });
            } else {
                $matchingBills = Bill::where('user_id', $userId)
                    ->where('is_active', true)
                    ->get();
            }
        } else {
            $cleanCategory = trim(preg_replace('/^tagihan:\s*/i', '', $normalizedCategory));
            $matchingBills = Bill::where('user_id', $userId)
                ->where('is_active', true)
                ->where(function ($query) use ($normalizedCategory, $cleanCategory) {
                    $query->whereRaw('LOWER(TRIM(name)) = ?', [$normalizedCategory])
                        ->orWhereRaw('LOWER(TRIM(name)) = ?', [$cleanCategory]);
                })
                ->get();
        }

        if ($matchingBills->isEmpty()) {
            return;
        }

        foreach ($matchingBills as $bill) {
            $billName = strtolower(trim($bill->name ?? ''));

            // Check if existing payment is already linked to a transaction
            $existingPayment = BillPayment::where('bill_id', $bill->id)
                ->where('month', $monthStr)
                ->first();

            if ($transaction && $billId && (int) $bill->id === (int) $billId) {
                BillPayment::updateOrCreate(
                    [
                        'bill_id' => $bill->id,
                        'month' => $monthStr,
                    ],
                    [
                        'user_id' => $userId,
                        'transaction_id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'paid_at' => $transaction->date,
                        'payment_method' => $transaction->payment_method ?? 'Cash',
                        'notes' => $transaction->description ?: "Dibayar via transaksi Pengeluaran: {$transaction->title}",
                    ]
                );

                continue;
            }

            $monthParts = explode('-', $monthStr);
            $queryYear = (int) ($monthParts[0] ?? date('Y'));
            $queryMonth = (int) ($monthParts[1] ?? date('m'));

            $matchingTransactions = Transaction::where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->inMonth($queryYear, $queryMonth)
                ->where(function ($q) use ($billName, $existingPayment) {
                    if ($existingPayment && $existingPayment->transaction_id) {
                        $q->where('id', $existingPayment->transaction_id);
                    } else {
                        $q->where(function ($sub) use ($billName) {
                            $sub->whereRaw('LOWER(TRIM(category)) = ?', ['tagihan rutin'])
                                ->where(function ($inner) use ($billName) {
                                    $inner->whereRaw('LOWER(title) LIKE ?', ['%'.$billName.'%'])
                                        ->orWhereRaw('LOWER(description) LIKE ?', ['%'.$billName.'%']);
                                });
                        })
                            ->orWhereRaw('LOWER(TRIM(category)) = ?', [$billName]);
                    }
                })
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            if ($matchingTransactions->isNotEmpty()) {
                $totalPaid = (float) $matchingTransactions->sum('amount');
                $latestTx = $matchingTransactions->first();

                BillPayment::updateOrCreate(
                    [
                        'bill_id' => $bill->id,
                        'month' => $monthStr,
                    ],
                    [
                        'user_id' => $userId,
                        'transaction_id' => $latestTx->id,
                        'amount' => $totalPaid,
                        'paid_at' => $latestTx->date,
                        'payment_method' => $latestTx->payment_method ?? 'Cash',
                        'notes' => $latestTx->description ?: "Dibayar via transaksi Pengeluaran: {$latestTx->title}",
                    ]
                );
            } else {
                if ($existingPayment) {
                    $existingPayment->delete();
                }
            }
        }
    }
}
