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
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_id')->unique();
            $table->string('plan'); // pro | pro_plus
            $table->string('billing_cycle'); // monthly | yearly
            $table->unsignedInteger('amount');
            $table->string('status')->default('pending'); // pending | paid | failed | expired | cancelled | refunded
            $table->string('snap_token')->nullable();
            $table->string('payment_type')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->json('last_notification')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
