// The imported design uses hash anchors like <a href="#/roster"> for in-app
// navigation. Inertia expects real URLs, so we intercept these clicks
// once globally and translate them into router.visit() calls.
import { router } from '@inertiajs/react';

// Maps hash paths from the design to real Inertia routes.
const ROUTE_MAP = {
    '#/': '/',
    '#/roster': '/roster',
    '#/console': '/console',
    '#/vendor': '/vendor',
    '#/auth': '/login',
    '#/auth/register': '/register',
    '#/onboarding': '/onboarding',
    '#/docs': '/docs',
    '#/about': '/about',
    '#/power': '/power',
    '#/hire': '/hire',
    '#/settings': '/settings',
    '#/pricing': '/pricing',
    '#/changelog': '/changelog',
    '#/customers': '/customers',
    '#/security': '/security',
    '#/status': '/status',
    '#/legal': '/legal',
    '#/emails': '/emails',
};

function hashToPath(hash) {
    if (!hash || hash === '#' || hash === '#/') return '/';
    if (ROUTE_MAP[hash]) return ROUTE_MAP[hash];
    // Dynamic segments: #/agent/{id}, #/run/{id}
    const agent = hash.match(/^#\/agent\/(.+)$/);
    if (agent) return `/agent/${agent[1]}`;
    const run = hash.match(/^#\/run\/(.+)$/);
    if (run) return `/run/${run[1]}`;
    // Strip the leading "#" as a default.
    return hash.startsWith('#') ? hash.slice(1) : hash;
}

if (typeof document !== 'undefined') {
    document.addEventListener('click', (event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const anchor = event.target.closest?.('a[href]');
        if (!anchor) return;
        if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;

        const href = anchor.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const path = hashToPath(href);
        if (!path) return;

        event.preventDefault();
        router.visit(path);
    });
}
