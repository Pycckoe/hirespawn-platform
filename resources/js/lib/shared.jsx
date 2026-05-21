// Shared data and small utilities across all three directions
import '@/setup';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

// Translation hook — returns a t(key, fallback) function. Reads the
// translations map shared from Laravel via HandleInertiaRequests
// (i18n.translations). Keys are namespaced "namespace.key"; calls
// without a "." default to the "site" namespace.
const useT = () => {
  const map = usePage().props?.i18n?.translations || {};
  return (key, fallback = null) => {
    const full = key.includes('.') ? key : `site.${key}`;
    return map[full] ?? (fallback ?? full);
  };
};

// Rates hook — single source of truth for money-related rates in the
// JS layer. All values are read from /admin/site-settings (group: rates)
// via the shared cms.settings prop. Numbers come back as plain JS, with
// safe fallbacks if a row is missing (mirrors App\Support\Rates on the
// server). Use this everywhere we display EUR conversions or compute
// fees client-side so the admin can re-tune without a deploy.
const useRates = () => {
  const settings = usePage().props?.cms?.settings || {};
  const eurCentsPerPower = parseFloat(settings.eur_cents_per_power) || 0.9;
  const sellerSharePct = parseFloat(settings.seller_share_pct) || 70;
  const vatPct = parseFloat(settings.vat_rate_pct) || 20;
  return {
    // 1 ⚡ → EUR (e.g. 0.009)
    eurPerPower: eurCentsPerPower / 100,
    // Fraction the seller keeps after platform cut (e.g. 0.7)
    sellerShare: sellerSharePct / 100,
    // VAT fraction (e.g. 0.20)
    vatFraction: vatPct / 100,
    // Raw values for label display
    eurCentsPerPower,
    sellerSharePct,
    vatPct,
    minTopupEur: parseInt(settings.min_topup_eur, 10) || 5,
    maxTopupEur: parseInt(settings.max_topup_eur, 10) || 50000,
    cashoutFeePct: parseFloat(settings.cashout_fee_pct) || 1,
  };
};

// === Theme: dark/light. Tokens live in Hirespawn.html as CSS vars on :root[data-theme]. ===
const THEME_KEY = 'hirespawn-theme';
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') || 'dark'; }
    catch (e) { return 'dark'; }
  });
  const apply = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    setTheme(t);
    // Notify other useTheme consumers in the same document
    window.dispatchEvent(new CustomEvent('hirespawn-theme', { detail: t }));
  };
  useEffect(() => {
    const onTheme = (e) => setTheme(e.detail);
    window.addEventListener('hirespawn-theme', onTheme);
    return () => window.removeEventListener('hirespawn-theme', onTheme);
  }, []);
  return [theme, apply];
};

// Power-token pricing model. Every agent burns Power per task it executes.
// Buy Power packs; your team allocates Power across whichever agents you hire.
// 1 Power ≈ €0.01 (varies by pack).
const AGENTS = [
  { id: 'sdr-pro',     name: 'AI SDR',           role: 'Cold Outreach',   rank: 'O-4', vendor: 'Acme AI',     power: 12, perUnit: 'lead',        rating: 4.9,  deployed: 1247, langs: ['EN','RU','ES'],          tone: 'sales',    int: ['hubspot','gmail','slack'],     spec: '1.2k leads/day'   },
  { id: 'recruit',     name: 'AI Recruiter',     role: 'Sourcer',         rank: 'O-3', vendor: 'Cohort Labs', power: 28, perUnit: 'profile',     rating: 4.8,  deployed: 892,  langs: ['EN','DE'],               tone: 'hr',       int: ['linkedin','greenhouse'],       spec: '300 candidates/wk'},
  { id: 'books',       name: 'AI Bookkeeper',    role: 'Finance',         rank: 'E-7', vendor: 'Ledger.ai',   power: 4,  perUnit: 'transaction', rating: 4.9,  deployed: 2104, langs: ['EN','FR','DE'],          tone: 'finance',  int: ['xero','quickbooks','stripe'],  spec: '99.7% accuracy'   },
  { id: 'review',      name: 'AI Code Reviewer', role: 'Engineering',     rank: 'O-5', vendor: 'PullRequest', power: 38, perUnit: 'PR',          rating: 4.95, deployed: 3401, langs: ['ANY'],                   tone: 'eng',      int: ['github','gitlab','linear'],    spec: '< 90s review'     },
  { id: 'analyst',     name: 'AI Data Analyst',  role: 'Research',        rank: 'O-3', vendor: 'Querium',     power: 22, perUnit: 'query',       rating: 4.7,  deployed: 612,  langs: ['EN'],                    tone: 'research', int: ['snowflake','bigquery','dbt'],  spec: '15s avg query'    },
  { id: 'legal',       name: 'AI Legal Reviewer',role: 'Contracts',       rank: 'O-4', vendor: 'Quill Legal', power: 64, perUnit: 'contract',    rating: 4.85, deployed: 421,  langs: ['EN','DE'],               tone: 'legal',    int: ['docusign','notion'],           spec: '40-pg in 4min'    },
  { id: 'support',     name: 'AI Support Agent', role: 'Customer Care',   rank: 'E-5', vendor: 'Helpdesk AI', power: 6,  perUnit: 'ticket',      rating: 4.6,  deployed: 5872, langs: ['EN','RU','ES','DE','FR'],tone: 'support',  int: ['zendesk','intercom'],          spec: '24/7, sub-30s'    },
  { id: 'designer',    name: 'AI Designer',      role: 'Design',          rank: 'O-2', vendor: 'Mockstar',    power: 48, perUnit: 'mock',        rating: 4.7,  deployed: 234,  langs: ['EN'],                    tone: 'design',   int: ['figma','linear'],              spec: '40 mocks/wk'      },
];

// NB: Power packs are NOT defined in JS any more. The single source of
// truth is the `power_packs` DB table, managed in /admin/power-packs.
// Every page that renders pack info reads `usePage().props.powerPacks`
// (shipped by PageController / SettingsController). See Pricing.jsx,
// PowerCheckout.jsx, Settings.jsx (Billing tab), and DirA PowerPacks +
// PowerCalculator on the homepage.

const FAQS = [
  { q: 'What is Power exactly?',                   a: 'Power is the unit of work on Hirespawn. Every agent declares how much Power one task costs (e.g. an SDR burns 12 Power per personalized cold email). You buy a Power pack once; allocate it across any agent in the roster.' },
  { q: 'Why not just charge per agent per month?', a: 'You hire agents at different intensities. A bookkeeper might run 4 Power per transaction × thousands a month. A legal reviewer runs 64 Power × ten contracts. Subscriptions punish careful users and reward heavy ones. Power is fair.' },
  { q: 'Does Power expire?',                       a: 'Pro & Scale packs roll over for 12 months. Enterprise never expires. Starter rolls 90 days. You always see remaining balance in the console.' },
  { q: 'Who runs the agents?',                     a: 'The seller does — Hirespawn is pure marketplace. We route your scoped API calls, meter usage, escrow funds 14 days, then pay sellers on the 1st. If an agent fails its SLA we credit your Power.' },
  { q: 'Can I bring my own agent?',                a: 'Yes. Publish a manifest.json that meets our spec, set the Power cost, share revenue. We collect VAT, handle billing, and surface you in the roster. 12% take rate at Enterprise.' },
  { q: 'What about data?',                         a: 'Each subscription gets an isolated API key with scoped access. Data residency declared per agent (EU / US). GDPR-compliant subprocessor list on every listing.' },
];

const INTEGRATIONS = [
  'Slack','Gmail','HubSpot','Salesforce','Pipedrive','Zendesk','Intercom','GitHub','GitLab','Linear','Notion','Figma','Stripe','Xero','QuickBooks','LinkedIn','Greenhouse','Snowflake','BigQuery','dbt','DocuSign','Zapier','Make','Airtable',
];

const CATEGORIES = [
  { key: 'sales',     label: 'Sales',        icon: '◇' },
  { key: 'hr',        label: 'HR',           icon: '◈' },
  { key: 'finance',   label: 'Finance',      icon: '◉' },
  { key: 'eng',       label: 'Engineering',  icon: '◌' },
  { key: 'support',   label: 'Support',      icon: '◍' },
  { key: 'legal',     label: 'Legal',        icon: '◎' },
  { key: 'design',    label: 'Design',       icon: '◐' },
  { key: 'research',  label: 'Research',     icon: '◑' },
];

// A short stream of "live ops" log lines for hero demos
const OPS_FEED = [
  { agent: 'AI SDR',           verb: 'sent personalized email to', obj: 'lead@northwind.io',         t: '0.4s' },
  { agent: 'AI Code Reviewer', verb: 'approved PR #4291 in',        obj: 'monorepo/payments',         t: '1.1s' },
  { agent: 'AI Bookkeeper',    verb: 'reconciled',                  obj: '142 Stripe transactions',   t: '0.7s' },
  { agent: 'AI Recruiter',     verb: 'scored',                      obj: '87 LinkedIn profiles',      t: '2.3s' },
  { agent: 'AI Support',       verb: 'resolved ticket',             obj: '#88471 (refund — happy)',   t: '0.3s' },
  { agent: 'AI Data Analyst',  verb: 'answered',                    obj: '"Q3 revenue by segment"',   t: '1.8s' },
  { agent: 'AI Legal',         verb: 'flagged',                     obj: '3 clauses in NDA-220.pdf',  t: '4.1s' },
  { agent: 'AI Designer',      verb: 'shipped',                     obj: '6 banner variants',         t: '6.2s' },
  { agent: 'AI SDR',           verb: 'booked',                      obj: 'demo with Helix Co.',       t: '0.9s' },
  { agent: 'AI Bookkeeper',    verb: 'filed',                       obj: 'VAT MOSS Q1 — DE',          t: '2.0s' },
];

// Small hook: incrementing counter with easing toward target
function useCountUp(target, ms = 1500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// Live ops feed: rotates one item every `interval` ms
function useLiveFeed(interval = 1100, length = 5) {
  const [items, setItems] = useState(() => OPS_FEED.slice(0, length));
  const idx = useRef(length);
  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => {
        const next = OPS_FEED[idx.current % OPS_FEED.length];
        idx.current++;
        return [{ ...next, key: idx.current }, ...prev.slice(0, length - 1)];
      });
    }, interval);
    return () => clearInterval(t);
  }, [interval, length]);
  return items;
}

// Format helpers
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);
const fmtCurrency = (n) => '€' + n.toLocaleString();

// Also expose on window for any legacy script that expects globals.
if (typeof window !== 'undefined') {
    Object.assign(window, {
        AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
        useCountUp, useLiveFeed, useTheme, useT, useRates, fmt, fmtCurrency,
    });
}

export {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, useT, useRates, fmt, fmtCurrency,
};
