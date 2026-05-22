import '@/setup';
import { useEffect, useRef, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, useRates, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// AGENT DETAIL PAGE
// Specs · capabilities · integrations · SLA · pricing · sample tasks
// =====================================================================

const AgentDetail = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Logo, SectionLabel, Reveal, Footer, ThemeToggle } = DirA;

  // ---- Buyer top bar (signed-in only) ----
  // Mirrors the Console / Catalog topbars so /agent/{slug} feels like
  // part of the buyer surface, not the marketing site.
  const BuyerTopBar = ({ user, isAdmin, workspaceName, powerBalance, agentName }) => {
    const initials = (user?.name || 'U').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${palette.border}`, background: 'var(--p-topbar-bg)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <Link href="/roster" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>/ roster</Link>
          {agentName && <>
            <span style={{ color: palette.textMute }}>/</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, letterSpacing: 1, textTransform: 'uppercase' }}>{agentName}</span>
          </>}
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '4px 9px', background: 'var(--p-chip)', border: `1px solid ${palette.border}`, borderRadius: 6, marginLeft: 8 }}>{workspaceName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--p-chip)', border: `1px solid ${palette.border}`, color: palette.text }}>
            <span style={{ color: palette.accent }}>⚡</span>{(powerBalance || 0).toLocaleString()}
          </span>
          <ThemeToggle size={32} />
          {isAdmin && <a href="/admin" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.amber}`, color: palette.amber, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Admin →</a>}
          <Link href="/console" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Console →</Link>
          <Link href="/settings?tab=billing" style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>Buy Power +</Link>
          <BuyerMenu user={user} initials={initials} />
        </div>
      </div>
    );
  };

  const BuyerMenu = ({ user, initials }) => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
      if (!open) return;
      const close = () => setOpen(false);
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }, [open]);
    return (
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Account menu"
          style={{ width: 32, height: 32, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, color: palette.onAccent, border: 0, cursor: 'pointer' }}
        >
          {initials}
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220, background: 'var(--p-glass-strong, rgba(15,17,23,0.95))', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: `1px solid ${palette.borderStrong}`, borderRadius: 10, padding: 6, boxShadow: '0 12px 36px rgba(0,0,0,0.45)', zIndex: 30 }}>
            <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${palette.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{user?.name || 'You'}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{user?.email || ''}</div>
            </div>
            <Link href="/profile" style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: palette.text, textDecoration: 'none', borderRadius: 6 }}>Profile</Link>
            <Link href="/settings" style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: palette.text, textDecoration: 'none', borderRadius: 6 }}>Settings</Link>
            <div style={{ height: 1, background: palette.border, margin: '4px 6px' }} />
            <button onClick={() => router.post('/logout')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, background: 'transparent', color: palette.red, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 6 }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  };

  // Sample tasks per agent role tone — show what the agent actually does
  const SAMPLE_TASKS = {
    sales: [
      { in: 'Find 50 SaaS founders in DACH, pre-seed', out: 'Personalized outreach + booked 4 meetings', cost: 600, time: '14m' },
      { in: 'Re-engage 200 cold leads from Q3',         out: 'Sent 3-touch sequence, 18 replies',        cost: 2400, time: '2h' },
      { in: 'Draft demo follow-up to {Helix Co}',       out: 'Tailored email referencing call notes',    cost: 12,  time: '11s' },
    ],
    eng: [
      { in: 'Review PR #4291 — payments refactor',      out: '14 comments, 3 blockers, suggested 2 tests', cost: 38, time: '78s' },
      { in: 'Audit branch `feat/sso-saml`',             out: 'Flagged secret leak in commit 1f2a3',        cost: 76, time: '2m' },
      { in: 'Generate Playwright tests for /checkout',  out: '12 tests, 100% happy path coverage',         cost: 38, time: '94s' },
    ],
    finance: [
      { in: 'Reconcile Stripe → Xero, October',         out: '1,840 tx matched, 3 anomalies flagged',   cost: 7360, time: '4m' },
      { in: 'Categorize 500 receipts from Drive',       out: '99.8% auto, 1 needs review',              cost: 2000, time: '90s' },
      { in: 'File DE VAT MOSS Q1',                       out: 'Draft submitted, ready to e-sign',        cost: 80,   time: '6m' },
    ],
    hr: [
      { in: 'Source 50 senior Rust eng, EU remote',     out: '47 vetted profiles, 12 highly likely',    cost: 1316, time: '40m' },
      { in: 'Screen 30 candidates against JD',          out: 'Ranked 1-5, notes per criterion',         cost: 840,  time: '8m' },
      { in: 'Schedule 8 interviews next week',          out: 'All slots confirmed, calendars updated',  cost: 28,   time: '1m' },
    ],
    support: [
      { in: 'Answer ticket #88471 — refund request',    out: 'Resolved, customer rated 5★',             cost: 6,  time: '22s' },
      { in: 'Triage 400 tickets overnight',             out: '380 auto-resolved, 20 escalated',         cost: 2400, time: '6h (overnight)' },
      { in: 'Translate FAQ to 5 langs',                 out: 'EN→RU/ES/DE/FR, brand-tuned',             cost: 30,   time: '4m' },
    ],
    legal: [
      { in: 'Review NDA-220.pdf, 40 pages',             out: '3 risky clauses, 7 markup suggestions',   cost: 64, time: '4m' },
      { in: 'GDPR audit our subprocessor list',         out: '2 missing DPAs, 1 non-EU host flagged',   cost: 256, time: '12m' },
      { in: 'Compare MSA v3 vs v4',                     out: 'Diff with 11 material changes summarized',cost: 64,  time: '5m' },
    ],
    research: [
      { in: 'Q3 revenue by segment, last 6 quarters',   out: 'Chart + commentary + cohort breakdown',   cost: 22, time: '15s' },
      { in: 'Competitor analysis: Acme vs us',          out: 'Pricing, features, GTM diff in Notion',   cost: 88,  time: '3m' },
      { in: 'Daily competitor digest',                  out: '5 signals, ranked by relevance',          cost: 16,  time: '2m' },
    ],
    design: [
      { in: 'Generate 6 banner variants for launch',    out: '6 mocks in Figma, brand-tight',           cost: 288, time: '14m' },
      { in: 'Adapt hero for 4 locales',                 out: 'EN/DE/FR/JP layouts, type-safe',          cost: 192, time: '8m' },
      { in: 'Design new email template',                out: 'Light + dark, MJML + preview',            cost: 48,  time: '5m' },
    ],
  };

  // Capability bullets per tone
  const CAPS = {
    sales:    ['Multi-step outbound sequences', 'Persona research from URL', 'Meeting booking via Calendly', 'CRM hygiene + dedup', 'Reply classification & routing'],
    eng:      ['PR review with inline comments', 'Static + semantic analysis', 'Auto-fix simple violations', 'Test generation', 'Security: secrets, SAST, CVEs'],
    finance:  ['Bank ↔ ledger reconciliation', 'Receipt OCR + categorization', 'VAT / GST filings', 'Anomaly detection', 'Month-end close packets'],
    hr:       ['LinkedIn Boolean search', 'Resume scoring vs JD', 'Outreach drafting', 'Calendar coordination', 'Pipeline reporting'],
    support:  ['Ticket triage + routing', 'Multilingual replies', 'Macro suggestion', 'Refund / shipping flows', 'Escalation w/ context bundle'],
    legal:    ['Contract clause extraction', 'Risk scoring vs playbook', 'Diff between versions', 'NDA / MSA / DPA review', 'GDPR + AI Act audits'],
    research: ['SQL → chart + narrative', 'Multi-source synthesis', 'Daily monitoring digests', 'Cohort + funnel analysis', 'Citation-grade outputs'],
    design:   ['Brand-tuned variants', 'Locale adaptation', 'Layout exploration', 'Asset packs (Figma)', 'Email + ad creatives'],
  };

  const NotFound = () => (
    <div style={{ padding: '120px 40px', textAlign: 'center' }}>
      <Pill dot color={palette.red} style={{ marginBottom: 14 }}>404</Pill>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 500, color: palette.text, margin: 0 }}>Agent unknown.</h1>
      <p style={{ fontSize: 16, color: palette.textDim, marginTop: 10 }}>That recruit isn't in the roster. <a href="#/roster" style={{ color: palette.accent, textDecoration: 'none' }}>Browse all →</a></p>
    </div>
  );

  // Header — hero of the agent
  const AgentHeader = ({ agent, isSubscribed = false, isAuthenticated = false, subscription = null }) => {
    const rates = useRates();
    // useForm gives us processing + onError so the buyer sees the
    // button transition to "Hiring…" + a visible error if the server
    // rejects (e.g. session expired, validation). The previous
    // router.post(...) call had no visible feedback at all — clicks
    // looked like nothing happened.
    const hire = useForm({});
    const cancel = useForm({});
    const [hireError, setHireError] = useState(null);

    const onHire = () => {
      setHireError(null);
      hire.post(`/agent/${agent.id}/subscribe`, {
        preserveScroll: true,
        onError: (errors) => {
          const msg = Object.values(errors || {})[0] || 'Could not hire — please try again.';
          setHireError(String(msg));
        },
      });
    };

    const onCancel = () => {
      if (!confirm(`Cancel ${agent.name} subscription? You'll lose access to its tools.`)) return;
      cancel.delete(`/agent/${agent.id}/subscribe`, { preserveScroll: true });
    };

    return (
    <div style={{ padding: '40px 40px 28px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        <Link href="/" style={{ color: palette.textMute, textDecoration: 'none' }}>hirespawn</Link>
        <span>/</span>
        <Link href="/roster" style={{ color: palette.textMute, textDecoration: 'none' }}>roster</Link>
        <span>/</span>
        <span style={{ color: palette.text }}>{agent.role.toLowerCase()}</span>
        <span>/</span>
        <span style={{ color: palette.accent }}>{agent.id}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
            <div style={{ width: 84, height: 84, borderRadius: 18, background: 'linear-gradient(135deg, rgba(180,242,91,0.28), rgba(180,242,91,0.04))', border: `1px solid ${palette.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent, fontSize: 40, fontFamily: 'Geist Mono, monospace' }}>{CATEGORIES.find(c => c.key === agent.tone)?.icon || '◇'}</div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>{agent.rank}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.amber }}>★ {agent.rating}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>· {agent.deployed.toLocaleString()} deployed</span>
              </div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, lineHeight: 1.05, fontWeight: 600, letterSpacing: -1.8, margin: 0, color: palette.text }}>{agent.name}</h1>
              <div style={{ fontSize: 15, color: palette.textDim, marginTop: 10 }}>{agent.role} · by <span style={{ color: palette.text }}>{agent.vendor}</span></div>
            </div>
          </div>

          <p style={{ fontSize: 17, color: palette.textDim, lineHeight: 1.55, maxWidth: 620, margin: 0 }}>
            {agent.spec}. Deploys in under 90 seconds with a scoped key. Burns Power per {agent.perUnit}, audited per event. SLA-backed — if it fails, your Power is credited.
          </p>

          {/* Lang chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 22 }}>
            {agent.langs.map(l => (
              <span key={l} style={{ padding: '4px 9px', fontSize: 11, color: palette.textDim, fontFamily: 'Geist Mono, monospace', border: `1px solid ${palette.border}`, borderRadius: 4, letterSpacing: 0.5 }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Deploy card */}
        <Glass style={{ padding: 28, position: 'sticky', top: 24 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Power per task</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 64, fontWeight: 500, color: palette.accent, letterSpacing: -2, lineHeight: 1 }}>{agent.power}</span>
            <span style={{ fontSize: 24, color: palette.textMute }}>⚡</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, marginLeft: 4 }}>per {agent.perUnit}</span>
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 6 }}>
            ≈ €{(agent.power * rates.eurPerPower).toFixed(3)} per task
          </div>

          <div style={{ marginTop: 22, padding: 14, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '4px 0' }}>
              <span>100 tasks</span><span style={{ color: palette.text }}>{(agent.power * 100).toLocaleString()}⚡ · €{(agent.power * 100 * rates.eurPerPower).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '4px 0' }}>
              <span>1,000 tasks</span><span style={{ color: palette.text }}>{(agent.power * 1000).toLocaleString()}⚡ · €{(agent.power * 1000 * rates.eurPerPower).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, padding: '4px 0', borderTop: `1px dashed ${palette.border}`, marginTop: 4, paddingTop: 8 }}>
              <span>10,000 tasks</span><span>{(agent.power * 10000).toLocaleString()}⚡ · €{(agent.power * 10000 * rates.eurPerPower).toFixed(0)}</span>
            </div>
          </div>

          {isAuthenticated && isSubscribed ? (
            <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                ✓ Hired · since {subscription?.startedAt || '—'}
              </div>
              {subscription?.id && (
                <Link href={`/console/subscriptions/${subscription.id}/configure`} style={{ display: 'block', padding: '12px', borderRadius: 10, background: palette.accent, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none' }}>
                  Configure →
                </Link>
              )}
              <Link href="/console" style={{ display: 'block', padding: '10px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none' }}>
                Open Console
              </Link>
              <button
                type="button"
                disabled={cancel.processing}
                onClick={onCancel}
                style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.red, fontSize: 12, fontFamily: 'inherit', cursor: cancel.processing ? 'wait' : 'pointer', opacity: cancel.processing ? 0.6 : 1 }}
              >
                {cancel.processing ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            </div>
          ) : isAuthenticated ? (
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                disabled={hire.processing}
                onClick={onHire}
                style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: hire.processing ? 'wait' : 'pointer', opacity: hire.processing ? 0.65 : 1 }}
              >
                {hire.processing ? `Hiring ${agent.name}…` : `Hire ${agent.name} →`}
              </button>
              {hireError && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,99,99,0.08)', border: `1px solid ${palette.red}`, color: palette.red, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
                  ✗ {hireError}
                </div>
              )}
            </div>
          ) : (
            <a href={`/login?intended=${encodeURIComponent('/agent/' + agent.id)}`} style={{ display: 'block', textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '14px', borderRadius: 10, marginTop: 18, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Sign in to hire →
              </button>
            </a>
          )}
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, textAlign: 'center', marginTop: 10 }}>Hires instantly · cancel anytime</div>
        </Glass>
      </div>
    </div>
    );
  };

  // ---- Setup requirements ----
  // Shows the buyer what they need to set up to actually use the agent:
  // 1. OAuth providers required by oauth_proxy skills
  // 2. Configuration variables the vendor declared (settingDefs)
  // Renders nothing when the agent has zero requirements.
  const SetupRequirements = ({ oauthChecklist = [], settingDefs = [], subscription = null, isAuthenticated = false }) => {
    if (oauthChecklist.length === 0 && settingDefs.length === 0) return null;
    const needsOauth = oauthChecklist.filter(o => !o.connected || o.expired);
    const allReady = needsOauth.length === 0;

    return (
      <div style={{ padding: '0 40px 28px' }}>
        <Glass style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Setup checklist</div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>
                {subscription ? 'Configure your deployment' : 'What you need to run this agent'}
              </div>
            </div>
            {isAuthenticated && (
              <span style={{ padding: '4px 10px', borderRadius: 4, background: allReady ? palette.accentDim : 'rgba(255,184,77,0.12)', color: allReady ? palette.accent : palette.amber, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                {allReady ? '✓ ready' : `${needsOauth.length} pending`}
              </span>
            )}
          </div>

          {oauthChecklist.length > 0 && (
            <div style={{ marginBottom: settingDefs.length > 0 ? 22 : 0 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Integrations</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {oauthChecklist.map(o => {
                  const ok = o.connected && !o.expired;
                  return (
                    <div key={o.provider} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14, alignItems: 'center', padding: '12px 14px', background: 'var(--p-inset-soft)', border: `1px solid ${ok ? palette.accentDim : palette.border}`, borderRadius: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: ok ? palette.accentDim : 'var(--p-chip)', color: ok ? palette.accent : palette.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                        {o.provider.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: palette.text, fontWeight: 500, textTransform: 'capitalize' }}>{o.provider}</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: ok ? palette.accent : palette.textMute, marginTop: 2 }}>
                          {ok ? `✓ connected${o.accountLabel ? ' · ' + o.accountLabel : ''}` : o.expired ? 'expired · reconnect' : 'not connected'}
                        </div>
                      </div>
                      {isAuthenticated && (
                        <a href={`/oauth/${o.provider}/connect?return=${encodeURIComponent(window.location.pathname)}`} style={{ padding: '7px 12px', borderRadius: 6, background: ok ? 'transparent' : palette.accent, color: ok ? palette.textDim : palette.onAccent, border: ok ? `1px solid ${palette.border}` : 0, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>
                          {ok ? 'Reconnect' : 'Connect →'}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {settingDefs.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Variables you'll configure</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {settingDefs.map(d => (
                  <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 12px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{d.label}</span>
                      {d.isRequired && <span style={{ marginLeft: 8, fontSize: 10, color: palette.red, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>required</span>}
                      {d.description && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 2 }}>{d.description}</div>}
                    </div>
                    <code style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>{d.type}</code>
                  </div>
                ))}
              </div>
              {subscription && (
                <Link href={`/console/subscriptions/${subscription.id}/configure`} style={{ display: 'inline-block', marginTop: 12, padding: '8px 14px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>
                  Configure now →
                </Link>
              )}
            </div>
          )}
        </Glass>
      </div>
    );
  };

  // Run-task panel — only shown to subscribed buyers. Posts to
  // /agent/{slug}/run which debits power and logs a UsageEvent.
  // Chat-style run panel — scrollable conversation history above an
  // input field. After each submit we reload only the `recentRuns` prop
  // so the new turn appears in the history without a full page swap.
  const RunTaskPanel = ({ agent, recentRuns = [] }) => {
    const rates = useRates();
    const { data, setData, post, processing, errors, reset } = useForm({ input: '' });
    const historyRef = useRef(null);

    // Scroll the conversation to the latest turn whenever the runs list
    // grows (after a submit's reload, or on first mount).
    useEffect(() => {
      if (historyRef.current) {
        historyRef.current.scrollTop = historyRef.current.scrollHeight;
      }
    }, [recentRuns.length]);

    const submit = (e) => {
      e.preventDefault();
      post(route('agent.run', agent.id), {
        preserveScroll: true,
        // Refresh only the recentRuns prop on success so the new turn
        // shows up instantly without re-rendering the whole page.
        onSuccess: () => {
          reset('input');
          router.reload({ only: ['recentRuns', 'powerBalance'] });
        },
      });
    };

    const onEnterKey = (e) => {
      // Cmd/Ctrl + Enter to submit — typical chat shortcut.
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && data.input.trim() && !processing) {
        e.preventDefault();
        submit(e);
      }
    };

    return (
      <div style={{ padding: '0 40px 36px' }}>
        <Glass style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>● Chat with {agent.name}</div>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, color: palette.text, margin: '6px 0 0' }}>Send work · see the result inline</h3>
              <p style={{ fontSize: 13, color: palette.textDim, margin: '4px 0 0' }}>
                Each run burns <span style={{ color: palette.accent }}>{agent.power}⚡</span> · ≈ €{(agent.power * rates.eurPerPower).toFixed(4)}
              </p>
            </div>
            <Link href="/console" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>full log →</Link>
          </div>

          {/* Conversation history */}
          <div
            ref={historyRef}
            style={{ maxHeight: 480, overflowY: 'auto', padding: '20px 24px', background: 'var(--p-inset-soft)' }}
          >
            {recentRuns.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: palette.textDim }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>▸</div>
                <div style={{ fontSize: 13, color: palette.text, marginBottom: 4 }}>No runs yet</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Type a task below — answers land here.</div>
              </div>
            ) : (
              recentRuns.map(run => (
                <div key={run.id} style={{ marginBottom: 22 }}>
                  {/* User turn */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--p-chip)', border: `1px solid ${palette.border}`, color: palette.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, flexShrink: 0 }}>YOU</div>
                    <div style={{ flex: 1, padding: '10px 14px', background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, fontSize: 14, color: palette.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {run.input || <span style={{ color: palette.textMute }}>(no input)</span>}
                    </div>
                  </div>
                  {/* Agent turn */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: run.ok ? palette.accentDim : 'rgba(255,99,99,0.12)', color: run.ok ? palette.accent : palette.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>AI</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ padding: '10px 14px', background: run.ok ? 'rgba(180,242,91,0.04)' : 'rgba(255,99,99,0.05)', borderRadius: 10, border: `1px solid ${run.ok ? palette.accentDim : 'rgba(255,99,99,0.3)'}`, fontSize: 14, color: palette.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {run.error
                          ? <span style={{ color: palette.red, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>✗ {run.error}</span>
                          : (run.output || <span style={{ color: palette.textMute }}>(empty response)</span>)
                        }
                      </div>
                      <div style={{ marginTop: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{run.at}</span>
                        {run.cost > 0 && <span><span style={{ color: palette.accent }}>{run.cost}⚡</span> burned</span>}
                        {(run.inputTokens > 0 || run.outputTokens > 0) && <span>{run.inputTokens}+{run.outputTokens} tok</span>}
                        {run.latencyMs > 0 && <span>{run.latencyMs}ms</span>}
                        {run.toolCalls?.length > 0 && (
                          <span style={{ color: palette.cyan }}>{run.toolCalls.length} tool{run.toolCalls.length !== 1 ? 's' : ''} called</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={submit} style={{ padding: '16px 24px 20px', borderTop: `1px solid ${palette.border}` }}>
            <textarea
              value={data.input}
              onChange={(e) => setData('input', e.target.value)}
              onKeyDown={onEnterKey}
              placeholder={`Ask ${agent.name} to do something. E.g. "${agent.spec || 'process a task'}"`}
              rows={3}
              maxLength={8000}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${errors.input ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
            />
            {errors.input && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{errors.input}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
                {data.input.length} / 8000 · <span style={{ opacity: 0.7 }}>⌘+Enter to send</span>
              </div>
              <button type="submit" disabled={processing || !data.input.trim()} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing || !data.input.trim() ? 'not-allowed' : 'pointer', opacity: processing || !data.input.trim() ? 0.5 : 1 }}>
                {processing ? 'Running…' : `Send · ${agent.power}⚡`}
              </button>
            </div>
          </form>
        </Glass>
      </div>
    );
  };

  // Spec strip — quick stats row under header
  const SpecStrip = ({ agent }) => (
    <div style={{ padding: '0 40px 36px' }}>
      <Glass style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', overflow: 'hidden' }}>
        {[
          { l: 'Throughput',   v: agent.spec },
          { l: 'Per unit',     v: `${agent.power}⚡ / ${agent.perUnit}` },
          { l: 'Languages',    v: agent.langs.join(' · ') },
          { l: 'Integrations', v: `${agent.int.length} connected` },
          { l: 'Data region',  v: 'EU · Frankfurt' },
        ].map((c, i, arr) => (
          <div key={c.l} style={{ padding: '20px 22px', borderRight: i < arr.length - 1 ? `1px solid ${palette.border}` : 0 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{c.l}</div>
            <div style={{ fontSize: 14, color: palette.text, marginTop: 6, fontFamily: 'Geist, sans-serif' }}>{c.v}</div>
          </div>
        ))}
      </Glass>
    </div>
  );

  // Capabilities
  const Capabilities = ({ agent }) => {
    const caps = CAPS[agent.tone] || [];
    return (
      <div style={{ padding: '0 40px 60px' }}>
        <SectionLabel kicker="Capabilities" title={<>What it does. <span style={{ color: palette.textDim }}>Out of the box.</span></>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {caps.map((c, i) => (
            <Glass key={c} style={{ padding: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 'none', width: 32, height: 32, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontSize: 15, color: palette.text, lineHeight: 1.5 }}>{c}</div>
            </Glass>
          ))}
        </div>
      </div>
    );
  };

  // Sample tasks — terminal-style log
  const SampleTasks = ({ agent }) => {
    const tasks = SAMPLE_TASKS[agent.tone] || [];
    return (
      <div style={{ padding: '0 40px 60px' }}>
        <SectionLabel kicker="Sample missions" title={<>Real tasks. <span style={{ color: palette.textDim }}>Real Power burned.</span></>} />
        <Glass style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${palette.borderStrong}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>recent missions · {agent.id}</span>
            <span>last 30 days</span>
          </div>
          {tasks.map((t, i) => (
            <div key={i} style={{ padding: '20px 22px', borderBottom: i < tasks.length - 1 ? `1px solid ${palette.border}` : 0, display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Brief</div>
                <div style={{ fontSize: 14, color: palette.text, lineHeight: 1.45 }}>{t.in}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>→ Outcome</div>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.45 }}>{t.out}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.accent }}>{t.cost.toLocaleString()}<span style={{ fontSize: 12, color: palette.textMute, marginLeft: 2 }}>⚡</span></div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute }}>≈ €{(t.cost * 0.009).toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{t.time}</div>
            </div>
          ))}
        </Glass>
      </div>
    );
  };

  // Integrations
  const Integrations = ({ agent }) => (
    <div style={{ padding: '0 40px 60px' }}>
      <SectionLabel kicker="Integrations" title={<>Speaks <span style={{ color: palette.cyan }}>{agent.int.length} tools</span> natively.</>} sub="Connect once at the gateway. The agent inherits your auth and respects per-tool scopes." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {agent.int.map(name => (
          <Glass key={name} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(125,211,255,0.12)', border: `1px solid rgba(125,211,255,0.3)`, color: palette.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 600 }}>{name.slice(0, 1).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 14, color: palette.text, fontWeight: 500, textTransform: 'capitalize' }}>{name}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>OAuth · scoped</div>
            </div>
          </Glass>
        ))}
      </div>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 0.5 }}>
        Need another tool? <a href="mailto:support@hirespawn.com?subject=Integration%20request" style={{ color: palette.cyan, textDecoration: 'none' }}>Request integration →</a>
      </div>
    </div>
  );

  // SLA + compliance
  const SlaPanel = ({ agent }) => (
    <div style={{ padding: '0 40px 60px' }}>
      <SectionLabel kicker="SLA · Compliance · Trust" title={<>Backed by guarantees. <span style={{ color: palette.textDim }}>Not vibes.</span></>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Glass style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.amber, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Service-level</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { l: 'Uptime',         v: '99.9%',           note: 'or auto Power credit' },
              { l: 'Median latency', v: agent.spec.includes('< ') ? agent.spec.match(/< [\w]+/)[0] : '< 5s', note: 'p50, last 30d' },
              { l: 'Failure rate',   v: '< 0.4%',          note: 'agent self-retries 3×' },
              { l: 'Refund window',  v: '14 days',         note: 'dispute via console' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: `1px dashed ${palette.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: palette.text }}>{r.l}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>{r.note}</div>
                </div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.accent }}>{r.v}</div>
              </div>
            ))}
          </div>
        </Glass>

        <Glass style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.cyan, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Compliance & Trust</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {['SOC 2 Type II','GDPR','ISO 27001','EU AI Act','DPA on file'].map(b => (
              <span key={b} style={{ padding: '5px 10px', borderRadius: 999, border: `1px solid ${palette.border}`, background: 'rgba(125,211,255,0.05)', fontSize: 11, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.4 }}>{b}</span>
            ))}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Scoped API keys per subscription — revoke any time',
              'Data residency: EU (Frankfurt). US region available on request.',
              'No training on your data. No cross-tenant leakage.',
              'Full audit log — every Power burn, every tool call.',
              'Subprocessor list updated on every release.',
            ].map((x, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: palette.textDim, lineHeight: 1.5 }}>
                <span style={{ color: palette.cyan }}>›</span>{x}
              </li>
            ))}
          </ul>
        </Glass>
      </div>
    </div>
  );

  // Deploy flow — 3 steps
  const DeployFlow = ({ agent }) => (
    <div style={{ padding: '0 40px 60px' }}>
      <SectionLabel kicker="Deploy" title={<>Three steps. <span style={{ color: palette.textDim }}>Under 90 seconds.</span></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { n: '01', t: 'Buy Power',     d: 'Pick Starter / Pro / Scale. Power rolls over.', icon: '⚡' },
          { n: '02', t: 'Provision key', d: `Scoped API key for ${agent.name}. Tools auto-connect via OAuth.`, icon: '◇' },
          { n: '03', t: 'Send tasks',    d: 'POST to gateway, or wire your existing tool. Power burns per event.', icon: '▸' },
        ].map(s => (
          <Glass key={s.n} style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, right: 18, fontSize: 56, color: palette.accentDim, fontFamily: 'Geist, sans-serif', fontWeight: 600, letterSpacing: -2 }}>{s.n}</div>
            <div style={{ fontSize: 24, color: palette.accent, marginBottom: 14 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 500, color: palette.text, marginBottom: 8 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.5 }}>{s.d}</div>
          </Glass>
        ))}
      </div>

      {/* Code snippet */}
      <Glass style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>POST · gateway.hirespawn.io / agents / {agent.id} / run</span>
          <span style={{ color: palette.accent }}>● 200 OK · {agent.power}⚡ burned</span>
        </div>
        <pre style={{ margin: 0, padding: 22, fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text, lineHeight: 1.65, background: 'var(--p-inset-strong)' }}>
{`curl https://gateway.hirespawn.io/agents/${agent.id}/run \\
  -H "Authorization: Bearer hsp_sk_live_..." \\
  -d '{
    "input": "Your brief here",
    "callback_url": "https://your-app.io/hooks/done"
  }'
{
  "id":         "run_8f2c1...",
  "status":     "completed",
  "power_burn": ${agent.power},
  "output":     "...",
  "balance":    243891
}`}
        </pre>
      </Glass>
    </div>
  );

  // Related agents from same vendor / category
  const RelatedAgents = ({ related = [] }) => {
    const same = related.slice(0, 4);
    if (same.length === 0) return null;
    return (
      <div style={{ padding: '0 40px 80px' }}>
        <SectionLabel kicker="Reinforcements" title={<>You might also <span style={{ color: palette.accent }}>deploy</span>.</>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {same.map(a => (
            <Link key={a.id} href={`/agent/${a.id}`} style={{ textDecoration: 'none' }}>
              <Glass style={{ padding: 18, cursor: 'pointer', transition: 'border-color 0.25s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{CATEGORIES.find(c => c.key === a.tone)?.icon || '◇'}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: palette.textMute }}>{a.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: `1px solid ${palette.border}` }}>
                  <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.accent }}>{a.power}<span style={{ fontSize: 11, color: palette.textMute }}>⚡</span></span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute }}>★ {a.rating}</span>
                </div>
              </Glass>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Page
  const Page = () => {
    const {
      agent = null, relatedAgents = [],
      subscription = null, isSubscribed = false, isAuthenticated = false,
      oauthChecklist = [], settingDefs = [], recentRuns = [],
      auth, workspaceName = 'Workspace', powerBalance = 0,
    } = usePage().props;
    const user = auth?.user || null;
    const isAdmin = !!user?.is_admin;

    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto' }}>
          {isAuthenticated
            ? <BuyerTopBar user={user} isAdmin={isAdmin} workspaceName={workspaceName} powerBalance={powerBalance} agentName={agent?.name} />
            : <Nav />}
          {!agent ? <NotFound /> : (
            <>
              <AgentHeader
                agent={agent}
                isSubscribed={isSubscribed}
                isAuthenticated={isAuthenticated}
                subscription={subscription}
              />
              {isAuthenticated && (oauthChecklist.length > 0 || settingDefs.length > 0) && (
                <SetupRequirements
                  oauthChecklist={oauthChecklist}
                  settingDefs={settingDefs}
                  subscription={subscription}
                  isAuthenticated={isAuthenticated}
                />
              )}
              {isSubscribed && <RunTaskPanel agent={agent} recentRuns={recentRuns} />}
              <SpecStrip agent={agent} />
              <Reveal><Capabilities agent={agent} /></Reveal>
              <Reveal><SampleTasks agent={agent} /></Reveal>
              <Reveal><Integrations agent={agent} /></Reveal>
              <Reveal><SlaPanel agent={agent} /></Reveal>
              {!isAuthenticated && <Reveal><DeployFlow agent={agent} /></Reveal>}
              <Reveal><RelatedAgents related={relatedAgents} /></Reveal>
            </>
          )}
          {!isAuthenticated && <Footer />}
        </div>
      </div>
    );
  };

  return { Page };
})();

export default AgentDetail.Page;
