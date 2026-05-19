<?php

namespace App\Filament\Resources\OauthApps\Pages;

use App\Filament\Resources\OauthApps\OauthAppResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListOauthApps extends ListRecords
{
    protected static string $resource = OauthAppResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
