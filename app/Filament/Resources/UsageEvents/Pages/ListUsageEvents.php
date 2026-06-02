<?php

namespace App\Filament\Resources\UsageEvents\Pages;

use App\Filament\Resources\UsageEvents\UsageEventResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListUsageEvents extends ListRecords
{
    protected static string $resource = UsageEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
