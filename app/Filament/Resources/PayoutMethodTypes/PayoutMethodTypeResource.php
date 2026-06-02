<?php

namespace App\Filament\Resources\PayoutMethodTypes;

use App\Filament\Resources\PayoutMethodTypes\Pages\CreatePayoutMethodType;
use App\Filament\Resources\PayoutMethodTypes\Pages\EditPayoutMethodType;
use App\Filament\Resources\PayoutMethodTypes\Pages\ListPayoutMethodTypes;
use App\Filament\Resources\PayoutMethodTypes\Schemas\PayoutMethodTypeForm;
use App\Filament\Resources\PayoutMethodTypes\Tables\PayoutMethodTypesTable;
use App\Models\PayoutMethodType;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PayoutMethodTypeResource extends Resource
{
    protected static ?string $model = PayoutMethodType::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Money';

    protected static ?int $navigationSort = 5;

    protected static ?string $pluralModelLabel = 'Payout methods';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PayoutMethodTypeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PayoutMethodTypesTable::configure($table);
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
            'index' => ListPayoutMethodTypes::route('/'),
            'create' => CreatePayoutMethodType::route('/create'),
            'edit' => EditPayoutMethodType::route('/{record}/edit'),
        ];
    }
}
