<?php

namespace App\Filament\Resources\OauthApps\Pages;

use App\Filament\Resources\OauthApps\OauthAppResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditOauthApp extends EditRecord
{
    protected static string $resource = OauthAppResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }

    // No mutators needed — the secret fields encrypt their own values via
    // ->dehydrateStateUsing() and skip themselves when left blank (so the
    // existing secret is preserved). See OauthAppForm.
}
