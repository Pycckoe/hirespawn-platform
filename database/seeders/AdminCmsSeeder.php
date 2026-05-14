<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\PayoutMethodType;
use App\Models\SiteSetting;
use App\Models\TopupMethodType;
use Illuminate\Database\Seeder;

class AdminCmsSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Site copy ----
        $settings = [
            ['key' => 'hero_pill',     'group' => 'home', 'label' => 'Home · hero pill',     'type' => 'text',     'value' => '● Live · 12,847 agents on duty',                    'sort' => 1],
            ['key' => 'hero_title',    'group' => 'home', 'label' => 'Home · hero title (display only — H1 is stylized)', 'type' => 'textarea', 'value' => "Hire an army.\nBurn Power.",                                'sort' => 2],
            ['key' => 'hero_subtitle', 'group' => 'home', 'label' => 'Home · hero subtitle', 'type' => 'textarea', 'value' => 'The marketplace for AI employees. No subscriptions, no headcount. Buy Power once — every agent in the roster runs on it. Pay only for tasks executed.', 'sort' => 3],
            ['key' => 'hero_cta',      'group' => 'home', 'label' => 'Home · primary CTA',   'type' => 'text',     'value' => 'Buy Power →',                                       'sort' => 4],

            ['key' => 'footer_tagline','group' => 'footer','label' => 'Footer · tagline',    'type' => 'text',     'value' => 'Pay only for power burned.',                        'sort' => 1],
            ['key' => 'footer_copyright','group' => 'footer','label' => 'Footer · copyright', 'type' => 'text',     'value' => '© HIRESPAWN SIA · RIGA · 2026',                     'sort' => 2],
            ['key' => 'support_email', 'group' => 'footer','label' => 'Support email',       'type' => 'text',     'value' => 'support@hirespawn.com',                             'sort' => 3],
            ['key' => 'recovery_email','group' => 'footer','label' => 'Recovery email',      'type' => 'text',     'value' => 'recover@hirespawn.io',                              'sort' => 4],

            ['key' => 'seller_share_pct','group' => 'rates','label' => 'Seller revenue share %','type' => 'text',  'value' => '70',                                                'sort' => 1],
            ['key' => 'eur_cents_per_power','group' => 'rates','label' => 'EUR cents per ⚡','type' => 'text',     'value' => '0.9',                                               'sort' => 2],
            ['key' => 'min_cashout_eur','group' => 'rates','label' => 'Min cash-out (€)',    'type' => 'text',     'value' => '10',                                                'sort' => 3],

            // Brand assets — admin uploads PNG / SVG via Filament. Defaults
            // point at the bundled /logo.svg and /favicon.ico so the site
            // ships with a real logo + favicon out of the box. Admin can
            // replace with custom uploads anytime; uploaded values become
            // storage paths (e.g. 'site/foo.png') which the model resolves
            // to /storage/site/foo.png URLs.
            ['key' => 'site_logo',     'group' => 'brand','label' => 'Site logo',           'type' => 'image',    'value' => '/logo.svg',                                         'sort' => 1],
            ['key' => 'site_favicon',  'group' => 'brand','label' => 'Site favicon',        'type' => 'image',    'value' => '/favicon.ico',                                      'sort' => 2],
        ];
        // Preserve admin edits across re-seeds: metadata (label/group/type
        // /sort) always updates so we can rename / regroup later, but the
        // `value` column is only set when the row is new OR still null.
        foreach ($settings as $row) {
            $defaultValue = $row['value'] ?? null;
            unset($row['value']);
            $setting = SiteSetting::updateOrCreate(['key' => $row['key']], $row);
            if (($setting->value === null || $setting->value === '') && $defaultValue !== null) {
                $setting->forceFill(['value' => $defaultValue])->save();
            }
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

        // ---- Top-up methods (buyer side · power pack purchases) ----
        // Inbound gateway fees that buyers see at checkout.
        $topup = [
            ['key' => 'card',   'label' => 'Debit / credit',    'icon' => '💳', 'description' => 'Card top-ups via Stripe',             'fee_percent' => 2.90, 'fee_flat_cents' => 30, 'min_amount_cents' => 500,  'sort' => 1],
            ['key' => 'sepa',   'label' => 'SEPA bank transfer','icon' => '🏦', 'description' => 'EU bank · 1-2 business days',         'fee_percent' => 0.50, 'fee_flat_cents' => 0,  'min_amount_cents' => 2000, 'sort' => 2],
            ['key' => 'paypal', 'label' => 'PayPal',            'icon' => '🅿', 'description' => 'Instant pay-in via PayPal',           'fee_percent' => 2.00, 'fee_flat_cents' => 30, 'min_amount_cents' => 500,  'sort' => 3],
            ['key' => 'crypto', 'label' => 'Crypto deposit',    'icon' => '₿', 'description' => 'USDC / ETH deposit',                   'fee_percent' => 0.50, 'fee_flat_cents' => 0,  'min_amount_cents' => 1000, 'sort' => 4],
        ];
        foreach ($topup as $row) {
            TopupMethodType::updateOrCreate(['key' => $row['key']], $row + ['is_active' => true]);
        }

        // ---- Payout methods (seller side · cash-out from earnings) ----
        // Outbound gateway fees that sellers see when withdrawing.
        $payout = [
            ['key' => 'bank',   'label' => 'Bank · SEPA',    'icon' => '🏦', 'description' => 'IBAN bank account · 1-3 business days', 'fee_percent' => 0.50, 'fee_flat_cents' => 0,   'min_amount_cents' => 1000, 'sort' => 1],
            ['key' => 'paypal', 'label' => 'PayPal',         'icon' => '🅿', 'description' => 'Instant transfers to PayPal balance',  'fee_percent' => 2.00, 'fee_flat_cents' => 30,  'min_amount_cents' => 500,  'sort' => 2],
            ['key' => 'wise',   'label' => 'Wise',           'icon' => '⚡', 'description' => 'Wise multi-currency account',          'fee_percent' => 0.80, 'fee_flat_cents' => 0,   'min_amount_cents' => 1000, 'sort' => 3],
            ['key' => 'crypto', 'label' => 'Crypto wallet',  'icon' => '₿', 'description' => 'USDC / ETH wallet, ~1h settlement',    'fee_percent' => 1.50, 'fee_flat_cents' => 100, 'min_amount_cents' => 2000, 'sort' => 4],
        ];
        foreach ($payout as $row) {
            PayoutMethodType::updateOrCreate(['key' => $row['key']], $row + ['is_active' => true]);
        }
    }
}
