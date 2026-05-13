<?php

namespace App\Filament\Resources\UsageEvents\Pages;

use App\Filament\Resources\UsageEvents\UsageEventResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditUsageEvent extends EditRecord
{
    protected static string $resource = UsageEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
