<?php

namespace Database\Seeders;

use App\Models\LlmModel;
use Illuminate\Database\Seeder;

class LlmModelsSeeder extends Seeder
{
    /**
     * Seed the public LLM catalogue. Prices in € cents per 1M tokens
     * (approximate USD → EUR at ~0.92 rate, rounded up so the platform
     * never under-charges itself). Admin can re-edit at /admin/llm-models
     * when providers change pricing.
     *
     * Sources: provider public pricing pages (May 2026). Cents are an
     * integer to avoid float drift in margin math.
     */
    public function run(): void
    {
        $rows = [
            // ---- Anthropic ----
            ['provider' => 'anthropic', 'slug' => 'claude-opus-4-7',    'name' => 'Claude Opus 4.7',    'api_id' => 'claude-opus-4-7',           'input_price_cents_per_1m' => 1380, 'output_price_cents_per_1m' => 6900, 'context_window' => 200000, 'max_output_tokens' => 32000, 'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'Anthropic\'s flagship reasoning model. Best for complex agents.', 'sort_order' => 10],
            ['provider' => 'anthropic', 'slug' => 'claude-sonnet-4-6',  'name' => 'Claude Sonnet 4.6',  'api_id' => 'claude-sonnet-4-6',         'input_price_cents_per_1m' => 276,  'output_price_cents_per_1m' => 1380, 'context_window' => 200000, 'max_output_tokens' => 16000, 'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'Balanced cost / quality. Default for most production agents.', 'sort_order' => 20],
            ['provider' => 'anthropic', 'slug' => 'claude-haiku-4-5',   'name' => 'Claude Haiku 4.5',   'api_id' => 'claude-haiku-4-5-20251001', 'input_price_cents_per_1m' => 92,   'output_price_cents_per_1m' => 460,  'context_window' => 200000, 'max_output_tokens' => 8192,  'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'Fast + cheap. Good for high-volume routers and classifiers.', 'sort_order' => 30],

            // ---- OpenAI ----
            ['provider' => 'openai',    'slug' => 'gpt-5',              'name' => 'GPT-5',              'api_id' => 'gpt-5',                     'input_price_cents_per_1m' => 1150, 'output_price_cents_per_1m' => 4600, 'context_window' => 400000, 'max_output_tokens' => 32000, 'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'OpenAI\'s flagship multimodal model. Tool-use parity with Claude.', 'sort_order' => 40],
            ['provider' => 'openai',    'slug' => 'gpt-5-mini',         'name' => 'GPT-5 mini',         'api_id' => 'gpt-5-mini',                'input_price_cents_per_1m' => 138,  'output_price_cents_per_1m' => 552,  'context_window' => 400000, 'max_output_tokens' => 16000, 'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'Distilled GPT-5 for cost-sensitive workloads.', 'sort_order' => 50],
            ['provider' => 'openai',    'slug' => 'o3-mini',            'name' => 'o3-mini',            'api_id' => 'o3-mini',                   'input_price_cents_per_1m' => 184,  'output_price_cents_per_1m' => 736,  'context_window' => 200000, 'max_output_tokens' => 32000, 'capabilities' => ['text', 'tools', 'json'],          'description' => 'Reasoning model. Slower but stronger at math + planning.', 'sort_order' => 60],

            // ---- Google ----
            ['provider' => 'google',    'slug' => 'gemini-2-5-pro',     'name' => 'Gemini 2.5 Pro',     'api_id' => 'gemini-2.5-pro',            'input_price_cents_per_1m' => 115,  'output_price_cents_per_1m' => 460,  'context_window' => 2000000,'max_output_tokens' => 8192,  'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => '2M-token context window. Great for long-doc agents.', 'sort_order' => 70],
            ['provider' => 'google',    'slug' => 'gemini-2-5-flash',   'name' => 'Gemini 2.5 Flash',   'api_id' => 'gemini-2.5-flash',          'input_price_cents_per_1m' => 28,   'output_price_cents_per_1m' => 110,  'context_window' => 1000000,'max_output_tokens' => 8192,  'capabilities' => ['text', 'vision', 'tools', 'json'], 'description' => 'Cheapest fast model. Routers, summaries, RAG.', 'sort_order' => 80],

            // ---- DeepSeek ----
            ['provider' => 'deepseek',  'slug' => 'deepseek-v3',        'name' => 'DeepSeek V3',        'api_id' => 'deepseek-chat',             'input_price_cents_per_1m' => 25,   'output_price_cents_per_1m' => 100,  'context_window' => 128000, 'max_output_tokens' => 8192,  'capabilities' => ['text', 'tools', 'json'],          'description' => 'High-quality open-weights model at fraction of GPT-5 cost.', 'sort_order' => 90],
            ['provider' => 'deepseek',  'slug' => 'deepseek-r1',        'name' => 'DeepSeek R1',        'api_id' => 'deepseek-reasoner',         'input_price_cents_per_1m' => 50,   'output_price_cents_per_1m' => 200,  'context_window' => 128000, 'max_output_tokens' => 32000, 'capabilities' => ['text', 'tools'],                  'description' => 'Reasoning-focused. Competitive with o3-mini at lower cost.', 'sort_order' => 100],

            // ---- xAI ----
            ['provider' => 'xai',       'slug' => 'grok-4',             'name' => 'Grok 4',             'api_id' => 'grok-4',                    'input_price_cents_per_1m' => 460,  'output_price_cents_per_1m' => 1380, 'context_window' => 256000, 'max_output_tokens' => 16000, 'capabilities' => ['text', 'tools', 'json'],          'description' => 'xAI flagship. Strong at code + real-time web context.', 'sort_order' => 110],

            // ---- Mistral ----
            ['provider' => 'mistral',   'slug' => 'mistral-large-2',    'name' => 'Mistral Large 2',    'api_id' => 'mistral-large-latest',      'input_price_cents_per_1m' => 184,  'output_price_cents_per_1m' => 552,  'context_window' => 128000, 'max_output_tokens' => 8192,  'capabilities' => ['text', 'tools', 'json'],          'description' => 'EU-hosted option for GDPR-sensitive workloads.', 'sort_order' => 120],
            ['provider' => 'mistral',   'slug' => 'codestral',          'name' => 'Codestral',          'api_id' => 'codestral-latest',          'input_price_cents_per_1m' => 28,   'output_price_cents_per_1m' => 84,   'context_window' => 32000,  'max_output_tokens' => 8192,  'capabilities' => ['text', 'tools'],                  'description' => 'Code-specialised. Cheap for engineering agents.', 'sort_order' => 130],

            // ---- Meta (via Groq / Together / Fireworks) ----
            ['provider' => 'meta',      'slug' => 'llama-3-3-70b',      'name' => 'Llama 3.3 70B',      'api_id' => 'meta-llama/llama-3.3-70b',  'input_price_cents_per_1m' => 55,   'output_price_cents_per_1m' => 80,   'context_window' => 128000, 'max_output_tokens' => 8192,  'capabilities' => ['text', 'tools', 'json'],          'description' => 'Open-weights via Groq/Together. Fast inference.', 'sort_order' => 140],
        ];

        foreach ($rows as $row) {
            LlmModel::updateOrCreate(
                ['slug' => $row['slug']],
                $row + ['is_active' => true],
            );
        }
    }
}
