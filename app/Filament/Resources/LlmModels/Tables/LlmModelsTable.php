<?php

namespace App\Filament\Resources\LlmModels\Tables;

use App\Models\LlmModel;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class LlmModelsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('provider')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'anthropic' => 'warning',
                        'openai' => 'success',
                        'google' => 'info',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('slug')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('input_price_cents_per_1m')
                    ->label('In ¢/1M')
                    ->numeric()
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('output_price_cents_per_1m')
                    ->label('Out ¢/1M')
                    ->numeric()
                    ->sortable()
                    ->alignEnd(),
                TextColumn::make('context_window')
                    ->label('Context')
                    ->formatStateUsing(fn (int $state): string => $state >= 1000 ? round($state / 1000).'k' : (string) $state)
                    ->sortable()
                    ->alignEnd(),
                IconColumn::make('is_active')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('deprecated_at')
                    ->dateTime('M d, Y')
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('provider')
                    ->options(fn () => LlmModel::query()->distinct()->pluck('provider', 'provider')->all()),
                TernaryFilter::make('is_active'),
            ])
            ->recordActions([EditAction::make()])
            ->toolbarActions([
                BulkActionGroup::make([DeleteBulkAction::make()]),
            ])
            ->defaultGroup('provider')
            ->defaultSort('sort_order');
    }
}
