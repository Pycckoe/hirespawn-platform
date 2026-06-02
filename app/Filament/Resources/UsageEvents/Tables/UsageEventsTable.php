<?php

namespace App\Filament\Resources\UsageEvents\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class UsageEventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('subscription.id')
                    ->searchable(),
                TextColumn::make('event_type')
                    ->searchable(),
                TextColumn::make('units_consumed')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('unit_type')
                    ->searchable(),
                TextColumn::make('power_consumed')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('request_id')
                    ->searchable(),
                TextColumn::make('agent_response_status')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('latency_ms')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('cost_cents')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('recorded_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
