<?php

namespace App\Filament\Resources\SupportTickets\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SupportTicketForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Ticket')
                    ->schema([
                        TextInput::make('reference')
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('kind')
                            ->options(['support' => 'Support', 'dispute' => 'Dispute'])
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('status')
                            ->options([
                                'open' => 'Open',
                                'investigating' => 'Investigating',
                                'resolved' => 'Resolved',
                                'closed' => 'Closed',
                            ])
                            ->required()
                            ->native(false),
                        Select::make('category')
                            ->options([
                                'general' => 'General',
                                'billing' => 'Billing',
                                'agent_failure' => 'Agent failure',
                                'integrations' => 'Integrations',
                                'account' => 'Account',
                                'abuse' => 'Abuse',
                                'feature_request' => 'Feature request',
                                'sla_breach' => 'SLA breach',
                                'incorrect_output' => 'Incorrect output',
                                'data_leak' => 'Data leak',
                                'overcharged' => 'Overcharged',
                                'integration_broken' => 'Integration broken',
                                'other' => 'Other',
                            ])
                            ->native(false),
                    ])
                    ->columns(2),

                Section::make('Reporter')
                    ->schema([
                        TextInput::make('name')->disabled()->dehydrated(false),
                        TextInput::make('email')->disabled()->dehydrated(false)->columnSpan(1),
                    ])
                    ->columns(2),

                Section::make('Content')
                    ->schema([
                        TextInput::make('subject')->disabled()->dehydrated(false)->columnSpanFull(),
                        Textarea::make('body')->disabled()->dehydrated(false)->rows(8)->columnSpanFull(),
                        TextInput::make('refund_power')
                            ->label('Refund Power (⚡)')
                            ->helperText('Filled by buyer when filing a dispute. Editable so admin can adjust the credit.')
                            ->numeric()
                            ->minValue(0),
                        DateTimePicker::make('resolved_at')
                            ->label('Resolved at'),
                    ])
                    ->columns(2),
            ]);
    }
}
