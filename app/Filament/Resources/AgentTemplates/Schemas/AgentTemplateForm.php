<?php

namespace App\Filament\Resources\AgentTemplates\Schemas;

use App\Models\AgentCategory;
use App\Models\LlmModel;
use App\Models\OauthApp;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;

class AgentTemplateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Gallery card')
                    ->description('How the template appears to sellers on the "Publish agent" page.')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(120),
                        TextInput::make('slug')
                            ->required()
                            ->alphaDash()
                            ->maxLength(120)
                            ->unique(ignoreRecord: true),
                        TextInput::make('icon')
                            ->maxLength(16)
                            ->helperText('Emoji or single character.'),
                        Toggle::make('is_active')
                            ->default(true),
                        TextInput::make('sort_order')
                            ->numeric()
                            ->default(0),
                        Textarea::make('summary')
                            ->rows(2)
                            ->maxLength(400)
                            ->columnSpanFull()
                            ->helperText('One-liner describing what the agent does.'),
                    ])
                    ->columns(2),

                Section::make('Prefilled identity & specs')
                    ->schema([
                        TextInput::make('agent_name')
                            ->label('Suggested agent name')
                            ->maxLength(120),
                        Select::make('category_slug')
                            ->label('Category')
                            ->options(fn () => AgentCategory::query()->orderBy('sort_order')->pluck('name', 'slug')->all())
                            ->searchable(),
                        TextInput::make('role')->maxLength(120),
                        TextInput::make('rank')->maxLength(8),
                        TextInput::make('tagline')->maxLength(160)->columnSpanFull(),
                        Textarea::make('description')->rows(4)->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Model & prompt')
                    ->schema([
                        Select::make('suggested_model_slug')
                            ->label('Suggested LLM model')
                            ->options(fn () => LlmModel::query()->where('is_active', true)->orderBy('provider')->pluck('name', 'slug')->all())
                            ->searchable()
                            ->helperText('Pre-selected in the publish form when a model with this slug is active.'),
                        TextInput::make('per_unit')->maxLength(60)->helperText('Unit of work, e.g. ticket, lead, PR.'),
                        TextInput::make('power_cost')->numeric()->default(10)->suffix('power / unit'),
                        TextInput::make('est_input_tokens')->numeric()->default(800)->suffix('tokens'),
                        TextInput::make('est_output_tokens')->numeric()->default(400)->suffix('tokens'),
                        Textarea::make('system_prompt')
                            ->rows(8)
                            ->columnSpanFull()
                            ->helperText('Use {{variable}} placeholders that match the variables below.'),
                    ])
                    ->columns(2),

                Section::make('Knowledge base (RAG)')
                    ->schema([
                        Toggle::make('accepts_knowledge')
                            ->label('Enable buyer knowledge base')
                            ->live(),
                        Textarea::make('knowledge_instructions')
                            ->rows(3)
                            ->columnSpanFull()
                            ->visible(fn (Get $get) => (bool) $get('accepts_knowledge'))
                            ->helperText('How the agent should use retrieved knowledge.'),
                    ])
                    ->columns(1),

                Section::make('Catalog tags')
                    ->schema([
                        TagsInput::make('languages')->helperText('e.g. EN, RU, DE.'),
                        TagsInput::make('integrations')->helperText('e.g. slack, hubspot, github.'),
                    ])
                    ->columns(2),

                Section::make('Variables (buyer fills these)')
                    ->description('Pre-declared {{key}} variables. The buyer sets values per deployment.')
                    ->schema([
                        Repeater::make('setting_defs')
                            ->hiddenLabel()
                            ->addActionLabel('Add variable')
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['label'] ?? $state['key'] ?? 'Variable')
                            ->default([])
                            ->schema([
                                TextInput::make('key')->required()->alphaDash()->maxLength(60),
                                TextInput::make('label')->required()->maxLength(120),
                                Select::make('type')
                                    ->options([
                                        'text' => 'Text',
                                        'textarea' => 'Long text',
                                        'select' => 'Select',
                                        'number' => 'Number',
                                        'boolean' => 'Toggle',
                                        'slack_channel' => 'Slack channel',
                                    ])
                                    ->default('text')
                                    ->native(false)
                                    ->live()
                                    ->required(),
                                TextInput::make('default_value')->maxLength(2000),
                                TagsInput::make('options')
                                    ->visible(fn (Get $get) => $get('type') === 'select')
                                    ->columnSpanFull(),
                                Toggle::make('is_required'),
                                TextInput::make('description')->maxLength(500)->columnSpanFull(),
                            ])
                            ->columns(2),
                    ]),

                Section::make('Skills / tools')
                    ->description('Pre-declared tools the agent can call. webhook_url can be a placeholder the seller edits later.')
                    ->schema([
                        Repeater::make('skills')
                            ->hiddenLabel()
                            ->addActionLabel('Add skill')
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? 'Skill')
                            ->default([])
                            ->schema([
                                TextInput::make('name')->required()->alphaDash()->maxLength(60),
                                TextInput::make('label')->maxLength(120),
                                Textarea::make('description')->required()->rows(2)->columnSpanFull(),
                                Select::make('transport')
                                    ->options([
                                        'webhook' => 'Webhook',
                                        'builtin' => 'Built-in',
                                        'oauth_proxy' => 'OAuth proxy',
                                    ])
                                    ->default('webhook')
                                    ->native(false)
                                    ->live()
                                    ->required(),
                                Select::make('required_oauth_provider')
                                    ->label('Requires connection')
                                    ->options(fn () => OauthApp::query()->orderBy('label')->pluck('label', 'provider')->all())
                                    ->searchable()
                                    ->visible(fn (Get $get) => $get('transport') === 'oauth_proxy'),
                                TextInput::make('webhook_url')
                                    ->url()
                                    ->maxLength(500)
                                    ->visible(fn (Get $get) => in_array($get('transport'), ['webhook', 'oauth_proxy'], true))
                                    ->columnSpanFull(),
                                Textarea::make('parameters_schema')
                                    ->rows(5)
                                    ->columnSpanFull()
                                    ->helperText('JSON Schema for the tool arguments (stored as text).'),
                                TextInput::make('timeout_seconds')->numeric()->default(30)->suffix('s'),
                            ])
                            ->columns(2),
                    ]),
            ]);
    }
}
