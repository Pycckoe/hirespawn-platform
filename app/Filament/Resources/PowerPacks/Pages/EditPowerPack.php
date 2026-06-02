<?php

namespace App\Filament\Resources\PowerPacks\Pages;

use App\Filament\Resources\PowerPacks\PowerPackResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPowerPack extends EditRecord
{
    protected static string $resource = PowerPackResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
