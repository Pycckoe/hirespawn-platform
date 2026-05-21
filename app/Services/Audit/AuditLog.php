<?php

namespace App\Services\Audit;

use App\Models\AuditEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Throwable;

/**
 * Façade for writing audit_events. Stays loose-coupled — callers don't
 * care about the underlying schema, they just say "user X did Y to Z".
 *
 * Usage:
 *   app(AuditLog::class)->record('agent.create', $agent, ['name' => $agent->name]);
 *   audit('subscription.configure', $sub, ['keys' => array_keys($values)]);
 */
class AuditLog
{
    /**
     * Write a row. Silently swallows errors so a logging failure can't
     * take down the business action that triggered it (we already log
     * to the laravel log in that case).
     */
    public function record(string $eventType, ?Model $subject = null, array $metadata = [], ?int $userId = null): ?AuditEvent
    {
        try {
            return AuditEvent::create([
                'user_id' => $userId ?? Auth::id(),
                'subject_type' => $subject ? get_class($subject) : null,
                'subject_id' => $subject?->getKey(),
                'event_type' => $eventType,
                'metadata' => $metadata,
                'ip_address' => $this->safeIp(),
                'user_agent' => $this->safeUa(),
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            \Log::warning('AuditLog::record failed', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function safeIp(): ?string
    {
        try {
            return Request::ip();
        } catch (Throwable) {
            return null;
        }
    }

    private function safeUa(): ?string
    {
        try {
            $ua = Request::userAgent();

            return $ua ? mb_strimwidth($ua, 0, 400) : null;
        } catch (Throwable) {
            return null;
        }
    }
}
