<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Platform-owned embeddings key for the knowledge base (RAG). This is
    // OUR cost/responsibility: buyers enrich any agent with knowledge and
    // sellers don't configure anything. Set EMBEDDINGS_API_KEY in the
    // environment (falls back to OPENAI_API_KEY).
    'embeddings' => [
        'key' => env('EMBEDDINGS_API_KEY', env('OPENAI_API_KEY')),
        'model' => env('EMBEDDINGS_MODEL', 'text-embedding-3-small'),
    ],

];
