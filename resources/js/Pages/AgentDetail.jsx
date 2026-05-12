import '@/setup';
import { usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// AGENT DETAIL PAGE
// Specs · capabilities · integrations · SLA · pricing · sample tasks
// =====================================================================

const AgentDetail = (() => {
  const { palette, Glass, Pill, Mesh, Nav, SectionLabel, Reveal, Footer } = DirA;

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
  const AgentHeader = ({ agent }) => (
    <div style={{ padding: '40px 40px 28px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        <a href="#/" style={{ color: palette.textMute, textDecoration: 'none' }}>hirespawn</a>
        <span>/</span>
        <a href="#/roster" style={{ color: palette.textMute, textDecoration: 'none' }}>roster</a>
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
            ≈ €{(agent.power * 0.009).toFixed(3)} per task at Pro rate
          </div>

          <div style={{ marginTop: 22, padding: 14, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '4px 0' }}>
              <span>100 tasks</span><span style={{ color: palette.text }}>{(agent.power * 100).toLocaleString()}⚡ · €{(agent.power * 100 * 0.009).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '4px 0' }}>
              <span>1,000 tasks</span><span style={{ color: palette.text }}>{(agent.power * 1000).toLocaleString()}⚡ · €{(agent.power * 1000 * 0.009).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, padding: '4px 0', borderTop: `1px dashed ${palette.border}`, marginTop: 4, paddingTop: 8 }}>
              <span>10,000 tasks</span><span>{(agent.power * 10000).toLocaleString()}⚡ · €{(agent.power * 10000 * 0.009).toFixed(0)}</span>
            </div>
          </div>

          <button style={{ width: '100%', padding: '14px', borderRadius: 10, marginTop: 18, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Deploy {agent.name} →
          </button>
          <button style={{ width: '100%', padding: '12px', borderRadius: 10, marginTop: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            Try in sandbox
          </button>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, textAlign: 'center', marginTop: 10 }}>Self-installs in &lt; 90s · scoped key</div>
        </Glass>
      </div>
    </div>
  );

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
        Need another tool? <a href="#/" style={{ color: palette.cyan, textDecoration: 'none' }}>Request integration →</a>
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
            <a key={a.id} href={`#/agent/${a.id}`} style={{ textDecoration: 'none' }}>
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
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Page
  const Page = () => {
    const { agent = null, relatedAgents = [] } = usePage().props;
    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto' }}>
          <Nav />
          {!agent ? <NotFound /> : (
            <>
              <AgentHeader agent={agent} />
              <SpecStrip agent={agent} />
              <Reveal><Capabilities agent={agent} /></Reveal>
              <Reveal><SampleTasks agent={agent} /></Reveal>
              <Reveal><Integrations agent={agent} /></Reveal>
              <Reveal><SlaPanel agent={agent} /></Reveal>
              <Reveal><DeployFlow agent={agent} /></Reveal>
              <Reveal><RelatedAgents related={relatedAgents} /></Reveal>
            </>
          )}
          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default AgentDetail.Page;
