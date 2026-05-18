<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\ConsoleController;
use App\Http\Controllers\InvokeController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RunController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TopupController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorCredentialsController;
use App\Http\Controllers\VendorPayoutController;
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

// CMS markdown pages (Terms, Privacy, DPA, AUP, etc. — admin-editable).
Route::get('/p/{slug}', [PageController::class, 'showPage'])->name('cms.page');

// === Authenticated app ===
// Note: email verification not gated yet — we send the Registered event so
// the welcome email goes out, but we don't block onboarding/console on a
// click-through. Re-add the `verified` middleware once we wire that flow.
Route::middleware(['auth'])->group(function () {
    Route::get('/console', [ConsoleController::class, 'index'])->name('console');
    // Power top-up — accepts either pack_slug or free-form amount_cents.
    // Creates a pending Invoice; Stripe webhook will flip it to "paid"
    // and credit power_balance when the buyer completes checkout.
    Route::post('/power/checkout', [TopupController::class, 'store'])->name('power.checkout');
    Route::get('/vendor', [VendorController::class, 'index'])->name('vendor');
    Route::get('/vendor/agents/new', [VendorPublishController::class, 'create'])->name('vendor.publish.create');
    Route::post('/vendor/agents', [VendorPublishController::class, 'store'])->name('vendor.publish.store');
    Route::get('/vendor/agents/{agent:slug}/edit', [VendorPublishController::class, 'edit'])->name('vendor.publish.edit');
    Route::patch('/vendor/agents/{agent:slug}', [VendorPublishController::class, 'update'])->name('vendor.publish.update');
    Route::post('/vendor/payout-methods', [VendorPayoutController::class, 'storeMethod'])->name('vendor.payout.methods.store');
    Route::post('/vendor/payout-methods/{method}/default', [VendorPayoutController::class, 'defaultMethod'])->name('vendor.payout.methods.default');
    Route::delete('/vendor/payout-methods/{method}', [VendorPayoutController::class, 'destroyMethod'])->name('vendor.payout.methods.destroy');
    Route::post('/vendor/payouts', [VendorPayoutController::class, 'requestPayout'])->name('vendor.payout.request');
    // LLM API credentials — one row per (seller, provider).
    Route::post('/vendor/llm-credentials', [VendorCredentialsController::class, 'store'])->name('vendor.credentials.store');
    Route::post('/vendor/llm-credentials/{credential}/verify', [VendorCredentialsController::class, 'verify'])->name('vendor.credentials.verify');
    Route::delete('/vendor/llm-credentials/{credential}', [VendorCredentialsController::class, 'destroy'])->name('vendor.credentials.destroy');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::patch('/settings/workspace', [SettingsController::class, 'updateWorkspace'])->name('settings.workspace.update');
    Route::post('/settings/keys', [SettingsController::class, 'storeKey'])->name('settings.keys.store');
    Route::delete('/settings/keys/{apiKey}', [SettingsController::class, 'revokeKey'])->name('settings.keys.revoke');
    Route::post('/settings/members', [SettingsController::class, 'storeMember'])->name('settings.members.store');
    Route::delete('/settings/members/{member}', [SettingsController::class, 'destroyMember'])->name('settings.members.destroy');
    Route::get('/run/{run}', [RunController::class, 'show'])->name('run.show');

    Route::post('/agent/{agent:slug}/subscribe', [SubscriptionController::class, 'store'])->name('subscription.store');
    Route::delete('/agent/{agent:slug}/subscribe', [SubscriptionController::class, 'destroy'])->name('subscription.destroy');
    Route::post('/agent/{agent:slug}/run', [InvokeController::class, 'store'])->name('agent.run');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin review queue + CMS now lives in the Filament panel at /admin
// (see App\Providers\Filament\AdminPanelProvider). Only users with
// is_admin=true can sign in; non-admins get a 403.

// Map the legacy /dashboard URL Breeze installs to our console page.
Route::redirect('/dashboard', '/console')->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/auth.php';
