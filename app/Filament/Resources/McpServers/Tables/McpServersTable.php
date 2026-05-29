<?php

namespace App\Filament\Resources\McpServers\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class McpServersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('sort_order')->label('#')->sortable(),
                TextColumn::make('icon')->label('')->placeholder('—'),
                TextColumn::make('name')->searchable()->sortable()->weight('bold'),
                TextColumn::make('category')->badge()->sortable(),
                TextColumn::make('url')->label('URL')->fontFamily('mono')->color('gray')->placeholder('— (buyer-supplied)')->limit(40)->toggleable(),
                IconColumn::make('is_active')->label('Active')->boolean(),
            ])
            ->filters([
                SelectFilter::make('category')->options([
                    'CRM' => 'CRM',
                    'Support' => 'Support',
                    'Finance' => 'Finance',
                    'Docs' => 'Docs',
                    'Dev' => 'Dev',
                    'Productivity' => 'Productivity',
                    'Other' => 'Other',
                ]),
                TernaryFilter::make('is_active'),
            ])
            ->recordActions([EditAction::make()])
            ->toolbarActions([
                BulkActionGroup::make([DeleteBulkAction::make()]),
            ])
            ->defaultSort('sort_order')
            ->reorderable('sort_order');
    }
}
