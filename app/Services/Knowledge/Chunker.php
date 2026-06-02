<?php

namespace App\Services\Knowledge;

/**
 * Splits a document into overlapping, sentence-aligned chunks sized for
 * embedding + retrieval. Sizes are in characters (~4 chars ≈ 1 token), so
 * the defaults target ~800-token chunks with ~100-token overlap to keep
 * context across boundaries.
 */
class Chunker
{
    public function __construct(
        private readonly int $maxChars = 3200,
        private readonly int $overlapChars = 400,
    ) {}

    /**
     * @return string[]
     */
    public function chunk(string $text): array
    {
        // Normalise newlines/whitespace runs but keep single spaces so
        // sentences stay readable for the model.
        $text = trim(preg_replace('/[ \t]+/', ' ', str_replace(["\r\n", "\r"], "\n", $text)));
        $text = preg_replace('/\n{3,}/', "\n\n", (string) $text);
        if ($text === '') {
            return [];
        }

        // Split into sentence-ish units so chunks don't cut mid-sentence.
        $units = preg_split('/(?<=[.!?。！？\n])\s+/u', $text) ?: [$text];

        $chunks = [];
        $current = '';
        foreach ($units as $unit) {
            $unit = trim($unit);
            if ($unit === '') {
                continue;
            }

            // A single oversized unit (e.g. a giant table row) is hard-split.
            if (mb_strlen($unit) > $this->maxChars) {
                if ($current !== '') {
                    $chunks[] = $current;
                    $current = '';
                }
                foreach (mb_str_split($unit, $this->maxChars) as $piece) {
                    $chunks[] = $piece;
                }

                continue;
            }

            if ($current !== '' && mb_strlen($current) + mb_strlen($unit) + 1 > $this->maxChars) {
                $chunks[] = $current;
                // Carry the tail of the previous chunk as overlap.
                $tail = mb_substr($current, -$this->overlapChars);
                $current = trim($tail).' '.$unit;
            } else {
                $current = $current === '' ? $unit : $current.' '.$unit;
            }
        }

        if (trim($current) !== '') {
            $chunks[] = trim($current);
        }

        return $chunks;
    }
}
