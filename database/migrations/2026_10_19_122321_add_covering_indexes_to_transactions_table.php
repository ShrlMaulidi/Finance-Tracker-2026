<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Widen the existing transaction indexes into covering indexes.
     *
     * Totals, category and payment-method breakdowns then read only the index instead of every
     * table row, which keeps dashboards and reports fast for users with tens of thousands of rows.
     * The leading columns are unchanged, so every query that used the old indexes still does.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_user_date_type');
            $table->dropIndex('idx_transactions_user_type');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'date', 'type', 'amount'], 'idx_transactions_user_date_type');
            $table->index(['user_id', 'type', 'category', 'payment_method', 'amount'], 'idx_transactions_user_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_user_date_type');
            $table->dropIndex('idx_transactions_user_type');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'date', 'type'], 'idx_transactions_user_date_type');
            $table->index(['user_id', 'type'], 'idx_transactions_user_type');
        });
    }
};
