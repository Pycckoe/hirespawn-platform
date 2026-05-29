<?php

namespace App\Services\Knowledge;

use App\Models\KnowledgeChunk;
use App\Models\Subscription;

/**
 * Embeds a query and returns the most semantically similar knowledge
 * chunks for a deployment, ranked by cosine similarity (computed in PHP).
 * Kept dependency-light on purpose: no vector DB extension required, which
 * is fine for a single deployment's knowledge base (hundreds–low-thousands
 * of chunks).
 */
class KnowledgeRetriever
{
    /**
     * @return array<int, array{content: string, score: float}>
     */
    public function retrieve(Subscription $subscription, string $query, int $topK = 5): array
    {
        $query = trim($query);
        if ($query === '' || ! $subscription->agent) {
            return [];
        }

        $embedder = Embedder::forAgent($subscription->agent);
        if (! $embedder) {
            return [];
        }

        $queryVector = $embedder->embedOne($query);
        if (! $queryVector) {
            return [];
        }

        $chunks = KnowledgeChunk::query()
            ->where('subscription_id', $subscription->id)
            ->get(['content', 'embedding']);
        if ($chunks->isEmpty()) {
            return [];
        }

        $queryNorm = $this->norm($queryVector);
        if ($queryNorm === 0.0) {
            return [];
        }

        $scored = [];
        foreach ($chunks as $chunk) {
            $vector = $chunk->embedding;
            if (! is_array($vector) || $vector === []) {
                continue;
            }
            $norm = $this->norm($vector);
            if ($norm === 0.0) {
                continue;
            }
            $scored[] = [
                'content' => $chunk->content,
                'score' => $this->dot($queryVector, $vector) / ($queryNorm * $norm),
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, max(1, $topK));
    }

    private function dot(array $a, array $b): float
    {
        $sum = 0.0;
        $n = min(count($a), count($b));
        for ($i = 0; $i < $n; $i++) {
            $sum += ((float) $a[$i]) * ((float) $b[$i]);
        }

        return $sum;
    }

    private function norm(array $v): float
    {
        $sum = 0.0;
        foreach ($v as $x) {
            $sum += ((float) $x) * ((float) $x);
        }

        return sqrt($sum);
    }
}
