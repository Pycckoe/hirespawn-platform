import '@/setup';
import { useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// 4-step onboarding wizard: Workspace → Power pack → First agent → Deploy.
// Reads `powerPacks`, `starterAgents`, `defaults`, `welcomeBonus` from
// OnboardingController@show and submits to OnboardingController@store.
const Onboarding = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;
  const STEPS = [
    { k: 'workspace', label: 'Workspace' },
    { k: 'power',     label: 'Buy Power' },
    { k: 'agent',     label: 'Hire agent' },
    { k: 'deploy',    label: 'Deploy' },
  ];

  const Page = () => {
    const { powerPacks = [], starterAgents = [], defaults = {}, welcomeBonus = 5000 } = usePage().props;

    const [step, setStep] = React.useState(0);
    const { data, setData, post, processing, errors } = useForm({
      workspace: defaults.workspace || '',
      pack: defaults.pack || (powerPacks[0]?.slug ?? ''),
      agent: defaults.agentId || (starterAgents[0]?.id ?? ''),
    });

    const next = () => setStep(s => Math.min(3, s + 1));
    const back = () => setStep(s => Math.max(0, s - 1));
    const submit = () => post(route('onboarding.store'));

    const chosenAgent = starterAgents.find(a => a.id === data.agent) || starterAgents[0];
    const chosenPack = powerPacks.find(p => p.slug === data.pack) || powerPacks[0];

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href={route('home')} style={{ textDecoration: 'none' }}><Logo /></a>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ enlistment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle size={32} />
            <a href={route('console')} style={{ fontSize: 12, color: palette.textMute, textDecoration: 'none' }}>Skip for now →</a>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 40px 0', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.k}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: i <= step ? palette.accent : 'var(--p-track)', color: i <= step ? palette.onAccent : palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>{i < step ? '✓' : i + 1}</div>
                  <span style={{ fontSize: 13, color: i <= step ? palette.text : palette.textMute, fontWeight: i === step ? 600 : 400 }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? palette.accent : palette.border, transition: 'background 0.3s' }} />}
              </React.Fragment>
            ))}
          </div>

          <Glass style={{ padding: 48 }}>
            {step === 0 && (
              <div>
                <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Step 1 · Workspace</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Name your command center.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Workspaces are isolated — your agents, Power balance, runs, billing all live here.</p>
                <label>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Workspace name</div>
                  <input value={data.workspace} onChange={e => setData('workspace', e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'var(--p-inset)', border: `1px solid ${errors.workspace ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 16, outline: 'none' }} />
                  {errors.workspace && <div style={{ fontSize: 11, color: palette.red, marginTop: 6, fontFamily: 'Geist Mono, monospace' }}>{errors.workspace}</div>}
                </label>
                <div style={{ marginTop: 18, fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textMute }}>URL · <span style={{ color: palette.accent }}>{(data.workspace || 'workspace').toLowerCase().replace(/\s+/g,'-')}.hirespawn.io</span></div>
                <div style={{ marginTop: 22, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Defaults · editable later in Settings</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
                  {[{ l: 'Team size', v: '5–20' }, { l: 'Use case', v: 'Sales · Marketing' }, { l: 'Region', v: 'EU · West-1' }].map(c => (
                    <div key={c.l} style={{ padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}`, opacity: 0.7 }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{c.l}</div>
                      <div style={{ fontSize: 14, color: palette.textDim, marginTop: 4 }}>{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Step 2 · Power pack</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Buy your first Power pack.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Power burns per task. No subscription, no reset, no bs. <strong style={{ color: palette.accent }}>+{welcomeBonus.toLocaleString()}⚡ free</strong> on activation.</p>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, powerPacks.length || 1)}, 1fr)`, gap: 14 }}>
                  {powerPacks.map(p => {
                    const sel = data.pack === p.slug;
                    return (
                      <div key={p.slug} onClick={() => setData('pack', p.slug)} style={{ padding: 24, borderRadius: 14, background: sel ? 'rgba(180,242,91,0.08)' : 'var(--p-inset-soft)', border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                        {p.popular && <div style={{ position: 'absolute', top: -10, left: 18, padding: '3px 10px', background: palette.accent, color: palette.onAccent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>POPULAR</div>}
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{p.name}</div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, marginTop: 6, letterSpacing: -1 }}>{(p.power / 1000).toLocaleString()}k<span style={{ fontSize: 14, color: palette.textDim, marginLeft: 4 }}>⚡</span></div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, color: palette.text, marginTop: 4 }}>{p.eur != null ? `€${p.eur.toLocaleString()}` : 'Custom'}</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 4 }}>≈ €{(p.perPower || 0).toFixed(4)} per ⚡</div>
                      </div>
                    );
                  })}
                </div>
                {chosenPack && (
                  <div style={{ marginTop: 24, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Total today</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500 }}>{chosenPack.eur != null ? `€${chosenPack.eur}` : 'Custom'} <span style={{ fontSize: 13, color: palette.accent }}>+ {welcomeBonus.toLocaleString()}⚡ free</span></div>
                    </div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{(chosenPack.power + welcomeBonus).toLocaleString()}⚡ available immediately</div>
                  </div>
                )}
                {errors.pack && <div style={{ fontSize: 11, color: palette.red, marginTop: 10, fontFamily: 'Geist Mono, monospace' }}>{errors.pack}</div>}
              </div>
            )}

            {step === 2 && (
              <div>
                <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Step 3 · First hire</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Pick your first agent.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>You can swap, hire more, or fire any agent later from the console. We pre-selected the most popular for new operators.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {starterAgents.map(a => {
                    const sel = data.agent === a.id;
                    return (
                      <div key={a.id} onClick={() => setData('agent', a.id)} style={{ padding: 22, borderRadius: 14, background: sel ? 'rgba(180,242,91,0.08)' : 'var(--p-inset-soft)', border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>{a.name}</div>
                          <div style={{ fontSize: 13, color: palette.textDim, marginTop: 2 }}>{a.role}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, marginTop: 8 }}>{a.power}⚡ per task</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.agent && <div style={{ fontSize: 11, color: palette.red, marginTop: 10, fontFamily: 'Geist Mono, monospace' }}>{errors.agent}</div>}
              </div>
            )}

            {step === 3 && (
              <div>
                <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Step 4 · Deploy</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Confirm & deploy.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Review and ship. You'll land on the console with {chosenAgent?.name || 'your agent'} live and {((chosenPack?.power || 0) + welcomeBonus).toLocaleString()}⚡ ready to burn.</p>
                <div style={{ background: 'var(--p-inset)', borderRadius: 12, border: `1px solid ${palette.border}`, padding: 22 }}>
                  {[
                    { l: 'Workspace', v: data.workspace },
                    { l: 'Power pack', v: chosenPack ? `${chosenPack.name} · ${(chosenPack.power/1000).toLocaleString()}k⚡ · ${chosenPack.eur != null ? `€${chosenPack.eur}` : 'Custom'}` : '—' },
                    { l: `Free Power on activation`, v: `+${welcomeBonus.toLocaleString()}⚡` },
                    { l: 'First agent', v: chosenAgent?.name || '—' },
                    { l: 'Region', v: 'EU · West-1' },
                  ].map((r, i, arr) => (
                    <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{r.l}</span>
                      <span style={{ fontSize: 14, color: palette.text }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 18, padding: 16, background: 'rgba(180,242,91,0.06)', border: `1px solid ${palette.accentDim}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Charged today</div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 26, fontWeight: 500, marginTop: 2 }}>{chosenPack?.eur != null ? `€${chosenPack.eur}` : 'Custom'} <span style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginLeft: 6 }}>(payment wires up later)</span></div>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, textAlign: 'right' }}>VAT (20%) included<br/>Free {welcomeBonus.toLocaleString()}⚡ activates now</div>
                </div>
              </div>
            )}

            {/* Footer nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${palette.border}` }}>
              <button onClick={back} disabled={step === 0} style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: step === 0 ? palette.textMute : palette.text, fontSize: 14, fontFamily: 'inherit', cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.5 : 1 }}>← Back</button>
              {step < 3 ? (
                <button onClick={next} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Continue →</button>
              ) : (
                <button onClick={submit} disabled={processing} style={{ padding: '12px 28px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                  {processing ? 'Deploying…' : 'Deploy & enter console →'}
                </button>
              )}
            </div>
          </Glass>

          <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 40, fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
            Cancel anytime · No subscription · Power never expires
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Onboarding.Page;
