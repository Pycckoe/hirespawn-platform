<?php

namespace App\Filament\Resources\Agents\RelationManagers;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * Manage the vendor-declared variables ({{key}}) buyers fill in when they
 * configure a subscription. These feed system_prompt substitution at run
 * time.
 */
class VariablesRelationManager extends RelationManager
{
    protected static string $relationship = 'settingDefs';

    protected static ?string $title = 'Variables';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('key')
                    ->required()
                    ->alphaDash()
                    ->maxLength(60)
                    ->helperText('snake_case. Referenced as {{key}} in the system prompt.'),
                TextInput::make('label')
                    ->required()
                    ->maxLength(120)
                    ->helperText('Shown to the buyer on the configure page.'),
                Select::make('type')
                    ->options([
                        'text' => 'Text',
                        'textarea' => 'Long text',
                        'select' => 'Select (fixed options)',
                        'number' => 'Number',
                        'boolean' => 'Toggle',
                        'slack_channel' => 'Slack channel picker',
                    ])
                    ->default('text')
                    ->native(false)
                    ->live()
                    ->required(),
                TextInput::make('default_value')
                    ->maxLength(4000),
                TagsInput::make('options')
                    ->helperText('Allowed values. Press Enter after each.')
                    ->visible(fn (Get $get) => $get('type') === 'select')
                    ->columnSpanFull(),
                Toggle::make('is_required')
                    ->helperText('Buyer must provide a value before the agent is ready.'),
                TextInput::make('sort_order')
                    ->numeric()
                    ->default(0),
                Textarea::make('description')
                    ->rows(2)
                    ->maxLength(500)
                    ->helperText('Hint shown under the input.')
                    ->columnSpanFull(),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('label')
            ->columns([
                TextColumn::make('sort_order')
                    ->label('#')
                    ->sortable(),
                TextColumn::make('key')
                    ->fontFamily('mono')
                    ->searchable(),
                TextColumn::make('label')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('type')
                    ->badge(),
                IconColumn::make('is_required')
                    ->label('Required')
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
