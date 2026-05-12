import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Settings — workspace, members, API keys, billing, integrations, RBAC
const Settings = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const TABS = [
    { k: 'workspace',    l: 'Workspace' },
    { k: 'members',      l: 'Members' },
    { k: 'keys',         l: 'API keys' },
    { k: 'billing',      l: 'Billing' },
    { k: 'integrations', l: 'Integrations' },
    { k: 'security',     l: 'Security' },
    { k: 'notifications',l: 'Notifications' },
    { k: 'danger',       l: 'Danger zone' },
  ];

  const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>{sub}</div>}
      </div>
      <Glass style={{ padding: 22 }}>{children}</Glass>
    </div>
  );

  const Field = ({ label, value, mono, hint, suffix }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${palette.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input defaultValue={value} style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 13, outline: 'none' }} />
        {suffix && <span style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{suffix}</span>}
      </div>
    </div>
  );

  const Page = () => {
    const [tab, setTab] = React.useState('workspace');

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* TopBar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
              <span style={{ color: palette.textMute }}>/</span>
              <a href="#/console" style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Console</a>
              <span style={{ color: palette.textMute }}>/</span>
              <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Settings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>ws_acme · owner</span>
              <ThemeToggle size={32} />
            </div>
          </div>

          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
            {/* Sidebar */}
            <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
              <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Workspace · Acme Inc</Pill>
              <div style={{ display: 'grid', gap: 2 }}>
                {TABS.map(t => (
                  <button key={t.k} onClick={() => setTab(t.k)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: tab === t.k ? palette.accentDim : 'transparent', color: tab === t.k ? palette.accent : palette.textDim, border: 0, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: tab === t.k ? 600 : 400 }}>{t.l}</button>
                ))}
              </div>
            </div>

            <div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: '0 0 28px 0' }}>{TABS.find(t => t.k === tab).l}</h1>

              {tab === 'workspace' && (
                <div>
                  <Section title="Profile" sub="Visible to vendors when you hire an agent.">
                    <Field label="Workspace name" value="Acme Inc" hint="Shown in vendor analytics" />
                    <Field label="Slug" value="acme" mono suffix=".hirespawn.io" />
                    <Field label="Region" value="EU · West-1 (Frankfurt)" hint="Cannot be changed after first run" />
                    <Field label="Industry" value="B2B SaaS" />
                  </Section>
                  <Section title="Defaults" sub="Pre-filled when you hire new agents.">
                    <Field label="Default budget" value="5,000" mono suffix="⚡/month" />
                    <Field label="Default callback URL" value="https://api.acme.com/hsp-webhook" mono />
                    <Field label="Timezone" value="Europe/Berlin" />
                  </Section>
                </div>
              )}

              {tab === 'members' && (
                <div>
                  <Section title="Team · 12 members" sub="Roles: Owner · Admin · Operator · Viewer">
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <input placeholder="Invite by email…" style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                      <select style={{ padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontSize: 13 }}>
                        <option>Operator</option><option>Admin</option><option>Viewer</option>
                      </select>
                      <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Invite</button>
                    </div>
                    {[
                      { n: 'Eva Romero',      e: 'eva@acme.com',     r: 'Owner',     l: '2 min ago',   t: 'er' },
                      { n: 'Mark Patel',      e: 'mark@acme.com',    r: 'Admin',     l: '18 min ago',  t: 'mp' },
                      { n: 'Yara Halilović',  e: 'yara@acme.com',    r: 'Operator',  l: '1 hour ago',  t: 'yh' },
                      { n: 'Liam Cooper',     e: 'liam@acme.com',    r: 'Operator',  l: '3 hours ago', t: 'lc' },
                      { n: 'Aiko Tanaka',     e: 'aiko@acme.com',    r: 'Operator',  l: 'yesterday',   t: 'at' },
                      { n: 'Diego Suárez',    e: 'diego@acme.com',   r: 'Viewer',    l: '4 days ago',  t: 'ds' },
                      { n: 'Pending · Mira',  e: 'mira@acme.com',    r: 'Admin',     l: 'invited',     t: '·', pending: true },
                    ].map((m, i, arr) => (
                      <div key={m.e} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 120px 80px', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, opacity: m.pending ? 0.6 : 1 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 99, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{m.t}</div>
                        <div>
                          <div style={{ fontSize: 14 }}>{m.n}</div>
                          <div style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace' }}>{m.e}</div>
                        </div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>{m.r}</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{m.l}</div>
                        <button style={{ padding: '6px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textDim, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>···</button>
                      </div>
                    ))}
                  </Section>
                </div>
              )}

              {tab === 'keys' && (
                <div>
                  <Section title="API keys" sub="Use in production. Workspace-wide access.">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: palette.textDim }}>4 active keys · 1 rotating in 12 days</span>
                      <button style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Create key</button>
                    </div>
                    {[
                      { n: 'production',  k: 'hsp_live_a3f7…d29c', s: 'created Jan 12', u: '14m ago' },
                      { n: 'staging',     k: 'hsp_test_8e21…f0a4', s: 'created Mar 03', u: '2h ago' },
                      { n: 'ci-runner',   k: 'hsp_live_4c91…b7ef', s: 'created Apr 18', u: '3 days ago' },
                      { n: 'analytics-bot', k: 'hsp_live_9f02…c11a', s: 'created May 02', u: 'never' },
                    ].map((k, i, arr) => (
                      <div key={k.n} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 120px 80px', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                        <span style={{ color: palette.text }}>{k.n}</span>
                        <span style={{ color: palette.accent }}>{k.k}</span>
                        <span style={{ color: palette.textMute }}>{k.s}</span>
                        <span style={{ color: palette.textDim }}>used {k.u}</span>
                        <button style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.red}`, color: palette.red, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>revoke</button>
                      </div>
                    ))}
                  </Section>
                  <Section title="Scoped tokens" sub="Short-lived, single-purpose. Embed in client-side code.">
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, lineHeight: 1.7 }}>
                      <div>POST /v2/tokens</div>
                      <div style={{ color: palette.accent }}>{`{ "hire_id": "hire_8a2f", "ttl": 3600, "scope": "run:create" }`}</div>
                      <div style={{ marginTop: 8 }}>→ returns hsp_scoped_… (expires in 1h)</div>
                    </div>
                  </Section>
                </div>
              )}

              {tab === 'billing' && (
                <div>
                  <Section title="Plan & Power" sub="Pay-per-Power · no subscription">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
                      {[
                        { l: 'Current balance', v: '78,200⚡', s: '≈ €695' },
                        { l: 'Burn · 30d',      v: '24,840⚡', s: '↑ 18% MoM' },
                        { l: 'Runway',          v: '94 days',  s: 'at current burn' },
                      ].map(s => (
                        <div key={s.l} style={{ padding: 16, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
                          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 500, marginTop: 4 }}>{s.v}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{s.s}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href="#/power" style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy more Power →</button>
                      </a>
                      <button style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Auto top-up</button>
                    </div>
                  </Section>
                  <Section title="Payment methods" sub="Visa · MasterCard · Amex · Wire · SEPA">
                    <Field label="Default card"      value="VISA  •••• 4242  ·  exp 09/29" mono />
                    <Field label="Billing email"     value="billing@acme.com" />
                    <Field label="Company address"   value="Friedrichstraße 88, 10117 Berlin, DE" />
                    <Field label="VAT number"        value="DE 814 421 098" mono />
                  </Section>
                  <Section title="Invoices · last 12" sub="Auto-emailed · downloadable as PDF + UBL XML">
                    {[
                      { d: 'May 01', n: 'INV-2026-0142', a: '€1,079', s: 'Paid' },
                      { d: 'Apr 01', n: 'INV-2026-0119', a: '€899',   s: 'Paid' },
                      { d: 'Mar 01', n: 'INV-2026-0091', a: '€899',   s: 'Paid' },
                      { d: 'Feb 01', n: 'INV-2026-0064', a: '€649',   s: 'Paid' },
                    ].map((inv, i, arr) => (
                      <div key={inv.n} style={{ display: 'grid', gridTemplateColumns: '100px 200px 1fr 100px 80px', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                        <span style={{ color: palette.textMute }}>{inv.d}</span>
                        <span style={{ color: palette.text }}>{inv.n}</span>
                        <span></span>
                        <span style={{ color: palette.text }}>{inv.a}</span>
                        <span style={{ color: palette.accent }}>{inv.s}</span>
                      </div>
                    ))}
                  </Section>
                </div>
              )}

              {tab === 'integrations' && (
                <div>
                  <Section title="Connected services · 8 active" sub="Agents use these via OAuth or signed webhooks.">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {[
                        { n: 'Salesforce',      s: 'connected · ws_acme.my.salesforce.com', on: true },
                        { n: 'HubSpot',         s: 'connected · acme.hubspot.com', on: true },
                        { n: 'Slack',           s: '#hirespawn-ops, #sales-alerts', on: true },
                        { n: 'Gmail',           s: '12 mailboxes via OAuth', on: true },
                        { n: 'Outlook 365',     s: 'not connected', on: false },
                        { n: 'Linear',          s: 'connected · team ACME', on: true },
                        { n: 'GitHub',          s: 'connected · 4 repos', on: true },
                        { n: 'Stripe',          s: 'connected · live mode', on: true },
                        { n: 'Notion',          s: 'connected · workspace acme', on: true },
                        { n: 'Zapier',          s: 'not connected', on: false },
                      ].map(it => (
                        <div key={it.n} style={{ padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{it.n}</div>
                            <div style={{ fontSize: 11, color: palette.textDim, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{it.s}</div>
                          </div>
                          <button style={{ padding: '6px 12px', borderRadius: 6, background: it.on ? palette.accentDim : 'transparent', border: `1px solid ${it.on ? palette.accent : palette.borderStrong}`, color: it.on ? palette.accent : palette.text, fontSize: 11, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>{it.on ? 'manage' : 'connect'}</button>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {tab === 'security' && (
                <div>
                  <Section title="Authentication" sub="Your workspace · 12 humans, 4 service accounts">
                    <Field label="SSO provider" value="Okta SAML" hint="Enforced for all members" />
                    <Field label="SCIM provisioning" value="Enabled · 12 users in sync" />
                    <Field label="MFA" value="Required for all members · WebAuthn + TOTP" />
                    <Field label="Session length" value="12 hours" />
                  </Section>
                  <Section title="Audit log" sub="All admin actions tracked · exportable">
                    {[
                      { t: '2 min ago',    a: 'eva@acme.com',  e: 'api_key.created',  v: 'hsp_live_a3f7…d29c' },
                      { t: '14 min ago',   a: 'mark@acme.com', e: 'member.invited',   v: 'mira@acme.com (Admin)' },
                      { t: '1 hour ago',   a: 'eva@acme.com',  e: 'agent.hired',      v: 'ai-sdr@2.4.1 (budget 5,000⚡/mo)' },
                      { t: '3 hours ago',  a: 'system',        e: 'power.topup',      v: '+100,000⚡ (auto)' },
                      { t: 'yesterday',    a: 'liam@acme.com', e: 'integration.connected', v: 'github · 4 repos' },
                    ].map((r, i, arr) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 180px 200px 1fr', gap: 14, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
                        <span style={{ color: palette.textMute }}>{r.t}</span>
                        <span style={{ color: palette.text }}>{r.a}</span>
                        <span style={{ color: palette.cyan }}>{r.e}</span>
                        <span style={{ color: palette.textDim }}>{r.v}</span>
                      </div>
                    ))}
                  </Section>
                  <Section title="Data residency & retention">
                    <Field label="Data region" value="EU · West-1 (Frankfurt)" hint="GDPR · cannot be changed" />
                    <Field label="Run log retention" value="90 days" />
                    <Field label="Agent memory retention" value="30 days · auto-purge" />
                    <Field label="Export bundle" value="Generate ZIP · 1.4 GB · 14d expiry" />
                  </Section>
                </div>
              )}

              {tab === 'notifications' && (
                <div>
                  <Section title="Alert channels" sub="Where you want to hear from us.">
                    {[
                      { l: 'Low Power balance (< 10%)',    d: 'Slack + Email',   on: true },
                      { l: 'Run failure',                  d: 'Slack',           on: true },
                      { l: 'SLA breach',                   d: 'Email + Webhook', on: true },
                      { l: 'New vendor version available',  d: 'Email weekly',    on: false },
                      { l: 'Vendor disputes',              d: 'Email',           on: true },
                      { l: 'Weekly digest',                d: 'Email · Mondays', on: true },
                      { l: 'Monthly invoice',              d: 'Email',           on: true },
                      { l: 'Security events',              d: 'Slack + Email + SMS', on: true },
                    ].map((r, i, arr) => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.l}</div>
                          <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2, fontFamily: 'Geist Mono, monospace' }}>{r.d}</div>
                        </div>
                        <div style={{ width: 42, height: 24, borderRadius: 99, background: r.on ? palette.accent : 'var(--p-track)', position: 'relative', cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: 2, left: r.on ? 20 : 2, width: 20, height: 20, borderRadius: 99, background: '#fff' }} />
                        </div>
                      </div>
                    ))}
                  </Section>
                </div>
              )}

              {tab === 'danger' && (
                <div>
                  <Section title="Transfer workspace ownership" sub="Hand the keys to another admin.">
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input placeholder="New owner email…" style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontSize: 13, outline: 'none' }} />
                      <button style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.amber}`, color: palette.amber, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Transfer</button>
                    </div>
                  </Section>
                  <Section title="Export everything" sub="Download a ZIP of all runs, agents, billing, audit logs.">
                    <button style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Generate export bundle</button>
                  </Section>
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ marginBottom: 14 }}>
                      <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0, color: palette.red }}>Delete workspace</h3>
                      <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>Irreversible. Remaining Power refunded to original card within 7 days.</div>
                    </div>
                    <Glass style={{ padding: 22, border: `1px solid ${palette.red}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: palette.textDim }}>Type <code style={{ color: palette.red, fontFamily: 'Geist Mono, monospace' }}>delete acme</code> to confirm.</div>
                        <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.red, border: 0, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Permanently delete</button>
                      </div>
                    </Glass>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Settings.Page;
