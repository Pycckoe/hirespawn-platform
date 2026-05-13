<?php

namespace App\Filament\Resources\PaymentMethodTypes;

use App\Filament\Resources\PaymentMethodTypes\Pages\CreatePaymentMethodType;
use App\Filament\Resources\PaymentMethodTypes\Pages\EditPaymentMethodType;
use App\Filament\Resources\PaymentMethodTypes\Pages\ListPaymentMethodTypes;
use App\Filament\Resources\PaymentMethodTypes\Schemas\PaymentMethodTypeForm;
use App\Filament\Resources\PaymentMethodTypes\Tables\PaymentMethodTypesTable;
use App\Models\PaymentMethodType;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PaymentMethodTypeResource extends Resource
{
    protected static ?string $model = PaymentMethodType::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Content';

    protected static ?int $navigationSort = 3;

    protected static ?string $recordTitleAttribute = 'label';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PaymentMethodTypeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PaymentMethodTypesTable::configure($table);
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
            'index' => ListPaymentMethodTypes::route('/'),
            'create' => CreatePaymentMethodType::route('/create'),
            'edit' => EditPaymentMethodType::route('/{record}/edit'),
        ];
    }
}
