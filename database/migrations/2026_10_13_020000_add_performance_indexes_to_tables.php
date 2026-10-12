<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Transactions indexes
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'date'], 'idx_transactions_user_date');
            $table->index(['user_id', 'type'], 'idx_transactions_user_type');
            $table->index(['user_id', 'category'], 'idx_transactions_user_category');
            $table->index(['user_id', 'date', 'type'], 'idx_transactions_user_date_type');
        });

        // 2. Budgets indexes
        Schema::table('budgets', function (Blueprint $table) {
            $table->index(['user_id', 'month'], 'idx_budgets_user_month');
            $table->index(['user_id', 'type'], 'idx_budgets_user_type');
            $table->index(['user_id', 'is_recurring'], 'idx_budgets_user_recurring');
        });

        // 3. Debts indexes
        Schema::table('debts', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_debts_user_status');
            $table->index(['user_id', 'type', 'status'], 'idx_debts_user_type_status');
            $table->index(['user_id', 'name'], 'idx_debts_user_name');
        });

        // 4. Debt budgets indexes
        if (Schema::hasTable('debt_budgets')) {
            Schema::table('debt_budgets', function (Blueprint $table) {
                $table->index(['user_id', 'name'], 'idx_debt_budgets_user_name');
            });
        }

        // 5. Targets indexes
        Schema::table('targets', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_targets_user_status');
            $table->index(['user_id', 'name'], 'idx_targets_user_name');
        });

        // 6. Bills & payments indexes
        if (Schema::hasTable('bills')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index(['user_id', 'is_active'], 'idx_bills_user_active');
            });
        }

        if (Schema::hasTable('bill_payments')) {
            Schema::table('bill_payments', function (Blueprint $table) {
                $table->index(['bill_id', 'month'], 'idx_bill_payments_bill_month');
                $table->index(['user_id', 'month'], 'idx_bill_payments_user_month');
            });
        }

        // 7. Categories & payment methods indexes
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['user_id', 'type'], 'idx_categories_user_type');
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->index(['user_id', 'name'], 'idx_payment_methods_user_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_user_date');
            $table->dropIndex('idx_transactions_user_type');
            $table->dropIndex('idx_transactions_user_category');
            $table->dropIndex('idx_transactions_user_date_type');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropIndex('idx_budgets_user_month');
            $table->dropIndex('idx_budgets_user_type');
            $table->dropIndex('idx_budgets_user_recurring');
        });

        Schema::table('debts', function (Blueprint $table) {
            $table->dropIndex('idx_debts_user_status');
            $table->dropIndex('idx_debts_user_type_status');
            $table->dropIndex('idx_debts_user_name');
        });

        if (Schema::hasTable('debt_budgets')) {
            Schema::table('debt_budgets', function (Blueprint $table) {
                $table->dropIndex('idx_debt_budgets_user_name');
            });
        }

        Schema::table('targets', function (Blueprint $table) {
            $table->dropIndex('idx_targets_user_status');
            $table->dropIndex('idx_targets_user_name');
        });

        if (Schema::hasTable('bills')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->dropIndex('idx_bills_user_active');
            });
        }

        if (Schema::hasTable('bill_payments')) {
            Schema::table('bill_payments', function (Blueprint $table) {
                $table->dropIndex('idx_bill_payments_bill_month');
                $table->dropIndex('idx_bill_payments_user_month');
            });
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_user_type');
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropIndex('idx_payment_methods_user_name');
        });
    }
};
