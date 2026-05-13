<?php

namespace App\Filament\Resources\PaymentMethodTypes\Pages;

use App\Filament\Resources\PaymentMethodTypes\PaymentMethodTypeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPaymentMethodTypes extends ListRecords
{
    protected static string $resource = PaymentMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
