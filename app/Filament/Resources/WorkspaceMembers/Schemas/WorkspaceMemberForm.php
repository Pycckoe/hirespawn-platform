<?php

namespace App\Filament\Resources\WorkspaceMembers\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class WorkspaceMemberForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('owner_id')
                    ->relationship('owner', 'name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                Select::make('user_id')
                    ->relationship('user', 'name'),
                TextInput::make('role')
                    ->required()
                    ->default('member'),
                TextInput::make('status')
                    ->required()
                    ->default('invited'),
                DateTimePicker::make('invited_at'),
                DateTimePicker::make('accepted_at'),
            ]);
    }
}
