<?php

namespace App\Support;

use App\Models\SiteSetting;

/**
 * Single source of truth for every money-related rate on the platform.
 * All values live in `site_settings` (group: rates) and are editable at
 * /admin/site-settings. The fallback constants here are only used when
 * a row is completely missing — they keep the app from dividing by zero
 * if an admin wipes the table, never as the canonical number.
 *
 * Lookups are cheap because SiteSetting::all_keyed() caches everything
 * for 60s via the shared Inertia middleware path.
 */
class Rates
{
    /** Fallback: seller keeps 70% of buyer power-burn. */
    private const FB_SELLER_SHARE_PCT = 70;

    /** Fallback: 1⚡ ≈ €0.009 at the Pro rate (i.e. 0.9 cents per ⚡). */
    private const FB_EUR_CENTS_PER_POWER = 0.9;

    /** Fallback: VAT charged on top of subtotal (20% EU standard). */
    private const FB_VAT_PCT = 20;

    /** Fallback: lower bound for a single Power top-up. */
    private const FB_MIN_TOPUP_EUR = 5;

    /** Fallback: self-serve top-up cap. Bigger orders go through sales. */
    private const FB_MAX_TOPUP_EUR = 50000;

    /** Fallback: minimum seller cash-out request. */
    private const FB_MIN_CASHOUT_EUR = 10;

    /** Fallback: gateway/platform fee charged on cash-out. */
    private const FB_CASHOUT_FEE_PCT = 1;

    /** Fallback: LLM tool-use loop ceiling. */
    private const FB_LLM_MAX_ITERATIONS = 8;

    /** Fallback: LLM max output tokens when neither agent nor model specifies. */
    private const FB_LLM_DEFAULT_MAX_OUTPUT = 4096;

    /** Fallback: cap on skills per agent. */
    private const FB_MAX_SKILLS_PER_AGENT = 24;

    public static function sellerSharePct(): float
    {
        return (float) (SiteSetting::lookup('seller_share_pct') ?? self::FB_SELLER_SHARE_PCT);
    }

    public static function sellerShareFraction(): float
    {
        return self::sellerSharePct() / 100;
    }

    public static function eurCentsPerPower(): float
    {
        return (float) (SiteSetting::lookup('eur_cents_per_power') ?? self::FB_EUR_CENTS_PER_POWER);
    }

    public static function vatPct(): float
    {
        return (float) (SiteSetting::lookup('vat_rate_pct') ?? self::FB_VAT_PCT);
    }

    public static function vatFraction(): float
    {
        return self::vatPct() / 100;
    }

    public static function minTopupEur(): int
    {
        return (int) (SiteSetting::lookup('min_topup_eur') ?? self::FB_MIN_TOPUP_EUR);
    }

    public static function maxTopupEur(): int
    {
        return (int) (SiteSetting::lookup('max_topup_eur') ?? self::FB_MAX_TOPUP_EUR);
    }

    public static function minCashoutCents(): int
    {
        return (int) ((SiteSetting::lookup('min_cashout_eur') ?? self::FB_MIN_CASHOUT_EUR) * 100);
    }

    public static function cashoutFeePct(): float
    {
        return (float) (SiteSetting::lookup('cashout_fee_pct') ?? self::FB_CASHOUT_FEE_PCT);
    }

    /**
     * Convenience: total Power × seller's per-cent-per-Power × share
     * fraction → cents the seller actually earned. Used by VendorController
     * + VendorPayoutController so the math stays consistent across both.
     */
    public static function sellerEarnedCents(int $totalPower): int
    {
        return (int) round($totalPower * self::eurCentsPerPower() * self::sellerShareFraction());
    }

    public static function llmMaxIterations(): int
    {
        return (int) (SiteSetting::lookup('llm_max_iterations') ?? self::FB_LLM_MAX_ITERATIONS);
    }

    public static function llmDefaultMaxOutputTokens(): int
    {
        return (int) (SiteSetting::lookup('llm_default_max_output_tokens') ?? self::FB_LLM_DEFAULT_MAX_OUTPUT);
    }

    public static function maxSkillsPerAgent(): int
    {
        return (int) (SiteSetting::lookup('max_skills_per_agent') ?? self::FB_MAX_SKILLS_PER_AGENT);
    }

    /**
     * Parse a comma-separated CMS setting into a clean array. Used for
     * agent_ranks, known_languages, known_integration_tags — picker
     * options that admins maintain as a single string for simplicity.
     */
    public static function listSetting(string $key, array $fallback = []): array
    {
        $raw = SiteSetting::lookup($key);
        if (! $raw) {
            return $fallback;
        }

        return collect(explode(',', $raw))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->values()
            ->all();
    }
}
