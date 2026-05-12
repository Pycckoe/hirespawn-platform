<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time orphan cleanup.
 *
 * The first production deploy left marketplace tables in an inconsistent
 * state: the `agents` table existed in the database but no row for its
 * migration sat in `migrations`, so the create migration tried to run a
 * second time and crashed on a duplicate-table error.
 *
 * This guard runs once, before the marketplace migrations. It drops every
 * marketplace table (no-op on a clean database) and deletes any matching
 * rows from the migrations log so the subsequent create migrations always
 * run from a known state. After it lands it gets recorded in `migrations`
 * itself and never executes again.
 */
return new class extends Migration
{
    private const TABLES = [
        'disputes',
        'reviews',
        'payouts',
        'invoices',
        'usage_events',
        'subscriptions',
        'power_packs',
        'agent_tags',
        'agent_screenshots',
        'agent_pricing_tiers',
        'agent_capabilities',
        'agents',
        'agent_categories',
        'buyer_profiles',
        'seller_profiles',
    ];

    private const MIGRATION_PREFIXES = [
        '2026_05_12_074020_',
        '2026_05_12_074021_',
        '2026_05_12_074022_',
        '2026_05_12_074023_',
        '2026_05_12_074024_',
        '2026_05_12_074025_',
        '2026_05_12_074026_',
        '2026_05_12_074027_',
        '2026_05_12_074028_',
        '2026_05_12_074029_',
        '2026_05_12_074030_',
        '2026_05_12_074031_',
        '2026_05_12_074032_',
        '2026_05_12_074033_',
        '2026_05_12_074034_',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::hasTable('migrations')) {
            DB::table('migrations')
                ->where(function ($query) {
                    foreach (self::MIGRATION_PREFIXES as $prefix) {
                        $query->orWhere('migration', 'like', $prefix.'%');
                    }
                })
                ->delete();
        }
    }

    public function down(): void
    {
        // Intentionally empty — this guard is a one-time fix; rolling it back
        // would leave the marketplace tables present without rebuilding the
        // log entries that were just removed.
    }
};
