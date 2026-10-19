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
        Schema::table('debts', function (Blueprint $table) {
            if (! Schema::hasColumn('debts', 'user_id')) {
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            }
            if (! Schema::hasColumn('debts', 'type')) {
                $table->enum('type', ['hutang', 'piutang']);
            }
            if (! Schema::hasColumn('debts', 'name')) {
                $table->string('name');
            }
            if (! Schema::hasColumn('debts', 'amount')) {
                $table->decimal('amount', 15, 2);
            }
            if (! Schema::hasColumn('debts', 'remaining_amount')) {
                $table->decimal('remaining_amount', 15, 2);
            }
            if (! Schema::hasColumn('debts', 'due_date')) {
                $table->date('due_date')->nullable();
            }
            if (! Schema::hasColumn('debts', 'status')) {
                $table->enum('status', ['belum_lunas', 'lunas'])->default('belum_lunas');
            }
            if (! Schema::hasColumn('debts', 'description')) {
                $table->text('description')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            //
        });
    }
};
