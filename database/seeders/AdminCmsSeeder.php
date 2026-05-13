<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\PaymentMethodType;
use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class AdminCmsSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Site copy ----
        $settings = [
            ['key' => 'hero_pill',     'group' => 'home', 'label' => 'Home · hero pill',     'type' => 'text',     'value' => 'AI agent marketplace',                              'sort' => 1],
            ['key' => 'hero_title',    'group' => 'home', 'label' => 'Home · hero title',    'type' => 'textarea', 'value' => "Spawn AI agents.\nPay only for power burned.",      'sort' => 2],
            ['key' => 'hero_subtitle', 'group' => 'home', 'label' => 'Home · hero subtitle', 'type' => 'textarea', 'value' => 'Hire production-grade agents from verified vendors. No per-seat lock-in.', 'sort' => 3],
            ['key' => 'hero_cta',      'group' => 'home', 'label' => 'Home · primary CTA',   'type' => 'text',     'value' => 'Browse roster →',                                   'sort' => 4],

            ['key' => 'footer_tagline','group' => 'footer','label' => 'Footer · tagline',    'type' => 'text',     'value' => 'Pay only for power burned.',                        'sort' => 1],
            ['key' => 'support_email', 'group' => 'footer','label' => 'Support email',       'type' => 'text',     'value' => 'support@hirespawn.com',                             'sort' => 2],
            ['key' => 'recovery_email','group' => 'footer','label' => 'Recovery email',      'type' => 'text',     'value' => 'recover@hirespawn.io',                              'sort' => 3],

            ['key' => 'seller_share_pct','group' => 'rates','label' => 'Seller revenue share %','type' => 'text',  'value' => '70',                                                'sort' => 1],
            ['key' => 'eur_cents_per_power','group' => 'rates','label' => 'EUR cents per ⚡','type' => 'text',     'value' => '0.9',                                               'sort' => 2],
            ['key' => 'min_cashout_eur','group' => 'rates','label' => 'Min cash-out (€)',    'type' => 'text',     'value' => '10',                                                'sort' => 3],
        ];
        foreach ($settings as $row) {
            SiteSetting::updateOrCreate(['key' => $row['key']], $row);
        }

        // ---- Currencies ----
        $currencies = [
            ['code' => 'EUR', 'symbol' => '€', 'name' => 'Euro',             'is_default' => true,  'sort' => 1],
            ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar',        'is_default' => false, 'sort' => 2],
            ['code' => 'GBP', 'symbol' => '£', 'name' => 'Pound sterling',   'is_default' => false, 'sort' => 3],
            ['code' => 'CHF', 'symbol' => 'CHF','name' => 'Swiss franc',      'is_default' => false, 'sort' => 4],
            ['code' => 'USDC','symbol' => '$', 'name' => 'USD Coin (crypto)', 'is_default' => false, 'sort' => 5],
        ];
        foreach ($currencies as $row) {
            Currency::updateOrCreate(['code' => $row['code']], $row + ['is_active' => true]);
        }

        // ---- Payment method types (admin-controlled allow-list + fees) ----
        // Fees mirror market gateway rates as defaults. Admin can tune in /admin.
        $methods = [
            ['key' => 'bank',    'label' => 'Bank · SEPA',      'audience' => 'both',   'icon' => '🏦', 'description' => 'IBAN bank account · 1-3 business days',  'fee_percent' => 0.50, 'fee_flat_cents' => 0,   'min_amount_cents' => 1000, 'sort' => 1],
            ['key' => 'card',    'label' => 'Debit / credit',   'audience' => 'buyer',  'icon' => '💳', 'description' => 'Card top-ups · Stripe-rate',             'fee_percent' => 2.90, 'fee_flat_cents' => 30,  'min_amount_cents' => 500,  'sort' => 2],
            ['key' => 'paypal',  'label' => 'PayPal',           'audience' => 'both',   'icon' => '🅿', 'description' => 'Instant transfers via PayPal',           'fee_percent' => 2.00, 'fee_flat_cents' => 30,  'min_amount_cents' => 500,  'sort' => 3],
            ['key' => 'wise',    'label' => 'Wise',             'audience' => 'seller', 'icon' => '⚡', 'description' => 'Wise multi-currency account',            'fee_percent' => 0.80, 'fee_flat_cents' => 0,   'min_amount_cents' => 1000, 'sort' => 4],
            ['key' => 'crypto',  'label' => 'Crypto wallet',    'audience' => 'seller', 'icon' => '₿', 'description' => 'USDC / ETH wallet, ~1h settlement',      'fee_percent' => 1.50, 'fee_flat_cents' => 100, 'min_amount_cents' => 2000, 'sort' => 5],
        ];
        foreach ($methods as $row) {
            PaymentMethodType::updateOrCreate(['key' => $row['key']], $row + ['is_active' => true]);
        }
    }
}
