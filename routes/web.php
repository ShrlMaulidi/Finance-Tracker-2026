<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::post('/webhook/whatsapp', [\App\Http\Controllers\WebhookController::class, 'handleWhatsApp']);

Route::middleware('auth')->group(function () {
    Route::get('/tabungan/target', [\App\Http\Controllers\TargetController::class, 'index'])->name('tabungan.target');
    Route::post('/tabungan/target', [\App\Http\Controllers\TargetController::class, 'store'])->name('tabungan.target.store');
    Route::post('/tabungan/target/{target}', [\App\Http\Controllers\TargetController::class, 'update'])->name('tabungan.target.update');
    Route::delete('/tabungan/target/{target}', [\App\Http\Controllers\TargetController::class, 'destroy'])->name('tabungan.target.destroy');
    Route::get('/anggaran/investasi', [\App\Http\Controllers\BudgetController::class, 'index'])->name('anggaran.investasi');
    Route::post('/anggaran/investasi', [\App\Http\Controllers\BudgetController::class, 'store'])->name('anggaran.investasi.store');
    Route::put('/anggaran/investasi/{budget}', [\App\Http\Controllers\BudgetController::class, 'update'])->name('anggaran.investasi.update');
    Route::delete('/anggaran/investasi/{budget}', [\App\Http\Controllers\BudgetController::class, 'destroy'])->name('anggaran.investasi.destroy');
    
    Route::get('/anggaran/pengeluaran', [\App\Http\Controllers\ExpenseBudgetController::class, 'index'])->name('anggaran.pengeluaran');
    Route::post('/anggaran/pengeluaran', [\App\Http\Controllers\ExpenseBudgetController::class, 'store'])->name('anggaran.pengeluaran.store');
    Route::put('/anggaran/pengeluaran/{budget}', [\App\Http\Controllers\ExpenseBudgetController::class, 'update'])->name('anggaran.pengeluaran.update');
    Route::delete('/anggaran/pengeluaran/{budget}', [\App\Http\Controllers\ExpenseBudgetController::class, 'destroy'])->name('anggaran.pengeluaran.destroy');
    
    Route::get('/anggaran/hutang', [\App\Http\Controllers\DebtBudgetController::class, 'index'])->name('anggaran.hutang');
    Route::post('/anggaran/hutang', [\App\Http\Controllers\DebtBudgetController::class, 'store'])->name('anggaran.hutang.store');
    Route::put('/anggaran/hutang/{budget}', [\App\Http\Controllers\DebtBudgetController::class, 'update'])->name('anggaran.hutang.update');
    Route::delete('/anggaran/hutang/{budget}', [\App\Http\Controllers\DebtBudgetController::class, 'destroy'])->name('anggaran.hutang.destroy');
    
    Route::get('/hutang-piutang', [\App\Http\Controllers\DebtController::class, 'index'])->name('hutang-piutang.index');
    Route::post('/hutang-piutang', [\App\Http\Controllers\DebtController::class, 'store'])->name('hutang-piutang.store');
    Route::put('/hutang-piutang/{debt}', [\App\Http\Controllers\DebtController::class, 'update'])->name('hutang-piutang.update');
    Route::delete('/hutang-piutang/{debt}', [\App\Http\Controllers\DebtController::class, 'destroy'])->name('hutang-piutang.destroy');
    
    Route::get('/transaksi', [\App\Http\Controllers\TransactionController::class, 'index'])->name('transaksi.index');
    Route::post('/transaksi', [\App\Http\Controllers\TransactionController::class, 'store'])->name('transaksi.store');
    Route::put('/transaksi/{transaction}', [\App\Http\Controllers\TransactionController::class, 'update'])->name('transaksi.update');
    Route::delete('/transaksi/{transaction}', [\App\Http\Controllers\TransactionController::class, 'destroy'])->name('transaksi.destroy');
    Route::get('/transaksi/history/{type?}', [\App\Http\Controllers\TransactionHistoryController::class, 'index'])->name('transaksi.history');
    Route::get('/laporan', [\App\Http\Controllers\ReportController::class, 'index'])->name('laporan.index');
    Route::get('/berita', [\App\Http\Controllers\NewsController::class, 'index'])->name('news.index');
    Route::get('/ai-agent', [\App\Http\Controllers\AIAgentController::class, 'index'])->name('ai-agent.index');
    Route::get('/berlangganan', [\App\Http\Controllers\SubscriptionController::class, 'index'])->name('berlangganan.index');
    
    Route::get('/kategori', [\App\Http\Controllers\CategoryController::class, 'index'])->name('kategori.index');
    Route::post('/kategori', [\App\Http\Controllers\CategoryController::class, 'store'])->name('kategori.store');
    Route::put('/kategori/{category}', [\App\Http\Controllers\CategoryController::class, 'update'])->name('kategori.update');
    Route::delete('/kategori/{category}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->name('kategori.destroy');
    
    Route::get('/metode', [\App\Http\Controllers\PaymentMethodController::class, 'index'])->name('metode.index');
    Route::post('/metode', [\App\Http\Controllers\PaymentMethodController::class, 'store'])->name('metode.store');
    Route::put('/metode/{paymentMethod}', [\App\Http\Controllers\PaymentMethodController::class, 'update'])->name('metode.update');
    Route::delete('/metode/{paymentMethod}', [\App\Http\Controllers\PaymentMethodController::class, 'destroy'])->name('metode.destroy');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'post'], '/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
