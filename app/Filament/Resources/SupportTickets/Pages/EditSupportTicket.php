<?php

namespace App\Filament\Resources\SupportTickets\Pages;

use App\Filament\Resources\SupportTickets\SupportTicketResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSupportTicket extends EditRecord
{
    protected static string $resource = SupportTicketResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // When admin flips status to resolved, stamp resolved_at.
        if (($data['status'] ?? null) === 'resolved' && empty($data['resolved_at'])) {
            $data['resolved_at'] = now();
        }

        return $data;
    }
}
