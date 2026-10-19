<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AIAgentController;
use App\Http\Controllers\Api\WhatsAppAIWebhookController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\BudgetSummaryController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DebtBudgetController;
use App\Http\Controllers\DebtController;
use App\Http\Controllers\ExpenseBudgetController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TargetController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionHistoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register') && AdminSettingController::isRegistrationAllowed(),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

// WhatsApp AI Agent Webhook Endpoints (Called from VPS / n8n / Hermes)
Route::prefix('api/webhook/whatsapp')->group(function () {
    Route::post('/transaction', [WhatsAppAIWebhookController::class, 'storeTransaction']);
    Route::post('/check-user', [WhatsAppAIWebhookController::class, 'getUserContext']);
    Route::post('/summary', [WhatsAppAIWebhookController::class, 'getSummary']);
});
Route::post('/webhook/whatsapp', [WhatsAppAIWebhookController::class, 'storeTransaction']);

Route::middleware('auth')->group(function () {
    Route::get('/tabungan/target', [TargetController::class, 'index'])->name('tabungan.target');
    Route::post('/tabungan/target', [TargetController::class, 'store'])->name('tabungan.target.store');
    Route::post('/tabungan/target/{target}', [TargetController::class, 'update'])->name('tabungan.target.update');
    Route::delete('/tabungan/target/{target}', [TargetController::class, 'destroy'])->name('tabungan.target.destroy');
    Route::get('/anggaran/ringkasan', [BudgetSummaryController::class, 'index'])->name('anggaran.ringkasan');
    Route::get('/anggaran/investasi', [BudgetController::class, 'index'])->name('anggaran.investasi');
    Route::post('/anggaran/investasi', [BudgetController::class, 'store'])->name('anggaran.investasi.store');
    Route::put('/anggaran/investasi/{budget}', [BudgetController::class, 'update'])->name('anggaran.investasi.update');
    Route::delete('/anggaran/investasi/{budget}', [BudgetController::class, 'destroy'])->name('anggaran.investasi.destroy');

    Route::get('/anggaran/pengeluaran', [ExpenseBudgetController::class, 'index'])->name('anggaran.pengeluaran');
    Route::post('/anggaran/pengeluaran', [ExpenseBudgetController::class, 'store'])->name('anggaran.pengeluaran.store');
    Route::put('/anggaran/pengeluaran/{budget}', [ExpenseBudgetController::class, 'update'])->name('anggaran.pengeluaran.update');
    Route::delete('/anggaran/pengeluaran/{budget}', [ExpenseBudgetController::class, 'destroy'])->name('anggaran.pengeluaran.destroy');

    Route::get('/anggaran/hutang', [DebtBudgetController::class, 'index'])->name('anggaran.hutang');
    Route::post('/anggaran/hutang', [DebtBudgetController::class, 'store'])->name('anggaran.hutang.store');
    Route::put('/anggaran/hutang/{budget}', [DebtBudgetController::class, 'update'])->name('anggaran.hutang.update');
    Route::delete('/anggaran/hutang/{budget}', [DebtBudgetController::class, 'destroy'])->name('anggaran.hutang.destroy');

    Route::get('/hutang-piutang', [DebtController::class, 'index'])->name('hutang-piutang.index');
    Route::post('/hutang-piutang', [DebtController::class, 'store'])->name('hutang-piutang.store');
    Route::put('/hutang-piutang/{debt}', [DebtController::class, 'update'])->name('hutang-piutang.update');
    Route::delete('/hutang-piutang/{debt}', [DebtController::class, 'destroy'])->name('hutang-piutang.destroy');

    Route::get('/tagihan', [BillController::class, 'index'])->name('tagihan.index');
    Route::post('/tagihan', [BillController::class, 'store'])->name('tagihan.store');
    Route::put('/tagihan/{bill}', [BillController::class, 'update'])->name('tagihan.update');
    Route::delete('/tagihan/payment/{payment}', [BillController::class, 'destroyPayment'])->name('tagihan.payment.destroy');
    Route::delete('/tagihan/{bill}', [BillController::class, 'destroy'])->name('tagihan.destroy');
    Route::post('/tagihan/{bill}/pay', [BillController::class, 'pay'])->name('tagihan.pay');

    Route::get('/transaksi', [TransactionController::class, 'index'])->name('transaksi.index');
    Route::post('/transaksi', [TransactionController::class, 'store'])->name('transaksi.store');
    Route::put('/transaksi/{transaction}', [TransactionController::class, 'update'])->name('transaksi.update');
    Route::delete('/transaksi/{transaction}', [TransactionController::class, 'destroy'])->name('transaksi.destroy');
    Route::get('/transaksi/history/{type?}', [TransactionHistoryController::class, 'index'])->name('transaksi.history');
    Route::get('/laporan', [ReportController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/export/pdf', [ReportController::class, 'exportPdf'])->name('laporan.export.pdf');
    Route::get('/laporan/export/excel', [ReportController::class, 'exportExcel'])->name('laporan.export.excel');
    Route::get('/berita', [NewsController::class, 'index'])->name('news.index');
    Route::get('/ai-agent', [AIAgentController::class, 'index'])->name('ai-agent.index');
    Route::post('/ai-agent/phone', [AIAgentController::class, 'updatePhone'])->name('ai-agent.update-phone');
    Route::delete('/ai-agent/phone', [AIAgentController::class, 'disconnectPhone'])->name('ai-agent.disconnect-phone');
    Route::get('/berlangganan', [SubscriptionController::class, 'index'])->name('berlangganan.index');

    Route::get('/kategori', [CategoryController::class, 'index'])->name('kategori.index');
    Route::post('/kategori', [CategoryController::class, 'store'])->name('kategori.store');
    Route::put('/kategori/{category}', [CategoryController::class, 'update'])->name('kategori.update');
    Route::delete('/kategori/{category}', [CategoryController::class, 'destroy'])->name('kategori.destroy');

    Route::get('/metode', [PaymentMethodController::class, 'index'])->name('metode.index');
    Route::post('/metode', [PaymentMethodController::class, 'store'])->name('metode.store');
    Route::put('/metode/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('metode.update');
    Route::delete('/metode/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('metode.destroy');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'post'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Web Push Notifications
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push-subscriptions.store');
    Route::delete('/push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push-subscriptions.destroy');
    Route::post('/push-subscriptions/test', [PushSubscriptionController::class, 'sendTest'])->name('push-subscriptions.test');
});

Route::middleware(['auth', 'superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::patch('/users/{user}/tier', [AdminUserController::class, 'updateTier'])->name('users.update-tier');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [AdminSettingController::class, 'update'])->name('settings.update');
    Route::post('/settings/reset-tier-rules', [AdminSettingController::class, 'resetTierRules'])->name('settings.reset-tier-rules');
});

require __DIR__.'/auth.php';
