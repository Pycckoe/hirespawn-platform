import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Sign in / Sign up — split-screen, ops-room aesthetic.
const Auth = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const SocialBtn = ({ label, icon }) => (
    <button style={{ flex: 1, padding: '12px', borderRadius: 10, background: palette.glass, border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14 }}>{icon}</span>{label}
    </button>
  );

  const Field = ({ label, type = 'text', placeholder, mono }) => (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <input type={type} placeholder={placeholder} style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 14, outline: 'none' }}
        onFocus={e => e.currentTarget.style.borderColor = palette.accent}
        onBlur={e => e.currentTarget.style.borderColor = palette.border} />
    </label>
  );

  const Page = () => {
    const isSignup = location.hash.startsWith('#/signup');
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        {/* Left — form */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ThemeToggle size={32} />
              <a href={isSignup ? '#/signin' : '#/signup'} style={{ fontSize: 13, color: palette.textDim, textDecoration: 'none' }}>
                {isSignup ? 'Have an account? Sign in →' : 'New here? Create account →'}
              </a>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <Pill dot={palette.accent} style={{ marginBottom: 18 }}>{isSignup ? 'Enlist · Free Power on signup' : 'Welcome back, operator'}</Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                {isSignup ? <>Spawn your<br/>first agent.</> : <>Resume<br/>operations.</>}
              </h1>
              <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 28, lineHeight: 1.5 }}>
                {isSignup ? '5,000⚡ free Power on activation. Deploy any agent in under 90 seconds.' : 'Power balance, agent fleet and runs sync as soon as you sign in.'}
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <SocialBtn icon="G" label="Google" />
                <SocialBtn icon="GH" label="GitHub" />
                <SocialBtn icon="◆" label="SSO" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0' }}>
                <div style={{ flex: 1, height: 1, background: palette.border }} /> or with email <div style={{ flex: 1, height: 1, background: palette.border }} />
              </div>

              {isSignup && <Field label="Full name" placeholder="Eva Romero" />}
              <Field label="Work email" type="email" placeholder="ops@yourcompany.com" />
              <Field label="Password" type="password" placeholder="••••••••" />
              {isSignup && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textDim, marginBottom: 14 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: palette.accent }} /> I agree to the Terms and Acceptable Use Policy
                </label>
              )}

              <a href={isSignup ? '#/onboarding' : '#/console'} style={{ display: 'block', textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {isSignup ? 'Enlist & claim 5,000⚡ →' : 'Sign in →'}
                </button>
              </a>
              {!isSignup && <div style={{ textAlign: 'center', marginTop: 12 }}><a href="#/" style={{ fontSize: 12, color: palette.textMute, textDecoration: 'none' }}>Forgot password?</a></div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
            <span>SOC 2 · GDPR · ISO 27001</span>
            <span>v2.1 · gateway.hirespawn.io</span>
          </div>
        </div>

        {/* Right — live ops preview panel */}
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 18, borderLeft: `1px solid ${palette.border}` }}>
          <Glass style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Live · last 60 minutes</div>
              <span style={{ width: 8, height: 8, background: palette.accent, borderRadius: 99, boxShadow: `0 0 10px ${palette.accent}` }} />
            </div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 500, color: palette.text, letterSpacing: -1 }}>4,184<span style={{ fontSize: 16, color: palette.textDim, marginLeft: 8 }}>tasks shipped</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(60, 1fr)', gap: 2, marginTop: 18, height: 56 }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const h = 20 + Math.abs(Math.sin(i * 0.6)) * 36;
                return <div key={i} style={{ height: h, alignSelf: 'end', background: i > 50 ? palette.accent : 'var(--p-track-fill)', borderRadius: 1 }} />;
              })}
            </div>
          </Glass>

          <Glass style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Recently spawned</div>
            {[
              { t: 'Acme · AI SDR', s: '12s ago', p: '47⚡' },
              { t: 'Kelvin Labs · AI Researcher', s: '38s ago', p: '124⚡' },
              { t: 'Northwind · AI Closer', s: '1m ago', p: '89⚡' },
              { t: 'Pivotal · AI QA', s: '2m ago', p: '23⚡' },
              { t: 'Ironclad · AI Data Steward', s: '3m ago', p: '67⚡' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${palette.border}` : 0, fontSize: 13 }}>
                <span style={{ color: palette.text }}>{r.t}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{r.s} · <span style={{ color: palette.accent }}>{r.p}</span></span>
              </div>
            ))}
          </Glass>

          <Glass style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
              "We deployed 6 AI SDRs in a Friday afternoon. By Monday we'd booked 41 meetings. The platform just works."
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)' }} />
              <div>
                <div style={{ fontSize: 13, color: palette.text }}>Maya Okonkwo</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Head of Revenue · Northwind</div>
              </div>
            </div>
          </Glass>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Auth.Page;
