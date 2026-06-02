<?php

namespace App\Services\Knowledge;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;

/**
 * Turns text into embedding vectors via the OpenAI embeddings API using the
 * PLATFORM's own key (config services.embeddings.key). Embeddings power the
 * knowledge base, which is our cost/responsibility — buyers enrich any agent
 * with knowledge and sellers never have to configure a key for it.
 */
class Embedder
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model = 'text-embedding-3-small',
    ) {}

    /**
     * Build the platform embedder, or null when no platform key is
     * configured (caller degrades gracefully / the UI shows it's
     * temporarily unavailable — an admin/ops concern, not the seller's).
     */
    public static function platform(): ?self
    {
        $key = config('services.embeddings.key');
        if (! $key) {
            return null;
        }

        // Model is admin-tunable via SiteSetting, falling back to config.
        $model = (string) SiteSetting::lookup('embedding_model', (string) config('services.embeddings.model', 'text-embedding-3-small'));

        return new self($key, $model ?: 'text-embedding-3-small');
    }

    /** True when the platform has an embeddings key configured. */
    public static function platformConfigured(): bool
    {
        return ! empty(config('services.embeddings.key'));
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
