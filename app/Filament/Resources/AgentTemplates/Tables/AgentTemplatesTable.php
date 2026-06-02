<?php

namespace App\Filament\Resources\AgentTemplates\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class AgentTemplatesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('sort_order')->label('#')->sortable(),
                TextColumn::make('icon')->label('')->placeholder('—'),
                TextColumn::make('name')->searchable()->sortable()->weight('bold'),
                TextColumn::make('category_slug')->label('Category')->badge()->placeholder('—'),
                TextColumn::make('suggested_model_slug')->label('Model')->fontFamily('mono')->color('gray')->placeholder('—')->toggleable(),
                IconColumn::make('accepts_knowledge')->label('RAG')->boolean(),
                IconColumn::make('is_active')->label('Active')->boolean(),
            ])
            ->filters([
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
            ->defaultSort('sort_order')
            ->reorderable('sort_order');
    }
}
