<?php

namespace App\Filament\Resources\Translations\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TranslationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Identity')
                    ->schema([
                        Select::make('locale')
                            ->label('Locale')
                            ->helperText('ISO code: en, ru, de, fr, …')
                            ->required()
                            ->options([
                                'en' => 'English',
                                'ru' => 'Русский',
                                'de' => 'Deutsch',
                                'fr' => 'Français',
                                'es' => 'Español',
                                'pt' => 'Português',
                                'it' => 'Italiano',
                                'pl' => 'Polski',
                                'uk' => 'Українська',
                            ])
                            ->searchable()
                            ->native(false)
                            ->default('en'),
                        TextInput::make('namespace')
                            ->label('Namespace')
                            ->helperText('Groups related strings: site, console, vendor, errors, …')
                            ->required()
                            ->alphaDash()
                            ->maxLength(60)
                            ->default('site'),
                        TextInput::make('key')
                            ->label('Key')
                            ->helperText('Stable slug, e.g. hero.title — read via t(\'site.hero.title\').')
                            ->required()
                            ->maxLength(160)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Value')
                    ->schema([
                        Textarea::make('value')
                            ->label('Translated copy')
                            ->rows(4)
                            ->autosize()
                            ->columnSpanFull(),

                        Textarea::make('description')
                            ->label('Admin notes (optional)')
                            ->placeholder('Context for translators — what this string is for / where it shows.')
                            ->rows(2)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
