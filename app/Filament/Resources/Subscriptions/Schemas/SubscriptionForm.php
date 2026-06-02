<?php

namespace App\Filament\Resources\Subscriptions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class SubscriptionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('buyer_id')
                    ->relationship('buyer', 'name')
                    ->required(),
                Select::make('agent_id')
                    ->relationship('agent', 'name')
                    ->required(),
                Select::make('pricing_tier_id')
                    ->relationship('pricingTier', 'name'),
                TextInput::make('status')
                    ->required()
                    ->default('active'),
                TextInput::make('api_key_hash'),
                TextInput::make('api_key_prefix'),
                DateTimePicker::make('started_at'),
                DateTimePicker::make('current_period_start'),
                DateTimePicker::make('current_period_end'),
                DateTimePicker::make('cancelled_at'),
                DateTimePicker::make('ends_at'),
                DateTimePicker::make('trial_ends_at'),
                Textarea::make('metadata')
                    ->columnSpanFull(),
            ]);
    }
}
