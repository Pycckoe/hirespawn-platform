<?php

namespace App\Filament\Resources\PowerPacks\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PowerPackForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('slug')
                    ->required(),
                TextInput::make('power')
                    ->required()
                    ->numeric(),
                TextInput::make('price_cents')
                    ->numeric(),
                TextInput::make('currency')
                    ->required()
                    ->default('EUR'),
                TextInput::make('per_power_eur')
                    ->numeric(),
                Toggle::make('is_popular')
                    ->required(),
                Textarea::make('perks')
                    ->columnSpanFull(),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('audience'),
            ]);
    }
}
