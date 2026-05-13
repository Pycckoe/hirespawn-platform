<?php

namespace App\Filament\Resources\TopupMethodTypes\Pages;

use App\Filament\Resources\TopupMethodTypes\TopupMethodTypeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTopupMethodType extends EditRecord
{
    protected static string $resource = TopupMethodTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
