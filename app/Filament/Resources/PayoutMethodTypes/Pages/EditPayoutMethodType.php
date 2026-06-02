<?php

namespace App\Filament\Resources\PayoutMethodTypes\Pages;

use App\Filament\Resources\PayoutMethodTypes\PayoutMethodTypeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPayoutMethodType extends EditRecord
{
    protected static string $resource = PayoutMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
