<?php

use App\Http\Controllers\AdminAgentController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\ConsoleController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RunController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorPublishController;
use Illuminate\Support\Facades\Route;

// === Public marketplace pages ===
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/roster', [AgentController::class, 'index'])->name('catalog');
Route::get('/agent/{agent:slug}', [AgentController::class, 'show'])->name('agent.show');
Route::get('/pricing', [PageController::class, 'pricing'])->name('pricing');
Route::get('/hire', [PageController::class, 'hire'])->name('hire');
Route::get('/power', [PageController::class, 'power'])->name('power');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/customers', [PageController::class, 'customers'])->name('customers');
Route::get('/docs', [PageController::class, 'docs'])->name('docs');
Route::get('/security', [PageController::class, 'security'])->name('security');
Route::get('/status', [PageController::class, 'status'])->name('status');
Route::get('/changelog', [PageController::class, 'changelog'])->name('changelog');
Route::get('/legal', [PageController::class, 'legal'])->name('legal');
Route::get('/emails', [PageController::class, 'emails'])->name('emails');
Route::get('/blog', [PageController::class, 'blogIndex'])->name('blog.index');
Route::get('/blog/{slug}', [PageController::class, 'blogPost'])->name('blog.show');

// === Authenticated app ===
// Note: email verification not gated yet — we send the Registered event so
// the welcome email goes out, but we don't block onboarding/console on a
// click-through. Re-add the `verified` middleware once we wire that flow.
Route::middleware(['auth'])->group(function () {
    Route::get('/console', [ConsoleController::class, 'index'])->name('console');
    Route::get('/vendor', [VendorController::class, 'index'])->name('vendor');
    Route::get('/vendor/agents/new', [VendorPublishController::class, 'create'])->name('vendor.publish.create');
    Route::post('/vendor/agents', [VendorPublishController::class, 'store'])->name('vendor.publish.store');
    Route::get('/vendor/agents/{agent:slug}/edit', [VendorPublishController::class, 'edit'])->name('vendor.publish.edit');
    Route::patch('/vendor/agents/{agent:slug}', [VendorPublishController::class, 'update'])->name('vendor.publish.update');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::patch('/settings/workspace', [SettingsController::class, 'updateWorkspace'])->name('settings.workspace.update');
    Route::get('/run/{run}', [RunController::class, 'show'])->name('run.show');

    Route::post('/agent/{agent:slug}/subscribe', [SubscriptionController::class, 'store'])->name('subscription.store');
    Route::delete('/agent/{agent:slug}/subscribe', [SubscriptionController::class, 'destroy'])->name('subscription.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// === Admin review queue (is_admin only) ===
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/agents', [AdminAgentController::class, 'index'])->name('admin.agents');
    Route::post('/agents/{agent:slug}/approve', [AdminAgentController::class, 'approve'])->name('admin.agents.approve');
    Route::post('/agents/{agent:slug}/reject', [AdminAgentController::class, 'reject'])->name('admin.agents.reject');
    Route::post('/agents/{agent:slug}/suspend', [AdminAgentController::class, 'suspend'])->name('admin.agents.suspend');
});

// Map the legacy /dashboard URL Breeze installs to our console page.
Route::redirect('/dashboard', '/console')->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/auth.php';
