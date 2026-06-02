<?php

namespace App\Filament\Resources\OauthApps;

use App\Filament\Resources\OauthApps\Pages\CreateOauthApp;
use App\Filament\Resources\OauthApps\Pages\EditOauthApp;
use App\Filament\Resources\OauthApps\Pages\ListOauthApps;
use App\Filament\Resources\OauthApps\Schemas\OauthAppForm;
use App\Filament\Resources\OauthApps\Tables\OauthAppsTable;
use App\Models\OauthApp;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class OauthAppResource extends Resource
{
    protected static ?string $model = OauthApp::class;

    protected static string|\UnitEnum|null $navigationGroup = 'Catalog';

    protected static ?int $navigationSort = 8;

    protected static ?string $recordTitleAttribute = 'label';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedKey;

    public static function form(Schema $schema): Schema
    {
        return OauthAppForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OauthAppsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOauthApps::route('/'),
            'create' => CreateOauthApp::route('/create'),
            'edit' => EditOauthApp::route('/{record}/edit'),
        ];
    }
}
