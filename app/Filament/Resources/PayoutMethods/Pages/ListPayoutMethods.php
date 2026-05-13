<?php

namespace App\Filament\Resources\PayoutMethods\Pages;

use App\Filament\Resources\PayoutMethods\PayoutMethodResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPayoutMethods extends ListRecords
{
    protected static string $resource = PayoutMethodResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
