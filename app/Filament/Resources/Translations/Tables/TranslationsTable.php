<?php

namespace App\Filament\Resources\Translations\Tables;

use App\Models\Translation;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TranslationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('locale')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                TextColumn::make('namespace')
                    ->badge()
                    ->color('gray')
                    ->sortable(),
                TextColumn::make('key')
                    ->searchable()
                    ->sortable()
                    ->fontFamily('mono')
                    ->weight('bold')
                    ->copyable(),
                TextColumn::make('value')
                    ->limit(80)
                    ->wrap()
                    ->placeholder('—')
                    ->searchable(),
                TextColumn::make('updated_at')
                    ->dateTime('M d, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('locale')
                    ->options(fn () => Translation::query()
                        ->distinct()
                        ->orderBy('locale')
                        ->pluck('locale', 'locale')
                        ->all()
                    ),
                SelectFilter::make('namespace')
                    ->options(fn () => Translation::query()
                        ->distinct()
                        ->orderBy('namespace')
                        ->pluck('namespace', 'namespace')
                        ->all()
                    ),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultGroup('namespace')
            ->defaultSort('key');
    }
}
