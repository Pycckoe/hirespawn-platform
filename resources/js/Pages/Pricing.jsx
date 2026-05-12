import '@/setup';
import { usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Pricing standalone page — reads `powerPacks` from PageController@pricing.
const Pricing = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const Page = () => {
    const { powerPacks = [] } = usePage().props;
    const PACKS = powerPacks;
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />
          {/* Hero */}
          <div style={{ padding: '80px 40px 32px', maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
            <Pill dot={palette.accent} style={{ marginBottom: 18 }}>Pay-per-Power · no subscriptions, ever</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 88, lineHeight: 0.96, fontWeight: 600, letterSpacing: -3, margin: 0 }}>One unit. <span style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.accent }}>Power.</span></h1>
            <p style={{ fontSize: 18, color: palette.textDim, marginTop: 22, maxWidth: 680, marginInline: 'auto', lineHeight: 1.5 }}>Buy Power upfront. Burn it when agents run. Cheaper at volume. Never expires. Refundable for 14 days, no questions.</p>
          </div>

          {/* Packs */}
          <div style={{ padding: '40px 40px', maxWidth: 1380, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {PACKS.map(p => (
                <Glass key={p.name} style={{ padding: 28, position: 'relative', border: p.popular ? `1.5px solid ${palette.accent}` : undefined }}>
                  {p.popular && <div style={{ position: 'absolute', top: -10, left: 22, padding: '3px 10px', background: palette.accent, color: palette.onAccent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>MOST POPULAR</div>}
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{p.name}</div>
                  {p.custom ? (
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 500, marginTop: 8, letterSpacing: -1.2 }}>Custom</div>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 500, marginTop: 8, letterSpacing: -1.2, lineHeight: 1 }}>€{p.eur.toLocaleString()}</div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent, marginTop: 6 }}>{(p.power/1000).toLocaleString()}k⚡ · €{p.perPower.toFixed(4)}/⚡</div>
                    </>
                  )}
                  <div style={{ marginTop: 14, fontSize: 12, color: palette.textDim, lineHeight: 1.5, minHeight: 56 }}>{p.audience}</div>
                  <a href={p.custom ? '#/about' : '#/power'} style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: 12, borderRadius: 10, background: p.popular ? palette.accent : 'transparent', border: p.popular ? 0 : `1px solid ${palette.borderStrong}`, color: p.popular ? palette.onAccent : palette.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginTop: 18 }}>{p.custom ? 'Talk to sales →' : 'Get started →'}</button>
                  </a>
                  <div style={{ borderTop: `1px solid ${palette.border}`, marginTop: 22, paddingTop: 16, display: 'grid', gap: 10 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: palette.textDim, lineHeight: 1.45 }}>
                        <span style={{ color: palette.accent, flexShrink: 0 }}>✓</span><span>{f}</span>
                      </div>
                    ))}
                  </div>
                </Glass>
              ))}
            </div>
          </div>

          {/* Power explainer */}
          <div style={{ padding: '60px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 32, alignItems: 'center' }}>
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>How Power works</Pill>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: 0 }}>One ⚡ = one unit of agent work.</h2>
                  <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55, marginTop: 14 }}>Each agent declares its Power burn upfront. A simple lookup is 4⚡. A research-heavy task with web browsing and multi-step planning might be 250⚡. You always know before you run.</p>
                  <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                    {[
                      { k: '◇', t: 'Per-task billing',   d: 'Agent runs → Power burns → audit log. No invoices, no metering, no anxiety.' },
                      { k: '◈', t: 'Volume discount',    d: 'Buy more, pay less per ⚡. The Scale pack is 20% cheaper than Starter.' },
                      { k: '◉', t: 'Refunds in Power',   d: 'SLA breach? Auto-refunded as Power within 48h. No customer-support tickets.' },
                      { k: '◐', t: 'Never expires',      d: 'Power rolls over forever. No reset, no rotation, no "use it or lose it".' },
                    ].map(b => (
                      <div key={b.t} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.k}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.t}</div>
                          <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>{b.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'var(--p-inset)', borderRadius: 14, padding: 22, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Reference burn rates</div>
                  {[
                    { a: 'AI SDR · 1 outbound email',   p: '47⚡', e: '€0.42' },
                    { a: 'AI Enricher · 1 lead lookup', p: '8⚡',  e: '€0.07' },
                    { a: 'AI QA · 1 regression suite',  p: '23⚡', e: '€0.20' },
                    { a: 'AI Closer · 1 follow-up',     p: '89⚡', e: '€0.79' },
                    { a: 'AI Researcher · 1 brief',     p: '124⚡', e: '€1.10' },
                    { a: 'AI Steward · 1 dedupe batch', p: '67⚡', e: '€0.59' },
                  ].map((r, i, arr) => (
                    <div key={r.a} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                      <span style={{ color: palette.text, fontFamily: 'Inter, sans-serif', fontSize: 13 }}>{r.a}</span>
                      <span style={{ color: palette.accent, textAlign: 'right' }}>{r.p}</span>
                      <span style={{ color: palette.textDim, textAlign: 'right' }}>{r.e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
          </div>

          {/* Comparison table */}
          <div style={{ padding: '40px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: 0, marginBottom: 24 }}>Compare packs side-by-side.</h2>
            <Glass style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--p-inset)' }}>
                    {['', 'Starter', 'Pro', 'Scale', 'Fleet'].map(h => (
                      <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', borderBottom: `1px solid ${palette.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Price',                  '€249',      '€899',     '€3,999',   'Custom'],
                    ['Power',                  '25k⚡',     '100k⚡',   '500k⚡',   'Unlimited'],
                    ['Approx runs / month',    '~ 400',     '~ 1,700',  '~ 8,500',  'unlimited'],
                    ['€/⚡',                   '0.0099',    '0.0089',   '0.0079',   'custom'],
                    ['Log retention',          '90d',       '180d',     '365d',     'custom'],
                    ['SSO',                    '—',         '✓',        '✓',        '✓'],
                    ['Audit log',              '—',         '✓',        '✓',        '✓'],
                    ['Custom data residency',  '—',         '—',        '✓',        '✓'],
                    ['SLA refunds in €',       '—',         '—',        '✓',        '✓'],
                    ['Dedicated CSM',          '—',         '—',        '✓',        '✓'],
                    ['On-prem gateway',        '—',         '—',        '—',        '✓'],
                    ['Phone support',          '—',         '—',        '—',        '24/7'],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${palette.border}` }}>
                      {row.map((c, j) => (
                        <td key={j} style={{ padding: '12px 18px', color: j === 0 ? palette.textDim : (c === '—' ? palette.textMute : palette.text), fontWeight: j === 0 ? 500 : 400, fontFamily: j === 0 ? 'Inter, sans-serif' : 'Geist Mono, monospace' }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Glass>
          </div>

          {/* FAQ */}
          <div style={{ padding: '60px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: 0, marginBottom: 24 }}>Questions you have right now.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { q: 'Does Power expire?',                       a: 'Never. Buy 100k⚡ today, use it in 4 years if you want.' },
                { q: 'Can I refund unused Power?',               a: 'Within 14 days of purchase — full refund, no questions.' },
                { q: 'How is Power priced per ⚡?',              a: 'Volume discount. Starter is €0.0099 · Fleet drops below €0.007.' },
                { q: 'What if a run fails?',                     a: 'Auto-refunded as Power within 48h. No support tickets.' },
                { q: 'Do you offer annual contracts?',           a: 'For Scale and Fleet, yes. 12% off if you commit to 12 months.' },
                { q: 'EU billing? Invoices? VAT?',               a: 'Yes — VAT-compliant invoices, SEPA, wire, AP-system friendly.' },
              ].map(f => (
                <Glass key={f.q} style={{ padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.q}</div>
                  <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.55, marginTop: 6 }}>{f.a}</div>
                </Glass>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '40px 40px 100px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 60, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(180,242,91,0.18), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <Pill dot={palette.accent} style={{ marginBottom: 16 }}>5,000⚡ free on signup · no card required</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 52, fontWeight: 600, letterSpacing: -1.8, margin: 0 }}>Start burning Power today.</h2>
                <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <a href="#/auth?mode=signup" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '14px 28px', borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Enlist · 5,000⚡ free →</button>
                  </a>
                  <a href="#/power" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '14px 28px', borderRadius: 12, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>Buy a pack now →</button>
                  </a>
                </div>
              </div>
            </Glass>
          </div>

          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Pricing.Page;
