import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Status page
const Status = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  // 90-day uptime bars per service
  const services = [
    { n: 'Gateway · v2 API',         u: 99.97, p95: '142ms' },
    { n: 'Agent runtime · EU West',  u: 99.99, p95: '47ms boot' },
    { n: 'Agent runtime · US East',  u: 99.94, p95: '52ms boot' },
    { n: 'Power ledger',             u: 100.0, p95: '14ms' },
    { n: 'Vendor payouts · Stripe',  u: 99.92, p95: 'daily 09:00' },
    { n: 'Webhook delivery',         u: 99.88, p95: 'p95 < 200ms' },
    { n: 'Marketplace · public site',u: 99.99, p95: '78ms TTFB' },
    { n: 'Console + Dashboard',      u: 99.96, p95: '110ms TTFB' },
    { n: 'Auth · SSO + SCIM',        u: 100.0, p95: '38ms' },
  ];

  // pseudo-random but deterministic incident map per service
  const seed = (s, i) => (s.charCodeAt(0) + i * 7) % 100;
  const dayState = (svc, day) => {
    const s = seed(svc.n, day);
    if (s < 2)  return 'major';
    if (s < 5)  return 'minor';
    if (s < 9)  return 'degraded';
    return 'ok';
  };
  const dayColor = (st) => ({ ok: palette.accent, degraded: palette.cyan, minor: palette.amber, major: palette.red }[st]);

  const incidents = [
    { d: 'May 09', t: '14:22 → 14:31 UTC', sv: 'minor',     ti: 'Webhook delivery delays · EU West',
      r: 'Postmark sub-processor returned 503 for 9 minutes. Outbound webhooks queued and replayed automatically with idempotency_key honored. No data loss.' },
    { d: 'May 03', t: '02:11 → 02:14 UTC', sv: 'degraded',  ti: 'Gateway p95 latency briefly above 800ms',
      r: 'Cold-boot fleet drained during a routine kernel patch. Latency restored within 3 minutes. Affected ~2% of runs.' },
    { d: 'Apr 22', t: '17:48 → 18:43 UTC', sv: 'major',     ti: 'US East runtime · ~12% run failures',
      r: 'us-east-1 had EBS throttling on the Firecracker host fleet. We failed over to us-east-2 within 55 minutes. Affected runs auto-refunded as Power. Post-mortem published.' },
    { d: 'Apr 14', t: '08:02 → 08:09 UTC', sv: 'minor',     ti: 'Marketplace search returning stale results',
      r: 'Search index lagged the source-of-truth by 7 min during a deploy. No agent runs affected; only roster browsing was stale.' },
    { d: 'Mar 28', t: '23:11 → 23:14 UTC', sv: 'minor',     ti: 'Webhook signature verification skew',
      r: 'A clock-drift on one signer caused signatures to fail verification for ~3 min. Clients retried automatically.' },
  ];

  const sevLabel = { ok: 'Operational', degraded: 'Degraded', minor: 'Partial outage', major: 'Major outage' };

  // Aggregate header status
  const worst = services.reduce((acc, s) => Math.min(acc, s.u), 100);
  const allOk = worst >= 99.9;

  const Page = () => (
    <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <Mesh />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Nav />

        <div style={{ padding: '64px 40px 32px', maxWidth: 1180, margin: '0 auto' }}>
          <Pill dot={allOk ? palette.accent : palette.amber} style={{ marginBottom: 16 }}>Live · refreshed every 30s</Pill>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 72, lineHeight: 0.98, fontWeight: 600, letterSpacing: -2.5, margin: 0 }}>{allOk ? 'All systems nominal.' : 'Degraded.'}</h1>
              <p style={{ fontSize: 15, color: palette.textDim, marginTop: 16, lineHeight: 1.55 }}>Real-time health across 9 services. 90 days of history below. Subscribe via RSS, webhook, email, or SMS — your choice.</p>
            </div>
            <Glass style={{ padding: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { l: 'Uptime · 30d', v: '99.97%' },
                  { l: 'Uptime · 90d', v: '99.94%' },
                  { l: 'p95 latency',  v: '142ms' },
                  { l: 'Open incidents', v: '0' },
                ].map(s => (
                  <div key={s.l} style={{ padding: 12, background: 'var(--p-inset)', borderRadius: 8, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>{s.l}</div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, marginTop: 4, color: palette.text }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {['RSS', 'Email', 'Slack', 'Webhook', 'SMS'].map(c => (
                  <button key={c} style={{ flex: 1, padding: '8px 0', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textDim, fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>{c}</button>
                ))}
              </div>
            </Glass>
          </div>
        </div>

        {/* Services + uptime bars */}
        <div style={{ padding: '24px 40px 40px', maxWidth: 1180, margin: '0 auto' }}>
          <Glass style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>Services · 90 days</h2>
              <div style={{ display: 'flex', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
                {[['Operational', palette.accent], ['Degraded', palette.cyan], ['Minor', palette.amber], ['Major', palette.red]].map(l => (
                  <span key={l[0]} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: l[1], borderRadius: 2 }}/>{l[0]}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {services.map(svc => (
                <div key={svc.n}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: svc.u >= 99.9 ? palette.accent : palette.amber }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{svc.n}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>
                      <span>{svc.p95}</span>
                      <span style={{ color: svc.u >= 99.9 ? palette.accent : palette.amber }}>{svc.u.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 90 }).map((_, d) => {
                      const st = dayState(svc, d);
                      return <div key={d} style={{ flex: 1, height: 22, borderRadius: 1.5, background: dayColor(st), opacity: st === 'ok' ? 0.85 : 1 }} title={`Day -${89 - d}: ${sevLabel[st]}`} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Glass>
        </div>

        {/* Incident history */}
        <div style={{ padding: '24px 40px 100px', maxWidth: 1180, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 600, letterSpacing: -0.7, margin: '0 0 18px 0' }}>Incident history</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {incidents.map((inc, i) => (
              <Glass key={i} style={{ padding: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 24 }}>
                  <div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text, fontWeight: 600 }}>{inc.d}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 4 }}>{inc.t}</div>
                    <span style={{ display: 'inline-block', marginTop: 8, fontFamily: 'Geist Mono, monospace', fontSize: 9, color: dayColor(inc.sv), padding: '3px 8px', background: 'var(--p-inset-soft)', border: `1px solid ${dayColor(inc.sv)}`, borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{sevLabel[inc.sv]}</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, letterSpacing: -0.4, margin: '0 0 8px 0' }}>{inc.ti}</h3>
                    <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.55, margin: 0 }}>{inc.r}</p>
                    <a href="#" style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: palette.accent, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Full post-mortem →</a>
                  </div>
                </div>
              </Glass>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );

  return { Page };
})();

export default Status.Page;
