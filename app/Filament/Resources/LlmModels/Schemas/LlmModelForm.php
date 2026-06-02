<?php

namespace App\Filament\Resources\LlmModels\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LlmModelForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        Select::make('provider')
                            ->required()
                            ->options([
                                'openai' => 'OpenAI',
                                'anthropic' => 'Anthropic',
                                'google' => 'Google',
                                'deepseek' => 'DeepSeek',
                                'xai' => 'xAI',
                                'mistral' => 'Mistral',
                                'meta' => 'Meta (Llama)',
                                'cohere' => 'Cohere',
                                'groq' => 'Groq',
                            ])
                            ->searchable()
                            ->native(false),
                        TextInput::make('name')
                            ->label('Display name')
                            ->helperText('Shown to sellers when picking a model.')
                            ->required()
                            ->maxLength(120),
                        TextInput::make('slug')
                            ->helperText('Stable slug, e.g. claude-opus-4-7.')
                            ->required()
                            ->alphaDash()
                            ->maxLength(80),
                        TextInput::make('api_id')
                            ->label('Provider API id')
                            ->helperText('Exact model id the provider expects in its API.')
                            ->required()
                            ->maxLength(120),
                        TextInput::make('version')
                            ->helperText('Snapshot tag if pinned.')
                            ->maxLength(40),
                    ])
                    ->columns(2),

                Section::make('Pricing (€ cents per 1M tokens)')
                    ->description('Convert provider USD prices to € cents. Stored as integers to avoid float drift in margin math.')
                    ->schema([
                        TextInput::make('input_price_cents_per_1m')
                            ->label('Input price (cents / 1M tokens)')
                            ->required()
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('output_price_cents_per_1m')
                            ->label('Output price (cents / 1M tokens)')
                            ->required()
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('context_window')
                            ->label('Context window (tokens)')
                            ->numeric()
                            ->minValue(0),
                        TextInput::make('max_output_tokens')
                            ->label('Max output tokens')
                            ->numeric()
                            ->minValue(0),
                    ])
                    ->columns(2),

                Section::make('Catalog metadata')
                    ->schema([
                        TagsInput::make('capabilities')
                            ->helperText('Press Enter after each: text, vision, tools, json, audio…')
                            ->columnSpanFull(),
                        Textarea::make('description')
                            ->rows(2)
                            ->columnSpanFull(),
                        Toggle::make('is_active')
                            ->helperText('Inactive models are hidden from the seller picker.')
                            ->default(true),
                        TextInput::make('sort_order')
                            ->required()
                            ->numeric()
                            ->default(0),
                        DateTimePicker::make('deprecated_at')
                            ->helperText('Mark when the provider is sunsetting this model.')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }
}
