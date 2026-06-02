<?php

namespace App\Filament\Resources\AgentCategories\Pages;

use App\Filament\Resources\AgentCategories\AgentCategoryResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditAgentCategory extends EditRecord
{
    protected static string $resource = AgentCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
