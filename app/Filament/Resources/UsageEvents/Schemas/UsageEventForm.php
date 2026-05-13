<?php

namespace App\Filament\Resources\UsageEvents\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class UsageEventForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('subscription_id')
                    ->relationship('subscription', 'id')
                    ->required(),
                TextInput::make('event_type')
                    ->required(),
                TextInput::make('units_consumed')
                    ->required()
                    ->numeric()
                    ->default(1),
                TextInput::make('unit_type'),
                TextInput::make('power_consumed')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('request_id'),
                TextInput::make('agent_response_status')
                    ->numeric(),
                TextInput::make('latency_ms')
                    ->numeric(),
                TextInput::make('cost_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                DateTimePicker::make('recorded_at')
                    ->required(),
                Textarea::make('metadata')
                    ->columnSpanFull(),
            ]);
    }
}
