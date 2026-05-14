<?php

namespace App\Filament\Resources\Menus\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class MenuForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('key')
                    ->label('Internal key')
                    ->helperText('Stable slug. Used by the renderer (header_main, footer_legal, footer_social, footer_payments…).')
                    ->required()
                    ->alphaDash()
                    ->maxLength(60),
                TextInput::make('label')
                    ->label('Admin label')
                    ->helperText('Only shown in the admin list to help you remember what this menu is.')
                    ->required()
                    ->maxLength(120),
                Select::make('location')
                    ->required()
                    ->options([
                        'header'        => 'Header — top nav links',
                        'footer'        => 'Footer — link columns',
                        'footer_bottom' => 'Footer — bottom legal row',
                        'social'        => 'Social — icon row',
                        'payments'      => 'Payments — logos row',
                    ])
                    ->native(false),
                TextInput::make('sort')
                    ->label('Display order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ])
            ->columns(2);
    }
}
