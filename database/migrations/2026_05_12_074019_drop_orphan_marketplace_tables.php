<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time orphan cleanup.
 *
 * The first production deploy revealed the Neon Postgres database carried
 * an `agents` table — plus dependent `agent_subscriptions` and
 * `agent_reviews` tables — that aren't part of this codebase. They came
 * from a prior schema attempt on the same database. Their presence
 * blocked the marketplace `create_agents_table` migration with
 * "relation agents already exists" and, after a naive CASCADE drop,
 * "agent_categories does not exist" (because deleting log rows mid-run
 * doesn't make the migrator re-run anything within the same command).
 *
 * Conservative design:
 *   • Drop **only** the orphan tables that aren't in this codebase.
 *     Postgres uses `CASCADE` so unknown dependent FK constraints are
 *     swept away alongside.
 *   • Do **not** touch tables managed by the marketplace migrations.
 *   • Do **not** delete anything from `migrations`. Letting the standard
 *     migrator decide what's pending keeps state consistent regardless of
 *     prior partial runs.
 *
 * Fresh database: all drops are no-ops, the guard is recorded, and the
 * marketplace migrations create everything cleanly. Existing database
 * with orphan `agents`: drops the orphan trio (cascading their FKs to
 * each other), leaves any already-created marketplace tables alone, then
 * the create migrations fill in the rest.
 */
return new class extends Migration
{
    private const ORPHAN_TABLES = [
        'agent_subscriptions',
        'agent_reviews',
        'agents',
    ];

    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        foreach (self::ORPHAN_TABLES as $table) {
            if ($driver === 'pgsql') {
                DB::statement('DROP TABLE IF EXISTS "'.$table.'" CASCADE');
            } else {
                Schema::dropIfExists($table);
            }
        }
    }

    public function down(): void
    {
        // Intentionally empty — restoring legacy orphan tables is not useful.
    }
};
