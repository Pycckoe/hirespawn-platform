<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Page extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    /**
     * Page body is stored as HTML by Filament's RichEditor — return as-is.
     * Legacy markdown bodies (from before the editor swap) are detected by
     * the absence of any HTML tag and converted on read.
     */
    public function renderedBody(): string
    {
        if (! $this->body) {
            return '';
        }

        $looksLikeHtml = preg_match('/<[a-z][\s\S]*>/i', $this->body) === 1;

        return $looksLikeHtml ? $this->body : Str::markdown($this->body);
    }
}
