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
     * Convert markdown body to safe HTML for rendering.
     */
    public function renderedBody(): string
    {
        return $this->body ? Str::markdown($this->body) : '';
    }
}
