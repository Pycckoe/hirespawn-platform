<?php

namespace App\Filament\Resources\OauthApps\Pages;

use App\Filament\Resources\OauthApps\OauthAppResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOauthApp extends CreateRecord
{
    protected static string $resource = OauthAppResource::class;

    // No mutator needed — the form fields encrypt their values directly
    // via ->dehydrateStateUsing() (see OauthAppForm).
}
