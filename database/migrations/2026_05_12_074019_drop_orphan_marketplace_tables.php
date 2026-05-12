<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time orphan cleanup.
 *
 * The first production deploy left marketplace tables in an inconsistent
 * state: an `agents` table existed, but with foreign keys from `agent_*`
 * tables that aren't in this codebase at all (`agent_subscriptions`,
 * `agent_reviews`), so a plain `dropIfExists('agents')` failed with
 * `cannot drop table agents because other objects depend on it`.
 *
 * This guard now drops every marketplace table with `CASCADE` on Postgres
 * — that removes the dependent FK constraints from any unknown legacy
 * table — and falls back to `Schema::dropIfExists` on other drivers
 * (SQLite locally) where CASCADE isn't supported. It also enumerates the
 * known orphan `agent_*` tables so they get dropped fully.
 *
 * After it lands it sits in `migrations` and never runs again.
 */
return new class extends Migration
{
    private const TABLES = [
        // Current schema, reverse FK order.
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
        // Known legacy orphan tables from a prior schema attempt.
        'agent_subscriptions',
        'agent_reviews',
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
        $driver = DB::connection()->getDriverName();

        foreach (self::TABLES as $table) {
            if ($driver === 'pgsql') {
                DB::statement('DROP TABLE IF EXISTS "'.$table.'" CASCADE');
            } else {
                Schema::dropIfExists($table);
            }
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
