<?php

namespace App\Services\Knowledge;

use App\Models\KnowledgeChunk;
use App\Models\KnowledgeSource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

/**
 * Turns a KnowledgeSource (file or pasted text) into embedded chunks:
 * extract text → chunk → embed in batches → persist. Re-running on an
 * existing source replaces its chunks. Sets status ready/failed so the
 * UI can surface progress + errors.
 */
class KnowledgeIngestor
{
    /** OpenAI embeddings accept many inputs per call; keep batches modest. */
    private const EMBED_BATCH = 64;

    public function __construct(
        private readonly TextExtractor $extractor,
        private readonly Chunker $chunker,
    ) {}

    public function ingest(KnowledgeSource $source): void
    {
        try {
            $text = $this->resolveText($source);
            $text = trim($text);
            if ($text === '') {
                throw new RuntimeException('No readable text found in this source.');
            }

            $embedder = Embedder::forAgent($source->subscription->agent);
            if (! $embedder) {
                throw new RuntimeException("The agent owner has no OpenAI API key configured, which is required to index knowledge. Ask them to add one under /vendor → LLM keys.");
            }

            $chunks = $this->chunker->chunk($text);
            if ($chunks === []) {
                throw new RuntimeException('Document produced no chunks.');
            }

            // Embed in batches, then atomically swap the source's chunks.
            $rows = [];
            $ordinal = 0;
            foreach (array_chunk($chunks, self::EMBED_BATCH) as $batch) {
                $vectors = $embedder->embed($batch);
                if ($vectors === null || count($vectors) !== count($batch)) {
                    throw new RuntimeException('Embedding request failed. Check the OpenAI key / quota and retry.');
                }
                foreach ($batch as $i => $chunkText) {
                    $rows[] = [
                        'knowledge_source_id' => $source->id,
                        'subscription_id' => $source->subscription_id,
                        'ordinal' => $ordinal++,
                        'content' => $chunkText,
                        'token_estimate' => (int) ceil(mb_strlen($chunkText) / 4),
                        'embedding' => json_encode($vectors[$i]),
                        'embedding_model' => $embedder->model(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            DB::transaction(function () use ($source, $rows, $text) {
                $source->chunks()->delete();
                foreach (array_chunk($rows, 200) as $insert) {
                    KnowledgeChunk::insert($insert);
                }
                $source->forceFill([
                    'status' => 'ready',
                    'error' => null,
                    'chunk_count' => count($rows),
                    'char_count' => mb_strlen($text),
                ])->save();
            });
        } catch (Throwable $e) {
            $source->forceFill([
                'status' => 'failed',
                'error' => $e->getMessage(),
            ])->save();
        }
    }

    private function resolveText(KnowledgeSource $source): string
    {
        if ($source->source_type === 'file') {
            $disk = Storage::disk($source->disk ?: 'local');
            if (! $disk->exists($source->path)) {
                throw new RuntimeException('Uploaded file is missing from storage.');
            }

            return $this->extractor->extract($disk->path($source->path), $source->mime, $source->original_filename ?? 'file');
        }

        return (string) $source->raw_text;
    }
}
