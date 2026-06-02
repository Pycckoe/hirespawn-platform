<?php

namespace App\Filament\Resources\PayoutMethods\Pages;

use App\Filament\Resources\PayoutMethods\PayoutMethodResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPayoutMethod extends EditRecord
{
    protected static string $resource = PayoutMethodResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
