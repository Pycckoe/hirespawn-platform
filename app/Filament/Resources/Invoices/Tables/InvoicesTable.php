<?php

namespace App\Filament\Resources\Invoices\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class InvoicesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('buyer.name')
                    ->searchable(),
                TextColumn::make('subscription.id')
                    ->searchable(),
                TextColumn::make('period_start')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('period_end')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('subtotal_cents')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('vat_cents')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_cents')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('currency')
                    ->searchable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('stripe_invoice_id')
                    ->searchable(),
                TextColumn::make('pdf_url')
                    ->searchable(),
                TextColumn::make('paid_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('due_at')
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
