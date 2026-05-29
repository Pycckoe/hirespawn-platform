<?php

namespace App\Filament\Resources\Agents\RelationManagers;

use App\Models\OauthApp;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * Manage the tools (skills) an agent exposes to the LLM. The model reads
 * name/description/parameters_schema verbatim; we dispatch the call via
 * `transport` (vendor webhook, built-in handler, or oauth_proxy).
 */
class SkillsRelationManager extends RelationManager
{
    protected static string $relationship = 'allSkills';

    protected static ?string $title = 'Skills / tools';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Tool definition')
                    ->description('The LLM reads these fields verbatim when deciding whether to call the tool.')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->alphaDash()
                            ->maxLength(60)
                            ->helperText('snake_case function name, e.g. post_to_slack.'),
                        TextInput::make('label')
                            ->maxLength(120)
                            ->helperText('Human label for admin display.'),
                        Textarea::make('description')
                            ->required()
                            ->rows(2)
                            ->columnSpanFull()
                            ->helperText('What the tool does — the LLM uses this to decide when to call it.'),
                        Textarea::make('parameters_schema')
                            ->rows(8)
                            ->columnSpanFull()
                            ->helperText('JSON Schema for the tool arguments.')
                            ->rules(['nullable', 'json'])
                            ->formatStateUsing(fn ($state) => filled($state) ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '')
                            ->dehydrateStateUsing(fn ($state) => filled($state) ? json_decode($state, true) : null),
                    ])
                    ->columns(2),

                Section::make('Dispatch')
                    ->schema([
                        Select::make('transport')
                            ->options([
                                'webhook' => "Webhook (vendor's backend)",
                                'builtin' => 'Built-in handler',
                                'oauth_proxy' => 'OAuth proxy (act on buyer integration)',
                            ])
                            ->default('webhook')
                            ->native(false)
                            ->live()
                            ->required(),
                        TextInput::make('webhook_url')
                            ->label('Webhook URL')
                            ->url()
                            ->maxLength(500)
                            ->visible(fn (Get $get) => in_array($get('transport'), ['webhook', 'oauth_proxy'], true))
                            ->columnSpanFull(),
                        TextInput::make('builtin_handler')
                            ->maxLength(60)
                            ->visible(fn (Get $get) => $get('transport') === 'builtin')
                            ->helperText('Key into the server-side handler map.'),
                        Select::make('required_oauth_provider')
                            ->label('Requires connection')
                            ->options(fn () => OauthApp::query()->orderBy('label')->pluck('label', 'provider')->all())
                            ->searchable()
                            ->visible(fn (Get $get) => $get('transport') === 'oauth_proxy')
                            ->helperText('Buyer must connect this provider for the tool to run.'),
                        TextInput::make('timeout_seconds')
                            ->numeric()
                            ->default(30)
                            ->suffix('s'),
                        TextInput::make('sort_order')
                            ->numeric()
                            ->default(0),
                        Toggle::make('is_active')
                            ->default(true),
                    ])
                    ->columns(2),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                TextColumn::make('sort_order')
                    ->label('#')
                    ->sortable(),
                TextColumn::make('name')
                    ->fontFamily('mono')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('transport')
                    ->badge(),
                TextColumn::make('required_oauth_provider')
                    ->label('Provider')
                    ->placeholder('—'),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('sort_order');
    }
}
