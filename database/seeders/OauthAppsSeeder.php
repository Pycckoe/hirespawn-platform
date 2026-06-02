<?php

namespace Database\Seeders;

use App\Models\OauthApp;
use Illuminate\Database\Seeder;

class OauthAppsSeeder extends Seeder
{
    /**
     * Pre-fill the oauth_apps catalog with the well-known endpoints +
     * default scopes for popular providers. Admin still has to enter
     * client_id + client_secret in /admin/oauth-apps to activate any
     * row — until then is_active stays false and Console hides them.
     *
     * `updateOrCreate` on provider slug means admins can edit any field
     * without our re-seed clobbering their changes (PHP-side static
     * values are only used to insert missing rows).
     */
    public function run(): void
    {
        $rows = [
            [
                'provider' => 'slack',
                'label' => 'Slack',
                'icon' => '◐',
                'authorize_url' => 'https://slack.com/oauth/v2/authorize',
                'token_url' => 'https://slack.com/api/oauth.v2.access',
                'api_base_url' => 'https://slack.com/api',
                'default_scopes' => ['chat:write', 'chat:write.public', 'channels:read', 'users:read', 'app_mentions:read', 'channels:history', 'groups:history', 'im:history', 'im:read'],
                'sort_order' => 10,
            ],
            [
                'provider' => 'github',
                'label' => 'GitHub',
                'icon' => '◆',
                'authorize_url' => 'https://github.com/login/oauth/authorize',
                'token_url' => 'https://github.com/login/oauth/access_token',
                'api_base_url' => 'https://api.github.com',
                'default_scopes' => ['repo', 'read:user'],
                'sort_order' => 20,
            ],
            [
                'provider' => 'google',
                'label' => 'Google',
                'icon' => 'G',
                'authorize_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url' => 'https://oauth2.googleapis.com/token',
                'api_base_url' => 'https://www.googleapis.com',
                'default_scopes' => [
                    'openid',
                    'email',
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/gmail.send',
                    'https://www.googleapis.com/auth/calendar.readonly',
                    'https://www.googleapis.com/auth/calendar.events',
                    'https://www.googleapis.com/auth/drive.readonly',
                ],
                'sort_order' => 30,
            ],
            [
                'provider' => 'hubspot',
                'label' => 'HubSpot',
                'icon' => '◇',
                'authorize_url' => 'https://app.hubspot.com/oauth/authorize',
                'token_url' => 'https://api.hubapi.com/oauth/v1/token',
                'api_base_url' => 'https://api.hubapi.com',
                'default_scopes' => ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
                'sort_order' => 40,
            ],
            [
                'provider' => 'notion',
                'label' => 'Notion',
                'icon' => '◼',
                'authorize_url' => 'https://api.notion.com/v1/oauth/authorize',
                'token_url' => 'https://api.notion.com/v1/oauth/token',
                'api_base_url' => 'https://api.notion.com/v1',
                'default_scopes' => [],
                'sort_order' => 50,
            ],
            [
                'provider' => 'linear',
                'label' => 'Linear',
                'icon' => '▲',
                'authorize_url' => 'https://linear.app/oauth/authorize',
                'token_url' => 'https://api.linear.app/oauth/token',
                'api_base_url' => 'https://api.linear.app',
                'default_scopes' => ['read', 'write'],
                'sort_order' => 60,
            ],
            [
                'provider' => 'jira',
                'label' => 'Jira',
                'icon' => '◈',
                'authorize_url' => 'https://auth.atlassian.com/authorize',
                'token_url' => 'https://auth.atlassian.com/oauth/token',
                'api_base_url' => 'https://api.atlassian.com',
                'default_scopes' => ['read:jira-work', 'write:jira-work', 'read:jira-user', 'offline_access'],
                'sort_order' => 70,
            ],
        ];

        // IMPORTANT: Laravel Cloud runs db:seed on every deploy. We must
        // NOT clobber admin-entered values on re-seed, otherwise the OAuth
        // app gets reset and /oauth/{provider}/connect 404s after each
        // deploy. So:
        //   - new row  → insert catalog defaults + inactive + blank creds
        //   - existing → refresh ONLY the immutable catalog metadata (urls,
        //     label, icon), leaving client_id / secret / is_active AND
        //     default_scopes alone.
        //
        // default_scopes is admin-owned: e.g. an admin may add `groups:read`
        // to Slack to enable the private-channel picker. Clobbering it on the
        // next deploy would silently drop that, so we never overwrite it on
        // existing rows.
        foreach ($rows as $row) {
            $existing = OauthApp::query()->where('provider', $row['provider'])->first();

            if ($existing) {
                $existing->forceFill([
                    'label' => $row['label'],
                    'icon' => $row['icon'],
                    'authorize_url' => $row['authorize_url'],
                    'token_url' => $row['token_url'],
                    'api_base_url' => $row['api_base_url'],
                    'sort_order' => $row['sort_order'],
                ])->save();

                continue;
            }

            OauthApp::create($row + [
                'is_active' => false,
                'client_id' => '',
                'encrypted_client_secret' => '',
            ]);
        }
    }
}
