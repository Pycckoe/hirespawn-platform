<?php

namespace App\Filament\Resources\UsageEvents\Pages;

use App\Filament\Resources\UsageEvents\UsageEventResource;
use Filament\Resources\Pages\CreateRecord;

class CreateUsageEvent extends CreateRecord
{
    protected static string $resource = UsageEventResource::class;
}
