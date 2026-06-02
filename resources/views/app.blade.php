<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Hirespawn') }}</title>

        {{-- Admin-managed favicon (CMS · /admin/site-settings · site_favicon).
             Falls back to /favicon.ico when no upload has been done yet. --}}
        @php($faviconUrl = \App\Models\SiteSetting::lookup('site_favicon'))
        @if($faviconUrl)
            <link rel="icon" href="{{ $faviconUrl }}" />
            <link rel="shortcut icon" href="{{ $faviconUrl }}" />
        @else
            <link rel="icon" href="/favicon.ico" />
        @endif

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

        <script>
            (function () {
                try {
                    var t = localStorage.getItem('hirespawn-theme') || 'dark';
                    document.documentElement.setAttribute('data-theme', t);
                } catch (e) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            })();
        </script>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
