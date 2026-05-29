<?php

namespace App\Filament\Resources\OauthApps\Pages;

use App\Filament\Resources\OauthApps\OauthAppResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Crypt;

class EditOauthApp extends EditRecord
{
    protected static string $resource = OauthAppResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }

    /**
     * Strip the encrypted field from the form payload; we never display
     * the secret. The `client_secret` form field starts empty — leaving
     * it empty keeps the existing secret, typing a new value rotates it.
     */
    protected function mutateFormDataBeforeFill(array $data): array
    {
        unset($data['encrypted_client_secret'], $data['encrypted_signing_secret']);
        $data['client_secret'] = '';
        $data['signing_secret'] = '';

        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (! empty($data['client_secret'])) {
            $data['encrypted_client_secret'] = Crypt::encryptString(trim($data['client_secret']));
        }
        unset($data['client_secret']);

        if (! empty($data['signing_secret'])) {
            $data['encrypted_signing_secret'] = Crypt::encryptString(trim($data['signing_secret']));
        }
        unset($data['signing_secret']);

        return $data;
    }
}
