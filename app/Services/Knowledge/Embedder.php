<?php

namespace App\Services\Knowledge;

use App\Models\Agent;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;

/**
 * Turns text into embedding vectors via the OpenAI embeddings API, using
 * the agent owner's stored OpenAI key (the same per-seller credential the
 * LLM gateway uses). Embeddings are billed to the owner's account, which
 * keeps the cost model consistent with agent runs.
 *
 * Anthropic has no embeddings endpoint, so even Anthropic-powered agents
 * need the owner to add an OpenAI key for the knowledge base to work.
 */
class Embedder
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model = 'text-embedding-3-small',
    ) {}

    /**
     * Build an embedder for an agent from its owner's OpenAI credential,
     * or null when no key is configured (caller degrades gracefully).
     */
    public static function forAgent(Agent $agent): ?self
    {
        $credential = $agent->seller?->llmCredentialFor('openai');
        if (! $credential) {
            return null;
        }

        $model = (string) SiteSetting::lookup('embedding_model', 'text-embedding-3-small');

        return new self($credential->decryptedKey(), $model ?: 'text-embedding-3-small');
    }

    public function model(): string
    {
        return $this->model;
    }

    /**
     * Embed a batch of strings. Returns a list of float vectors aligned to
     * the input order, or null on API failure. Empty input → empty list.
     *
     * @param  string[]  $texts
     * @return array<int, array<int, float>>|null
     */
    public function embed(array $texts): ?array
    {
        $texts = array_values($texts);
        if ($texts === []) {
            return [];
        }

        $resp = Http::withToken($this->apiKey)
            ->timeout(60)
            ->post('https://api.openai.com/v1/embeddings', [
                'model' => $this->model,
                'input' => $texts,
            ]);

        if (! $resp->ok()) {
            return null;
        }

        $data = $resp->json('data');
        if (! is_array($data)) {
            return null;
        }

        // The API returns items with an `index` matching input order, but
        // sort defensively so we never misalign a vector with its text.
        usort($data, fn ($a, $b) => ($a['index'] ?? 0) <=> ($b['index'] ?? 0));

        return array_map(fn ($d) => $d['embedding'] ?? [], $data);
    }

    /** Embed a single string. Null on failure. */
    public function embedOne(string $text): ?array
    {
        $vectors = $this->embed([$text]);

        return $vectors[0] ?? null;
    }
}
