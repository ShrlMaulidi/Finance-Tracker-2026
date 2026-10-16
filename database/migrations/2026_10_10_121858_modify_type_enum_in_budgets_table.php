<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE budgets MODIFY COLUMN type ENUM('Tabungan', 'Investasi', 'Pengeluaran') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE budgets MODIFY COLUMN type ENUM('Tabungan', 'Investasi') NOT NULL");
        }
    }
};
