<?php

namespace App\Filament\Resources\Menus\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class ItemsRelationManager extends RelationManager
{
    protected static string $relationship = 'items';

    protected static ?string $title = 'Items';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Content')
                    ->schema([
                        TextInput::make('label')
                            ->required()
                            ->maxLength(120)
                            ->columnSpan(1),
                        TextInput::make('url')
                            ->label('URL')
                            ->placeholder('/roster · https://… · mailto:…')
                            ->maxLength(500)
                            ->columnSpan(1),
                        TextInput::make('icon')
                            ->label('Icon key')
                            ->helperText('For social / payments rows. Known keys: x, linkedin, github, youtube, rss, visa, mastercard, applepay, googlepay, amex, paypal. Leave blank for text links.')
                            ->maxLength(40)
                            ->columnSpan(1),
                        Select::make('target')
                            ->options([
                                '_self'  => 'Same tab',
                                '_blank' => 'New tab',
                            ])
                            ->default('_self')
                            ->native(false)
                            ->required()
                            ->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Visibility')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('Visible on the site')
                            ->default(true),
                        TextInput::make('sort')
                            ->label('Display order')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('label')
            ->columns([
                TextColumn::make('sort')
                    ->label('#')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('icon')
                    ->label('Icon')
                    ->fontFamily('mono')
                    ->color('gray')
                    ->placeholder('—'),
                TextColumn::make('label')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('url')
                    ->color('gray')
                    ->limit(40)
                    ->placeholder('—')
                    ->copyable(),
                TextColumn::make('target')
                    ->badge()
                    ->color(fn ($state) => $state === '_blank' ? 'info' : 'gray'),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
            ])
            ->filters([
                TernaryFilter::make('is_active'),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('sort')
            ->reorderable('sort');
    }
}
