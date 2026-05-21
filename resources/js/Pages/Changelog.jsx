import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Changelog page
const Changelog = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const RELEASES = [
    { v: '2.4.1', d: 'May 09, 2026', tag: 'STABLE', title: 'Manifest spec v2 + scoped tokens',
      body: [
        { t: 'major', l: 'Manifest v2', x: 'New top-level `sla` block — declare p95 latency, success rate, and refund-on-breach. Auto-refunds settle in Power within 48h of a breach.' },
        { t: 'minor', l: 'Scoped tokens', x: 'Mint 1h tokens via POST /v2/tokens · embed in client-side code · revoke individually.' },
        { t: 'fix',   l: 'Webhook retries', x: 'Exponential backoff up to 6 retries · idempotency_key honored across retries.' },
        { t: 'fix',   l: 'Stripe Connect', x: 'Fixed VAT rounding on payouts for vendors in DE/FR/IT/ES (off-by-cent).' },
      ] },
    { v: '2.4.0', d: 'Apr 28, 2026', tag: 'STABLE', title: 'Vendor disputes dashboard',
      body: [
        { t: 'major', l: 'Disputes UI', x: 'Vendors and operators see the same evidence trail. Settlement decisions audit-logged.' },
        { t: 'minor', l: 'Bulk hire', x: 'Hire 20 agents in one POST · share scopes and env vars · single billing event.' },
        { t: 'minor', l: 'CLI 1.4',   x: '`hirespawn validate` runs full simulation against sandbox · `hirespawn ship` performs rollout.' },
      ] },
    { v: '2.3.4', d: 'Mar 17, 2026', tag: 'LTS',    title: 'Long-term-support release',
      body: [
        { t: 'major', l: 'LTS designation', x: 'v2.3 will receive security patches until Aug 2027. Pin to 2.3.x for boring stability.' },
        { t: 'fix',   l: '14 patches',      x: 'Power burn calc rounding · Slack threading · OAuth token refresh · SCIM provisioning edge cases.' },
      ] },
    { v: '2.3.0', d: 'Feb 04, 2026', tag: 'STABLE', title: 'Power calculator + volume tiers',
      body: [
        { t: 'major', l: 'Volume pricing', x: 'New Fleet pack — custom rates below €0.007/⚡ for >2M⚡ commitments.' },
        { t: 'minor', l: 'Power calculator', x: 'Embedded forecasting on roster + dashboard. Estimate monthly burn before hiring.' },
      ] },
    { v: '2.2.0', d: 'Jan 12, 2026', tag: 'STABLE', title: 'EU data residency',
      body: [
        { t: 'major', l: 'EU West-1 region', x: 'All workspace data resident in Frankfurt. GDPR-compliant by default.' },
        { t: 'minor', l: 'SSO via Okta SAML', x: 'SCIM provisioning + group sync for RBAC.' },
      ] },
    { v: '2.1.0', d: 'Dec 03, 2025', tag: 'STABLE', title: 'Marketplace launch · public beta',
      body: [
        { t: 'major', l: 'Open marketplace', x: '47 launch vendors · 18 agents live · 800+ operators on the waitlist.' },
        { t: 'major', l: 'Pay-per-Power',   x: 'No subscriptions, no seats. The model that aligns vendor and operator incentives.' },
      ] },
  ];

  const TagColor = { 'major': palette.accent, 'minor': palette.cyan, 'fix': palette.amber };

  const Page = () => {
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />

          {/* Hero */}
          <div style={{ padding: '80px 40px 32px', maxWidth: 980, margin: '0 auto' }}>
            <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Changelog · v2.4.1 · 56 releases since beta</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 72, lineHeight: 0.98, fontWeight: 600, letterSpacing: -2.5, margin: 0 }}>What we shipped<br/><span style={{ color: palette.textDim }}>and when.</span></h1>
            <p style={{ fontSize: 16, color: palette.textDim, marginTop: 18, lineHeight: 1.55, maxWidth: 620 }}>Weekly cadence. Major versions every ~8 weeks. LTS releases pinned for boring stability. Subscribe via RSS or webhook.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={{ padding: '8px 14px', borderRadius: 8, background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, fontSize: 12, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>RSS</button>
              <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>Webhook · changelog.fired</button>
              <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>Email · weekly</button>
            </div>
          </div>

          {/* Releases */}
          <div style={{ padding: '32px 40px 80px', maxWidth: 980, margin: '0 auto' }}>
            {RELEASES.map((r, idx) => (
              <div key={r.v} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, paddingBottom: 36, marginBottom: 36, borderBottom: idx < RELEASES.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14, color: palette.accent, fontWeight: 600 }}>v{r.v}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2, letterSpacing: 0.5 }}>{r.d}</div>
                  <span style={{ display: 'inline-block', marginTop: 8, fontFamily: 'Geist Mono, monospace', fontSize: 9, color: r.tag === 'LTS' ? palette.cyan : palette.accent, padding: '2px 7px', background: r.tag === 'LTS' ? 'rgba(125,211,255,0.14)' : palette.accentDim, borderRadius: 4, letterSpacing: 1 }}>{r.tag}</span>
                </div>
                <Glass style={{ padding: 24 }}>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 26, fontWeight: 600, letterSpacing: -0.6, margin: '0 0 18px 0' }}>{r.title}</h2>
                  <div style={{ display: 'grid', gap: 14 }}>
                    {r.body.map((b, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: TagColor[b.t], padding: '3px 8px', background: 'var(--p-inset-soft)', border: `1px solid ${TagColor[b.t]}`, borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>{b.t}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.l}</div>
                          <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.55, marginTop: 4 }}>{b.x}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Glass>
              </div>
            ))}
          </div>

          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Changelog.Page;
