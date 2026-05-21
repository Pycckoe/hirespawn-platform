<?php

namespace App\Filament\Resources\PowerPacks\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PowerPacksTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('slug')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->searchable()
                    ->toggleable(),
                // Power → human "100k⚡" instead of raw "100,000" so it
                // matches what the buyer sees on /pricing + /power.
                TextColumn::make('power')
                    ->label('Power (⚡)')
                    ->formatStateUsing(fn (int $state): string => $state >= 1000
                        ? number_format($state / 1000, $state % 1000 === 0 ? 0 : 1, '.', '').'k'
                        : (string) $state)
                    ->sortable()
                    ->alignEnd(),
                // Price as euros with 2 decimals, matching the buyer
                // view. Underlying column is cents; we just format.
                TextColumn::make('price_cents')
                    ->label('Price (€)')
                    ->formatStateUsing(fn (?int $state): string => $state === null
                        ? 'Custom'
                        : '€'.number_format($state / 100, 2, '.', ''))
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('currency')
                    ->badge()
                    ->color('gray')
                    ->toggleable(),
                // Per-power rate shown at 4 decimals so admins see the
                // real number (the model stores 0.0099, not 0.01).
                TextColumn::make('per_power_eur')
                    ->label('€ per ⚡')
                    ->formatStateUsing(fn ($state): string => $state === null
                        ? '—'
                        : '€'.number_format((float) $state, 4, '.', ''))
                    ->sortable()
                    ->alignEnd(),
                IconColumn::make('is_popular')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('sort_order')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('audience')
                    ->searchable()
                    ->limit(40)
                    ->toggleable(),
                TextColumn::make('updated_at')
                    ->dateTime('M d, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([EditAction::make()])
            ->toolbarActions([
                BulkActionGroup::make([DeleteBulkAction::make()]),
            ])
            ->defaultSort('sort_order');
    }
}
