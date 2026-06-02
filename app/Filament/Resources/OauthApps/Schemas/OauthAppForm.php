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
                    ->description('Register the Hirespawn app with the provider, paste the credentials here. For GitHub: Client ID = the GitHub App URL slug (e.g. "hirespawn-dev"), used to build the install URL.')
                    ->schema([
                        TextInput::make('client_id')
                            ->required()
                            ->maxLength(200)
                            ->columnSpanFull(),
                        TextInput::make('github_app_id')
                            ->label('GitHub App ID (numeric, GitHub only)')
                            ->helperText('GitHub App → General → App ID. Leave blank for non-GitHub rows.')
                            ->maxLength(40)
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
                            ->label('Signing secret (Slack / GitHub inbound events)')
                            ->password()
                            ->revealable()
                            ->helperText('Slack: Basic Information → Signing Secret. GitHub: the App\'s Webhook secret. Leave blank to keep the existing one.')
                            ->maxLength(400)
                            ->columnSpanFull()
                            ->formatStateUsing(fn () => '')
                            ->dehydrated(fn ($state) => filled($state))
                            ->dehydrateStateUsing(fn ($state) => \Illuminate\Support\Facades\Crypt::encryptString(trim((string) $state))),
                        \Filament\Forms\Components\Textarea::make('encrypted_github_private_key')
                            ->label('GitHub App private key (PEM, GitHub only)')
                            ->helperText('GitHub App → General → Generate a private key, paste the entire .pem (including -----BEGIN/END----- lines). Stored encrypted. Leave blank to keep the existing one.')
                            ->rows(6)
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
