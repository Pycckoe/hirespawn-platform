<?php

namespace App\Filament\Resources\PayoutMethods\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PayoutMethodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                TextInput::make('type')
                    ->required(),
                TextInput::make('label')
                    ->required(),
                TextInput::make('holder_name'),
                TextInput::make('country'),
                TextInput::make('currency')
                    ->required()
                    ->default('EUR'),
                TextInput::make('account_last4'),
                TextInput::make('routing_hint'),
                Textarea::make('details')
                    ->columnSpanFull(),
                Toggle::make('is_default')
                    ->required(),
                DateTimePicker::make('verified_at'),
            ]);
    }
}
