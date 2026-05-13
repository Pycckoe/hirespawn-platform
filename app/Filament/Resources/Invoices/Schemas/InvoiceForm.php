<?php

namespace App\Filament\Resources\Invoices\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class InvoiceForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('buyer_id')
                    ->relationship('buyer', 'name')
                    ->required(),
                Select::make('subscription_id')
                    ->relationship('subscription', 'id'),
                DateTimePicker::make('period_start'),
                DateTimePicker::make('period_end'),
                TextInput::make('subtotal_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('vat_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_cents')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('currency')
                    ->required()
                    ->default('EUR'),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                TextInput::make('stripe_invoice_id'),
                TextInput::make('pdf_url')
                    ->url(),
                DateTimePicker::make('paid_at'),
                DateTimePicker::make('due_at'),
            ]);
    }
}
