<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\ConsoleController;
use App\Http\Controllers\InvokeController;
use App\Http\Controllers\KnowledgeController;
use App\Http\Controllers\McpConnectionController;
use App\Http\Controllers\OauthController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RunController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionSettingsController;
use App\Http\Controllers\SupportController;
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

// Support / contact — public form. Anyone (signed-in or not) can file
// a ticket via /support. POSTed tickets land in support_tickets.
Route::get('/support', [SupportController::class, 'show'])->name('support');
Route::get('/contact', [SupportController::class, 'show'])->name('contact');
Route::post('/support', [SupportController::class, 'store'])->name('support.store');

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
    Route::post('/vendor/agents/{agent:slug}/save-as-template', [VendorPublishController::class, 'saveAsTemplate'])->name('vendor.publish.save-template');
    Route::post('/vendor/payout-methods', [VendorPayoutController::class, 'storeMethod'])->name('vendor.payout.methods.store');
    Route::post('/vendor/payout-methods/{method}/default', [VendorPayoutController::class, 'defaultMethod'])->name('vendor.payout.methods.default');
    Route::delete('/vendor/payout-methods/{method}', [VendorPayoutController::class, 'destroyMethod'])->name('vendor.payout.methods.destroy');
    Route::post('/vendor/payouts', [VendorPayoutController::class, 'requestPayout'])->name('vendor.payout.request');
    // LLM API credentials — one row per (seller, provider).
    Route::post('/vendor/llm-credentials', [VendorCredentialsController::class, 'store'])->name('vendor.credentials.store');
    Route::post('/vendor/llm-credentials/{credential}/verify', [VendorCredentialsController::class, 'verify'])->name('vendor.credentials.verify');
    Route::delete('/vendor/llm-credentials/{credential}', [VendorCredentialsController::class, 'destroy'])->name('vendor.credentials.destroy');

    // OAuth integrations — buyer connects their third-party accounts so
    // agents can act on their behalf via oauth_proxy skills.
    Route::get('/oauth/{provider}/connect', [OauthController::class, 'start'])->name('oauth.start');
    Route::get('/oauth/{provider}/callback', [OauthController::class, 'callback'])->name('oauth.callback');
    Route::delete('/oauth/{provider}', [OauthController::class, 'disconnect'])->name('oauth.disconnect');
    // Live resource pickers for the agent-configure UI.
    Route::get('/oauth/slack/channels', [OauthController::class, 'slackChannels'])->name('oauth.slack.channels');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::patch('/settings/workspace', [SettingsController::class, 'updateWorkspace'])->name('settings.workspace.update');
    Route::post('/settings/keys', [SettingsController::class, 'storeKey'])->name('settings.keys.store');
    Route::delete('/settings/keys/{apiKey}', [SettingsController::class, 'revokeKey'])->name('settings.keys.revoke');
    Route::post('/settings/members', [SettingsController::class, 'storeMember'])->name('settings.members.store');
    Route::delete('/settings/members/{member}', [SettingsController::class, 'destroyMember'])->name('settings.members.destroy');
    Route::patch('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password.update');
    Route::delete('/settings/sessions/{sessionId}', [SettingsController::class, 'revokeSession'])->name('settings.sessions.revoke');
    Route::patch('/settings/notifications', [SettingsController::class, 'updateNotifications'])->name('settings.notifications.update');

    // Per-subscription configuration — buyer fills in the variables the
    // vendor declared (AgentSettingDef rows). Values get substituted
    // into system_prompt at runtime via {{key}}.
    Route::get('/console/subscriptions/{subscription}/configure', [SubscriptionSettingsController::class, 'show'])->name('subscriptions.configure');
    Route::patch('/console/subscriptions/{subscription}/configure', [SubscriptionSettingsController::class, 'update'])->name('subscriptions.configure.update');
    // Knowledge base (RAG) — buyer uploads/pastes docs the agent retrieves from.
    Route::post('/console/subscriptions/{subscription}/knowledge', [KnowledgeController::class, 'store'])->name('subscriptions.knowledge.store');
    Route::delete('/console/subscriptions/{subscription}/knowledge/{source}', [KnowledgeController::class, 'destroy'])->name('subscriptions.knowledge.destroy');
    // MCP servers — buyer connects remote MCP servers; their tools are
    // exposed to the agent at run time.
    Route::post('/console/subscriptions/{subscription}/mcp', [McpConnectionController::class, 'store'])->name('subscriptions.mcp.store');
    Route::post('/console/subscriptions/{subscription}/mcp/{connection}/test', [McpConnectionController::class, 'test'])->name('subscriptions.mcp.test');
    Route::delete('/console/subscriptions/{subscription}/mcp/{connection}', [McpConnectionController::class, 'destroy'])->name('subscriptions.mcp.destroy');
    // Buyer-side dispute creation — files a SupportTicket(kind=dispute)
    // against an active subscription the buyer owns.
    Route::post('/console/disputes', [SupportController::class, 'storeDispute'])->name('disputes.store');
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
