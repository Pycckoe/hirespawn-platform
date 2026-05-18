import '@/setup';
import { useState, useMemo } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Buy Power / Checkout page — reads `powerPacks` from PageController@power.
// The buyer can either pick a pre-set pack (volume discount) or enter a
// free-form amount in € (billed at the lowest-tier rate). Submission
// POSTs to /power/checkout which creates a pending Invoice.
const PowerCheckout = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  // Synthetic "custom amount" choice that sits at the end of the pack
  // list. We don't store it as a DB row — its rate is derived from the
  // cheapest priced pack so volume tiers still incentivise commitment.
  const CUSTOM_KEY = '__custom__';

  const Page = () => {
    const { powerPacks = [] } = usePage().props;
    const settings = usePage().props?.cms?.settings || {};
    // All thresholds + tax rate are read from /admin/site-settings.
    const minTopupEur = parseInt(settings.min_topup_eur, 10) || 5;
    const maxTopupEur = parseInt(settings.max_topup_eur, 10) || 50000;
    const vatPct = parseFloat(settings.vat_rate_pct) || 20;
    const vatFraction = vatPct / 100;

    // Pre-set packs only (strip "Talk to sales" custom-priced rows).
    const PACKS = powerPacks.filter(p => p.price !== null && p.price !== undefined);

    // Rate for free-form amounts — Starter tier (highest €/⚡); falls
    // back to 0.0099 if nothing is seeded.
    const customRate = PACKS[0]?.perPower || 0.0099;

    const defaultPack = PACKS.find(p => p.popular)?.name || PACKS[0]?.name || CUSTOM_KEY;
    const [pack, setPack] = useState(defaultPack);

    // Custom-amount state. Keeps eur as the source of truth; power is
    // derived. Eur is a string so the user can type freely without React
    // fighting the cursor (we coerce on submit).
    const [customEur, setCustomEur] = useState(50);
    const customPower = useMemo(
      () => customRate > 0 ? Math.max(0, Math.floor(customEur / customRate)) : 0,
      [customEur, customRate]
    );

    const isCustom = pack === CUSTOM_KEY;
    const chosen = isCustom
      ? { name: 'Custom', eur: customEur, power: customPower, perPower: customRate, slug: null }
      : (PACKS.find(p => p.name === pack) || PACKS[0] || { name: 'Pack', eur: 0, power: 0, perPower: 0, slug: null });

    const eurNum = +chosen.eur || 0;
    const vat = +(eurNum * vatFraction).toFixed(2);
    const total = +(eurNum + vat).toFixed(2);

    const tooSmall = isCustom && customEur < minTopupEur;
    const tooBig = isCustom && customEur > maxTopupEur;

    const { post, processing, errors } = useForm({});

    const submit = (e) => {
      e.preventDefault();
      if (tooSmall || tooBig) return;
      const payload = isCustom
        ? { amount_cents: Math.round(customEur * 100) }
        : { pack_slug: chosen.slug || chosen.name?.toLowerCase() };
      post(route('power.checkout'), { data: payload, preserveScroll: true });
    };

    return (
      <form onSubmit={submit} style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* TopBar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
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
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>€{(+p.eur).toLocaleString()}</div>
                    </div>
                  );
                })}

                {/* Custom-amount tile — sits at end of pack list. Selecting
                    it expands a € input + live ⚡ readout below. Bidirectional:
                    typing in either field updates the other. */}
                <div onClick={() => setPack(CUSTOM_KEY)} style={{ padding: 22, borderRadius: 14, background: isCustom ? 'rgba(180,242,91,0.08)' : palette.glass, border: `1.5px dashed ${isCustom ? palette.accent : palette.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 18, alignItems: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${isCustom ? palette.accent : palette.border}`, background: isCustom ? palette.accent : 'transparent', position: 'relative' }}>
                      {isCustom && <div style={{ position: 'absolute', inset: 4, borderRadius: 99, background: palette.onAccent }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600 }}>Custom amount</div>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.cyan, padding: '2px 7px', background: 'rgba(125,211,255,0.12)', borderRadius: 4, letterSpacing: 1 }}>FLEXIBLE</span>
                      </div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, marginTop: 4 }}>Pay any amount from €{minTopupEur} · billed at €{customRate.toFixed(4)} per ⚡</div>
                    </div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 16, color: palette.textDim }}>you choose</div>
                  </div>

                  {isCustom && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 18, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>You pay (€)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 8 }}>
                          <span style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 14 }}>€</span>
                          <input
                            type="number"
                            step="1"
                            min={minTopupEur}
                            max={maxTopupEur}
                            value={customEur}
                            onChange={e => setCustomEur(Math.max(0, +e.target.value || 0))}
                            style={{ flex: 1, border: 0, background: 'transparent', color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 16, outline: 'none' }}
                          />
                        </div>
                      </label>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, paddingTop: 18 }}>buys</div>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>You get (⚡)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 8 }}>
                          <input
                            type="number"
                            step="1"
                            min={0}
                            value={customPower}
                            onChange={e => {
                              const p = Math.max(0, +e.target.value || 0);
                              setCustomEur(+(p * customRate).toFixed(2));
                            }}
                            style={{ flex: 1, border: 0, background: 'transparent', color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 16, outline: 'none' }}
                          />
                          <span style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 14 }}>⚡</span>
                        </div>
                      </label>
                      {(tooSmall || tooBig || errors.amount_cents) && (
                        <div style={{ gridColumn: '1 / -1', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.red }}>
                          {tooSmall && `Minimum top-up is €${minTopupEur}.`}
                          {tooBig && `Maximum self-serve top-up is €${maxTopupEur.toLocaleString()}. For larger volumes contact sales.`}
                          {errors.amount_cents && ` ${errors.amount_cents}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textMute, lineHeight: 1.55 }}>
                  Card processing connects to Stripe at checkout. You'll be redirected after clicking the button.
                </div>
              </div>
            </div>

            {/* Right — order summary, sticky */}
            <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
              <Glass style={{ padding: 28 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Order summary</div>
                <div style={{ marginTop: 16, padding: '20px 0', borderBottom: `1px solid ${palette.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{chosen.name}{isCustom ? ' top-up' : ' pack'}</span>
                    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14 }}>€{(+chosen.eur).toLocaleString()}</span>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, marginTop: 4 }}>{chosen.power.toLocaleString()}⚡ credited once payment clears</div>
                </div>
                <div style={{ padding: '14px 0', borderBottom: `1px solid ${palette.border}`, display: 'grid', gap: 8 }}>
                  {[
                    { l: 'Subtotal',         v: `€${(+chosen.eur).toLocaleString()}` },
                    { l: `VAT (${vatPct}%)`, v: `€${vat.toLocaleString()}` },
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
                <button
                  type="submit"
                  disabled={processing || tooSmall || tooBig || total <= 0}
                  style={{ width: '100%', padding: 14, borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: (processing || tooSmall || tooBig) ? 'not-allowed' : 'pointer', opacity: (processing || tooSmall || tooBig || total <= 0) ? 0.5 : 1 }}
                >
                  {processing ? 'Processing…' : `Pay €${total.toLocaleString()} →`}
                </button>
                <div style={{ marginTop: 14, fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Refund within 14d · No questions asked</div>

                <div style={{ marginTop: 24, padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>After purchase</div>
                  <div style={{ display: 'grid', gap: 6, fontSize: 12, color: palette.textDim }}>
                    <span>→ Power credited once payment settles</span>
                    <span>→ Invoice visible at /console under Billing</span>
                    <span>→ Audit log entry on workspace</span>
                  </div>
                </div>
              </Glass>

              <div style={{ marginTop: 14, padding: '14px 18px', background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px dashed ${palette.border}`, fontSize: 12, color: palette.textDim, lineHeight: 1.55 }}>
                Need a custom volume contract or wire payment over €{maxTopupEur.toLocaleString()}? <Link href="/about" style={{ color: palette.accent, textDecoration: 'none' }}>Talk to sales →</Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  };

  return { Page };
})();

export default PowerCheckout.Page;
