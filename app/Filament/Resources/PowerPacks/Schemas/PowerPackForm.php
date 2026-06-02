<?php

namespace App\Filament\Resources\PowerPacks\Schemas;

use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PowerPackForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        TextInput::make('name')
                            ->label('Display name')
                            ->helperText('Shown on landing page card + checkout (e.g. "Pro").')
                            ->required()
                            ->maxLength(60),
                        TextInput::make('slug')
                            ->helperText('Stable URL slug. Stays the same across renames.')
                            ->required()
                            ->alphaDash()
                            ->maxLength(60),
                        TextInput::make('audience')
                            ->label('Audience subtitle')
                            ->helperText('One-liner below the price on /pricing.')
                            ->maxLength(160)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Pricing')
                    ->schema([
                        TextInput::make('power')
                            ->label('Power amount (⚡)')
                            ->helperText('Total Power units this pack includes.')
                            ->required()
                            ->numeric()
                            ->minValue(0),
                        // Admin enters the price in euros (the unit they
                        // think in); we transform between euros (form) and
                        // cents (DB) so the column stays integer + the
                        // number always matches the buyer-facing price.
                        TextInput::make('price_cents')
                            ->label('Price (€)')
                            ->helperText('Buyer-facing price. Leave blank for "Talk to sales" packs.')
                            ->numeric()
                            ->step(0.01)
                            ->minValue(0)
                            ->prefix('€')
                            ->formatStateUsing(fn ($state) => $state === null
                                ? null
                                : number_format($state / 100, 2, '.', ''))
                            ->dehydrateStateUsing(fn ($state) => $state === null || $state === ''
                                ? null
                                : (int) round(((float) $state) * 100)),
                        TextInput::make('currency')
                            ->required()
                            ->maxLength(3)
                            ->default('EUR'),
                        TextInput::make('per_power_eur')
                            ->label('€ per ⚡ (effective rate)')
                            ->helperText('Sticker rate per Power. e.g. 0.0099 = €0.0099 per ⚡.')
                            ->numeric()
                            ->step(0.0001)
                            ->prefix('€'),
                    ])
                    ->columns(2),

                Section::make('Display')
                    ->schema([
                        Toggle::make('is_popular')
                            ->label('Highlight as "Most Popular"')
                            ->helperText('Only one pack should usually have this on.')
                            ->required(),
                        TextInput::make('sort_order')
                            ->label('Sort order')
                            ->helperText('Lower numbers appear first.')
                            ->required()
                            ->numeric()
                            ->default(0),
                        TagsInput::make('perks')
                            ->label('Feature bullets')
                            ->helperText('Press Enter after each item. Shows as "› bullet" list on the pricing card.')
                            ->placeholder('Add a feature and press Enter')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }
}
