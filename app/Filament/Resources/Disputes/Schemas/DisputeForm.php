<?php

namespace App\Filament\Resources\Disputes\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class DisputeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('subscription_id')
                    ->relationship('subscription', 'id')
                    ->required(),
                Select::make('buyer_id')
                    ->relationship('buyer', 'name')
                    ->required(),
                Select::make('seller_id')
                    ->relationship('seller', 'name')
                    ->required(),
                TextInput::make('reason_code')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('status')
                    ->required()
                    ->default('open'),
                Textarea::make('resolution')
                    ->columnSpanFull(),
                TextInput::make('refund_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                DateTimePicker::make('opened_at')
                    ->required(),
                DateTimePicker::make('resolved_at'),
            ]);
    }
}
