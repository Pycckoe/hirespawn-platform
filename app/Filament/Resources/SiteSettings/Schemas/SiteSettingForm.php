<?php

namespace App\Filament\Resources\SiteSettings\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SiteSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        TextInput::make('label')
                            ->label('Display label')
                            ->helperText('Only shown in this admin list — describes what the setting controls.')
                            ->required()
                            ->maxLength(200)
                            ->columnSpanFull(),
                        TextInput::make('key')
                            ->label('Internal key')
                            ->helperText('Stable slug. Read by controllers via SiteSetting::value(\'key\').')
                            ->required()
                            ->alphaDash()
                            ->maxLength(80),
                        TextInput::make('group')
                            ->required()
                            ->maxLength(40)
                            ->default('general'),
                        Select::make('type')
                            ->required()
                            ->live()
                            ->options([
                                'text'     => 'Text (single line)',
                                'textarea' => 'Text (multi-line)',
                                'url'      => 'URL',
                                'image'    => 'Image (uploadable)',
                                'bool'     => 'Boolean',
                                'json'     => 'JSON',
                            ])
                            ->native(false)
                            ->default('text'),
                        TextInput::make('sort')
                            ->required()
                            ->numeric()
                            ->default(0),
                    ])
                    ->columns(2),

                Section::make('Value')
                    ->schema([
                        // Image upload appears only for type='image'. Stored on
                        // the public disk; the `value` column gets the relative
                        // path; SiteSetting::all_keyed() turns it into a URL.
                        FileUpload::make('value')
                            ->label('Image')
                            ->image()
                            ->imagePreviewHeight('80')
                            ->acceptedFileTypes(['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg', 'image/x-icon', 'image/vnd.microsoft.icon'])
                            ->maxSize(1024)
                            ->disk('public')
                            ->directory('site')
                            ->visibility('public')
                            ->visible(fn ($get) => $get('type') === 'image')
                            ->columnSpanFull(),

                        Textarea::make('value')
                            ->rows(4)
                            ->autosize()
                            ->visible(fn ($get) => in_array($get('type'), ['text', 'textarea', 'url', 'bool', 'json'], true))
                            ->columnSpanFull(),

                        Textarea::make('description')
                            ->label('Admin notes (optional)')
                            ->rows(2)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
