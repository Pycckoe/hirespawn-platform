import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Buy Power / Checkout page — Stripe-style 2-column checkout
const PowerCheckout = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const PACKS = [
    { name: 'Starter', power: 25000, eur: 249, perPower: 0.0099 },
    { name: 'Pro',     power: 100000, eur: 899, perPower: 0.0089, popular: true },
    { name: 'Scale',   power: 500000, eur: 3999, perPower: 0.0079 },
    { name: 'Fleet',   power: 2000000, eur: 13999, perPower: 0.0070 },
  ];

  const Page = () => {
    const [pack, setPack] = React.useState('Pro');
    const [auto, setAuto] = React.useState(true);
    const [card, setCard] = React.useState('•••• 4242');
    const chosen = PACKS.find(p => p.name === pack);
    const vat = +(chosen.eur * 0.20).toFixed(2);
    const total = chosen.eur + vat;

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* TopBar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
              <span style={{ color: palette.textMute }}>/</span>
              <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Buy Power</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Secure · 256-bit TLS · Stripe</span>
              <ThemeToggle size={32} />
            </div>
          </div>

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36 }}>
            {/* Left — pack selection */}
            <div>
              <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 1 of 2 · Pick a pack</Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 48, fontWeight: 600, letterSpacing: -1.5, margin: 0, lineHeight: 1.05 }}>Buy Power.<br/><span style={{ color: palette.textDim }}>Burn it when ready.</span></h1>
              <p style={{ fontSize: 15, color: palette.textDim, marginTop: 12, marginBottom: 28, lineHeight: 1.55, maxWidth: 540 }}>One-time purchase. Power never expires, rolls over forever, and works across every agent in your workspace.</p>

              <div style={{ display: 'grid', gap: 12 }}>
                {PACKS.map(p => {
                  const sel = pack === p.name;
                  return (
                    <div key={p.name} onClick={() => setPack(p.name)} style={{ padding: 22, borderRadius: 14, background: sel ? 'rgba(180,242,91,0.08)' : palette.glass, border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 18, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${sel ? palette.accent : palette.border}`, background: sel ? palette.accent : 'transparent', position: 'relative' }}>
                        {sel && <div style={{ position: 'absolute', inset: 4, borderRadius: 99, background: palette.onAccent }} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600 }}>{p.name}</div>
                          {p.popular && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, padding: '2px 7px', background: palette.accentDim, borderRadius: 4, letterSpacing: 1 }}>POPULAR</span>}
                        </div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, marginTop: 4 }}>{(p.power/1000).toLocaleString()}k⚡ · €{p.perPower.toFixed(4)} per ⚡</div>
                      </div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>€{p.eur.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, padding: 18, background: 'var(--p-inset-soft)', borderRadius: 12, border: `1px solid ${palette.border}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} style={{ accentColor: palette.accent }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Auto top-up when balance drops below 10%</div>
                    <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>Same pack, same card. Cancel anytime from settings.</div>
                  </div>
                </label>
              </div>

              <div style={{ marginTop: 28 }}>
                <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 2 of 2 · Payment</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>Pay with</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                  {[{ k: 'card', l: 'Card', ic: '◇' }, { k: 'wire', l: 'Wire transfer', ic: '◈' }, { k: 'invoice', l: 'Invoice (NET-30)', ic: '◉' }].map((m, i) => (
                    <div key={m.k} style={{ padding: 14, borderRadius: 10, background: i === 0 ? palette.accentDim : 'var(--p-inset-soft)', border: `1.5px solid ${i === 0 ? palette.accent : palette.border}`, cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 18, color: palette.accent, marginBottom: 4 }}>{m.ic}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>
                  <span>VISA · {card}</span>
                  <span style={{ color: palette.textMute, fontSize: 11 }}>exp 09/29 · default</span>
                </div>
              </div>
            </div>

            {/* Right — order summary, sticky */}
            <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
              <Glass style={{ padding: 28 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Order summary</div>
                <div style={{ marginTop: 16, padding: '20px 0', borderBottom: `1px solid ${palette.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{chosen.name} pack</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14 }}>€{chosen.eur.toLocaleString()}</span>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, marginTop: 4 }}>{(chosen.power/1000).toLocaleString()}k⚡ delivered instantly</div>
                </div>
                <div style={{ padding: '14px 0', borderBottom: `1px solid ${palette.border}`, display: 'grid', gap: 8 }}>
                  {[
                    { l: 'Subtotal',  v: `€${chosen.eur.toLocaleString()}` },
                    { l: 'VAT (20%)', v: `€${vat.toLocaleString()}` },
                    { l: 'Auto top-up',v: auto ? 'enabled' : 'off' },
                  ].map(r => (
                    <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>
                      <span>{r.l}</span><span style={{ color: palette.text }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: palette.textDim }}>Total today</span>
                  <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, letterSpacing: -1 }}>€{total.toLocaleString()}</span>
                </div>
                <button style={{ width: '100%', padding: 14, borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Pay €{total.toLocaleString()} →</button>
                <div style={{ marginTop: 14, fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Refund within 14d · No questions asked</div>

                <div style={{ marginTop: 24, padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>After purchase</div>
                  <div style={{ display: 'grid', gap: 6, fontSize: 12, color: palette.textDim }}>
                    <span>→ Power credited within 60 seconds</span>
                    <span>→ Invoice emailed to billing@acme.com</span>
                    <span>→ Slack #hirespawn-billing pinged</span>
                    <span>→ Audit log entry on workspace</span>
                  </div>
                </div>
              </Glass>

              <div style={{ marginTop: 14, padding: '14px 18px', background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px dashed ${palette.border}`, fontSize: 12, color: palette.textDim, lineHeight: 1.55 }}>
                Need a custom volume contract or wire payment over €50,000? <a href="#/about" style={{ color: palette.accent, textDecoration: 'none' }}>Talk to sales →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default PowerCheckout.Page;
