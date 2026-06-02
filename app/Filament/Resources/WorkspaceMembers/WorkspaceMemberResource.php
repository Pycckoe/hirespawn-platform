<?php

namespace App\Filament\Resources\WorkspaceMembers;

use App\Filament\Resources\WorkspaceMembers\Pages\CreateWorkspaceMember;
use App\Filament\Resources\WorkspaceMembers\Pages\EditWorkspaceMember;
use App\Filament\Resources\WorkspaceMembers\Pages\ListWorkspaceMembers;
use App\Filament\Resources\WorkspaceMembers\Schemas\WorkspaceMemberForm;
use App\Filament\Resources\WorkspaceMembers\Tables\WorkspaceMembersTable;
use App\Models\WorkspaceMember;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class WorkspaceMemberResource extends Resource
{
    protected static ?string $model = WorkspaceMember::class;


    protected static string|\UnitEnum|null $navigationGroup = 'People';

    protected static ?int $navigationSort = 2;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return WorkspaceMemberForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return WorkspaceMembersTable::configure($table);
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
            'index' => ListWorkspaceMembers::route('/'),
            'create' => CreateWorkspaceMember::route('/create'),
            'edit' => EditWorkspaceMember::route('/{record}/edit'),
        ];
    }
}
