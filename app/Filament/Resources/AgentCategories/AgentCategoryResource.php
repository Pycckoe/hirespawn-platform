<?php

namespace App\Filament\Resources\AgentCategories;

use App\Filament\Resources\AgentCategories\Pages\CreateAgentCategory;
use App\Filament\Resources\AgentCategories\Pages\EditAgentCategory;
use App\Filament\Resources\AgentCategories\Pages\ListAgentCategories;
use App\Filament\Resources\AgentCategories\Schemas\AgentCategoryForm;
use App\Filament\Resources\AgentCategories\Tables\AgentCategoriesTable;
use App\Models\AgentCategory;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class AgentCategoryResource extends Resource
{
    protected static ?string $model = AgentCategory::class;


    protected static string|\UnitEnum|null $navigationGroup = 'Marketplace';

    protected static ?int $navigationSort = 2;

    protected static ?string $recordTitleAttribute = 'name';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return AgentCategoryForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AgentCategoriesTable::configure($table);
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
            'index' => ListAgentCategories::route('/'),
            'create' => CreateAgentCategory::route('/create'),
            'edit' => EditAgentCategory::route('/{record}/edit'),
        ];
    }
}
