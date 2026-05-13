<?php

namespace App\Filament\Resources\PaymentMethodTypes\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PaymentMethodTypeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Method')
                    ->description('What buyers and sellers see when picking a destination.')
                    ->schema([
                        TextInput::make('key')
                            ->label('Internal key')
                            ->helperText('Stable slug — never changes. Used by controllers (bank, card, paypal, wise, crypto…).')
                            ->required()
                            ->maxLength(32)
                            ->alphaDash(),
                        TextInput::make('label')
                            ->helperText('Shown in the UI dropdown.')
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
                        Select::make('audience')
                            ->required()
                            ->options([
                                'buyer'  => 'Buyer — top-ups',
                                'seller' => 'Seller — payouts',
                                'both'   => 'Both sides',
                            ])
                            ->native(false),
                        Toggle::make('is_active')
                            ->label('Available to users')
                            ->default(true),
                        TextInput::make('sort')
                            ->label('Display order')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(3),

                Section::make('Fees & limits')
                    ->description('Effective fee = ceil(amount × percent / 100) + flat. Both can be zero.')
                    ->schema([
                        TextInput::make('fee_percent')
                            ->label('Fee %')
                            ->helperText('e.g. 2.90 for 2.9%')
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
                            ->label('Minimum amount')
                            ->helperText('In cents. e.g. 1000 for €10.00.')
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
