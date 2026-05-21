<?php

namespace App\Filament\Resources\SupportTickets\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class SupportTicketsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('reference')
                    ->fontFamily('mono')
                    ->weight('bold')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('kind')
                    ->badge()
                    ->color(fn (string $state): string => $state === 'dispute' ? 'warning' : 'info')
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'open' => 'warning',
                        'investigating' => 'info',
                        'resolved' => 'success',
                        'closed' => 'gray',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('subject')
                    ->limit(50)
                    ->searchable(),
                TextColumn::make('email')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('category')
                    ->badge()
                    ->color('gray')
                    ->toggleable(),
                TextColumn::make('refund_power')
                    ->label('Refund ⚡')
                    ->numeric()
                    ->alignEnd()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime('M d, H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('kind')
                    ->options(['support' => 'Support', 'dispute' => 'Dispute']),
                SelectFilter::make('status')
                    ->options([
                        'open' => 'Open',
                        'investigating' => 'Investigating',
                        'resolved' => 'Resolved',
                        'closed' => 'Closed',
                    ]),
            ])
            ->recordActions([EditAction::make()])
            ->toolbarActions([
                BulkActionGroup::make([DeleteBulkAction::make()]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
