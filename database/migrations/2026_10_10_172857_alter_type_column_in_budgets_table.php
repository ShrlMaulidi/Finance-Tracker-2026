<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE budgets MODIFY COLUMN type VARCHAR(255) NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum if necessary, ignoring data truncation issues for simplicity here
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE budgets MODIFY COLUMN type ENUM('Tabungan', 'Investasi') NOT NULL");
        }
    }
};
