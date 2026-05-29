<?php

namespace App\Filament\Resources\AgentTemplates;

use App\Filament\Resources\AgentTemplates\Pages\CreateAgentTemplate;
use App\Filament\Resources\AgentTemplates\Pages\EditAgentTemplate;
use App\Filament\Resources\AgentTemplates\Pages\ListAgentTemplates;
use App\Filament\Resources\AgentTemplates\Schemas\AgentTemplateForm;
use App\Filament\Resources\AgentTemplates\Tables\AgentTemplatesTable;
use App\Models\AgentTemplate;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class AgentTemplateResource extends Resource
{
    protected static ?string $model = AgentTemplate::class;

    protected static string|\UnitEnum|null $navigationGroup = 'Marketplace';

    protected static ?int $navigationSort = 2;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationLabel = 'Agent templates';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSquares2x2;

    public static function form(Schema $schema): Schema
    {
        return AgentTemplateForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AgentTemplatesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAgentTemplates::route('/'),
            'create' => CreateAgentTemplate::route('/create'),
            'edit' => EditAgentTemplate::route('/{record}/edit'),
        ];
    }
}
