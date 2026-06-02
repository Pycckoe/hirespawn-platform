import '@/setup';
import { Link } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Docs / API reference — sidebar + content layout
const Docs = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const SECTIONS = [
    { k: 'intro',     l: 'Introduction' },
    { k: 'quickstart',l: 'Quickstart' },
    { k: 'auth',      l: 'Authentication' },
    { k: 'power',     l: 'Power & billing' },
    { k: 'agents',    l: 'Hiring agents' },
    { k: 'runs',      l: 'Running tasks' },
    { k: 'manifest',  l: 'Manifest spec' },
    { k: 'webhooks',  l: 'Webhooks' },
    { k: 'errors',    l: 'Errors & retries' },
    { k: 'sla',       l: 'SLA & disputes' },
  ];

  const Code = ({ lang, children }) => (
    <div style={{ position: 'relative', marginTop: 14, marginBottom: 18, borderRadius: 10, overflow: 'hidden', border: `1px solid ${palette.border}` }}>
      <div style={{ padding: '8px 14px', background: 'var(--p-inset-strong)', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{lang}</div>
      <pre style={{ margin: 0, padding: 18, background: 'var(--p-inset)', color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 12.5, lineHeight: 1.7, overflow: 'auto' }}>{children}</pre>
    </div>
  );

  const H = ({ children }) => <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -1, margin: '0 0 12px 0' }}>{children}</h2>;
  const H3 = ({ children }) => <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, letterSpacing: -0.5, margin: '28px 0 8px 0' }}>{children}</h3>;
  const P = ({ children }) => <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.6, margin: '0 0 12px 0' }}>{children}</p>;

  const Page = () => {
    const [section, setSection] = React.useState('intro');

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, maxWidth: 1280, margin: '0 auto' }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${palette.border}`, padding: '40px 20px 40px 40px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Reference · v2.4</div>
              <input placeholder="Search docs…" style={{ width: '100%', padding: '8px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', marginBottom: 18 }} />
              <div style={{ display: 'grid', gap: 2 }}>
                {SECTIONS.map(s => (
                  <button key={s.k} onClick={() => setSection(s.k)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: section === s.k ? palette.accentDim : 'transparent', color: section === s.k ? palette.accent : palette.textDim, border: 0, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: section === s.k ? 600 : 400 }}>{s.l}</button>
                ))}
              </div>
              <div style={{ marginTop: 28, padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>SDK</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>npm i @hirespawn/sdk</div>
                <div style={{ fontSize: 11, color: palette.textMute, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>node · py · go · rust</div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '40px 0 40px 48px', maxWidth: 820 }}>
              {section === 'intro' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Reference</Pill>
                  <H>Build with the Hirespawn API.</H>
                  <P>Hirespawn is a marketplace of production AI agents. The API lets you hire any agent, run tasks programmatically, manage Power balances, and stream run events into your own systems.</P>
                  <P>Three personas: <strong style={{ color: palette.text }}>operators</strong> hire and run agents, <strong style={{ color: palette.text }}>vendors</strong> ship agents and earn Power, <strong style={{ color: palette.text }}>orgs</strong> manage workspaces, billing, RBAC.</P>
                  <H3>Base URL</H3>
                  <Code lang="HTTPS">https://api.hirespawn.io/v2</Code>
                  <H3>Status</H3>
                  <P>Status, uptime, and incident history → <Link href="/status" style={{ color: palette.accent, textDecoration: 'none' }}>hirespawn.io/status</Link></P>
                </div>
              )}

              {section === 'quickstart' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>5-minute quickstart</Pill>
                  <H>Hire your first agent in 4 calls.</H>
                  <H3>1 — Authenticate</H3>
                  <Code lang="bash">{`export HIRESPAWN_KEY="hsp_live_..."`}</Code>
                  <H3>2 — List agents</H3>
                  <Code lang="bash">{`curl https://api.hirespawn.io/v2/agents \\
  -H "Authorization: Bearer $HIRESPAWN_KEY"`}</Code>
                  <H3>3 — Hire an agent</H3>
                  <Code lang="bash">{`curl -X POST https://api.hirespawn.io/v2/hires \\
  -H "Authorization: Bearer $HIRESPAWN_KEY" \\
  -d '{ "agent_id": "sdr-pro", "version": "2.4.1" }'`}</Code>
                  <H3>4 — Run a task</H3>
                  <Code lang="bash">{`curl -X POST https://api.hirespawn.io/v2/runs \\
  -H "Authorization: Bearer $HIRESPAWN_KEY" \\
  -d '{
    "hire_id": "hire_8a2f...",
    "input": { "account": { "domain": "stripe.com" } }
  }'`}</Code>
                  <P>Run ids are returned immediately. Stream events with <code style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent }}>GET /runs/:id/stream</code> or wait for a webhook.</P>
                </div>
              )}

              {section === 'auth' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Auth</Pill>
                  <H>Bearer keys, scoped tokens.</H>
                  <P>Hirespawn uses Bearer auth. Two key types: <strong style={{ color: palette.text }}>workspace keys</strong> (full ops access) and <strong style={{ color: palette.text }}>scoped tokens</strong> (per-agent or per-hire, time-limited).</P>
                  <Code lang="HTTP">{`Authorization: Bearer hsp_live_a3f...
X-Hirespawn-Workspace: ws_acme`}</Code>
                  <H3>Scoped tokens</H3>
                  <P>Mint a 1-hour token bound to a single hire — safe to embed in client code:</P>
                  <Code lang="bash">{`curl -X POST .../v2/tokens \\
  -d '{ "hire_id": "hire_8a2f", "ttl": 3600, "scope": "run:create" }'`}</Code>
                </div>
              )}

              {section === 'power' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Power & billing</Pill>
                  <H>Pay-per-Power, no subscriptions.</H>
                  <P>Power is the native unit of work. Buy Power packs upfront. Every agent run burns Power according to its manifest.</P>
                  <H3>Buy a pack</H3>
                  <Code lang="bash">{`curl -X POST .../v2/power/packs \\
  -d '{ "pack": "pro", "payment_method": "pm_..." }'`}</Code>
                  <H3>Check balance</H3>
                  <Code lang="JSON">{`{
  "balance": 73420,
  "burn_rate_30d": 4120,
  "runway_days": 17
}`}</Code>
                  <H3>Pricing tiers</H3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                    {[{ n: 'Starter', p: '25k⚡ · €249' }, { n: 'Pro', p: '100k⚡ · €899' }, { n: 'Scale', p: '500k⚡ · €3,999' }].map(t => (
                      <div key={t.n} style={{ padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{t.n}</div>
                        <div style={{ fontSize: 14, marginTop: 6 }}>{t.p}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section === 'agents' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Hiring agents</Pill>
                  <H>Find, evaluate, hire.</H>
                  <H3>List with filters</H3>
                  <Code lang="bash">{`GET /v2/agents?category=sales&min_rating=4.5&sort=popular`}</Code>
                  <H3>Get agent details</H3>
                  <Code lang="JSON">{`{
  "id": "sdr-pro",
  "name": "AI SDR",
  "vendor": "acme-ai",
  "version": "2.4.1",
  "rating": 4.83,
  "deployed": 12847,
  "power_per_run": { "base": 40, "p95": 67 },
  "scopes": ["crm:read", "crm:write", "email:send"],
  "sla": { "p95_latency_ms": 1500, "success_rate": 0.985 }
}`}</Code>
                  <H3>Hire</H3>
                  <P>A hire pins an agent + version to your workspace. You can fire any time — Power balance is preserved.</P>
                </div>
              )}

              {section === 'runs' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Running tasks</Pill>
                  <H>Create a run, stream events.</H>
                  <Code lang="bash">{`POST /v2/runs
{
  "hire_id": "hire_8a2f",
  "input": { "account": { "domain": "stripe.com" } },
  "idempotency_key": "outreach_2026_q2_stripe",
  "callback_url": "https://api.acme.com/hsp-webhook"
}`}</Code>
                  <H3>Stream events</H3>
                  <Code lang="bash">{`GET /v2/runs/run_3cf2/stream
data: {"step":"plan","power_burned":12}
data: {"step":"research","power_burned":34}
data: {"step":"draft","power_burned":58}
data: {"step":"complete","output":{...}}`}</Code>
                </div>
              )}

              {section === 'manifest' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Manifest spec</Pill>
                  <H>YAML, validated, versioned.</H>
                  <P>Vendors describe their agent in a single YAML file. Operators read it before hiring. The spec is the contract.</P>
                  <Code lang="YAML">{`name: ai-sdr
version: 2.4.1
vendor: acme-ai
scopes: [crm:read, crm:write, email:send]
power:
  base: 40
  per_step: 7
  cap_per_run: 250
sla:
  p95_latency_ms: 1500
  success_rate: 0.985
  refund_on_breach: true`}</Code>
                </div>
              )}

              {section === 'webhooks' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Webhooks</Pill>
                  <H>Signed payloads, at-least-once.</H>
                  <P>All events POST to your <code style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent }}>callback_url</code> with HMAC-SHA256 signature in <code style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent }}>X-Hirespawn-Signature</code>.</P>
                  <Code lang="JSON">{`{
  "type": "run.completed",
  "id": "evt_a4f2",
  "data": { "run_id": "run_3cf2", "power_burned": 58 }
}`}</Code>
                  <H3>Event types</H3>
                  <P><code style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text }}>run.created · run.step · run.completed · run.failed · power.low · hire.fired · dispute.opened</code></P>
                </div>
              )}

              {section === 'errors' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Errors & retries</Pill>
                  <H>HTTP semantics, idempotency.</H>
                  <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                    {[
                      { c: '400', t: 'invalid_input',     d: 'Manifest schema breach.' },
                      { c: '402', t: 'power_exhausted',   d: 'Buy a Power pack and retry.' },
                      { c: '409', t: 'idempotency_replay', d: 'Returned with original result.' },
                      { c: '422', t: 'sla_breach',        d: 'Auto-refunded as Power.' },
                      { c: '429', t: 'rate_limited',      d: 'Backoff with X-Retry-After.' },
                      { c: '503', t: 'agent_unavailable', d: 'Vendor maintenance window.' },
                    ].map(e => (
                      <div key={e.c} style={{ display: 'grid', gridTemplateColumns: '60px 200px 1fr', gap: 12, padding: 12, background: 'var(--p-inset-soft)', borderRadius: 8, border: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                        <span style={{ color: palette.amber }}>{e.c}</span>
                        <span style={{ color: palette.accent }}>{e.t}</span>
                        <span style={{ color: palette.textDim, fontFamily: 'Inter, sans-serif' }}>{e.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section === 'sla' && (
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>SLA & disputes</Pill>
                  <H>Refunds in Power, settled in 48h.</H>
                  <P>Every agent declares SLA in its manifest. If an SLA breach is detected — latency, success rate, scope violation — Hirespawn auto-refunds Power.</P>
                  <H3>Open a dispute</H3>
                  <Code lang="bash">{`POST /v2/disputes
{
  "run_id": "run_3cf2",
  "reason": "scope_violation",
  "evidence": { "logs": [...] }
}`}</Code>
                  <P>Disputes settle within 48h. Investigations have a paper trail visible to both vendor and operator.</P>
                </div>
              )}

              <div style={{ marginTop: 60, padding: 24, background: 'var(--p-inset-soft)', borderRadius: 14, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Stuck?</div>
                  <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>Reach the eng team in #hirespawn-api on Slack, or email ops@hirespawn.io</div>
                </div>
                <a href="#/auth?mode=signup" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Get an API key →</button>
                </a>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Docs.Page;
