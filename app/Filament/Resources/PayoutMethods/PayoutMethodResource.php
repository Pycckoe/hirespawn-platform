<?php

namespace App\Filament\Resources\PayoutMethods;

use App\Filament\Resources\PayoutMethods\Pages\CreatePayoutMethod;
use App\Filament\Resources\PayoutMethods\Pages\EditPayoutMethod;
use App\Filament\Resources\PayoutMethods\Pages\ListPayoutMethods;
use App\Filament\Resources\PayoutMethods\Schemas\PayoutMethodForm;
use App\Filament\Resources\PayoutMethods\Tables\PayoutMethodsTable;
use App\Models\PayoutMethod;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PayoutMethodResource extends Resource
{
    protected static ?string $model = PayoutMethod::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Money';

    protected static ?int $navigationSort = 2;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PayoutMethodForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PayoutMethodsTable::configure($table);
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
            'index' => ListPayoutMethods::route('/'),
            'create' => CreatePayoutMethod::route('/create'),
            'edit' => EditPayoutMethod::route('/{record}/edit'),
        ];
    }
}
