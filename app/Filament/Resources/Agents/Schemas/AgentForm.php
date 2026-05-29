<?php

namespace App\Filament\Resources\Agents\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class AgentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Ownership & status')
                    ->description('Who owns the agent and whether it is live in the catalog.')
                    ->schema([
                        Select::make('seller_id')
                            ->label('Seller (owner)')
                            ->relationship('seller', 'email')
                            ->searchable()
                            ->preload()
                            ->helperText("The agent runs on THIS user's LLM API key (set under /vendor → LLM keys). Reassign to yourself to use your own key.")
                            ->required(),
                        Select::make('category_id')
                            ->label('Category')
                            ->relationship('category', 'name')
                            ->searchable()
                            ->preload(),
                        Select::make('status')
                            ->options([
                                'draft' => 'Draft',
                                'pending_review' => 'Pending review',
                                'approved' => 'Approved · live',
                                'suspended' => 'Suspended',
                                'rejected' => 'Rejected',
                            ])
                            ->default('draft')
                            ->native(false)
                            ->required(),
                        Toggle::make('is_featured')
                            ->helperText('Pin to the featured strip on the marketplace.'),
                        DateTimePicker::make('featured_until')
                            ->label('Featured until'),
                        DateTimePicker::make('published_at')
                            ->label('Published at'),
                    ])
                    ->columns(2),

                Section::make('Identity')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(120),
                        TextInput::make('slug')
                            ->required()
                            ->alphaDash()
                            ->maxLength(120)
                            ->unique(ignoreRecord: true)
                            ->helperText('URL key: /agent/{slug}. Changing it breaks existing links.'),
                        TextInput::make('tagline')
                            ->maxLength(255)
                            ->columnSpanFull(),
                        Textarea::make('description')
                            ->rows(4)
                            ->columnSpanFull(),
                        TextInput::make('vendor')
                            ->maxLength(120),
                        TextInput::make('role')
                            ->maxLength(120),
                        TextInput::make('rank')
                            ->maxLength(8)
                            ->helperText('Display badge, e.g. O-4, E-5.'),
                        TextInput::make('spec')
                            ->maxLength(255)
                            ->helperText('Short spec line, e.g. "routes in 200ms".'),
                    ])
                    ->columns(2),

                Section::make('AI model & prompt')
                    ->description('The model the agent runs on and the system prompt. Use {{variable}} placeholders mapped to the Variables tab below.')
                    ->schema([
                        Select::make('llm_model_id')
                            ->label('LLM model')
                            ->relationship('llmModel', 'name')
                            ->searchable()
                            ->preload()
                            ->helperText("Cost is billed against the owner's API key for this provider."),
                        Textarea::make('system_prompt')
                            ->rows(8)
                            ->columnSpanFull()
                            ->helperText('Substituted at run time: {{tone}}, {{signature}}, … from the Variables tab.'),
                        TextInput::make('est_input_tokens')
                            ->numeric()
                            ->default(0)
                            ->suffix('tokens')
                            ->helperText('Estimated input tokens per run (for cost preview).'),
                        TextInput::make('est_output_tokens')
                            ->numeric()
                            ->default(0)
                            ->suffix('tokens'),
                        TextInput::make('max_output_tokens')
                            ->numeric()
                            ->helperText('Hard cap on output tokens per run (blank = model default).'),
                        Toggle::make('accepts_knowledge')
                            ->label('Buyer knowledge base (RAG)')
                            ->helperText('Lets buyers upload docs/text; relevant chunks are retrieved and added to the prompt at run time. Requires the agent owner to have an OpenAI key (used for embeddings).')
                            ->live(),
                        Textarea::make('knowledge_instructions')
                            ->rows(3)
                            ->columnSpanFull()
                            ->visible(fn (\Filament\Schemas\Components\Utilities\Get $get) => (bool) $get('accepts_knowledge'))
                            ->helperText('How the agent should use the retrieved knowledge, e.g. "Answer only from the knowledge base; if missing, say you don\'t know."'),
                    ])
                    ->columns(2),

                Section::make('Pricing')
                    ->description('Money values are stored in cents (e.g. 4900 = €49.00).')
                    ->schema([
                        Select::make('pricing_model')
                            ->options([
                                'subscription' => 'Subscription (recurring)',
                                'usage_based' => 'Usage-based (per unit / power)',
                            ])
                            ->default('subscription')
                            ->native(false)
                            ->required(),
                        Select::make('currency')
                            ->options([
                                'EUR' => 'EUR €',
                                'USD' => 'USD $',
                                'GBP' => 'GBP £',
                            ])
                            ->default('EUR')
                            ->native(false)
                            ->required(),
                        TextInput::make('base_price_cents')
                            ->numeric()
                            ->default(0)
                            ->suffix('cents')
                            ->helperText('Recurring base price in cents.'),
                        Select::make('billing_period')
                            ->options([
                                'monthly' => 'Monthly',
                                'quarterly' => 'Quarterly',
                                'yearly' => 'Yearly',
                            ])
                            ->default('monthly')
                            ->native(false)
                            ->required(),
                        TextInput::make('power_cost')
                            ->numeric()
                            ->default(0)
                            ->suffix('power / unit')
                            ->helperText('Power tokens charged per unit of work.'),
                        TextInput::make('per_unit')
                            ->maxLength(60)
                            ->helperText('Unit of work, e.g. lead, ticket, PR.'),
                    ])
                    ->columns(2),

                Section::make('Technical / integration')
                    ->collapsed()
                    ->schema([
                        TextInput::make('api_endpoint_url')
                            ->url()
                            ->maxLength(500)
                            ->columnSpanFull(),
                        TextInput::make('manifest_url')
                            ->url()
                            ->maxLength(500)
                            ->columnSpanFull(),
                        TextInput::make('manifest_version')
                            ->maxLength(40),
                        TextInput::make('webhook_secret')
                            ->password()
                            ->revealable()
                            ->maxLength(120)
                            ->helperText('HMAC secret used to sign skill webhook calls.'),
                        TextInput::make('health_check_url')
                            ->url()
                            ->maxLength(500)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Catalog metadata & stats')
                    ->collapsed()
                    ->schema([
                        TagsInput::make('languages')
                            ->helperText('Press Enter after each. e.g. EN, RU, DE.')
                            ->columnSpanFull(),
                        TagsInput::make('integrations')
                            ->helperText('e.g. slack, hubspot, github.')
                            ->columnSpanFull(),
                        TextInput::make('sla_uptime_pct')
                            ->numeric()
                            ->default(99)
                            ->suffix('%'),
                        TextInput::make('rating_avg')
                            ->numeric()
                            ->default(0)
                            ->helperText('0–5.'),
                        TextInput::make('reviews_count')
                            ->numeric()
                            ->default(0),
                        TextInput::make('subscribers_count')
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),
            ]);
    }
}
