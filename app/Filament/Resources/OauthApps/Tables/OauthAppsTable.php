<?php

namespace App\Filament\Resources\OauthApps\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class OauthAppsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('provider')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                TextColumn::make('label')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('client_id')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('default_scopes')
                    ->formatStateUsing(fn ($state) => is_array($state) ? count($state).' scopes' : '0 scopes')
                    ->color('gray'),
                IconColumn::make('is_active')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->dateTime('M d, H:i')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('is_active'),
            ])
            ->recordActions([EditAction::make()])
            ->toolbarActions([
                BulkActionGroup::make([DeleteBulkAction::make()]),
            ])
            ->defaultSort('sort_order');
    }
}
