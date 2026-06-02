<?php

namespace App\Filament\Resources\OauthApps\Schemas;

use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OauthAppForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        TextInput::make('provider')
                            ->helperText('Stable slug used in routes (/oauth/{provider}/...). Lowercase, e.g. slack, github, hubspot.')
                            ->required()
                            ->alphaDash()
                            ->maxLength(30),
                        TextInput::make('label')
                            ->required()
                            ->maxLength(80),
                        TextInput::make('icon')
                            ->helperText('Emoji or single character shown in the console card.')
                            ->maxLength(8),
                    ])
                    ->columns(3),

                Section::make('OAuth2 client')
                    ->description('Register the Hirespawn app with the provider, paste the credentials here.')
                    ->schema([
                        TextInput::make('client_id')
                            ->required()
                            ->maxLength(200)
                            ->columnSpanFull(),
                        // Both secret fields bind DIRECTLY to the encrypted_*
                        // column with per-field encrypt+blank handling: no
                        // virtual field, no page-level mutator (those proved
                        // unreliable on prod). Empty input on edit → skip the
                        // attribute on save → existing secret preserved.
                        TextInput::make('encrypted_client_secret')
                            ->label('Client secret')
                            ->password()
                            ->revealable()
                            ->helperText('Leave blank to keep the existing secret. Type a new value to rotate.')
                            ->maxLength(400)
                            ->columnSpanFull()
                            ->formatStateUsing(fn () => '')
                            ->dehydrated(fn ($state) => filled($state))
                            ->dehydrateStateUsing(fn ($state) => \Illuminate\Support\Facades\Crypt::encryptString(trim((string) $state))),
                        TextInput::make('encrypted_signing_secret')
                            ->label('Signing secret (Slack inbound events)')
                            ->password()
                            ->revealable()
                            ->helperText('Slack → Basic Information → Signing Secret. Verifies inbound bot mentions at /integrations/slack/events. Leave blank to keep the existing one.')
                            ->maxLength(400)
                            ->columnSpanFull()
                            ->formatStateUsing(fn () => '')
                            ->dehydrated(fn ($state) => filled($state))
                            ->dehydrateStateUsing(fn ($state) => \Illuminate\Support\Facades\Crypt::encryptString(trim((string) $state))),
                        TextInput::make('authorize_url')
                            ->required()
                            ->url()
                            ->maxLength(300)
                            ->placeholder('https://slack.com/oauth/v2/authorize')
                            ->columnSpanFull(),
                        TextInput::make('token_url')
                            ->required()
                            ->url()
                            ->maxLength(300)
                            ->placeholder('https://slack.com/api/oauth.v2.access')
                            ->columnSpanFull(),
                        TextInput::make('api_base_url')
                            ->url()
                            ->maxLength(300)
                            ->placeholder('https://slack.com/api')
                            ->columnSpanFull(),
                    ]),

                Section::make('Scopes & metadata')
                    ->schema([
                        TagsInput::make('default_scopes')
                            ->helperText('Press Enter after each scope. e.g. chat:write, users:read.')
                            ->columnSpanFull(),
                        Toggle::make('is_active')
                            ->default(true),
                        TextInput::make('sort_order')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),
            ]);
    }
}
