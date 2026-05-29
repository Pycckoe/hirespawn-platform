<?php

namespace App\Filament\Resources\McpServers\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class McpServerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Catalog entry')
                    ->description('How this MCP server appears in the buyer\'s picker.')
                    ->schema([
                        TextInput::make('name')->required()->maxLength(120),
                        TextInput::make('slug')->required()->alphaDash()->maxLength(120)->unique(ignoreRecord: true),
                        TextInput::make('icon')->maxLength(16)->helperText('Emoji or single character.'),
                        Select::make('category')
                            ->options([
                                'CRM' => 'CRM',
                                'Support' => 'Support / Ticketing',
                                'Finance' => 'Accounting / Finance',
                                'Docs' => 'Docs / Knowledge',
                                'Dev' => 'Developer',
                                'Productivity' => 'Productivity',
                                'Other' => 'Other',
                            ])
                            ->default('Other')
                            ->native(false)
                            ->required(),
                        Toggle::make('is_active')->default(true),
                        TextInput::make('sort_order')->numeric()->default(0),
                        Textarea::make('summary')->rows(2)->maxLength(400)->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Connection defaults')
                    ->description('Prefilled into the buyer\'s "Add MCP server" form. Leave URL blank if it depends on the buyer\'s instance/gateway — guide them via the setup hint.')
                    ->schema([
                        TextInput::make('url')
                            ->label('Endpoint URL')
                            ->url()
                            ->maxLength(500)
                            ->placeholder('https://mcp.example.com/mcp')
                            ->columnSpanFull(),
                        Select::make('auth_type')
                            ->options(['none' => 'No auth', 'bearer' => 'Bearer token'])
                            ->default('bearer')
                            ->native(false)
                            ->required(),
                        TextInput::make('docs_url')->label('Docs URL')->url()->maxLength(500),
                        Textarea::make('setup_hint')
                            ->rows(3)
                            ->columnSpanFull()
                            ->helperText('Shown to the buyer: where to get the endpoint URL + token.'),
                    ])
                    ->columns(2),
            ]);
    }
}
