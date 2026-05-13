<?php

namespace App\Filament\Resources\PowerPacks\Pages;

use App\Filament\Resources\PowerPacks\PowerPackResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPowerPacks extends ListRecords
{
    protected static string $resource = PowerPackResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
