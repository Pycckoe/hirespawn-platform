<?php

namespace App\Filament\Resources\Agents\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class AgentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('seller_id')
                    ->label('Seller (owner)')
                    ->relationship('seller', 'email')
                    ->searchable()
                    ->preload()
                    ->helperText("The agent runs on THIS user's LLM API key (set under /vendor → LLM keys). Reassign to yourself to use your own key.")
                    ->required(),
                Select::make('category_id')
                    ->relationship('category', 'name'),
                TextInput::make('slug')
                    ->required(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('tagline'),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('vendor'),
                TextInput::make('rank'),
                TextInput::make('role'),
                TextInput::make('status')
                    ->required()
                    ->default('draft'),
                TextInput::make('pricing_model')
                    ->required()
                    ->default('subscription'),
                TextInput::make('base_price_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('currency')
                    ->required()
                    ->default('EUR'),
                TextInput::make('billing_period')
                    ->required()
                    ->default('monthly'),
                TextInput::make('power_cost')
                    ->required()
                    ->numeric()
                    ->default(0)
                    ->prefix('$'),
                TextInput::make('per_unit'),
                TextInput::make('api_endpoint_url')
                    ->url(),
                TextInput::make('manifest_url')
                    ->url(),
                TextInput::make('manifest_version'),
                TextInput::make('webhook_secret'),
                TextInput::make('health_check_url')
                    ->url(),
                TextInput::make('sla_uptime_pct')
                    ->required()
                    ->numeric()
                    ->default(99),
                TextInput::make('rating_avg')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('reviews_count')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('subscribers_count')
                    ->required()
                    ->numeric()
                    ->default(0),
                Textarea::make('languages')
                    ->columnSpanFull(),
                Textarea::make('integrations')
                    ->columnSpanFull(),
                TextInput::make('spec'),
                Toggle::make('is_featured')
                    ->required(),
                DateTimePicker::make('featured_until'),
                DateTimePicker::make('published_at'),
            ]);
    }
}
