<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\AgentSettingDef;
use App\Models\AgentSkill;
use App\Models\LlmModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoAgentSeeder extends Seeder
{
    /**
     * Wires one existing seed agent (ops-ticket / AI Triager) into a
     * fully-runnable state so the platform owner can test the chat +
     * configure + Slack-channel flow without manually filling the
     * vendor publish form. Idempotent — safe to re-run.
     *
     * Still requires the agent's SELLER to add an Anthropic API key at
     * /vendor → LLM keys (real key, can't be seeded). Until then runs
     * fail with a clean "seller has no API key" message.
     */
    public function run(): void
    {
        $agent = Agent::where('slug', 'ops-ticket')->first();
        if (! $agent) {
            return;
        }

        // Only wire the demo on first run. Once it has a model assigned
        // we assume the owner may have customised it — don't clobber on
        // the next deploy (db:seed runs every time on Laravel Cloud).
        if ($agent->llm_model_id) {
            return;
        }

        $model = LlmModel::where('slug', 'claude-sonnet-4-6')->first();

        $agent->forceFill([
            'llm_model_id' => $model?->id,
            'status' => 'approved',
            'webhook_secret' => $agent->webhook_secret ?: Str::random(48),
            'system_prompt' => <<<'PROMPT'
            You are a {{tone}} customer-support triage assistant for the Hirespawn marketplace.

            For each incoming message:
            1. Classify it: billing | technical | account | abuse | general.
            2. Assign a priority: low | medium | high | urgent.
            3. Draft a short, helpful reply the human team can send as-is.

            When you reach a resolution, call the post_to_slack tool to post a
            one-line summary to the buyer's configured channel.

            Be concise. Never invent account details you weren't given.
            PROMPT,
            'est_input_tokens' => 600,
            'est_output_tokens' => 350,
        ])->save();

        // One config variable: tone (vendor-declared, feeds {{tone}}).
        AgentSettingDef::updateOrCreate(
            ['agent_id' => $agent->id, 'key' => 'tone'],
            [
                'label' => 'Tone of voice',
                'type' => 'select',
                'default_value' => 'friendly',
                'options' => ['friendly', 'formal', 'concise'],
                'is_required' => true,
                'description' => 'How the agent phrases replies.',
                'sort_order' => 0,
            ],
        );

        // One Slack skill (oauth_proxy) so the configure page surfaces a
        // "Connect Slack + pick channel" connection card. webhook_url is
        // a placeholder — a real vendor backend (or the future built-in
        // Slack handler) does the actual posting.
        AgentSkill::updateOrCreate(
            ['agent_id' => $agent->id, 'name' => 'post_to_slack'],
            [
                'label' => 'Post summary to Slack',
                'description' => 'Posts a one-line ticket-resolution summary to the buyer\'s chosen Slack channel.',
                'parameters_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'summary' => ['type' => 'string', 'description' => 'One-line summary to post.'],
                    ],
                    'required' => ['summary'],
                ],
                'transport' => 'oauth_proxy',
                'webhook_url' => 'https://example.com/hirespawn/post_to_slack',
                'required_oauth_provider' => 'slack',
                'timeout_seconds' => 30,
                'is_active' => true,
                'sort_order' => 0,
            ],
        );
    }
}
