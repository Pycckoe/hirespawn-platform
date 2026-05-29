<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeSource;
use App\Models\Subscription;
use App\Services\Knowledge\KnowledgeIngestor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Buyer-side CRUD for a deployment's knowledge base (RAG). The buyer
 * uploads files or pastes text; we ingest synchronously (extract → chunk
 * → embed) so the status is accurate by the time the page reloads.
 */
class KnowledgeController extends Controller
{
    public function store(Request $request, Subscription $subscription, KnowledgeIngestor $ingestor): RedirectResponse
    {
        $this->authorize($request, $subscription);

        if (! $subscription->agent?->accepts_knowledge) {
            return back()->with('status', 'This agent does not use a knowledge base.');
        }

        $validated = $request->validate([
            'kind' => ['required', 'in:text,file'],
            'title' => ['required', 'string', 'max:160'],
            'content' => ['nullable', 'string', 'max:200000'],
            'file' => ['nullable', 'file', 'mimes:txt,md,markdown,csv,json,pdf', 'max:5120'],
        ]);

        if ($validated['kind'] === 'file') {
            if (! $request->hasFile('file')) {
                throw ValidationException::withMessages(['file' => 'Choose a file to upload.']);
            }
            $file = $request->file('file');
            $path = $file->store("knowledge/{$subscription->id}", 'local');

            $source = $subscription->knowledgeSources()->create([
                'title' => $validated['title'],
                'source_type' => 'file',
                'original_filename' => $file->getClientOriginalName(),
                'disk' => 'local',
                'path' => $path,
                'mime' => $file->getClientMimeType(),
                'bytes' => $file->getSize(),
                'status' => 'pending',
            ]);
        } else {
            if (blank($validated['content'] ?? null)) {
                throw ValidationException::withMessages(['content' => 'Enter some text to add.']);
            }
            $source = $subscription->knowledgeSources()->create([
                'title' => $validated['title'],
                'source_type' => 'text',
                'raw_text' => $validated['content'],
                'bytes' => strlen($validated['content']),
                'status' => 'pending',
            ]);
        }

        $ingestor->ingest($source->fresh('subscription'));

        $fresh = $source->fresh();
        $message = $fresh->status === 'ready'
            ? "Indexed \"{$fresh->title}\" ({$fresh->chunk_count} chunks)."
            : "Couldn't index \"{$fresh->title}\": {$fresh->error}";

        audit('knowledge.add', $fresh, [
            'subscription_id' => $subscription->id,
            'agent' => $subscription->agent?->slug,
            'status' => $fresh->status,
        ]);

        return back()->with('status', $message);
    }

    public function destroy(Request $request, Subscription $subscription, KnowledgeSource $source): RedirectResponse
    {
        $this->authorize($request, $subscription);
        abort_unless($source->subscription_id === $subscription->id, 404);

        if ($source->source_type === 'file' && $source->path) {
            Storage::disk($source->disk ?: 'local')->delete($source->path);
        }
        $title = $source->title;
        $source->delete(); // chunks cascade

        audit('knowledge.delete', null, [
            'subscription_id' => $subscription->id,
            'title' => $title,
        ]);

        return back()->with('status', "Removed \"{$title}\" from the knowledge base.");
    }

    private function authorize(Request $request, Subscription $subscription): void
    {
        $user = $request->user();
        abort_unless($user && $subscription->buyer_id === $user->id, 403);
    }
}
