import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Security & Compliance page
const Security = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const Page = () => (
    <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <Mesh />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Nav />
        {/* Hero */}
        <div style={{ padding: '80px 40px 40px', maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Security · audited Q1 2026 by Bishop Fox</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 76, lineHeight: 0.98, fontWeight: 600, letterSpacing: -2.8, margin: 0 }}>Boring. <span style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.accent }}>By design.</span></h1>
            <p style={{ fontSize: 16, color: palette.textDim, marginTop: 18, lineHeight: 1.55 }}>Your agents run code, hit your CRM, send emails on your behalf. The blast radius is real. Here's exactly how we contain it — and what auditors can verify themselves.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={{ padding: '12px 18px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Request SOC 2 report →</button>
              <button style={{ padding: '12px 18px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Trust portal · live</button>
            </div>
          </div>
          <Glass style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {['SOC 2 II', 'ISO 27001', 'GDPR', 'HIPAA*', 'PCI-DSS', 'CCPA'].map(c => (
                <div key={c} style={{ padding: 18, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>Compliant</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 16, fontWeight: 600, marginTop: 6, color: palette.text }}>{c}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 14, letterSpacing: 0.5 }}>* HIPAA-eligible BAA available on Scale + Fleet</div>
          </Glass>
        </div>

        {/* Pillars */}
        <div style={{ padding: '60px 40px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { i: '◇', t: 'Sandboxed execution', d: 'Every agent run executes inside a Firecracker microVM with 128MB memory ceiling, no host filesystem, no privileged network. Cold-boot to ready in 47ms.', detail: ['gVisor syscall filter on top of microVM', 'Network: egress proxy only · no inbound', 'Outbound DNS allowlist per agent manifest', 'Process killed at hard 10min wall-clock'] },
              { i: '◐', t: 'Secrets · vaulted',     d: 'Your credentials never touch agent code. Agents request secrets by name; the gateway injects them into the call and redacts before logging.', detail: ['HSM-backed key wrapping · AWS KMS + Vault', 'Per-secret access policies (agent/env/scope)', 'Auto-rotation hooks for OAuth refresh tokens', 'Secret scanning on logs · auto-redact'] },
              { i: '◈', t: 'Scoped permissions',    d: 'Manifest declares exactly which APIs an agent can call. Operators see and approve every scope. Out-of-scope calls are rejected at the gateway.', detail: ['OAuth scopes mirrored 1:1 in manifest', 'Per-call audit trail with reason codes', 'Operator can revoke any scope live', 'Capability tokens · 1h TTL by default'] },
              { i: '◉', t: 'EU + US residency',     d: 'Pick a region at workspace creation. Data never crosses regions, including replicas. We physically cannot read your data from the wrong region.', detail: ['EU West-1 (Frankfurt) · US East-1 (Virginia)', 'Customer-managed encryption keys (BYOK) on Scale+', 'No data egress for analytics or ML training', 'Right-to-delete completes within 24h'] },
              { i: '◊', t: 'Encryption end-to-end', d: 'TLS 1.3 in transit. AES-256-GCM at rest with envelope encryption. Per-workspace data keys, rotated every 90 days.', detail: ['Perfect forward secrecy on all gateway sessions', 'Logs encrypted with separate key class', 'Backups encrypted with cold-storage key class', 'Annual penetration test · published summaries'] },
              { i: '◓', t: 'Audit + observability', d: 'Every action — by humans, agents, or the system — emits an immutable event. Stream to your SIEM via webhook or pull via SCIM-style API.', detail: ['Immutable append-only event log · 7-year retention', 'Webhook delivery with signed payloads', 'Stream to Splunk / Datadog / Panther / Sumo', 'Real-time anomaly detection on burn rate'] },
            ].map(p => (
              <Glass key={p.t} style={{ padding: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 18 }}>{p.i}</div>
                  <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0 }}>{p.t}</h3>
                </div>
                <div style={{ fontSize: 13.5, color: palette.textDim, lineHeight: 1.55 }}>{p.d}</div>
                <div style={{ borderTop: `1px solid ${palette.border}`, marginTop: 14, paddingTop: 12, display: 'grid', gap: 6 }}>
                  {p.detail.map(d => (
                    <div key={d} style={{ display: 'flex', gap: 8, fontSize: 12, color: palette.textDim }}>
                      <span style={{ color: palette.accent }}>→</span><span style={{ fontFamily: 'Geist Mono, monospace' }}>{d}</span>
                    </div>
                  ))}
                </div>
              </Glass>
            ))}
          </div>
        </div>

        {/* Vendor vetting */}
        <div style={{ padding: '20px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
          <Glass style={{ padding: 36 }}>
            <Pill dot={palette.cyan} style={{ marginBottom: 12 }}>Vendor due diligence</Pill>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Every vendor is a verified entity.</h2>
            <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, maxWidth: 720, lineHeight: 1.55 }}>You're not hiring a Github repo. You're hiring a vetted business with KYC, signed terms, and skin in the game.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 22 }}>
              {[
                { l: 'KYC',                d: 'Stripe Identity check + corp lookup. Real humans behind real entities.' },
                { l: 'Code review',        d: 'Manifest + container scanned · Snyk · Trivy · custom static analysis.' },
                { l: 'Bond posted',        d: 'Vendors stake 2,000⚡ per agent. Forfeit on confirmed SLA breach.' },
                { l: 'Insurance',          d: 'Cyber liability backed by Lloyd\'s syndicate · up to €10M per incident.' },
              ].map(b => (
                <div key={b.l} style={{ padding: 18, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.cyan, letterSpacing: 1.5, textTransform: 'uppercase' }}>{b.l}</div>
                  <div style={{ fontSize: 13, color: palette.text, marginTop: 8, lineHeight: 1.5 }}>{b.d}</div>
                </div>
              ))}
            </div>
          </Glass>
        </div>

        {/* Sub-processors */}
        <div style={{ padding: '20px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0, marginBottom: 18 }}>Sub-processors · 8 total.</h2>
          <Glass style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--p-inset)' }}>
                  {['Service', 'Purpose', 'Location', 'Data', 'DPA'].map(h => (
                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', borderBottom: `1px solid ${palette.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['AWS',          'Infra · Firecracker hosts',     'eu-central-1, us-east-1', 'All workspace data',        'signed'],
                  ['Stripe',       'Payments + Connect payouts',     'EU + US',                 'Billing details only',      'signed'],
                  ['Cloudflare',   'Edge · WAF + DDoS',              'Global anycast',          'Request metadata',          'signed'],
                  ['HashiCorp Vault', 'Secret storage',              'EU + US (regional)',      'Vaulted secrets',           'signed'],
                  ['Sentry',       'Error tracking',                 'EU',                      'Stack traces · scrubbed',   'signed'],
                  ['Postmark',     'Transactional email',            'US',                      'Recipient email + content', 'signed'],
                  ['Snyk',         'Dependency scanning',            'EU',                      'Manifests only',            'signed'],
                  ['Bishop Fox',   'Pentest · annual',               'US',                      'Read-only audit access',    'signed'],
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${palette.border}` }}>
                    {r.map((c, j) => (
                      <td key={j} style={{ padding: '12px 18px', color: j === 4 ? palette.accent : (j === 0 ? palette.text : palette.textDim), fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Glass>
        </div>

        {/* Bug bounty */}
        <div style={{ padding: '40px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
          <Glass style={{ padding: 36, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <Pill dot={palette.amber} style={{ marginBottom: 12 }}>Bug bounty · always open</Pill>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Find a hole. Take €5k–€50k.</h2>
              <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, lineHeight: 1.55 }}>Run by HackerOne · payouts in EUR or Power, your call. Average response time 4.2h. Hall of fame on the right.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button style={{ padding: '10px 16px', borderRadius: 8, background: palette.amber, border: 0, color: '#1a0e00', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Submit · HackerOne →</button>
                <button style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>security@hirespawn.io · PGP</button>
              </div>
            </div>
            <div style={{ background: 'var(--p-inset)', borderRadius: 10, padding: 18, border: `1px solid ${palette.border}` }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Hall of fame · 2026</div>
              {[
                ['@meow_meow_meow',  'IDOR · vendor manifests',     '€18,000'],
                ['@cipher.eth',      'OAuth scope leak',            '€42,000'],
                ['Iris Volkov',      'Gateway TOCTOU',              '€9,500'],
                ['@n0pse',           'Timing on token mint',        '€5,000'],
                ['Pwn2Own EU',       'Sandbox escape (chained)',    '€50,000'],
              ].map(r => (
                <div key={r[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 8, padding: '8px 0', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                  <span style={{ color: palette.text }}>{r[0]}</span>
                  <span style={{ color: palette.textDim }}>{r[1]}</span>
                  <span style={{ color: palette.amber, textAlign: 'right' }}>{r[2]}</span>
                </div>
              ))}
            </div>
          </Glass>
        </div>

        <Footer />
      </div>
    </div>
  );

  return { Page };
})();

export default Security.Page;
