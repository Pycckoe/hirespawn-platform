<?php

namespace App\Filament\Resources\UsageEvents;

use App\Filament\Resources\UsageEvents\Pages\CreateUsageEvent;
use App\Filament\Resources\UsageEvents\Pages\EditUsageEvent;
use App\Filament\Resources\UsageEvents\Pages\ListUsageEvents;
use App\Filament\Resources\UsageEvents\Schemas\UsageEventForm;
use App\Filament\Resources\UsageEvents\Tables\UsageEventsTable;
use App\Models\UsageEvent;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class UsageEventResource extends Resource
{
    protected static ?string $model = UsageEvent::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 1;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return UsageEventForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return UsageEventsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListUsageEvents::route('/'),
            'create' => CreateUsageEvent::route('/create'),
            'edit' => EditUsageEvent::route('/{record}/edit'),
        ];
    }
}
