<?php

namespace App\Filament\Resources\Pages\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class PageForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Page')
                    ->schema([
                        TextInput::make('title')
                            ->required()
                            ->live(onBlur: true)
                            ->maxLength(200)
                            ->afterStateUpdated(fn ($state, $set, $get) => $get('slug') ? null : $set('slug', Str::slug($state)))
                            ->columnSpanFull(),
                        TextInput::make('slug')
                            ->label('URL slug')
                            ->required()
                            ->alphaDash()
                            ->maxLength(80)
                            ->prefix('/p/')
                            ->helperText('Page will be reachable at /p/{slug}.'),
                        Toggle::make('is_published')
                            ->default(true),
                    ])
                    ->columns(2),

                Section::make('Content')
                    ->schema([
                        // RichEditor (TipTap-based) — what-you-see-is-what-you-get.
                        // Stores HTML in `body`. Page::renderedBody() returns it as-is.
                        RichEditor::make('body')
                            ->toolbarButtons([
                                ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'link'],
                                ['h1', 'h2', 'h3', 'blockquote', 'codeBlock', 'bulletList', 'orderedList'],
                                ['alignStart', 'alignCenter', 'alignEnd'],
                                ['table', 'attachFiles'],
                                ['undo', 'redo', 'clearFormatting'],
                            ])
                            ->fileAttachmentsDisk('public')
                            ->fileAttachmentsDirectory('page-attachments')
                            ->columnSpanFull(),
                    ]),

                Section::make('SEO')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextInput::make('meta_title')
                            ->maxLength(200),
                        TextInput::make('meta_description')
                            ->maxLength(500),
                        DateTimePicker::make('published_at'),
                    ])
                    ->columns(2),
            ]);
    }
}
