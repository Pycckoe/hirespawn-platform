<?php

namespace Database\Seeders;

use App\Models\AgentTemplate;
use Illuminate\Database\Seeder;

/**
 * Starter templates for the seller "publish agent" flow. Insert-if-missing
 * (keyed on slug) so admin edits to a template survive Laravel Cloud's
 * per-deploy re-seed — same rule we use for OAuth apps / power packs.
 */
class AgentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $row) {
            if (AgentTemplate::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }
            AgentTemplate::create($row);
        }
    }

    private function templates(): array
    {
        return [
            [
                'slug' => 'support-triage',
                'name' => 'Support Triage',
                'icon' => '◐',
                'summary' => 'Classifies incoming tickets, drafts a reply, and posts a summary to Slack. Uses your knowledge base for product answers.',
                'category_slug' => 'support',
                'agent_name' => 'Support Triage',
                'role' => 'Customer Care',
                'rank' => 'E-5',
                'tagline' => 'Classify · draft · route in seconds',
                'description' => 'A support triage assistant that classifies each message (billing/technical/account/abuse/general), assigns a priority, drafts a ready-to-send reply, and posts a one-line summary to your Slack channel. Answers product questions from your uploaded knowledge base.',
                'system_prompt' => "You are a {{tone}} customer-support triage assistant for {{company}}.\n\nFor each incoming message:\n1. Classify it: billing | technical | account | abuse | general.\n2. Assign a priority: low | medium | high | urgent.\n3. Draft a short, helpful reply the human team can send as-is.\n\nWhen you reach a resolution, call the post_to_slack tool to post a one-line summary to the configured channel.\n\nUse the knowledge base for product specifics. Never invent account details you weren't given.",
                'per_unit' => 'ticket',
                'power_cost' => 3,
                'est_input_tokens' => 800,
                'est_output_tokens' => 400,
                'suggested_model_slug' => 'claude-sonnet-4-6',
                'languages' => ['EN'],
                'integrations' => ['slack'],
                'accepts_knowledge' => true,
                'knowledge_instructions' => "Answer product and policy questions strictly from the knowledge base. If the answer isn't there, say so and suggest escalating to a human.",
                'skills' => [[
                    'name' => 'post_to_slack',
                    'label' => 'Post summary to Slack',
                    'description' => "Posts a one-line ticket-resolution summary to the buyer's chosen Slack channel.",
                    'transport' => 'oauth_proxy',
                    'webhook_url' => 'https://example.com/hirespawn/post_to_slack',
                    'required_oauth_provider' => 'slack',
                    'parameters_schema' => [
                        'type' => 'object',
                        'properties' => ['summary' => ['type' => 'string', 'description' => 'One-line summary to post.']],
                        'required' => ['summary'],
                    ],
                    'timeout_seconds' => 30,
                ]],
                'setting_defs' => [
                    ['key' => 'tone', 'label' => 'Tone of voice', 'type' => 'select', 'default_value' => 'friendly', 'options' => ['friendly', 'formal', 'concise'], 'is_required' => true, 'description' => 'How the agent phrases replies.'],
                    ['key' => 'company', 'label' => 'Company name', 'type' => 'text', 'default_value' => '', 'options' => [], 'is_required' => true, 'description' => 'Used in replies and signatures.'],
                ],
                'sort_order' => 10,
            ],
            [
                'slug' => 'sales-sdr',
                'name' => 'Sales SDR',
                'icon' => '◆',
                'summary' => 'Researches a lead, writes a tailored cold outreach email in your voice, and adapts to the target persona.',
                'category_slug' => 'sales',
                'agent_name' => 'AI SDR',
                'role' => 'Cold Outreach',
                'rank' => 'O-3',
                'tagline' => 'Personalised outreach at scale',
                'description' => 'A sales development rep that researches each lead, drafts a concise, tailored cold email in your brand voice, and follows your outreach playbook. Pulls positioning and product facts from your knowledge base.',
                'system_prompt' => "You are an SDR for {{company}} writing outreach to {{persona}}.\n\nGiven a lead, draft a {{tone}} cold email (<=120 words) that opens with a specific, researched hook, ties one concrete value prop to their role, and ends with a low-friction ask. Use the knowledge base for accurate product positioning. Never fabricate facts about the prospect.",
                'per_unit' => 'lead',
                'power_cost' => 12,
                'est_input_tokens' => 1200,
                'est_output_tokens' => 500,
                'suggested_model_slug' => 'claude-sonnet-4-6',
                'languages' => ['EN'],
                'integrations' => ['hubspot', 'gmail'],
                'accepts_knowledge' => true,
                'knowledge_instructions' => 'Use the knowledge base for product positioning, pricing, and differentiators. Do not invent claims not supported by it.',
                'skills' => [],
                'setting_defs' => [
                    ['key' => 'company', 'label' => 'Your company', 'type' => 'text', 'default_value' => '', 'options' => [], 'is_required' => true, 'description' => 'The company the SDR represents.'],
                    ['key' => 'persona', 'label' => 'Target persona', 'type' => 'text', 'default_value' => '', 'options' => [], 'is_required' => true, 'description' => 'e.g. "Head of Support at a 50-200 person SaaS".'],
                    ['key' => 'tone', 'label' => 'Tone', 'type' => 'select', 'default_value' => 'friendly', 'options' => ['friendly', 'formal', 'punchy'], 'is_required' => true, 'description' => 'Voice of the outreach.'],
                ],
                'sort_order' => 20,
            ],
            [
                'slug' => 'code-reviewer',
                'name' => 'Code Reviewer',
                'icon' => '◇',
                'summary' => 'Reviews a diff for bugs, security and style, and returns prioritised, actionable comments.',
                'category_slug' => 'eng',
                'agent_name' => 'AI Code Reviewer',
                'role' => 'Engineering',
                'rank' => 'O-4',
                'tagline' => 'Actionable PR review in under 90s',
                'description' => 'Reviews a code diff for correctness bugs, security issues, and style problems, then returns prioritised, concrete comments with suggested fixes. Honours your team conventions from the knowledge base.',
                'system_prompt' => "You are a senior {{language}} reviewer for {{company}}.\n\nReview the provided diff. Return findings grouped by severity (blocker | warning | nit). For each: file/line, the problem, and a concrete fix. Prefer fewer, high-signal comments. Apply the team conventions in the knowledge base. If the diff looks good, say so.",
                'per_unit' => 'PR',
                'power_cost' => 38,
                'est_input_tokens' => 6000,
                'est_output_tokens' => 1500,
                'suggested_model_slug' => 'claude-sonnet-4-6',
                'languages' => ['EN'],
                'integrations' => ['github'],
                'accepts_knowledge' => true,
                'knowledge_instructions' => 'Use the knowledge base for the team\'s coding conventions, architecture rules, and review checklist.',
                'skills' => [],
                'setting_defs' => [
                    ['key' => 'language', 'label' => 'Primary language', 'type' => 'text', 'default_value' => 'TypeScript', 'options' => [], 'is_required' => true, 'description' => 'Main language of the codebase.'],
                    ['key' => 'company', 'label' => 'Team / company', 'type' => 'text', 'default_value' => '', 'options' => [], 'is_required' => false, 'description' => 'Shown in the review voice.'],
                ],
                'sort_order' => 30,
            ],
            [
                'slug' => 'docs-qa',
                'name' => 'Docs Q&A',
                'icon' => '◼',
                'summary' => 'Answers questions strictly from your uploaded documents — handbooks, policies, product docs.',
                'category_slug' => 'support',
                'agent_name' => 'Docs Q&A',
                'role' => 'Knowledge',
                'rank' => 'E-6',
                'tagline' => 'Grounded answers from your docs',
                'description' => 'A retrieval-grounded assistant that answers questions using only your uploaded knowledge base (handbooks, policies, product docs). Cites the relevant section and refuses to guess when the answer is not present.',
                'system_prompt' => "You are a {{tone}} assistant that answers questions about {{topic}} for {{company}}.\n\nAnswer ONLY from the knowledge base. Quote or reference the relevant section. If the knowledge base does not contain the answer, say \"I don't have that in the provided documents\" rather than guessing.",
                'per_unit' => 'question',
                'power_cost' => 2,
                'est_input_tokens' => 1500,
                'est_output_tokens' => 400,
                'suggested_model_slug' => 'claude-sonnet-4-6',
                'languages' => ['EN'],
                'integrations' => [],
                'accepts_knowledge' => true,
                'knowledge_instructions' => 'This agent must answer exclusively from the knowledge base. Never use outside knowledge; if unsure, decline.',
                'skills' => [],
                'setting_defs' => [
                    ['key' => 'company', 'label' => 'Company / org', 'type' => 'text', 'default_value' => '', 'options' => [], 'is_required' => false, 'description' => 'Context for answers.'],
                    ['key' => 'topic', 'label' => 'Topic area', 'type' => 'text', 'default_value' => 'our product', 'options' => [], 'is_required' => false, 'description' => 'What the docs cover.'],
                    ['key' => 'tone', 'label' => 'Tone', 'type' => 'select', 'default_value' => 'concise', 'options' => ['concise', 'friendly', 'formal'], 'is_required' => true, 'description' => 'Answer style.'],
                ],
                'sort_order' => 40,
            ],
        ];
    }
}
