import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// 4-step onboarding wizard: Workspace → Power pack → First agent → Deploy
const Onboarding = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;
  const STEPS = [
    { k: 'workspace', label: 'Workspace' },
    { k: 'power',     label: 'Buy Power' },
    { k: 'agent',     label: 'Hire agent' },
    { k: 'deploy',    label: 'Deploy' },
  ];
  const PACKS = [
    { name: 'Starter', power: 25000, eur: 249, perPower: 0.0099, popular: false },
    { name: 'Pro',     power: 100000, eur: 899, perPower: 0.0089, popular: true },
    { name: 'Scale',   power: 500000, eur: 3999, perPower: 0.0079, popular: false },
  ];
  const FIRST_AGENTS = [
    { id: 'sdr-pro',     name: 'AI SDR',         role: 'Outbound prospecting',    power: 47, icon: '◈', tone: 'sales' },
    { id: 'researcher',  name: 'AI Researcher',  role: 'Deep research & briefs',  power: 124, icon: '◇', tone: 'research' },
    { id: 'lead-enrich', name: 'AI Enricher',    role: 'Lead data enrichment',    power: 8, icon: '◆', tone: 'sales' },
    { id: 'qa',          name: 'AI QA',          role: 'Test runs & regression',  power: 23, icon: '◉', tone: 'eng' },
  ];

  const Page = () => {
    const [step, setStep] = React.useState(0);
    const [pack, setPack] = React.useState('Pro');
    const [agentId, setAgent] = React.useState('sdr-pro');
    const [workspace, setWs] = React.useState('Acme Inc');
    const next = () => setStep(s => Math.min(3, s + 1));
    const back = () => setStep(s => Math.max(0, s - 1));
    const agent = FIRST_AGENTS.find(a => a.id === agentId);
    const chosenPack = PACKS.find(p => p.name === pack);

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ enlistment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle size={32} />
            <a href="#/console" style={{ fontSize: 12, color: palette.textMute, textDecoration: 'none' }}>Skip for now →</a>
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
                <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 1 · Workspace</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Name your command center.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Workspaces are isolated — your agents, Power balance, runs, billing all live here.</p>
                <label>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Workspace name</div>
                  <input value={workspace} onChange={e => setWs(e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 16, outline: 'none' }} />
                </label>
                <div style={{ marginTop: 18, fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textMute }}>URL · <span style={{ color: palette.accent }}>{workspace.toLowerCase().replace(/\s+/g,'-')}.hirespawn.io</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 28 }}>
                  {[{ l: 'Team size', v: '5–20' }, { l: 'Use case', v: 'Sales · Marketing' }, { l: 'Region', v: 'EU · West-1' }].map(c => (
                    <div key={c.l} style={{ padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{c.l}</div>
                      <div style={{ fontSize: 14, color: palette.text, marginTop: 4 }}>{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 2 · Power pack</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Buy your first Power pack.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Power burns per task. No subscription, no reset, no bs. <strong style={{ color: palette.accent }}>+5,000⚡ free</strong> on activation.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {PACKS.map(p => {
                    const sel = pack === p.name;
                    return (
                      <div key={p.name} onClick={() => setPack(p.name)} style={{ padding: 24, borderRadius: 14, background: sel ? 'rgba(180,242,91,0.08)' : 'var(--p-inset-soft)', border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                        {p.popular && <div style={{ position: 'absolute', top: -10, left: 18, padding: '3px 10px', background: palette.accent, color: palette.onAccent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>POPULAR</div>}
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{p.name}</div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, marginTop: 6, letterSpacing: -1 }}>{(p.power / 1000)}k<span style={{ fontSize: 14, color: palette.textDim, marginLeft: 4 }}>⚡</span></div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, color: palette.text, marginTop: 4 }}>€{p.eur.toLocaleString()}</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 4 }}>≈ €{p.perPower.toFixed(4)} per ⚡</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 24, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Total today</div>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500 }}>€{chosenPack.eur} <span style={{ fontSize: 13, color: palette.accent }}>+ 5,000⚡ free</span></div>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{(chosenPack.power + 5000).toLocaleString()}⚡ available immediately</div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 3 · First hire</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Pick your first agent.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>You can swap, hire more, or fire any agent later from the console. We pre-selected the most popular for new operators.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {FIRST_AGENTS.map(a => {
                    const sel = agentId === a.id;
                    return (
                      <div key={a.id} onClick={() => setAgent(a.id)} style={{ padding: 22, borderRadius: 14, background: sel ? 'rgba(180,242,91,0.08)' : 'var(--p-inset-soft)', border: `1.5px solid ${sel ? palette.accent : palette.border}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
              </div>
            )}

            {step === 3 && (
              <div>
                <Pill dot={palette.accent} style={{ marginBottom: 14 }}>Step 4 · Deploy</Pill>
                <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Confirm & deploy.</h2>
                <p style={{ color: palette.textDim, fontSize: 15, marginTop: 10, marginBottom: 28 }}>Review and ship. You'll land on the console with {agent.name} live and {(chosenPack.power + 5000).toLocaleString()}⚡ ready to burn.</p>
                <div style={{ background: 'var(--p-inset)', borderRadius: 12, border: `1px solid ${palette.border}`, padding: 22 }}>
                  {[
                    { l: 'Workspace', v: workspace },
                    { l: 'Power pack', v: `${chosenPack.name} · ${(chosenPack.power/1000)}k⚡ · €${chosenPack.eur}` },
                    { l: 'Free Power on activation', v: '+5,000⚡' },
                    { l: 'First agent', v: agent.name },
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
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 26, fontWeight: 500, marginTop: 2 }}>€{chosenPack.eur}</div>
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, textAlign: 'right' }}>VAT (20%) included<br/>Invoice → ops@{workspace.toLowerCase().replace(/\s+/g,'')}.com</div>
                </div>
              </div>
            )}

            {/* Footer nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${palette.border}` }}>
              <button onClick={back} disabled={step === 0} style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: step === 0 ? palette.textMute : palette.text, fontSize: 14, fontFamily: 'inherit', cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.5 : 1 }}>← Back</button>
              {step < 3 ? (
                <button onClick={next} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Continue →</button>
              ) : (
                <a href="#/console" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 28px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Deploy & enter console →</button>
                </a>
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
