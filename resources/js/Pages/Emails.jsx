import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Email templates preview — designer view, not a real inbox
const Emails = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer, Logo } = DirA;

  const EMAILS = [
    { id: 'welcome',     trigger: 'Account created',       subject: 'Your 5,000⚡ is live. Pick your first agent.',     to: 'eva@acme.com',  from: 'spawn@hirespawn.io',
      preheader: 'Welcome to Hirespawn. Here\'s exactly what to do next.', cta: 'Browse the Roster →', body: 'welcome' },
    { id: 'low-power',   trigger: 'Balance dropped below 10%', subject: 'Heads up — Acme is at 8% Power',               to: 'eva@acme.com',  from: 'ledger@hirespawn.io',
      preheader: '~9 days runway at current burn.', cta: 'Top up Power →', body: 'low-power' },
    { id: 'dispute',     trigger: 'Vendor dispute resolved',     subject: 'Dispute #DSP-4193 settled in your favor',     to: 'mark@acme.com', from: 'disputes@hirespawn.io',
      preheader: '1,240⚡ refunded to your workspace.', cta: 'View ledger →', body: 'dispute' },
    { id: 'invoice',     trigger: 'Monthly invoice issued',      subject: 'Invoice INV-2026-0142 · Acme · €1,079',       to: 'billing@acme.com', from: 'billing@hirespawn.io',
      preheader: 'Auto-charged Visa •••• 4242 · receipt attached.', cta: 'View invoice →', body: 'invoice' },
    { id: 'vendor-paid', trigger: 'Vendor payout sent',          subject: 'Spawned €2,142.18 was paid to your bank',      to: 'maker@nudge.io', from: 'payouts@hirespawn.io',
      preheader: 'Net of 12% platform fee · arrives within 24h.', cta: 'Open payouts →', body: 'vendor-paid' },
    { id: 'sla-refund',  trigger: 'SLA breach auto-refund',      subject: 'Auto-refund · 840⚡ returned',                  to: 'mark@acme.com', from: 'ledger@hirespawn.io',
      preheader: 'AI Closer v2.1 missed its 99.5% target this hour.', cta: 'See SLA report →', body: 'sla-refund' },
  ];

  const PreviewWelcome = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: '0 0 14px 0', color: palette.text }}>Welcome, Eva.</h1>
      <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>You've got <strong style={{ color: palette.accent }}>5,000⚡</strong> to burn — that's about 80 SDR emails, 600 lead enrichments, or 40 research briefs. No card on file yet. Spend it however you like.</p>
      <div style={{ marginTop: 22, padding: 20, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>Next 3 steps</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {[
            ['01', 'Pick an agent', 'Browse the Roster · 18 verified vendors · filter by integration.'],
            ['02', 'Approve scopes', 'Decide what data the agent can touch. Revoke anytime.'],
            ['03', 'Hire + go',     'First run completes in ~90 seconds. You\'ll see Power burn in real time.'],
          ].map(s => (
            <div key={s[0]} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent, fontWeight: 600 }}>{s[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s[1]}</div>
                <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>{s[2]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const PreviewLowPower = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -1, margin: '0 0 8px 0', color: palette.text }}>You're running low.</h1>
      <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>Acme workspace is at <strong style={{ color: palette.amber }}>7,840⚡</strong> — about <strong>9 days</strong> at current burn rate. Auto top-up isn't enabled.</p>
      <div style={{ marginTop: 18, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.amber}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
          <div>
            <div style={{ color: palette.textMute, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>Balance</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text }}>7,840⚡</div>
          </div>
          <div>
            <div style={{ color: palette.textMute, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>Burn · 7d avg</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text }}>871⚡/day</div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6, marginTop: 18 }}>Top up now to avoid agents pausing mid-run. We won't bill you a cent more than the pack you pick — Power never expires.</p>
    </>
  );

  const PreviewDispute = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: '0 0 14px 0', color: palette.text }}>Dispute #DSP-4193 settled.</h1>
      <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>You opened this dispute on May 4. After reviewing the evidence — agent logs, vendor manifest, your callback responses — the dispute team ruled in your favor.</p>
      <div style={{ marginTop: 18, padding: 18, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Refund</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, color: palette.accent }}>+1,240⚡</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Vendor</div>
            <div style={{ fontSize: 13 }}>Aurora Labs · ai-closer@2.1</div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6, marginTop: 18 }}>The vendor has been notified. Their dispute rate metric updated automatically. No further action needed from you.</p>
    </>
  );

  const PreviewInvoice = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: '0 0 6px 0', color: palette.text }}>Invoice INV-2026-0142</h1>
      <div style={{ fontSize: 13, color: palette.textDim }}>Period: April 1–30, 2026 · Acme Inc</div>
      <div style={{ marginTop: 18, padding: 0, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Power pack · Pro · 100,000⚡',           '€899.00'],
              ['Auto top-up · 20,000⚡',                  '€180.00'],
              ['SLA refunds (credit)',                    '−€38.20'],
              ['Subtotal',                                '€1,040.80'],
              ['VAT · 19% DE',                            '€197.75'],
              ['Net (paid Visa •••• 4242)',               '€1,238.55'],
            ].map((r, i, arr) => (
              <tr key={r[0]} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                <td style={{ padding: '10px 14px', color: i >= arr.length - 3 ? palette.text : palette.textDim, fontFamily: i === 2 ? 'Geist Mono, monospace' : 'inherit', fontWeight: i >= arr.length - 3 ? 600 : 400 }}>{r[0]}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'Geist Mono, monospace', color: r[1].startsWith('−') ? palette.accent : palette.text, fontWeight: i === arr.length - 1 ? 600 : 400 }}>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const PreviewVendorPaid = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: '0 0 14px 0', color: palette.text }}>€2,142.18 is on its way.</h1>
      <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>Your April payout for <strong>nudge / ai-sdr</strong> has been initiated. Funds typically arrive in 24h via SEPA.</p>
      <div style={{ marginTop: 18, padding: 18, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          ['Power burned', '270,400⚡'],
          ['Gross',        '€2,434.06'],
          ['Net (88%)',    '€2,142.18'],
        ].map(s => (
          <div key={s[0]}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>{s[0]}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 500, color: palette.text, marginTop: 4 }}>{s[1]}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6, marginTop: 18 }}>Invoice issued automatically · DE-VAT compliant · PDF and UBL XML attached.</p>
    </>
  );

  const PreviewSlaRefund = () => (
    <>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: '0 0 14px 0', color: palette.text }}>SLA missed → 840⚡ refunded.</h1>
      <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>AI Closer v2.1 ran 14 calls between 14:00–15:00 UTC. 2 timed out past the manifest's 30s ceiling. Per the vendor's declared SLA, every breached call refunds 2× its Power.</p>
      <div style={{ marginTop: 18, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['Calls', '14'], ['Breaches', '2'], ['Refunded', '+840⚡']].map(s => (
            <div key={s[0]}>
              <div style={{ color: palette.textMute, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>{s[0]}</div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: s[0] === 'Refunded' ? palette.accent : palette.text, marginTop: 4 }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6, marginTop: 18 }}>Refund is live in your ledger. Vendor is auto-notified. No tickets, no chase.</p>
    </>
  );

  const previewMap = { welcome: PreviewWelcome, 'low-power': PreviewLowPower, dispute: PreviewDispute, invoice: PreviewInvoice, 'vendor-paid': PreviewVendorPaid, 'sla-refund': PreviewSlaRefund };

  const Page = () => {
    const [selected, setSelected] = React.useState('welcome');
    const e = EMAILS.find(x => x.id === selected);
    const Body = previewMap[e.body];

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 40px 32px' }}>
            <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Internal · template gallery</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 600, letterSpacing: -1.8, margin: 0 }}>Transactional email · design library.</h1>
            <p style={{ fontSize: 15, color: palette.textDim, marginTop: 14, maxWidth: 680, lineHeight: 1.55 }}>Every system message a customer receives. Sent via Postmark, EU-resident, no tracking pixels. Click a template on the left to preview as it lands in an inbox.</p>
          </div>

          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            {/* List */}
            <div style={{ display: 'grid', gap: 6, alignSelf: 'flex-start', position: 'sticky', top: 32 }}>
              {EMAILS.map(em => (
                <button key={em.id} onClick={() => setSelected(em.id)} style={{ textAlign: 'left', padding: 14, borderRadius: 10, background: selected === em.id ? palette.accentDim : 'var(--p-inset-soft)', border: `1px solid ${selected === em.id ? palette.accent : palette.border}`, color: palette.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: selected === em.id ? palette.accent : palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>{em.trigger}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{em.subject}</div>
                  <div style={{ fontSize: 11, color: palette.textDim, marginTop: 4 }}>{em.preheader}</div>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div>
              {/* Inbox bar */}
              <Glass style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, fontSize: 12 }}>
                  <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>From</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace' }}>{e.from}</span>
                  <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>To</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace' }}>{e.to}</span>
                  <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>Subject</span>
                  <span style={{ fontWeight: 600 }}>{e.subject}</span>
                  <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>Trigger</span>
                  <span style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace' }}>{e.trigger}</span>
                </div>
              </Glass>

              {/* Email body */}
              <Glass style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 28px', borderBottom: `1px solid ${palette.border}`, background: 'var(--p-inset-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Logo />
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>hirespawn.io</span>
                </div>
                <div style={{ padding: 36 }}>
                  <Body />
                  <div style={{ marginTop: 28 }}>
                    <a href="#/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <button style={{ padding: '12px 22px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{e.cta}</button>
                    </a>
                  </div>
                </div>
                <div style={{ padding: '20px 28px', borderTop: `1px solid ${palette.border}`, background: 'var(--p-inset-soft)', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 0.5, lineHeight: 1.6 }}>
                  Hirespawn GmbH · Friedrichstraße 88, 10117 Berlin, DE · USt-IdNr. DE 814 421 098<br/>
                  Sent because you opted into transactional alerts · <a href="#" style={{ color: palette.textDim }}>preferences</a> · <a href="#" style={{ color: palette.textDim }}>unsubscribe</a> (transactional only — required messages still apply)
                </div>
              </Glass>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Emails.Page;
