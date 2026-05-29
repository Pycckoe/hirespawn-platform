<?php

namespace App\Filament\Resources\SiteSettings\Pages;

use App\Filament\Resources\SiteSettings\SiteSettingResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSiteSetting extends EditRecord
{
    protected static string $resource = SiteSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    /**
     * For image settings, seed the (separate) upload field from the stored
     * `value` path so the current image previews on edit.
     */
    protected function mutateFormDataBeforeFill(array $data): array
    {
        if (($data['type'] ?? null) === 'image') {
            $data['value_image'] = $data['value'] ?? null;
        }

        return $data;
    }

    /**
     * Move the uploaded image path back into the `value` column on save.
     * value_image is dehydrated by Filament to the stored path string.
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (($data['type'] ?? null) === 'image' && array_key_exists('value_image', $data)) {
            $data['value'] = $data['value_image'];
        }
        unset($data['value_image']);

        return $data;
    }
}
