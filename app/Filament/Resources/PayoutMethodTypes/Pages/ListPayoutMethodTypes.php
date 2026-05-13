<?php

namespace App\Filament\Resources\PayoutMethodTypes\Pages;

use App\Filament\Resources\PayoutMethodTypes\PayoutMethodTypeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPayoutMethodTypes extends ListRecords
{
    protected static string $resource = PayoutMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
