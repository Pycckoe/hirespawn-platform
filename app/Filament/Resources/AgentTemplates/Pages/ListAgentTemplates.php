<?php

namespace App\Filament\Resources\AgentTemplates\Pages;

use App\Filament\Resources\AgentTemplates\AgentTemplateResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAgentTemplates extends ListRecords
{
    protected static string $resource = AgentTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
