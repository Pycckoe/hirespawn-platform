<?php

namespace App\Filament\Resources\AgentCategories\Pages;

use App\Filament\Resources\AgentCategories\AgentCategoryResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAgentCategories extends ListRecords
{
    protected static string $resource = AgentCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
