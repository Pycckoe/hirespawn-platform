<?php

namespace App\Filament\Resources\Payouts\Tables;

use App\Models\Payout;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PayoutsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('reference')
                    ->label('Ref')
                    ->searchable()
                    ->copyable()
                    ->fontFamily('mono'),
                TextColumn::make('seller.name')
                    ->label('Seller')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->sortable()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'pending' => 'warning',
                        'processing' => 'info',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('payment_method')
                    ->label('Method')
                    ->badge()
                    ->color('gray'),
                TextColumn::make('gross_cents')
                    ->label('Gross')
                    ->money(fn (Payout $r) => $r->currency, divideBy: 100)
                    ->sortable(),
                TextColumn::make('platform_fee_cents')
                    ->label('Fee')
                    ->money(fn (Payout $r) => $r->currency, divideBy: 100)
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('net_cents')
                    ->label('Net')
                    ->money(fn (Payout $r) => $r->currency, divideBy: 100)
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('created_at')
                    ->label('Requested')
                    ->dateTime('M d, Y H:i')
                    ->sortable(),
                TextColumn::make('paid_at')
                    ->label('Paid')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->placeholder('—'),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'processing' => 'Processing',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                    ]),
                SelectFilter::make('payment_method')
                    ->options([
                        'bank' => 'Bank',
                        'card' => 'Card',
                        'paypal' => 'PayPal',
                        'wise' => 'Wise',
                        'crypto' => 'Crypto',
                    ]),
            ])
            ->recordActions([
                ActionGroup::make([
                    EditAction::make(),
                    Action::make('process')
                        ->label('Mark processing')
                        ->icon('heroicon-o-arrow-path')
                        ->color('info')
                        ->visible(fn (Payout $r) => $r->status === 'pending')
                        ->requiresConfirmation()
                        ->action(function (Payout $r) {
                            $r->forceFill(['status' => 'processing'])->save();
                            Notification::make()->info()->title("Payout {$r->reference} → processing")->send();
                        }),
                    Action::make('markPaid')
                        ->label('Mark paid')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->visible(fn (Payout $r) => in_array($r->status, ['pending', 'processing'], true))
                        ->requiresConfirmation()
                        ->action(function (Payout $r) {
                            $r->forceFill([
                                'status' => 'paid',
                                'paid_at' => now(),
                            ])->save();
                            Notification::make()->success()->title("Payout {$r->reference} paid")->send();
                        }),
                    Action::make('markFailed')
                        ->label('Mark failed')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->visible(fn (Payout $r) => in_array($r->status, ['pending', 'processing'], true))
                        ->requiresConfirmation()
                        ->action(function (Payout $r) {
                            $r->forceFill(['status' => 'failed'])->save();
                            Notification::make()->danger()->title("Payout {$r->reference} marked failed")->send();
                        }),
                ])
                    ->label('Transition')
                    ->icon('heroicon-m-ellipsis-vertical')
                    ->button(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
