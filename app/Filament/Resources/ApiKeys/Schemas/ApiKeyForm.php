<?php

namespace App\Filament\Resources\ApiKeys\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ApiKeyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('prefix')
                    ->required(),
                TextInput::make('hash')
                    ->required(),
                TextInput::make('environment')
                    ->required()
                    ->default('live'),
                DateTimePicker::make('last_used_at'),
                DateTimePicker::make('revoked_at'),
            ]);
    }
}
