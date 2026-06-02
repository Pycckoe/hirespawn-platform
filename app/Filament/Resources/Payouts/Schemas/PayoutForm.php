<?php

namespace App\Filament\Resources\Payouts\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PayoutForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('seller_id')
                    ->relationship('seller', 'name')
                    ->required(),
                DateTimePicker::make('period_start'),
                DateTimePicker::make('period_end'),
                TextInput::make('gross_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('platform_fee_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('vat_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('net_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('currency')
                    ->required()
                    ->default('EUR'),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                TextInput::make('payment_method'),
                TextInput::make('reference'),
                DateTimePicker::make('paid_at'),
            ]);
    }
}
