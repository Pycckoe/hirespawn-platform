<?php

namespace App\Services\Oauth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin client over HubSpot's CRM v3 API for the built-in connector
 * toolset. Auth: the buyer's stored OAuth token; refreshed automatically
 * by UserOauthToken::freshAccessToken. Methods return ['ok' => bool, ...]
 * so callers can react without try/catch noise.
 *
 * Spec: https://developers.hubspot.com/docs/api/crm/contacts
 */
class HubspotClient
{
    private const CONTACT_PROPERTIES = ['email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle', 'lifecyclestage', 'createdate', 'lastmodifieddate'];

    private const DEAL_PROPERTIES = ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'createdate', 'hs_lastmodifieddate'];

    public function searchContacts(User $user, string $query, int $limit = 10): array
    {
        return $this->call($user, fn (string $token) => Http::withToken($token)->timeout(20)
            ->post('https://api.hubapi.com/crm/v3/objects/contacts/search', [
                'query' => $query,
                'limit' => max(1, min(50, $limit)),
                'properties' => self::CONTACT_PROPERTIES,
            ]), function (array $j) use ($limit) {
            $contacts = collect($j['results'] ?? [])->take($limit)->map(fn ($c) => [
                'id' => $c['id'] ?? null,
                'email' => $c['properties']['email'] ?? null,
                'firstname' => $c['properties']['firstname'] ?? null,
                'lastname' => $c['properties']['lastname'] ?? null,
                'company' => $c['properties']['company'] ?? null,
                'jobtitle' => $c['properties']['jobtitle'] ?? null,
                'phone' => $c['properties']['phone'] ?? null,
                'lifecyclestage' => $c['properties']['lifecyclestage'] ?? null,
            ])->values()->all();

            return ['ok' => true, 'total' => $j['total'] ?? count($contacts), 'contacts' => $contacts];
        });
    }

    public function getContact(User $user, string $id): array
    {
        return $this->call($user, fn (string $token) => Http::withToken($token)->timeout(20)
            ->get('https://api.hubapi.com/crm/v3/objects/contacts/'.urlencode($id), [
                'properties' => implode(',', self::CONTACT_PROPERTIES),
            ]), function (array $j) {
            return [
                'ok' => true,
                'id' => $j['id'] ?? null,
                'email' => $j['properties']['email'] ?? null,
                'firstname' => $j['properties']['firstname'] ?? null,
                'lastname' => $j['properties']['lastname'] ?? null,
                'company' => $j['properties']['company'] ?? null,
                'jobtitle' => $j['properties']['jobtitle'] ?? null,
                'phone' => $j['properties']['phone'] ?? null,
                'lifecyclestage' => $j['properties']['lifecyclestage'] ?? null,
                'created' => $j['properties']['createdate'] ?? null,
                'updated' => $j['properties']['lastmodifieddate'] ?? null,
            ];
        });
    }

    public function createContact(User $user, string $email, ?string $firstname = null, ?string $lastname = null, array $extra = []): array
    {
        $properties = array_filter([
            'email' => $email,
            'firstname' => $firstname,
            'lastname' => $lastname,
        ], fn ($v) => $v !== null && $v !== '');
        // Merge extra properties (e.g. company, jobtitle, phone) safely.
        foreach ($extra as $k => $v) {
            if (is_string($v) || is_numeric($v)) {
                $properties[(string) $k] = (string) $v;
            }
        }

        return $this->call($user, fn (string $token) => Http::withToken($token)->timeout(20)
            ->post('https://api.hubapi.com/crm/v3/objects/contacts', ['properties' => $properties]), function (array $j) {
            return ['ok' => true, 'id' => $j['id'] ?? null, 'email' => $j['properties']['email'] ?? null];
        });
    }

    public function searchDeals(User $user, string $query, int $limit = 10): array
    {
        return $this->call($user, fn (string $token) => Http::withToken($token)->timeout(20)
            ->post('https://api.hubapi.com/crm/v3/objects/deals/search', [
                'query' => $query,
                'limit' => max(1, min(50, $limit)),
                'properties' => self::DEAL_PROPERTIES,
            ]), function (array $j) use ($limit) {
            $deals = collect($j['results'] ?? [])->take($limit)->map(fn ($d) => [
                'id' => $d['id'] ?? null,
                'name' => $d['properties']['dealname'] ?? null,
                'amount' => $d['properties']['amount'] ?? null,
                'stage' => $d['properties']['dealstage'] ?? null,
                'pipeline' => $d['properties']['pipeline'] ?? null,
                'close_date' => $d['properties']['closedate'] ?? null,
                'updated' => $d['properties']['hs_lastmodifieddate'] ?? null,
            ])->values()->all();

            return ['ok' => true, 'total' => $j['total'] ?? count($deals), 'deals' => $deals];
        });
    }

    public function createDeal(User $user, string $name, ?string $amount = null, ?string $stage = null, array $extra = []): array
    {
        $properties = array_filter([
            'dealname' => $name,
            'amount' => $amount,
            'dealstage' => $stage,
        ], fn ($v) => $v !== null && $v !== '');
        foreach ($extra as $k => $v) {
            if (is_string($v) || is_numeric($v)) {
                $properties[(string) $k] = (string) $v;
            }
        }

        return $this->call($user, fn (string $token) => Http::withToken($token)->timeout(20)
            ->post('https://api.hubapi.com/crm/v3/objects/deals', ['properties' => $properties]), function (array $j) {
            return ['ok' => true, 'id' => $j['id'] ?? null, 'name' => $j['properties']['dealname'] ?? null];
        });
    }

    /** Shared call wrapper: fresh token + HTTP + normalised errors. */
    private function call(User $user, callable $perform, callable $mapOk): array
    {
        $access = $user->oauthTokenFor('hubspot')?->freshAccessToken();
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }

        try {
            $resp = $perform($access);
            if (! $resp->successful()) {
                $err = $resp->json('message') ?? $resp->json('errors.0.message') ?? "HTTP {$resp->status()}";

                return ['ok' => false, 'error' => $err];
            }

            return $mapOk((array) $resp->json());
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
