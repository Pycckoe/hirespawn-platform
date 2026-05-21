<?php

namespace App\Filament\Resources\AuditEvents\Tables;

use App\Models\AuditEvent;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AuditEventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('When')
                    ->dateTime('M d, Y H:i:s')
                    ->sortable(),
                TextColumn::make('user.email')
                    ->label('User')
                    ->placeholder('—')
                    ->searchable(),
                TextColumn::make('event_type')
                    ->badge()
                    ->color(fn (string $state): string => match (true) {
                        str_starts_with($state, 'auth.failed') => 'danger',
                        str_starts_with($state, 'auth.') => 'info',
                        str_starts_with($state, 'agent.') => 'success',
                        str_starts_with($state, 'oauth.') => 'warning',
                        default => 'gray',
                    })
                    ->searchable()
                    ->sortable(),
                TextColumn::make('subject_type')
                    ->label('Subject')
                    ->formatStateUsing(fn (?string $state, AuditEvent $row): string => $state
                        ? class_basename($state).'#'.$row->subject_id
                        : '—')
                    ->color('gray')
                    ->fontFamily('mono')
                    ->toggleable(),
                TextColumn::make('ip_address')
                    ->label('IP')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->toggleable(),
                TextColumn::make('metadata')
                    ->limit(80)
                    ->wrap()
                    ->formatStateUsing(fn ($state): string => $state ? json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '—')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('event_type')
                    ->options(fn () => AuditEvent::query()
                        ->select('event_type')
                        ->distinct()
                        ->orderBy('event_type')
                        ->pluck('event_type', 'event_type')
                        ->all()
                    )
                    ->searchable(),
                Filter::make('last_7_days')
                    ->label('Last 7 days')
                    ->query(fn ($query) => $query->where('created_at', '>=', now()->subDays(7))),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
