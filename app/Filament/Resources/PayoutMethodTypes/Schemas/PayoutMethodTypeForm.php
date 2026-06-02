<?php

namespace App\Filament\Resources\PayoutMethodTypes\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PayoutMethodTypeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Payout method')
                    ->description('How sellers withdraw their earnings.')
                    ->schema([
                        TextInput::make('key')
                            ->label('Internal key')
                            ->helperText('Stable slug — never changes. Used by controllers (bank, paypal, wise, crypto…).')
                            ->required()
                            ->maxLength(32)
                            ->alphaDash(),
                        TextInput::make('label')
                            ->helperText('Shown when sellers add a payout destination.')
                            ->required()
                            ->maxLength(80),
                        TextInput::make('icon')
                            ->label('Icon (emoji or symbol)')
                            ->maxLength(4)
                            ->placeholder('🏦'),
                        Textarea::make('description')
                            ->rows(2)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Availability')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('Available to sellers')
                            ->default(true),
                        TextInput::make('sort')
                            ->label('Display order')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),

                Section::make('Outbound fees & limits')
                    ->description('What we charge sellers when they cash out via this method. Effective fee = ceil(amount × percent / 100) + flat.')
                    ->schema([
                        TextInput::make('fee_percent')
                            ->label('Fee %')
                            ->helperText('e.g. 1.50 for 1.5%')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100)
                            ->step(0.01)
                            ->default(1.00)
                            ->suffix('%'),
                        TextInput::make('fee_flat_cents')
                            ->label('Flat fee')
                            ->helperText('In cents. e.g. 100 for €1.00.')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->suffix('¢'),
                        TextInput::make('min_amount_cents')
                            ->label('Minimum cash-out')
                            ->helperText('In cents. e.g. 2000 for €20.00.')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->default(1000)
                            ->suffix('¢'),
                    ])
                    ->columns(3),
            ]);
    }
}
