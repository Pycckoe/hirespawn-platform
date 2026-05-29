<?php

namespace App\Filament\Resources\McpServers;

use App\Filament\Resources\McpServers\Pages\CreateMcpServer;
use App\Filament\Resources\McpServers\Pages\EditMcpServer;
use App\Filament\Resources\McpServers\Pages\ListMcpServers;
use App\Filament\Resources\McpServers\Schemas\McpServerForm;
use App\Filament\Resources\McpServers\Tables\McpServersTable;
use App\Models\McpServer;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class McpServerResource extends Resource
{
    protected static ?string $model = McpServer::class;

    protected static string|\UnitEnum|null $navigationGroup = 'Catalog';

    protected static ?int $navigationSort = 9;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationLabel = 'MCP servers';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedServerStack;

    public static function form(Schema $schema): Schema
    {
        return McpServerForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return McpServersTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMcpServers::route('/'),
            'create' => CreateMcpServer::route('/create'),
            'edit' => EditMcpServer::route('/{record}/edit'),
        ];
    }
}
