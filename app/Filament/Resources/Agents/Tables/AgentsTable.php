<?php

namespace App\Filament\Resources\Agents\Tables;

use App\Models\Agent;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AgentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('seller.name')
                    ->label('Seller')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('category.name')
                    ->label('Category')
                    ->searchable()
                    ->badge(),
                TextColumn::make('status')
                    ->badge()
                    ->sortable()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'pending_review' => 'warning',
                        'suspended' => 'danger',
                        'rejected' => 'danger',
                        'draft' => 'gray',
                        default => 'gray',
                    }),
                TextColumn::make('power_cost')
                    ->label('Power')
                    ->numeric()
                    ->sortable()
                    ->suffix('⚡'),
                TextColumn::make('per_unit')
                    ->label('Unit')
                    ->toggleable(),
                TextColumn::make('rating_avg')
                    ->label('Rating')
                    ->numeric(decimalPlaces: 2)
                    ->sortable()
                    ->formatStateUsing(fn ($state) => $state > 0 ? "★ {$state}" : '—'),
                TextColumn::make('subscribers_count')
                    ->label('Subs')
                    ->numeric()
                    ->sortable(),
                IconColumn::make('is_featured')
                    ->label('Featured')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('published_at')
                    ->label('Published')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime('M d, Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'pending_review' => 'Pending review',
                        'approved' => 'Approved · live',
                        'suspended' => 'Suspended',
                        'rejected' => 'Rejected',
                    ]),
                SelectFilter::make('category_id')
                    ->label('Category')
                    ->relationship('category', 'name'),
            ])
            ->recordActions([
                ActionGroup::make([
                    EditAction::make(),
                    Action::make('approve')
                        ->label('Approve · publish')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->visible(fn (Agent $r) => in_array($r->status, ['pending_review', 'draft', 'suspended', 'rejected'], true))
                        ->requiresConfirmation()
                        ->action(function (Agent $r) {
                            $r->forceFill([
                                'status' => 'approved',
                                'published_at' => $r->published_at ?? now(),
                            ])->save();
                            Notification::make()->success()->title("Approved “{$r->name}”")->send();
                        }),
                    Action::make('suspend')
                        ->label('Suspend')
                        ->icon('heroicon-o-pause-circle')
                        ->color('warning')
                        ->visible(fn (Agent $r) => $r->status === 'approved')
                        ->requiresConfirmation()
                        ->action(function (Agent $r) {
                            $r->forceFill(['status' => 'suspended'])->save();
                            Notification::make()->warning()->title("Suspended “{$r->name}”")->send();
                        }),
                    Action::make('reject')
                        ->label('Reject')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->visible(fn (Agent $r) => in_array($r->status, ['pending_review', 'draft'], true))
                        ->schema([
                            Textarea::make('reason')
                                ->label('Reason (visible to seller)')
                                ->rows(3)
                                ->maxLength(500),
                        ])
                        ->action(function (Agent $r, array $data) {
                            $r->forceFill(['status' => 'rejected'])->save();
                            // Reason is captured for future Dispute / audit log integration.
                            Notification::make()->danger()->title("Rejected “{$r->name}”")->send();
                        }),
                ])
                    ->label('Moderate')
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
