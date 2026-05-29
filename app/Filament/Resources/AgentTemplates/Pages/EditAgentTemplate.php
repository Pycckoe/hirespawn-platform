<?php

namespace App\Filament\Resources\AgentTemplates\Pages;

use App\Filament\Resources\AgentTemplates\AgentTemplateResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditAgentTemplate extends EditRecord
{
    protected static string $resource = AgentTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
