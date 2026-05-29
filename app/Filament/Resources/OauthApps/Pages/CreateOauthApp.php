<?php

namespace App\Filament\Resources\OauthApps\Pages;

use App\Filament\Resources\OauthApps\OauthAppResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOauthApp extends CreateRecord
{
    protected static string $resource = OauthAppResource::class;

    /**
     * Encrypt the client secret before save. Filament posts it as plain
     * text via the form's `client_secret` virtual field; we move it into
     * encrypted_client_secret via the model accessor.
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (! empty($data['client_secret'])) {
            $data['encrypted_client_secret'] = \Illuminate\Support\Facades\Crypt::encryptString(trim($data['client_secret']));
        }
        unset($data['client_secret']);

        if (! empty($data['signing_secret'])) {
            $data['encrypted_signing_secret'] = \Illuminate\Support\Facades\Crypt::encryptString(trim($data['signing_secret']));
        }
        unset($data['signing_secret']);

        return $data;
    }
}
