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
        // 1. Ensure 'Tagihan Rutin' category exists for all existing users
        $userIds = DB::table('users')->pluck('id');
        $now = now();

        foreach ($userIds as $userId) {
            $exists = DB::table('categories')
                ->where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->where('name', 'Tagihan Rutin')
                ->exists();

            if (! $exists) {
                DB::table('categories')->insert([
                    'user_id' => $userId,
                    'type' => 'pengeluaran',
                    'name' => 'Tagihan Rutin',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 2. Set category_name to 'Tagihan Rutin' for all existing bills
        DB::table('bills')->update([
            'category_name' => 'Tagihan Rutin',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep data intact
    }
};
