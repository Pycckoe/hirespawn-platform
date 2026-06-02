<?php

namespace App\Services\Oauth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin client over Google's REST APIs (Gmail, Calendar, Drive) used by the
 * built-in connector toolset. Calls are made with the buyer's stored OAuth
 * access token — refreshed automatically by UserOauthToken::freshAccessToken
 * before each call so an expired access_token doesn't trip the agent up.
 *
 * Every method returns ['ok' => bool, ...] arrays so callers can react
 * without try/catch noise.
 */
class GoogleClient
{
    // ── Gmail ─────────────────────────────────────────────────────────

    /**
     * Search messages with Gmail's query syntax (https://support.google.com/
     * mail/answer/7190). Returns a short list of message ids + snippets.
     */
    public function gmailSearch(User $user, string $query, int $limit = 10): array
    {
        $access = $this->access($user);
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        try {
            $listResp = Http::withToken($access)->timeout(20)
                ->get('https://gmail.googleapis.com/gmail/v1/users/me/messages', [
                    'q' => $query, 'maxResults' => max(1, min(25, $limit)),
                ]);
            if (! $listResp->successful()) {
                return ['ok' => false, 'error' => $listResp->json('error.message') ?? "HTTP {$listResp->status()}"];
            }
            $ids = collect($listResp->json('messages') ?? [])->pluck('id')->take($limit)->all();

            $messages = [];
            foreach ($ids as $id) {
                $msgResp = Http::withToken($access)->timeout(20)
                    ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$id}", ['format' => 'metadata', 'metadataHeaders' => ['From', 'To', 'Subject', 'Date']]);
                if (! $msgResp->successful()) {
                    continue;
                }
                $j = $msgResp->json();
                $headers = collect($j['payload']['headers'] ?? [])->mapWithKeys(fn ($h) => [strtolower($h['name']) => $h['value']])->all();
                $messages[] = [
                    'id' => $j['id'] ?? null,
                    'from' => $headers['from'] ?? null,
                    'to' => $headers['to'] ?? null,
                    'subject' => $headers['subject'] ?? '(no subject)',
                    'date' => $headers['date'] ?? null,
                    'snippet' => $j['snippet'] ?? '',
                ];
            }

            return ['ok' => true, 'count' => count($messages), 'messages' => $messages];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** Get a single message body (text/plain or text/html → text). */
    public function gmailGet(User $user, string $id): array
    {
        $access = $this->access($user);
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        try {
            $resp = Http::withToken($access)->timeout(20)
                ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$id}", ['format' => 'full']);
            if (! $resp->successful()) {
                return ['ok' => false, 'error' => $resp->json('error.message') ?? "HTTP {$resp->status()}"];
            }
            $j = $resp->json();
            $headers = collect($j['payload']['headers'] ?? [])->mapWithKeys(fn ($h) => [strtolower($h['name']) => $h['value']])->all();
            $body = self::extractMailBody($j['payload'] ?? []);

            return [
                'ok' => true,
                'id' => $j['id'] ?? null,
                'from' => $headers['from'] ?? null,
                'to' => $headers['to'] ?? null,
                'cc' => $headers['cc'] ?? null,
                'subject' => $headers['subject'] ?? '(no subject)',
                'date' => $headers['date'] ?? null,
                'body' => mb_substr($body, 0, 12_000),
            ];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** Send a plain-text email from the buyer's connected account. */
    public function gmailSend(User $user, string $to, string $subject, string $body): array
    {
        $access = $this->access($user);
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        try {
            // RFC 5322 minimal message → base64url for Gmail's `raw` field.
            $headers = "To: {$to}\r\nSubject: ".self::encodeHeader($subject)."\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n";
            $raw = rtrim(strtr(base64_encode($headers.$body), '+/', '-_'), '=');
            $resp = Http::withToken($access)->timeout(20)
                ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', ['raw' => $raw]);
            if (! $resp->successful()) {
                return ['ok' => false, 'error' => $resp->json('error.message') ?? "HTTP {$resp->status()}"];
            }

            return ['ok' => true, 'id' => $resp->json('id')];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    // ── Calendar ─────────────────────────────────────────────────────

    /** Upcoming events on the primary calendar, ordered by start time. */
    public function calendarListEvents(User $user, int $limit = 10): array
    {
        $access = $this->access($user);
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        try {
            $resp = Http::withToken($access)->timeout(20)
                ->get('https://www.googleapis.com/calendar/v3/calendars/primary/events', [
                    'timeMin' => now()->toIso8601String(),
                    'maxResults' => max(1, min(25, $limit)),
                    'singleEvents' => 'true',
                    'orderBy' => 'startTime',
                ]);
            if (! $resp->successful()) {
                return ['ok' => false, 'error' => $resp->json('error.message') ?? "HTTP {$resp->status()}"];
            }
            $items = collect($resp->json('items') ?? [])->take($limit)->map(fn ($e) => [
                'id' => $e['id'] ?? null,
                'summary' => $e['summary'] ?? '(no title)',
                'start' => $e['start']['dateTime'] ?? $e['start']['date'] ?? null,
                'end' => $e['end']['dateTime'] ?? $e['end']['date'] ?? null,
                'location' => $e['location'] ?? null,
                'attendees' => collect($e['attendees'] ?? [])->pluck('email')->all(),
                'url' => $e['htmlLink'] ?? null,
            ])->values()->all();

            return ['ok' => true, 'count' => count($items), 'events' => $items];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    // ── Drive ───────────────────────────────────────────────────────

    /** Search files visible to the user (drive.readonly scope is enough). */
    public function driveSearch(User $user, string $query, int $limit = 10): array
    {
        $access = $this->access($user);
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        try {
            $resp = Http::withToken($access)->timeout(20)
                ->get('https://www.googleapis.com/drive/v3/files', [
                    'q' => $query,
                    'pageSize' => max(1, min(25, $limit)),
                    'fields' => 'files(id,name,mimeType,modifiedTime,webViewLink,owners(displayName,emailAddress))',
                ]);
            if (! $resp->successful()) {
                return ['ok' => false, 'error' => $resp->json('error.message') ?? "HTTP {$resp->status()}"];
            }
            $files = collect($resp->json('files') ?? [])->take($limit)->map(fn ($f) => [
                'id' => $f['id'] ?? null,
                'name' => $f['name'] ?? null,
                'mime_type' => $f['mimeType'] ?? null,
                'modified' => $f['modifiedTime'] ?? null,
                'url' => $f['webViewLink'] ?? null,
                'owner' => $f['owners'][0]['emailAddress'] ?? null,
            ])->values()->all();

            return ['ok' => true, 'count' => count($files), 'files' => $files];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    // ── Internals ───────────────────────────────────────────────────

    private function access(User $user): ?string
    {
        return $user->oauthTokenFor('google')?->freshAccessToken();
    }

    /** Recursively pick text/plain (then text/html → strip tags) from a Gmail payload. */
    private static function extractMailBody(array $payload): string
    {
        if (! empty($payload['body']['data']) && ! empty($payload['mimeType']) && str_starts_with($payload['mimeType'], 'text/')) {
            $raw = (string) base64_decode(strtr($payload['body']['data'], '-_', '+/'), true);

            return str_contains($payload['mimeType'], 'html') ? trim(strip_tags($raw)) : $raw;
        }
        foreach ($payload['parts'] ?? [] as $part) {
            $text = self::extractMailBody($part);
            if ($text !== '') {
                return $text;
            }
        }

        return '';
    }

    private static function encodeHeader(string $value): string
    {
        if (preg_match('/[^\x20-\x7e]/', $value)) {
            return '=?UTF-8?B?'.base64_encode($value).'?=';
        }

        return $value;
    }
}
