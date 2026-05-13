<?php

namespace App\Filament\Resources\TopupMethodTypes\Pages;

use App\Filament\Resources\TopupMethodTypes\TopupMethodTypeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTopupMethodTypes extends ListRecords
{
    protected static string $resource = TopupMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
