<?php

namespace App\Filament\Resources\PowerPacks;

use App\Filament\Resources\PowerPacks\Pages\CreatePowerPack;
use App\Filament\Resources\PowerPacks\Pages\EditPowerPack;
use App\Filament\Resources\PowerPacks\Pages\ListPowerPacks;
use App\Filament\Resources\PowerPacks\Schemas\PowerPackForm;
use App\Filament\Resources\PowerPacks\Tables\PowerPacksTable;
use App\Models\PowerPack;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PowerPackResource extends Resource
{
    protected static ?string $model = PowerPack::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Marketplace';

    protected static ?int $navigationSort = 3;

    protected static ?string $recordTitleAttribute = 'name';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PowerPackForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PowerPacksTable::configure($table);
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
            'index' => ListPowerPacks::route('/'),
            'create' => CreatePowerPack::route('/create'),
            'edit' => EditPowerPack::route('/{record}/edit'),
        ];
    }
}
