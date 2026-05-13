<?php

namespace App\Filament\Resources\TopupMethodTypes;

use App\Filament\Resources\TopupMethodTypes\Pages\CreateTopupMethodType;
use App\Filament\Resources\TopupMethodTypes\Pages\EditTopupMethodType;
use App\Filament\Resources\TopupMethodTypes\Pages\ListTopupMethodTypes;
use App\Filament\Resources\TopupMethodTypes\Schemas\TopupMethodTypeForm;
use App\Filament\Resources\TopupMethodTypes\Tables\TopupMethodTypesTable;
use App\Models\TopupMethodType;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TopupMethodTypeResource extends Resource
{
    protected static ?string $model = TopupMethodType::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Money';

    protected static ?int $navigationSort = 4;

    protected static ?string $pluralModelLabel = 'Top-up methods';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return TopupMethodTypeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TopupMethodTypesTable::configure($table);
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
            'index' => ListTopupMethodTypes::route('/'),
            'create' => CreateTopupMethodType::route('/create'),
            'edit' => EditTopupMethodType::route('/{record}/edit'),
        ];
    }
}
