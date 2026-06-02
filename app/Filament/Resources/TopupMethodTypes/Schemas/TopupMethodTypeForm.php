<?php

namespace App\Filament\Resources\TopupMethodTypes\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TopupMethodTypeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Top-up method')
                    ->description('How buyers add power to their balance.')
                    ->schema([
                        TextInput::make('key')
                            ->label('Internal key')
                            ->helperText('Stable slug — never changes. Used by controllers (card, sepa, paypal, crypto…).')
                            ->required()
                            ->maxLength(32)
                            ->alphaDash(),
                        TextInput::make('label')
                            ->helperText('Shown in the checkout dropdown.')
                            ->required()
                            ->maxLength(80),
                        TextInput::make('icon')
                            ->label('Icon (emoji or symbol)')
                            ->maxLength(4)
                            ->placeholder('💳'),
                        Textarea::make('description')
                            ->rows(2)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Availability')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('Available to buyers')
                            ->default(true),
                        TextInput::make('sort')
                            ->label('Display order')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),

                Section::make('Inbound fees & limits')
                    ->description('What we charge buyers for using this top-up method. Effective fee = ceil(amount × percent / 100) + flat.')
                    ->schema([
                        TextInput::make('fee_percent')
                            ->label('Fee %')
                            ->helperText('e.g. 2.90 for 2.9% (Stripe card rate)')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100)
                            ->step(0.01)
                            ->default(1.00)
                            ->suffix('%'),
                        TextInput::make('fee_flat_cents')
                            ->label('Flat fee')
                            ->helperText('In cents. e.g. 30 for €0.30.')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->suffix('¢'),
                        TextInput::make('min_amount_cents')
                            ->label('Minimum top-up')
                            ->helperText('In cents. e.g. 500 for €5.00.')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->default(500)
                            ->suffix('¢'),
                    ])
                    ->columns(3),
            ]);
    }
}
