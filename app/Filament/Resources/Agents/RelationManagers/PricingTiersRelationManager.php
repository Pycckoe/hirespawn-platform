<?php

namespace App\Filament\Resources\Agents\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * Manage the published pricing tiers shown on the agent detail page.
 * Money values are stored in cents.
 */
class PricingTiersRelationManager extends RelationManager
{
    protected static string $relationship = 'pricingTiers';

    protected static ?string $title = 'Pricing tiers';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(120),
                Select::make('currency')
                    ->options([
                        'EUR' => 'EUR €',
                        'USD' => 'USD $',
                        'GBP' => 'GBP £',
                    ])
                    ->default('EUR')
                    ->native(false)
                    ->required(),
                TextInput::make('price_cents')
                    ->numeric()
                    ->default(0)
                    ->suffix('cents')
                    ->required()
                    ->helperText('e.g. 24900 = €249.00.'),
                TextInput::make('included_units')
                    ->numeric()
                    ->default(0)
                    ->helperText('Units bundled in the tier.'),
                TextInput::make('unit_name')
                    ->maxLength(60)
                    ->helperText('e.g. tickets, leads, runs.'),
                TextInput::make('overage_price_cents')
                    ->numeric()
                    ->default(0)
                    ->suffix('cents')
                    ->helperText('Charged per unit beyond the included amount.'),
                TextInput::make('sort_order')
                    ->numeric()
                    ->default(0),
                TagsInput::make('features')
                    ->helperText('Bullet points shown on the pricing card. Press Enter after each.')
                    ->columnSpanFull(),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                TextColumn::make('sort_order')
                    ->label('#')
                    ->sortable(),
                TextColumn::make('name')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('price_cents')
                    ->label('Price')
                    ->money(fn ($record) => $record->currency ?? 'EUR', divideBy: 100)
                    ->sortable(),
                TextColumn::make('included_units')
                    ->label('Included'),
                TextColumn::make('unit_name')
                    ->label('Unit')
                    ->placeholder('—'),
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
            ->defaultSort('sort_order');
    }
}
