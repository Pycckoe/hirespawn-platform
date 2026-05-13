<?php

namespace App\Filament\Resources\PaymentMethodTypes\Tables;

use App\Models\PaymentMethodType;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class PaymentMethodTypesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('icon')
                    ->label(''),
                TextColumn::make('label')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('key')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('audience')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'buyer' => 'info',
                        'seller' => 'success',
                        'both' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('fee_percent')
                    ->label('Fee %')
                    ->formatStateUsing(fn ($state) => number_format((float) $state, 2).'%')
                    ->sortable(),
                TextColumn::make('fee_flat_cents')
                    ->label('Flat')
                    ->money('EUR', divideBy: 100)
                    ->sortable(),
                TextColumn::make('min_amount_cents')
                    ->label('Min')
                    ->money('EUR', divideBy: 100)
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('description')
                    ->limit(40)
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
                TextColumn::make('sort')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('audience')->options([
                    'buyer' => 'Buyer',
                    'seller' => 'Seller',
                    'both' => 'Both',
                ]),
                TernaryFilter::make('is_active'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('sort');
    }
}
