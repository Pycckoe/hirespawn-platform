<?php

namespace App\Filament\Resources\WorkspaceMembers\Pages;

use App\Filament\Resources\WorkspaceMembers\WorkspaceMemberResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListWorkspaceMembers extends ListRecords
{
    protected static string $resource = WorkspaceMemberResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
