<?php

namespace Database\Seeders;

use App\Models\McpServer;
use Illuminate\Database\Seeder;

/**
 * Catalog of popular services buyers commonly want to wire to their agent
 * via MCP, grouped by category. Insert-if-missing (keyed on slug) so admin
 * edits — especially the endpoint URL once a stable one is known — survive
 * Laravel Cloud's per-deploy re-seed.
 *
 * URLs are intentionally left blank for most rows: the remote MCP endpoint
 * usually depends on the buyer's own instance or MCP gateway (Zapier MCP,
 * Composio, vendor-hosted, self-hosted). The setup_hint guides them, and
 * an admin can paste a stable URL in /admin/mcp-servers when one exists.
 */
class McpServerSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->servers() as $row) {
            if (McpServer::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }
            McpServer::create($row);
        }
    }

    private function servers(): array
    {
        $rows = [
            // --- CRM ---
            ['slug' => 'hubspot', 'name' => 'HubSpot', 'icon' => '◇', 'category' => 'CRM', 'summary' => 'Contacts, deals, companies and tickets from your HubSpot CRM.', 'docs_url' => 'https://developers.hubspot.com/mcp'],
            ['slug' => 'salesforce', 'name' => 'Salesforce', 'icon' => '☁', 'category' => 'CRM', 'summary' => 'Leads, opportunities and accounts from Salesforce.'],
            ['slug' => 'pipedrive', 'name' => 'Pipedrive', 'icon' => '◈', 'category' => 'CRM', 'summary' => 'Pipeline, deals and contacts from Pipedrive.'],
            ['slug' => 'attio', 'name' => 'Attio', 'icon' => '◆', 'category' => 'CRM', 'summary' => 'Records and lists from your Attio workspace.'],

            // --- Support / Ticketing ---
            ['slug' => 'zendesk', 'name' => 'Zendesk', 'icon' => '◐', 'category' => 'Support', 'summary' => 'Tickets, users and help-center articles from Zendesk.'],
            ['slug' => 'intercom', 'name' => 'Intercom', 'icon' => '◑', 'category' => 'Support', 'summary' => 'Conversations, contacts and articles from Intercom.'],
            ['slug' => 'freshdesk', 'name' => 'Freshdesk', 'icon' => '◒', 'category' => 'Support', 'summary' => 'Tickets and contacts from Freshdesk.'],
            ['slug' => 'jira-sm', 'name' => 'Jira Service Mgmt', 'icon' => '◈', 'category' => 'Support', 'summary' => 'Service requests and incidents from Jira Service Management.'],
            ['slug' => 'linear', 'name' => 'Linear', 'icon' => '▲', 'category' => 'Support', 'summary' => 'Issues, projects and cycles from Linear.', 'url' => 'https://mcp.linear.app/mcp', 'docs_url' => 'https://linear.app/docs/mcp'],

            // --- Accounting / Finance ---
            ['slug' => 'quickbooks', 'name' => 'QuickBooks', 'icon' => '◉', 'category' => 'Finance', 'summary' => 'Invoices, expenses and customers from QuickBooks Online.'],
            ['slug' => 'xero', 'name' => 'Xero', 'icon' => '◎', 'category' => 'Finance', 'summary' => 'Invoices, bills and contacts from Xero.'],
            ['slug' => 'stripe', 'name' => 'Stripe', 'icon' => '◢', 'category' => 'Finance', 'summary' => 'Payments, customers and subscriptions from Stripe.', 'url' => 'https://mcp.stripe.com', 'docs_url' => 'https://docs.stripe.com/mcp'],
            ['slug' => 'netsuite', 'name' => 'NetSuite', 'icon' => '◣', 'category' => 'Finance', 'summary' => 'Financials and records from Oracle NetSuite.'],

            // --- Docs / Knowledge ---
            ['slug' => 'notion', 'name' => 'Notion', 'icon' => '◼', 'category' => 'Docs', 'summary' => 'Pages and databases from your Notion workspace.', 'url' => 'https://mcp.notion.com/mcp', 'docs_url' => 'https://developers.notion.com/docs/mcp'],
            ['slug' => 'google-drive', 'name' => 'Google Drive', 'icon' => '▣', 'category' => 'Docs', 'summary' => 'Files and docs from Google Drive.'],
            ['slug' => 'confluence', 'name' => 'Confluence', 'icon' => '▤', 'category' => 'Docs', 'summary' => 'Spaces and pages from Atlassian Confluence.'],

            // --- Dev ---
            ['slug' => 'github', 'name' => 'GitHub', 'icon' => '◆', 'category' => 'Dev', 'summary' => 'Repos, issues and pull requests from GitHub.', 'url' => 'https://api.githubcopilot.com/mcp/', 'docs_url' => 'https://github.com/github/github-mcp-server'],
            ['slug' => 'sentry', 'name' => 'Sentry', 'icon' => '◤', 'category' => 'Dev', 'summary' => 'Issues and errors from Sentry.', 'url' => 'https://mcp.sentry.dev/mcp', 'docs_url' => 'https://docs.sentry.io/product/sentry-mcp/'],

            // --- Productivity ---
            ['slug' => 'airtable', 'name' => 'Airtable', 'icon' => '▦', 'category' => 'Productivity', 'summary' => 'Bases, tables and records from Airtable.'],
            ['slug' => 'asana', 'name' => 'Asana', 'icon' => '◍', 'category' => 'Productivity', 'summary' => 'Tasks and projects from Asana.'],
            ['slug' => 'clickup', 'name' => 'ClickUp', 'icon' => '◌', 'category' => 'Productivity', 'summary' => 'Tasks, docs and goals from ClickUp.'],
        ];

        $i = 0;
        return array_map(function (array $row) use (&$i) {
            $i += 10;

            return array_merge([
                'auth_type' => 'bearer',
                'is_active' => true,
                'sort_order' => $i,
                'setup_hint' => "Connect {$row['name']} via a remote MCP endpoint (its official MCP server, or a gateway like Zapier MCP / Composio). Paste the endpoint URL above and a bearer token from {$row['name']} if required.",
            ], $row);
        }, $rows);
    }
}
