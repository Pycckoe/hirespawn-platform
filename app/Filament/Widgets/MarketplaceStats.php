<?php

namespace App\Filament\Widgets;

use App\Models\Agent;
use App\Models\Payout;
use App\Models\Subscription;
use App\Models\UsageEvent;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class MarketplaceStats extends StatsOverviewWidget
{
    protected ?string $heading = 'Marketplace · last 30 days';

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(30);

        $usage30d = UsageEvent::query()
            ->where('recorded_at', '>=', $since)
            ->get(['power_consumed', 'cost_cents']);

        $power30d = (int) $usage30d->sum('power_consumed');
        $gmv30dCents = (int) $usage30d->sum('cost_cents');

        $newUsers30d = User::query()->where('created_at', '>=', $since)->count();
        $activeAgents = Agent::query()->where('status', 'approved')->count();
        $activeSubs = Subscription::query()->where('status', 'active')->count();
        $pendingPayoutCents = (int) Payout::query()
            ->whereIn('status', ['pending', 'processing'])
            ->sum('gross_cents');

        return [
            Stat::make('Power burned', number_format($power30d).' ⚡')
                ->description(($power30d > 0 ? '€'.number_format($power30d * 0.009, 0) : '€0').' at Pro rate')
                ->color('success'),

            Stat::make('GMV', '€'.number_format($gmv30dCents / 100, 2))
                ->description($usage30d->count().' runs')
                ->color('info'),

            Stat::make('Active agents', (string) $activeAgents)
                ->description($activeSubs.' active subscriptions')
                ->color('primary'),

            Stat::make('New users', (string) $newUsers30d)
                ->description('past 30 days')
                ->color('gray'),

            Stat::make('Payouts pending', '€'.number_format($pendingPayoutCents / 100, 2))
                ->description('awaiting processing')
                ->color($pendingPayoutCents > 0 ? 'warning' : 'gray'),
        ];
    }
}
