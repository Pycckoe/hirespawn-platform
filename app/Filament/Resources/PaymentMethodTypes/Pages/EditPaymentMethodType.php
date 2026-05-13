<?php

namespace App\Filament\Resources\PaymentMethodTypes\Pages;

use App\Filament\Resources\PaymentMethodTypes\PaymentMethodTypeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPaymentMethodType extends EditRecord
{
    protected static string $resource = PaymentMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
