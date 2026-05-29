<?php

namespace App\Filament\Resources\SiteSettings\Pages;

use App\Filament\Resources\SiteSettings\SiteSettingResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSiteSetting extends CreateRecord
{
    protected static string $resource = SiteSettingResource::class;

    /**
     * Image settings store the uploaded path in `value`; map it from the
     * separate upload field (which is non-dehydrated).
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (($data['type'] ?? null) === 'image' && array_key_exists('value_image', $data)) {
            $data['value'] = $data['value_image'];
        }
        unset($data['value_image']);

        return $data;
    }
}
