import '@/setup';
import { Link } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Hire / Deploy flow — agent-specific configuration wizard
const Hire = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Page = () => {
    const [step, setStep] = React.useState(0);
    const [version, setVersion] = React.useState('2.4.1');
    const [budget, setBudget] = React.useState(5000);
    const [scopes, setScopes] = React.useState({ 'crm:read': true, 'crm:write': true, 'email:send': true, 'web:browse': true });
    const [env, setEnv] = React.useState({ tone: 'consultative', cadence: '3-step', target_persona: 'Head of Eng', signature: 'Eva @ Acme' });
    const next = () => setStep(s => Math.min(3, s + 1));
    const back = () => setStep(s => Math.max(0, s - 1));

    const STEPS = ['Version', 'Scopes', 'Config', 'Dry run'];

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* TopBar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
              <span style={{ color: palette.textMute }}>/</span>
              <Link href="/roster" style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Roster</Link>
              <span style={{ color: palette.textMute }}>/</span>
              <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Hire · AI SDR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Balance · <span style={{ color: palette.accent }}>78,200⚡</span></span>
              <ThemeToggle size={32} />
            </div>
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
            {/* Agent banner */}
            <Glass style={{ padding: 24, marginBottom: 20, display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◈</div>
              <div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>O-3 · Captain · ★ 4.83 · 12,847 deployed</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 600, marginTop: 4 }}>AI SDR · v{version}</div>
                <div style={{ fontSize: 13, color: palette.textDim, marginTop: 2 }}>by Acme AI · outbound prospecting · p95 1.5s · 47⚡ avg</div>
              </div>
              <a href="#/agent/sdr-pro" style={{ padding: '10px 18px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>View specs →</a>
            </Glass>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 99, background: i <= step ? palette.accent : 'var(--p-track)', color: i <= step ? palette.onAccent : palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i < step ? '✓' : i + 1}</div>
                    <span style={{ fontSize: 13, color: i <= step ? palette.text : palette.textMute }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? palette.accent : palette.border }} />}
                </React.Fragment>
              ))}
            </div>

            <Glass style={{ padding: 36 }}>
              {step === 0 && (
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Step 1 · Pin version</div>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: 0 }}>Which version do you trust?</h2>
                  <p style={{ color: palette.textDim, fontSize: 14, marginTop: 8, marginBottom: 24 }}>Pin to a version — if the vendor ships v2.5, you stay on 2.4 until you say otherwise. Float on @latest to auto-track.</p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[
                      { v: '2.4.1', d: 'today', n: 'Latest stable · 99.6% rolled out', tag: 'stable' },
                      { v: '2.4.0', d: '11 days ago', n: 'Stable · 100% rolled out', tag: 'stable' },
                      { v: '2.3.4', d: '42 days ago', n: 'Older stable · LTS until Aug 2026', tag: 'lts' },
                      { v: '@latest', d: 'rolling', n: 'Floats to newest. Recommended for non-critical workloads.', tag: 'floating' },
                    ].map(o => {
                      const sel = version === o.v;
                      return (
                        <div key={o.v} onClick={() => setVersion(o.v)} style={{ padding: 18, borderRadius: 12, background: sel ? 'rgba(180,242,91,0.08)' : 'var(--p-inset-soft)', border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 600 }}>{o.v}</div>
                              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, padding: '2px 7px', background: palette.accentDim, borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{o.tag}</span>
                            </div>
                            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>{o.n}</div>
                          </div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{o.d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Step 2 · Scopes</div>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: 0 }}>What can this agent touch?</h2>
                  <p style={{ color: palette.textDim, fontSize: 14, marginTop: 8, marginBottom: 24 }}>The manifest requests these scopes. Deny any one — agent refuses runs that need it.</p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      { s: 'crm:read',   d: 'Read accounts, contacts, opportunities from your CRM' },
                      { s: 'crm:write',  d: 'Enrich CRM records · schedule cadences · log activities' },
                      { s: 'email:send', d: 'Send email on your behalf via Gmail/Outlook OAuth' },
                      { s: 'web:browse', d: 'Browse public web pages, parse content (no logged-in pages)' },
                      { s: 'slack:read', d: 'Read mentioned messages from #sales-ops · not requested' },
                    ].map(sc => {
                      const requested = sc.s !== 'slack:read';
                      const on = scopes[sc.s];
                      return (
                        <label key={sc.s} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}`, cursor: requested ? 'pointer' : 'default', opacity: requested ? 1 : 0.5 }}>
                          <input type="checkbox" disabled={!requested} checked={!!on} onChange={e => setScopes({ ...scopes, [sc.s]: e.target.checked })} style={{ accentColor: palette.accent }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent }}>{sc.s}</div>
                            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>{sc.d}</div>
                          </div>
                          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: requested ? palette.amber : palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{requested ? 'requested' : 'not requested'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Step 3 · Configure</div>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: 0 }}>Tune the brain.</h2>
                  <p style={{ color: palette.textDim, fontSize: 14, marginTop: 8, marginBottom: 24 }}>These knobs are exposed by the agent's manifest. Sensible defaults are pre-filled.</p>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { k: 'tone',            l: 'Tone of voice',     opts: ['consultative', 'punchy', 'casual', 'formal'] },
                      { k: 'cadence',         l: 'Outreach cadence',   opts: ['1-step', '3-step', '5-step', '7-step'] },
                      { k: 'target_persona',  l: 'Target persona',     free: true },
                      { k: 'signature',       l: 'Email signature',    free: true },
                    ].map(f => (
                      <div key={f.k} style={{ padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{f.l}</div>
                        {f.free ? (
                          <input value={env[f.k]} onChange={e => setEnv({ ...env, [f.k]: e.target.value })} style={{ width: '100%', marginTop: 8, padding: 8, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {f.opts.map(o => (
                              <button key={o} onClick={() => setEnv({ ...env, [f.k]: o })} style={{ padding: '6px 10px', borderRadius: 6, background: env[f.k] === o ? palette.accentDim : 'transparent', border: `1px solid ${env[f.k] === o ? palette.accent : palette.border}`, color: env[f.k] === o ? palette.accent : palette.textDim, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>{o}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, padding: 16, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Monthly Power budget · {budget.toLocaleString()}⚡</div>
                    <input type="range" min={500} max={50000} step={500} value={budget} onChange={e => setBudget(+e.target.value)} style={{ width: '100%', accentColor: palette.accent }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
                      <span>Agent pauses at cap · email + Slack alert at 80%</span>
                      <span>≈ €{(budget * 0.0089).toFixed(0)}/mo</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Step 4 · Dry run</div>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: -0.8, margin: 0 }}>Test before you wire to prod.</h2>
                  <p style={{ color: palette.textDim, fontSize: 14, marginTop: 8, marginBottom: 24 }}>One free dry-run on a sandbox account. Output is a draft only — no CRM writes, no emails sent.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ padding: 18, background: 'var(--p-inset-soft)', borderRadius: 12, border: `1px solid ${palette.border}` }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Input · sandbox account</div>
                      <pre style={{ margin: 0, fontFamily: 'Geist Mono, monospace', fontSize: 11, lineHeight: 1.6, color: palette.text, whiteSpace: 'pre-wrap' }}>{`{ "account": { "domain": "example.com", "persona": "${env.target_persona}" }, "brief": "Generic ICP test" }`}</pre>
                    </div>
                    <div style={{ padding: 18, background: 'var(--p-inset)', borderRadius: 12, border: `1px solid ${palette.accentDim}` }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Output · simulated</div>
                      <div style={{ fontSize: 13, color: palette.text, lineHeight: 1.55 }}>Hi {env.target_persona.split(' ')[0] || 'there'} — A few of our customers at companies like example.com have asked how we'd think about the EU rollout space. Happy to share what we've seen if useful. Would 20m on Thursday work?</div>
                      <div style={{ marginTop: 12, display: 'flex', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
                        <span>Latency · <span style={{ color: palette.accent }}>1.8s</span></span>
                        <span>Burned · <span style={{ color: palette.accent }}>52⚡</span></span>
                        <span>Tokens · 1,344 / 178</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 24, padding: 20, background: 'rgba(180,242,91,0.06)', borderRadius: 12, border: `1px solid ${palette.accentDim}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                      <div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Ready to deploy</div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, marginTop: 6 }}>AI SDR · v{version} · {budget.toLocaleString()}⚡/mo</div>
                        <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>{Object.values(scopes).filter(Boolean).length} scopes granted · {Object.keys(env).length} env vars set</div>
                      </div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, textAlign: 'right' }}>
                        First run free · cancel anytime<br/>Agent appears on console instantly
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: `1px solid ${palette.border}` }}>
                <button onClick={back} disabled={step === 0} style={{ padding: '12px 22px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: step === 0 ? palette.textMute : palette.text, fontSize: 14, fontFamily: 'inherit', cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.5 : 1 }}>← Back</button>
                {step < 3 ? (
                  <button onClick={next} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Continue →</button>
                ) : (
                  <a href="#/console" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '12px 28px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Deploy · spawn agent →</button>
                  </a>
                )}
              </div>
            </Glass>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Hire.Page;
