import '@/setup';
import { Link } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Run detail page — one specific agent execution: live log, output, audit, costs, dispute
const RunDetail = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const TopBar = () => {
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
    return (
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--p-bg0)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${palette.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <span style={{ color: palette.textMute }}>/</span>
          <Link href="/console" style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Console</Link>
          <span style={{ color: palette.textMute }}>/</span>
          <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Run · 3cf2</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span>UTC {time.toISOString().slice(11,19)}</span>
          <ThemeToggle size={32} />
        </div>
      </div>
    );
  };

  const STEPS = [
    { t: '0.0s',   k: 'PLAN',     msg: 'plan: research → draft → review → send', p: 12, ok: true },
    { t: '0.4s',   k: 'TOOL',     msg: 'web.browse · stripe.com (200 OK, 1.2 KB)', p: 8, ok: true },
    { t: '0.9s',   k: 'TOOL',     msg: 'crm.read · accounts/stripe (cached, 14ms)', p: 2, ok: true },
    { t: '1.2s',   k: 'RESEARCH', msg: 'identified ICP signals · 7 personas matched', p: 14, ok: true },
    { t: '1.7s',   k: 'DRAFT',    msg: 'draft v1 · 184 tokens · Flesch 64 · CTA: meeting', p: 11, ok: true },
    { t: '2.1s',   k: 'REVIEW',   msg: 'self-review · tone OK, no jailbreak signals', p: 6, ok: true },
    { t: '2.4s',   k: 'TOOL',     msg: 'crm.write · enriched 3 fields, scheduled cadence', p: 5, ok: true },
    { t: '2.6s',   k: 'COMPLETE', msg: 'delivered → ops@stripe.com · webhook fired', p: 0, ok: true },
  ];

  const Page = () => {
    const [tab, setTab] = React.useState('timeline');
    const totalPower = STEPS.reduce((a, s) => a + s.p, 0);
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <TopBar />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18, marginBottom: 24 }}>
              <div>
                <Pill dot={palette.accent} style={{ marginBottom: 12 }}>● Completed · 2.6s · 58⚡ burned</Pill>
                <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: 0 }}>Outreach · stripe.com</h1>
                <div style={{ marginTop: 6, fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>
                  run_3cf2a8e1 · agent <a href="#/agent/sdr-pro" style={{ color: palette.accent, textDecoration: 'none' }}>ai-sdr@2.4.1</a> · by ops@acme.com · today 14:38 UTC
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '10px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Replay</button>
                <button style={{ padding: '10px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Export JSON</button>
                <button style={{ padding: '10px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.red}`, color: palette.red, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Open dispute</button>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
              {[
                { l: 'Latency', v: '2.6s', s: 'p95 1.5s · within SLA' },
                { l: 'Power burned', v: `${totalPower}⚡`, s: 'cap 250⚡' },
                { l: 'EUR equivalent', v: '€0.52', s: '@€0.0089/⚡' },
                { l: 'Tokens (in/out)', v: '1,420 / 184', s: 'gpt-4o · cached 41%' },
                { l: 'Result', v: '✓ delivered', s: 'webhook 200 · 23ms' },
              ].map(s => (
                <Glass key={s.l} style={{ padding: 16 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 500, marginTop: 6 }}>{s.v}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textDim, marginTop: 2 }}>{s.s}</div>
                </Glass>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
              {/* Left — Timeline / Output / Audit */}
              <Glass style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ borderBottom: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['timeline', 'output', 'audit', 'tokens'].map(t => (
                      <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 12px', borderRadius: 6, background: tab === t ? palette.accentDim : 'transparent', color: tab === t ? palette.accent : palette.textDim, border: 0, fontSize: 12, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>{t}</button>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{STEPS.length} steps</span>
                </div>
                <div style={{ padding: 20, background: 'var(--p-inset)', fontFamily: 'Geist Mono, monospace', fontSize: 12, lineHeight: 1.8, color: palette.textDim, maxHeight: 540, overflowY: 'auto' }}>
                  {tab === 'timeline' && STEPS.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 80px 1fr 50px', gap: 12, padding: '6px 0', borderBottom: i < STEPS.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                      <span style={{ color: palette.textMute }}>{s.t}</span>
                      <span style={{ color: palette.accent }}>{s.k}</span>
                      <span style={{ color: palette.text }}>{s.msg}</span>
                      <span style={{ color: palette.amber, textAlign: 'right' }}>{s.p ? `${s.p}⚡` : '—'}</span>
                    </div>
                  ))}
                  {tab === 'output' && (
                    <pre style={{ margin: 0, color: palette.text, whiteSpace: 'pre-wrap' }}>{`{
  "draft": "Hi Patrick — Saw Stripe just shipped Tap-to-Pay in 6 EU markets and the launch numbers from Tobi's tweet on Monday were 🔥. A handful of our customers (Klarna ops, Mollie, Adyen alums) have been asking how we'd think about the EU rollout — happy to share what we've seen if useful.\\n\\nWould 20m on Thursday work? Pinning a calendar invite or feel free to grab anything here: cal.com/ops-acme",
  "meta": {
    "personalization_signals": 4,
    "cadence": "stripe_inbound_2026q2",
    "next_send": "2026-05-13T14:00:00Z"
  }
}`}</pre>
                  )}
                  {tab === 'audit' && (
                    <div>
                      {[
                        { t: '14:38:00.121', e: 'auth.verified',      v: 'bearer hsp_live_a3f… · workspace ws_acme' },
                        { t: '14:38:00.244', e: 'manifest.resolved',  v: 'ai-sdr@2.4.1 · scopes: crm:read, crm:write, email:send, web:browse' },
                        { t: '14:38:00.412', e: 'tool.invoked',       v: 'web.browse · domain stripe.com · cache miss · 1.2 KB' },
                        { t: '14:38:00.911', e: 'tool.invoked',       v: 'crm.read · acct stripe · cache HIT · 14ms' },
                        { t: '14:38:01.244', e: 'guard.passed',       v: 'prompt injection: clean · scope-creep: 0 · jailbreak: clean' },
                        { t: '14:38:02.412', e: 'crm.write',          v: 'enriched: industry, employees, ICP_score · cadence scheduled' },
                        { t: '14:38:02.601', e: 'webhook.dispatched', v: 'POST https://api.acme.com/hsp-webhook · 200 OK 23ms' },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 180px 1fr', gap: 12, padding: '4px 0' }}>
                          <span style={{ color: palette.textMute }}>{r.t}</span>
                          <span style={{ color: palette.cyan }}>{r.e}</span>
                          <span>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'tokens' && (
                    <div>
                      {[
                        { m: 'gpt-4o',              i: 1420, o: 184, c: '€0.21', n: 'primary draft' },
                        { m: 'gpt-4o-mini',         i: 380,  o: 22,  c: '€0.01', n: 'guard rails' },
                        { m: 'claude-3.5-haiku',    i: 240,  o: 18,  c: '€0.02', n: 'self-review' },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 80px 80px 80px 1fr', gap: 12, padding: '6px 0', borderBottom: i < 2 ? `1px solid ${palette.border}` : 0 }}>
                          <span style={{ color: palette.text }}>{r.m}</span>
                          <span style={{ color: palette.textMute }}>{r.i} in</span>
                          <span style={{ color: palette.textMute }}>{r.o} out</span>
                          <span style={{ color: palette.amber }}>{r.c}</span>
                          <span style={{ color: palette.textDim }}>{r.n}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 14, padding: '10px 0', borderTop: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: palette.textMute }}>Cache savings</span>
                        <span style={{ color: palette.accent }}>41% · €0.14 saved</span>
                      </div>
                    </div>
                  )}
                </div>
              </Glass>

              {/* Right — Inputs / Cost breakdown / Related */}
              <div style={{ display: 'grid', gap: 18, alignContent: 'flex-start' }}>
                <Glass style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Inputs</div>
                  <pre style={{ margin: 0, fontFamily: 'Geist Mono, monospace', fontSize: 11, lineHeight: 1.7, color: palette.text, background: 'var(--p-inset)', padding: 14, borderRadius: 8, border: `1px solid ${palette.border}`, whiteSpace: 'pre-wrap' }}>{`{
  "account": {
    "domain": "stripe.com",
    "icp_tier": "A",
    "persona": "Head of Eng"
  },
  "brief": "Stripe just shipped EU Tap-to-Pay. Reference the launch tweet by Tobi. Mention our recent ARR milestone."
}`}</pre>
                </Glass>

                <Glass style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Cost breakdown</div>
                  {[
                    { l: 'Model tokens',   v: '€0.24' },
                    { l: 'Tool calls (3)', v: '€0.06' },
                    { l: 'Vendor margin',  v: '€0.18' },
                    { l: 'Platform (15%)', v: '€0.04' },
                  ].map((r, i) => (
                    <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${palette.border}` : 0, fontSize: 13 }}>
                      <span style={{ color: palette.textDim }}>{r.l}</span>
                      <span style={{ fontFamily: 'Geist Mono, monospace' }}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 12, borderTop: `1px solid ${palette.borderStrong}` }}>
                    <span style={{ fontWeight: 600 }}>Total burned</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', color: palette.accent, fontWeight: 600 }}>58⚡ · €0.52</span>
                  </div>
                </Glass>

                <Glass style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Related runs</div>
                  {[
                    { d: 'adyen.com',   r: 'today 14:21', p: '54⚡' },
                    { d: 'klarna.com',  r: 'today 13:48', p: '62⚡' },
                    { d: 'mollie.com',  r: 'today 13:02', p: '49⚡' },
                  ].map((r, i) => (
                    <a key={r.d} href="#/console" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? `1px solid ${palette.border}` : 0, fontSize: 12.5, textDecoration: 'none', color: palette.text }}>
                      <span>{r.d}</span>
                      <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{r.r} · <span style={{ color: palette.accent }}>{r.p}</span></span>
                    </a>
                  ))}
                </Glass>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default RunDetail.Page;
