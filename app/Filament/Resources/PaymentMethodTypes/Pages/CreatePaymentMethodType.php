<?php

namespace App\Filament\Resources\PaymentMethodTypes\Pages;

use App\Filament\Resources\PaymentMethodTypes\PaymentMethodTypeResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePaymentMethodType extends CreateRecord
{
    protected static string $resource = PaymentMethodTypeResource::class;
}
