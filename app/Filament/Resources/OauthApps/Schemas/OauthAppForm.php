<?php

namespace App\Filament\Resources\OauthApps\Schemas;

use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;

class OauthAppForm
{
    public static function configure(Schema $schema): Schema
    {
        $isGithub = fn (Get $get) => $get('provider') === 'github';
        $isSlack = fn (Get $get) => $get('provider') === 'slack';
        $hasInboundEvents = fn (Get $get) => in_array($get('provider'), ['slack', 'github'], true);

        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        TextInput::make('provider')
                            ->helperText('Stable slug used in routes (/oauth/{provider}/...). Lowercase, e.g. slack, github, hubspot.')
                            ->required()
                            ->alphaDash()
                            ->maxLength(30)
                            ->live(onBlur: true), // refresh provider-specific field visibility below
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

                // Provider-specific block: GitHub App auth. Hidden for every
                // other provider so the form doesn't leak irrelevant fields.
                Section::make('GitHub App')
                    ->description('GitHub Apps use a numeric App ID + RSA private key, plus a public URL slug for the install link. Not used by other providers.')
                    ->visible($isGithub)
                    ->schema([
                        TextInput::make('github_app_id')
                            ->label('GitHub App ID (numeric)')
                            ->helperText('GitHub App → General → App ID.')
                            ->maxLength(40)
                            ->columnSpanFull(),
                        TextInput::make('github_app_slug')
                            ->label('GitHub App URL slug')
                            ->helperText('The part after "/apps/" in your App\'s public URL — e.g. for https://github.com/apps/hirespawn-dev paste "hirespawn-dev". NOT the Client ID.')
                            ->maxLength(80)
                            ->columnSpanFull(),
                        Textarea::make('encrypted_github_private_key')
                            ->label('GitHub App private key (PEM)')
                            ->helperText('GitHub App → General → Generate a private key, paste the entire .pem (including -----BEGIN/END----- lines). Stored encrypted. Leave blank to keep the existing one.')
                            ->rows(6)
                            ->columnSpanFull()
                            ->formatStateUsing(fn () => '')
                            ->dehydrated(fn ($state) => filled($state))
                            ->dehydrateStateUsing(fn ($state) => \Illuminate\Support\Facades\Crypt::encryptString(trim((string) $state))),
                    ]),

                // Inbound webhook signing secret — only relevant for providers
                // that send signed events to us (Slack, GitHub today).
                Section::make('Inbound webhook signing secret')
                    ->description('Used to verify event POSTs from the provider at /integrations/{provider}/events.')
                    ->visible($hasInboundEvents)
                    ->schema([
                        TextInput::make('encrypted_signing_secret')
                            ->label(fn (Get $get) => match ($get('provider')) {
                                'github' => 'GitHub webhook secret',
                                'slack' => 'Slack signing secret',
                                default => 'Signing secret',
                            })
                            ->password()
                            ->revealable()
                            ->helperText(fn (Get $get) => match ($get('provider')) {
                                'github' => "Your GitHub App's Webhook secret. Leave blank to keep the existing one.",
                                'slack' => "Slack → Basic Information → Signing Secret. Leave blank to keep the existing one.",
                                default => 'Leave blank to keep the existing one.',
                            })
                            ->maxLength(400)
                            ->columnSpanFull()
                            ->formatStateUsing(fn () => '')
                            ->dehydrated(fn ($state) => filled($state))
                            ->dehydrateStateUsing(fn ($state) => \Illuminate\Support\Facades\Crypt::encryptString(trim((string) $state))),
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
