// =====================================================================
// DIRECTION A — "Command Center"
// Dark glass · ops-room HUD · Power-token economy
// =====================================================================
import '@/setup';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

const DirA = (() => {

  // Palette is fully-CSS-var driven so theme toggle just flips html[data-theme].
  // The actual color tokens live in Hirespawn.html <style> block.
  const palette = {
    bg0: 'var(--p-bg0)', bg1: 'var(--p-bg1)',
    glass: 'var(--p-glass)',
    glassStrong: 'var(--p-glass-strong)',
    border: 'var(--p-border)',
    borderStrong: 'var(--p-border-strong)',
    text: 'var(--p-text)', textDim: 'var(--p-text-dim)', textMute: 'var(--p-text-mute)',
    accent: 'var(--p-accent)', accentDim: 'var(--p-accent-dim)',
    amber: 'var(--p-amber)', red: 'var(--p-red)', cyan: 'var(--p-cyan)',
    onAccent: 'var(--p-on-accent)', // text color on top of accent fill
  };

  // === Reveal on scroll ===
  const useReveal = (threshold = 0.15) => {
    const ref = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
      if (!ref.current) return;
      // Synchronous check: already on screen? show immediately.
      const r = ref.current.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        setVis(true);
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { setVis(true); io.unobserve(e.target); } });
      }, { threshold, rootMargin: '0px 0px -10% 0px' });
      io.observe(ref.current);
      // Fallback in case IO never fires in the host environment
      const fallback = setTimeout(() => setVis(true), 1200);
      return () => { io.disconnect(); clearTimeout(fallback); };
    }, [threshold]);
    return [ref, vis];
  };

  const Reveal = ({ children, delay = 0, y = 30, style }) => {
    const [ref, vis] = useReveal();
    return (
      <div ref={ref} style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 0.9s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        ...style,
      }}>{children}</div>
    );
  };

  // === Parallax (scroll-driven Y translate) ===
  const useParallax = (strength = 0.15) => {
    const ref = useRef(null);
    const [y, setY] = useState(0);
    useEffect(() => {
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            const center = r.top + r.height / 2 - window.innerHeight / 2;
            setY(-center * strength);
          }
          raf = 0;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }, [strength]);
    return [ref, y];
  };

  // === Mouse parallax (for hero) ===
  const useMouseParallax = () => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    useEffect(() => {
      const onMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setPos({ x, y });
      };
      window.addEventListener('mousemove', onMove);
      return () => window.removeEventListener('mousemove', onMove);
    }, []);
    return pos;
  };

  const Glass = ({ children, style, blur = 24, ...rest }) => (
    <div style={{
      background: palette.glass, border: `1px solid ${palette.border}`,
      backdropFilter: `blur(${blur}px) saturate(160%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
      boxShadow: 'var(--p-glass-shadow)',
      borderRadius: 16, ...style,
    }} {...rest}>{children}</div>
  );

  const Pill = ({ children, dot, color = palette.accent, style }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: 'var(--p-glass)', border: `1px solid ${palette.border}`,
      fontSize: 11, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.4,
      color: palette.textDim, textTransform: 'uppercase', ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: color, boxShadow: `0 0 8px ${color}` }} />}
      {children}
    </span>
  );

  const SectionLabel = ({ kicker, title, sub }) => (
    <div style={{ marginBottom: 36 }}>
      <Pill dot color={palette.amber} style={{ marginBottom: 14 }}>{kicker}</Pill>
      <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 500, letterSpacing: -1.5, margin: 0, color: palette.text, lineHeight: 1.02 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: palette.textDim, marginTop: 14, maxWidth: 620 }}>{sub}</p>}
    </div>
  );

  const Mesh = () => {
    const mp = useMouseParallax();
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
      const onScroll = () => setScrollY(window.scrollY);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: '-20%',
        background: `radial-gradient(600px 400px at 15% 20%, var(--p-mesh-1), transparent 60%),
                     radial-gradient(700px 500px at 85% 30%, var(--p-mesh-2), transparent 60%),
                     radial-gradient(900px 600px at 50% 100%, var(--p-mesh-3), transparent 60%)`,
        animation: 'dirA-drift 24s ease-in-out infinite alternate',
        transform: `translate3d(${mp.x * 14}px, ${mp.y * 14 + scrollY * -0.08}px, 0)`,
        transition: 'transform 0.6s cubic-bezier(.2,.7,.2,1)',
      }} />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18, transform: `translateY(${scrollY * -0.04}px)` }}>
        <defs>
          <pattern id="dirA-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0 L 0 0 L 0 48" fill="none" stroke="var(--p-grid-stroke)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dirA-grid)" />
      </svg>
      <style>{`@keyframes dirA-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(2%,-2%) scale(1.05); } }`}</style>
    </div>
    );
  };

  const Logo = () => {
    // Admin-uploaded site_logo wins; otherwise we render the original
    // inline-SVG mark + wordmark. Uploaded asset is rendered at the same
    // 26px height so layout doesn't shift.
    const logoUrl = usePage().props?.cms?.settings?.site_logo;
    if (logoUrl) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoUrl} alt="Hirespawn" style={{ height: 26, width: 'auto', display: 'block' }} />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 2 L24 8 V18 L13 24 L2 18 V8 Z" stroke={palette.accent} strokeWidth="1.5" fill="rgba(180,242,91,0.06)" />
          <path d="M13 7 L19 10.5 V15.5 L13 19 L7 15.5 V10.5 Z" fill={palette.accent} opacity="0.85" />
        </svg>
        <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.4, color: palette.text }}>hirespawn</span>
      </div>
    );
  };

  // Sun/moon theme toggle — flips html[data-theme] attribute (CSS vars do the rest)
  const ThemeToggle = ({ size = 36 }) => {
    const [theme, setTheme] = useTheme();
    const isDark = theme === 'dark';
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title={isDark ? 'Switch to light' : 'Switch to dark'}
        aria-label="Toggle theme"
        style={{
          width: size, height: size, borderRadius: 10,
          background: palette.glass, border: `1px solid ${palette.borderStrong}`,
          color: palette.text, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', padding: 0, transition: 'all 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = palette.glassStrong; e.currentTarget.style.borderColor = palette.accent; }}
        onMouseLeave={e => { e.currentTarget.style.background = palette.glass; e.currentTarget.style.borderColor = palette.borderStrong; }}
      >
        {isDark ? (
          // Moon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 9.2A5.5 5.5 0 1 1 6.8 2.5a4.5 4.5 0 0 0 6.7 6.7Z" />
          </svg>
        ) : (
          // Sun
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
          </svg>
        )}
      </button>
    );
  };

  const Nav = () => (
    <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo />
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ Marketplace OS v2.1</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[
          { label: 'Roster',      href: '#/roster' },
          { label: 'For Sellers', href: '#/vendor' },
          { label: 'Docs',        href: '#/docs' },
          { label: 'About',       href: '#/about' },
        ].map(l => (
          <a key={l.label} href={l.href} style={{ padding: '8px 14px', fontSize: 13, color: palette.textDim, textDecoration: 'none', cursor: 'pointer' }}>{l.label}</a>
        ))}
        <ThemeToggle />
        <a href="#/console" style={{ padding: '9px 16px', borderRadius: 10, marginLeft: 4, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>Console</a>
        <button style={{ padding: '9px 18px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy Power →</button>
      </div>
    </div>
  );

  const Hero = () => {
    const deployed = useCountUp(12847, 1800);
    const power    = useCountUp(8473291, 2200);
    const burned   = useCountUp(2104893, 2000);
    const mp = useMouseParallax();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const settings = usePage().props?.cms?.settings || {};
    const pillCopy = settings.hero_pill || '● Live · 12,847 agents on duty';
    const subtitleCopy = settings.hero_subtitle || 'The marketplace for AI employees. No subscriptions, no headcount. Buy Power once — every agent in the roster runs on it. Pay only for tasks executed.';
    const ctaPrimary = settings.hero_cta || 'Buy Power →';
    return (
      <div style={{ position: 'relative', padding: '60px 40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.9s cubic-bezier(.2,.7,.2,1), transform 0.9s cubic-bezier(.2,.7,.2,1)',
          }}>
            <Pill dot color={palette.accent} style={{ marginBottom: 28 }}>{pillCopy}</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 86, lineHeight: 0.95, fontWeight: 600, letterSpacing: -3, margin: 0, color: palette.text, transform: `translate3d(${mp.x * -6}px, ${mp.y * -3}px, 0)`, transition: 'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
              Hire an army.<br/>
              <span style={{ color: palette.textDim, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Burn </span>
              <span style={{ color: palette.accent }}>Power.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.5, color: palette.textDim, maxWidth: 540, marginTop: 28, marginBottom: 36 }}>{subtitleCopy}</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
              <a href="/power" style={{ textDecoration: 'none' }}><button style={{ padding: '14px 22px', borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{ctaPrimary}</button></a>
              <a href="/roster" style={{ textDecoration: 'none' }}><button style={{ padding: '14px 22px', borderRadius: 12, background: palette.glassStrong, border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(20px)' }}>Browse the roster</button></a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Agents on duty',       val: deployed.toLocaleString() },
                { label: 'Power burned (24h)',   val: (burned/1000).toFixed(0)+'k' },
                { label: 'Power in circulation', val: (power/1000000).toFixed(1)+'M' },
              ].map(s => (
                <div key={s.label} style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.text, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted
              ? `translate3d(${mp.x * 8}px, ${mp.y * 6}px, 0) perspective(1200px) rotateY(${mp.x * -1.5}deg) rotateX(${mp.y * 1.2}deg)`
              : 'translateY(40px)',
            transition: 'opacity 1.1s cubic-bezier(.2,.7,.2,1) 0.15s, transform 0.5s cubic-bezier(.2,.7,.2,1)',
            transformStyle: 'preserve-3d',
          }}>
            <LiveConsole />
          </div>
        </div>
      </div>
    );
  };

  const LiveConsole = () => {
    const feed = useLiveFeed(900, 6);
    const [active, setActive] = useState(0);
    useEffect(() => { const t = setInterval(() => setActive(a => (a + 1) % 4), 1400); return () => clearInterval(t); }, []);
    return (
      <Glass style={{ padding: 0, overflow: 'hidden', height: 540, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, background: 'var(--p-inset-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: palette.accent, boxShadow: `0 0 12px ${palette.accent}` }} />
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text, letterSpacing: 1, textTransform: 'uppercase' }}>Operations Console · Live</span>
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{new Date().toISOString().slice(0,19).replace('T',' ')}Z</div>
        </div>
        <div style={{ padding: 18, borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Active deployments — sector view</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
            {Array.from({ length: 64 }).map((_, i) => {
              const lit = (i + active * 3) % 7 < 2;
              const hot = (i + active * 5) % 11 === 0;
              return <div key={i} style={{ height: 14, borderRadius: 3, background: hot ? palette.amber : lit ? palette.accent : 'var(--p-track)', opacity: lit || hot ? (0.4 + (i % 5) * 0.12) : 1, transition: 'all 0.4s', boxShadow: hot ? `0 0 10px ${palette.amber}` : lit ? `0 0 6px ${palette.accent}` : 'none' }} />;
            })}
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 18px', overflow: 'hidden' }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Power burn stream</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feed.map((f, i) => {
              const a = AGENTS.find(x => f.agent.includes(x.name.replace('AI ', ''))) || AGENTS[0];
              return (
                <div key={f.key || i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Geist Mono, monospace', fontSize: 12, opacity: 1 - i * 0.13, animation: i === 0 ? 'dirA-fade-in 0.3s ease' : 'none' }}>
                  <span style={{ color: palette.accent, width: 50 }}>+{f.t}</span>
                  <span style={{ color: palette.text, fontWeight: 500 }}>{f.agent}</span>
                  <span style={{ color: palette.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.verb} {f.obj}</span>
                  <span style={{ color: palette.amber }}>−{a.power}⚡</span>
                </div>
              );
            })}
          </div>
          <style>{`@keyframes dirA-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', background: 'var(--p-inset-soft)', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
          <span style={{ color: palette.textDim }}>p95 latency · <span style={{ color: palette.accent }}>1.8s</span></span>
          <span style={{ color: palette.textDim }}>err rate · <span style={{ color: palette.accent }}>0.04%</span></span>
          <span style={{ color: palette.textDim }}>uptime · <span style={{ color: palette.accent }}>99.97%</span></span>
        </div>
      </Glass>
    );
  };

  // === Power explainer ===
  const PowerExplainer = () => {
    const [picked, setPicked] = useState('sdr-pro');
    const a = AGENTS.find(x => x.id === picked);
    const tasks = 1000;
    const cost = a.power * tasks * 0.009;
    return (
      <div style={{ padding: '80px 40px' }}>
        <SectionLabel kicker="Power · the unit of work" title={<>One currency.<br/><span style={{ color: palette.accent }}>Every agent. Every task.</span></>} sub="No more subscriptions per agent. Buy a Power pack once. Allocate it across whichever specialists you hire. Each agent declares its Power cost upfront — fair, predictable, audited." />
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
          <Glass style={{ padding: 28 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Power cost · per task</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AGENTS.map(ag => (
                <div key={ag.id} onClick={() => setPicked(ag.id)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: picked === ag.id ? palette.accentDim : 'transparent', border: `1px solid ${picked === ag.id ? palette.accent : palette.border}`, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 14, color: palette.text, fontWeight: 500 }}>{ag.name} <span style={{ color: palette.textMute, fontWeight: 400, fontSize: 12 }}>· per {ag.perUnit}</span></span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{ag.power}⚡</span>
                  <div style={{ width: 80, height: 6, borderRadius: 99, background: 'var(--p-track)' }}>
                    <div style={{ height: '100%', width: Math.min(100, ag.power) + '%', background: picked === ag.id ? palette.accent : 'var(--p-track-fill)', borderRadius: 99, transition: 'all 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </Glass>
          <Glass style={{ padding: 28 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>If you ran 1,000 {a.perUnit}s with {a.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 64, fontWeight: 500, color: palette.accent, letterSpacing: -2 }}>{(a.power * tasks).toLocaleString()}</span>
              <span style={{ fontSize: 24, color: palette.textDim }}>⚡</span>
            </div>
            <div style={{ fontSize: 14, color: palette.textDim }}>≈ €{cost.toFixed(2)} on the <strong style={{ color: palette.text }}>Pro</strong> pack ({a.power}⚡ × 1,000 × €0.009)</div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginBottom: 8 }}>vs hiring a junior @ €2,500/mo</div>
              <div style={{ height: 24, borderRadius: 6, background: 'var(--p-chip)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(cost / 2500) * 100}%`, background: palette.accent, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
                <span style={{ color: palette.accent }}>€{cost.toFixed(0)} ({Math.round((cost / 2500) * 100)}%)</span>
                <span style={{ color: palette.textDim }}>€2,500 (100%)</span>
              </div>
            </div>
          </Glass>
        </div>
      </div>
    );
  };

  // === Power packs (3 packs, Enterprise removed in favor of calculator) ===
  const PowerPacks = () => {
    const packs = POWER_PACKS.filter(p => p.price !== null);
    return (
    <div style={{ padding: '80px 40px' }}>
      <SectionLabel kicker="Pricing" title={<>Buy Power. <span style={{ color: palette.textDim }}>That's it.</span></>} sub="Volume discount built in. Higher pack = lower €/Power. Power rolls over (90 days Starter, 12 months Pro & Scale)." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {packs.map((p, idx) => (
          <Reveal key={p.name} delay={idx * 80} y={28}>
          <Glass style={{ padding: 28, position: 'relative', borderColor: p.popular ? palette.accent : palette.border, background: p.popular ? 'rgba(180,242,91,0.06)' : palette.glass }}>
            {p.popular && <div style={{ position: 'absolute', top: -10, left: 24, padding: '3px 10px', background: palette.accent, color: palette.onAccent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>MOST POPULAR</div>}
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{p.name}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 48, fontWeight: 500, color: palette.text, marginTop: 8, letterSpacing: -1.5 }}>
              €{p.price}
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 4 }}>
              {p.power.toLocaleString()}⚡ · €{(p.perPower * 1000).toFixed(2)} per 1,000⚡
            </div>
            <ul style={{ margin: '24px 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {p.perks.map(perk => (
                <li key={perk} style={{ fontSize: 13, color: palette.textDim, display: 'flex', gap: 8 }}>
                  <span style={{ color: palette.accent }}>›</span>{perk}
                </li>
              ))}
            </ul>
            <button style={{ width: '100%', padding: '12px', borderRadius: 10, background: p.popular ? palette.accent : 'transparent', border: `1px solid ${p.popular ? palette.accent : palette.borderStrong}`, color: p.popular ? '#0a0e14' : palette.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Buy pack
            </button>
          </Glass>
          </Reveal>
        ))}
      </div>
    </div>
    );
  };

  // === Power Calculator: budget for tasks/agents ===
  const PowerCalculator = () => {
    // Pre-pick a few common roles with sane defaults
    const initial = [
      { id: 'sdr-pro',  qty: 200 }, // 200 leads/mo
      { id: 'review',   qty: 80  }, // 80 PRs
      { id: 'support',  qty: 1500 },// 1500 tickets
    ];
    const [rows, setRows] = useState(initial);

    const update = (id, qty) => setRows(rs => rs.map(r => r.id === id ? { ...r, qty } : r));
    const remove = (id) => setRows(rs => rs.filter(r => r.id !== id));
    const add = (id) => { if (!rows.find(r => r.id === id)) setRows(rs => [...rs, { id, qty: 100 }]); };

    const expanded = rows.map(r => {
      const a = AGENTS.find(x => x.id === r.id);
      return a ? { ...r, agent: a, power: a.power * r.qty } : null;
    }).filter(Boolean);

    const totalPower = expanded.reduce((s, r) => s + r.power, 0);
    const packs = POWER_PACKS.filter(p => p.price !== null);
    // recommended pack: smallest pack whose power >= totalPower, else largest
    const rec = packs.find(p => p.power >= totalPower) || packs[packs.length - 1];
    const recCost = rec.price;
    const overflow = Math.max(0, totalPower - rec.power);
    const overflowCost = overflow * rec.perPower;
    const fairCost = totalPower * (rec.perPower);
    const monthlyEUR = recCost + overflowCost;

    const available = AGENTS.filter(a => !rows.find(r => r.id === a.id));

    return (
      <div style={{ padding: '40px 40px 80px' }}>
        <Glass style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 560 }}>
            {/* LEFT: builder */}
            <div style={{ padding: 36, borderRight: `1px solid ${palette.border}` }}>
              <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Power calculator</Pill>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, letterSpacing: -0.8, margin: 0, color: palette.text, lineHeight: 1.1 }}>
                Tell us your workload.<br/><span style={{ color: palette.textDim }}>We'll size the pack.</span>
              </h3>
              <p style={{ fontSize: 13, color: palette.textMute, marginTop: 10, marginBottom: 24 }}>
                Pick agents, dial in monthly volume. We compute Power burn and recommend a pack.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {expanded.map(r => (
                  <div key={r.id} style={{ padding: 14, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{CATEGORIES.find(c => c.key === r.agent.tone)?.icon || '◇'}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{r.agent.name}</div>
                          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute }}>{r.agent.power}⚡ per {r.agent.perUnit}</div>
                        </div>
                      </div>
                      <button onClick={() => remove(r.id)} style={{ background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textMute, fontSize: 11, fontFamily: 'Geist Mono, monospace', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="range"
                        min={0}
                        max={r.agent.perUnit === 'transaction' || r.agent.perUnit === 'ticket' ? 5000 : r.agent.perUnit === 'lead' ? 2000 : r.agent.perUnit === 'profile' || r.agent.perUnit === 'PR' || r.agent.perUnit === 'mock' ? 500 : r.agent.perUnit === 'contract' ? 100 : 1000}
                        step={r.agent.perUnit === 'transaction' || r.agent.perUnit === 'ticket' ? 25 : 5}
                        value={r.qty}
                        onChange={e => update(r.id, +e.target.value)}
                        style={{ flex: 1, accentColor: palette.accent }}
                      />
                      <div style={{ minWidth: 110, textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text, fontWeight: 600 }}>{r.qty.toLocaleString()} {r.agent.perUnit}{r.qty === 1 ? '' : 's'}/mo</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, marginTop: 2 }}>= {r.power.toLocaleString()}⚡</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {available.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>+ Add agent</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {available.map(a => (
                      <button key={a.id} onClick={() => add(a.id)} style={{ padding: '6px 10px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.textDim, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                        {CATEGORIES.find(c => c.key === a.tone)?.icon} {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: result */}
            <div style={{ padding: 36, background: 'rgba(180,242,91,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Total monthly burn</div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 64, fontWeight: 500, color: palette.accent, letterSpacing: -2, lineHeight: 1, marginTop: 6 }}>
                {totalPower.toLocaleString()}<span style={{ fontSize: 32, color: palette.text, marginLeft: 4 }}>⚡</span>
              </div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, marginTop: 6 }}>
                ≈ €{fairCost.toFixed(0)} fair value at {rec.name} rate
              </div>

              <div style={{ marginTop: 28, padding: 20, background: 'var(--p-inset-strong)', border: `1px solid ${palette.borderStrong}`, borderRadius: 12 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Recommended pack</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 600, color: palette.text }}>{rec.name}</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.accent }}>€{rec.price}</div>
                </div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 4 }}>
                  {rec.power.toLocaleString()}⚡ included · €{(rec.perPower * 1000).toFixed(2)}/1k after
                </div>
                {overflow > 0 && (
                  <div style={{ marginTop: 14, padding: 10, background: 'rgba(255,179,71,0.08)', border: `1px solid rgba(255,179,71,0.3)`, borderRadius: 8 }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.amber, letterSpacing: 1, textTransform: 'uppercase' }}>Overflow</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text, marginTop: 4 }}>+{overflow.toLocaleString()}⚡ → +€{overflowCost.toFixed(0)}</div>
                  </div>
                )}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Your monthly</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, color: palette.text, letterSpacing: -1 }}>€{Math.round(monthlyEUR).toLocaleString()}</div>
                </div>
              </div>

              <button style={{ marginTop: 'auto', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Buy {rec.name} pack →
              </button>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, textAlign: 'center', marginTop: 8 }}>
                Estimate only · cancel anytime · Power rolls over
              </div>
            </div>
          </div>
        </Glass>
      </div>
    );
  };

  // === Roster ===
  const Roster = () => (
    <div style={{ padding: '80px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32, gap: 24 }}>
        <SectionLabel kicker="The roster" title={<>Eight battalions.<br/><span style={{ color: palette.textDim }}>Ready to deploy.</span></>} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 380, justifyContent: 'flex-end' }}>
          {CATEGORIES.map(c => (
            <span key={c.key} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.glass, fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>{c.icon} {c.label}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {AGENTS.map((a, i) => <Reveal key={a.id} delay={i * 60} y={20}><AgentCard agent={a} /></Reveal>)}
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="#/roster" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 12, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', textDecoration: 'none' }}>
          View all 18 agents in the roster <span style={{ color: palette.accent }}>→</span>
        </a>
      </div>
    </div>
  );

  const AgentCard = ({ agent }) => {
    const [hover, setHover] = useState(false);
    return (
      <a href={`#/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <Glass onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: 18, cursor: 'pointer', transform: hover ? 'translateY(-3px)' : 'translateY(0)', transition: 'transform 0.3s, border-color 0.3s', borderColor: hover ? palette.borderStrong : palette.border, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', background: palette.accentDim, color: palette.accent, borderBottomLeftRadius: 10, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{agent.rank}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, rgba(180,242,91,0.22), rgba(180,242,91,0.04))', border: `1px solid ${palette.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent, fontSize: 20, fontFamily: 'Geist Mono, monospace' }}>{CATEGORIES.find(c => c.key === agent.tone)?.icon || '◇'}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: palette.text, letterSpacing: -0.2 }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: palette.textMute, marginTop: 2 }}>{agent.role} · by {agent.vendor}</div>
          </div>
        </div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '8px 10px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 8, marginBottom: 14 }}>
          ▸ {agent.spec}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.accent }}>
              {agent.power}<span style={{ fontSize: 14, color: palette.textMute }}>⚡</span>
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>per {agent.perUnit} · ★ {agent.rating}</div>
          </div>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: hover ? palette.accent : 'transparent', border: `1px solid ${hover ? palette.accent : palette.borderStrong}`, color: hover ? '#0a0e14' : palette.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.25s' }}>Deploy</button>
        </div>
      </Glass>
      </a>
    );
  };

  const HowItWorks = () => (
    <div style={{ padding: '80px 40px' }}>
      <SectionLabel kicker="Mission flow" title={<>Five steps. <span style={{ color: palette.textDim }}>From brief to billed.</span></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { n: '01', t: 'Buy Power',           d: 'One-time pack, never expires.' },
          { n: '02', t: 'Pick a role',         d: 'Filter, compare, read SLAs.' },
          { n: '03', t: 'Provision in 90s',    d: 'Scoped key. Agent self-installs.' },
          { n: '04', t: 'Send tasks',          d: 'Direct or via our API gateway.' },
          { n: '05', t: 'Power burns',         d: 'Audited, real-time. SLA-backed.' },
        ].map((s, idx) => (
          <Reveal key={s.n} delay={idx * 80} y={20}>
          <Glass style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1 }}>STEP {s.n}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 19, fontWeight: 500, color: palette.text, marginTop: 8, marginBottom: 6 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.5 }}>{s.d}</div>
          </Glass>
          </Reveal>
        ))}
      </div>
    </div>
  );

  const Integrations = () => (
    <div style={{ padding: '80px 40px' }}>
      <SectionLabel kicker="Integrations" title={<>Plugs into <span style={{ color: palette.cyan }}>everything</span> you already run.</>} sub="Each agent declares the tools it speaks. Connect once at the gateway level — every agent inherits your auth." />
      <Glass style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
          {INTEGRATIONS.map((name, i) => (
            <Reveal key={name} delay={i * 25} y={12}>
              <div className="dirA-int" style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, textAlign: 'center', fontSize: 13, color: palette.textDim, fontFamily: 'Geist Mono, monospace', cursor: 'pointer', transition: 'all 0.25s' }}>{name}</div>
            </Reveal>
          ))}
          <style>{`
            .dirA-int:hover { background: rgba(180,242,91,0.08) !important; border-color: rgba(180,242,91,0.4) !important; color: #b4f25b !important; transform: translateY(-2px); }
          `}</style>
        </div>
      </Glass>
    </div>
  );

  const SellerStrip = () => {
    // Interactive earnings calculator for would-be sellers
    const ROLE_PRESETS = [
      { key: 'sdr',     label: 'AI SDR',          icon: '◆', perUnit: 'lead',        suggestedPower: 12, dailyDefault: 80 },
      { key: 'review',  label: 'Code Reviewer',   icon: '◇', perUnit: 'PR',          suggestedPower: 38, dailyDefault: 25 },
      { key: 'support', label: 'Support Agent',   icon: '○', perUnit: 'ticket',      suggestedPower: 6,  dailyDefault: 400 },
      { key: 'finance', label: 'Bookkeeper',      icon: '▣', perUnit: 'transaction', suggestedPower: 4,  dailyDefault: 600 },
      { key: 'legal',   label: 'Legal Reviewer',  icon: '⌘', perUnit: 'contract',    suggestedPower: 64, dailyDefault: 8  },
    ];

    const [roleKey, setRoleKey]   = useState('sdr');
    const [powerCost, setPower]   = useState(12);   // power your agent charges per task
    const [tasksDay, setTasksDay] = useState(80);   // tasks/day across customers
    const [customers, setCustomers] = useState(40); // # paying teams using your agent

    const role = ROLE_PRESETS.find(r => r.key === roleKey);

    const switchRole = (k) => {
      const r = ROLE_PRESETS.find(x => x.key === k);
      setRoleKey(k);
      setPower(r.suggestedPower);
      setTasksDay(r.dailyDefault);
    };

    // Buyer pays Pro pack rate ≈ €0.009 per Power. Take rate volume-tiered.
    const PRICE_PER_POWER = 0.009;
    const monthlyTasks = tasksDay * 30 * Math.max(1, customers / 10); // crude scaling
    const monthlyPower = monthlyTasks * powerCost;
    const grossEUR     = monthlyPower * PRICE_PER_POWER;
    const takeRate     = grossEUR > 50000 ? 0.12 : grossEUR > 15000 ? 0.18 : 0.25; // higher revenue = lower fee
    const sellerEUR    = grossEUR * (1 - takeRate);
    const annualEUR    = sellerEUR * 12;

    return (
    <div style={{ padding: '80px 40px' }}>
      <Glass style={{ padding: 48, position: 'relative', overflow: 'hidden' }}>
        {/* Pitch + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center', marginBottom: 40 }}>
          <div>
            <Pill dot color={palette.cyan} style={{ marginBottom: 14 }}>For sellers</Pill>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 48, fontWeight: 500, letterSpacing: -1.2, margin: 0, color: palette.text, lineHeight: 1.05 }}>
              Built an agent? <br/><span style={{ color: palette.cyan }}>Earn while you sleep.</span>
            </h2>
            <p style={{ fontSize: 16, color: palette.textDim, lineHeight: 1.55, maxWidth: 540, marginTop: 18, marginBottom: 24 }}>
              Publish your manifest. Set Power cost per task. We handle distribution, billing, VAT, payouts, disputes. You ship code; we ship customers.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ padding: '12px 20px', borderRadius: 10, background: palette.cyan, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Apply as seller →</button>
              <button style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>Read manifest spec</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Take rate', v: '12-25%', k: 'volume tiered' },
              { l: 'Payout',    v: '1st of mo', k: 'auto Stripe Connect' },
              { l: 'Hold',      v: '14 days', k: 'fraud reserve' },
              { l: 'Top earner',v: '€41k',   k: 'last 30 days' },
            ].map(c => (
              <div key={c.l} style={{ padding: 16, background: 'var(--p-inset)', borderRadius: 12, border: `1px solid ${palette.border}` }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{c.l}</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 26, fontWeight: 500, color: palette.cyan, marginTop: 2 }}>{c.v}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>{c.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings calculator */}
        <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
            <div>
              <Pill dot color={palette.cyan} style={{ marginBottom: 10 }}>Earnings calculator</Pill>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, letterSpacing: -0.8, margin: 0, color: palette.text, lineHeight: 1.05 }}>
                What could your agent earn?
              </h3>
              <p style={{ fontSize: 13, color: palette.textMute, marginTop: 8, maxWidth: 520 }}>
                Pick a role, set what you'd charge per task, estimate adoption. We model gross revenue and your take-home after platform fee.
              </p>
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
              Buyer rate · €{(PRICE_PER_POWER * 1000).toFixed(2)} per 1,000⚡
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
            {/* Inputs */}
            <div style={{ padding: 28, background: 'var(--p-inset)', borderRadius: 14, border: `1px solid ${palette.border}` }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Agent type</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {ROLE_PRESETS.map(r => {
                  const sel = r.key === roleKey;
                  return (
                    <button key={r.key} onClick={() => switchRole(r.key)} style={{ padding: '8px 12px', borderRadius: 8, background: sel ? 'rgba(74,222,222,0.12)' : 'transparent', border: `1px solid ${sel ? palette.cyan : palette.border}`, color: sel ? palette.cyan : palette.textDim, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: sel ? 600 : 400 }}>
                      <span style={{ marginRight: 6 }}>{r.icon}</span>{r.label}
                    </button>
                  );
                })}
              </div>

              {/* Power cost slider */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Your charge per {role.perUnit}</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, color: palette.cyan }}>{powerCost}<span style={{ fontSize: 14, color: palette.textMute, marginLeft: 2 }}>⚡</span></div>
                </div>
                <input type="range" min={1} max={120} step={1} value={powerCost} onChange={e => setPower(+e.target.value)} style={{ width: '100%', accentColor: palette.cyan }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 4 }}>
                  <span>1⚡ (€{(PRICE_PER_POWER).toFixed(3)})</span>
                  <span>= €{(powerCost * PRICE_PER_POWER).toFixed(3)} per task</span>
                  <span>120⚡</span>
                </div>
              </div>

              {/* Tasks per day */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Avg tasks/day per customer</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, color: palette.cyan }}>{tasksDay.toLocaleString()}</div>
                </div>
                <input type="range" min={1} max={1000} step={1} value={tasksDay} onChange={e => setTasksDay(+e.target.value)} style={{ width: '100%', accentColor: palette.cyan }} />
              </div>

              {/* Customers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Active customers</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, color: palette.cyan }}>{customers}</div>
                </div>
                <input type="range" min={1} max={500} step={1} value={customers} onChange={e => setCustomers(+e.target.value)} style={{ width: '100%', accentColor: palette.cyan }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 4 }}>
                  <span>1</span><span>500</span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div style={{ padding: 28, background: 'linear-gradient(140deg, rgba(74,222,222,0.08), rgba(0,0,0,0.4))', borderRadius: 14, border: `1px solid rgba(74,222,222,0.3)`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Estimated take-home</div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 500, color: palette.cyan, letterSpacing: -2, lineHeight: 1, marginTop: 6 }}>
                €{Math.round(sellerEUR).toLocaleString()}
              </div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 6 }}>per month, after {Math.round(takeRate * 100)}% platform fee</div>

              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Monthly tasks',  v: Math.round(monthlyTasks).toLocaleString() },
                  { l: 'Monthly Power',  v: `${Math.round(monthlyPower).toLocaleString()}⚡` },
                  { l: 'Gross revenue',  v: `€${Math.round(grossEUR).toLocaleString()}` },
                  { l: 'Platform fee',   v: `−€${Math.round(grossEUR * takeRate).toLocaleString()} (${Math.round(takeRate*100)}%)` },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim, padding: '6px 0', borderBottom: `1px dashed ${palette.border}` }}>
                    <span>{r.l}</span><span style={{ color: palette.text }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Annual run-rate</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, color: palette.text, letterSpacing: -1, marginTop: 4 }}>
                  €{Math.round(annualEUR).toLocaleString()}
                </div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 8, lineHeight: 1.5 }}>
                  Estimate · actuals depend on customer mix, churn, SLA credits.<br/>
                  Tier: ≤€15k → 25% · €15-50k → 18% · €50k+ → 12%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Glass>
    </div>
    );
  };

  const Testimonials = () => (
    <div style={{ padding: '80px 40px' }}>
      <SectionLabel kicker="Field reports" title={<>Operators who burned <span style={{ color: palette.accent }}>millions of Power</span>.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { q: 'We replaced our entire SDR team with three Hirespawn agents. Pipeline doubled. Headcount cost dropped 84%.', a: 'Mara Lindholm',  r: 'Head of GTM, Helix Co.', power: '480k⚡ burned' },
          { q: 'AI Code Reviewer ships PRs at 3am. We onboarded it in 12 minutes. Power cost is 1/40th of what we paid contractors.', a: 'Tomás Ribeiro', r: 'CTO, Petrichor', power: '210k⚡ burned' },
          { q: 'Bookkeeper agent reconciled 8,000 transactions on day one. Our finance lead now does strategy instead of grunt work.', a: 'Rasa Kalniņa',   r: 'COO, Saulēs Lab',  power: '94k⚡ burned' },
        ].map((t, i) => (
          <Glass key={i} style={{ padding: 26 }}>
            <div style={{ fontSize: 16, color: palette.text, lineHeight: 1.55, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3 }}>"{t.q}"</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{t.a}</div>
                <div style={{ fontSize: 12, color: palette.textMute }}>{t.r}</div>
              </div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent }}>{t.power}</div>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );

  const Roi = () => (
    <div style={{ padding: '60px 40px' }}>
      <Glass style={{ padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <Pill dot color={palette.amber} style={{ marginBottom: 14 }}>The math</Pill>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 500, letterSpacing: -1, margin: 0, color: palette.text, lineHeight: 1.05 }}>
              A junior costs <span style={{ color: palette.red, textDecoration: 'line-through', textDecorationThickness: 2 }}>€2,500/mo</span>.
            </h2>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1, margin: 0, color: palette.accent, lineHeight: 1.05, marginTop: 6 }}>
              Power burns at €0.009 ea.
            </h2>
            <p style={{ fontSize: 16, color: palette.textDim, lineHeight: 1.55, maxWidth: 480, marginTop: 20 }}>
              That's 277,000 tasks for one month of salary. Real workload, audited per-event, and your remaining Power balance is always in the console.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Hire',    v: '90s',     k: 'vs 6 weeks' },
              { l: 'Onboard', v: '0h',      k: 'vs 40h' },
              { l: 'Vacation',v: 'never',   k: 'vs 21 days' },
              { l: 'Output',  v: '24/7',    k: 'vs 8h × 5' },
            ].map(c => (
              <div key={c.l} style={{ padding: 16, background: 'var(--p-inset)', borderRadius: 12, border: `1px solid ${palette.border}` }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{c.l}</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.accent, marginTop: 2 }}>{c.v}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>{c.k}</div>
              </div>
            ))}
          </div>
        </div>
      </Glass>
    </div>
  );

  const Faq = () => {
    const [open, setOpen] = useState(0);
    return (
      <div style={{ padding: '80px 40px' }}>
        <SectionLabel kicker="Intelligence briefing" title={<>Questions, answered. <span style={{ color: palette.textDim }}>No fluff.</span></>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((f, i) => (
            <Glass key={i} style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{ width: '100%', padding: '18px 22px', background: 'transparent', border: 0, color: palette.text, fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                <span>{f.q}</span>
                <span style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 18, transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              {open === i && <div style={{ padding: '0 22px 20px', fontSize: 14, color: palette.textDim, lineHeight: 1.6 }}>{f.a}</div>}
            </Glass>
          ))}
        </div>
      </div>
    );
  };

  const Cta = () => (
    <div style={{ padding: '60px 40px 100px' }}>
      <Glass style={{ padding: 64, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 400px at 50% 100%, rgba(180,242,91,0.18), transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 64, fontWeight: 500, letterSpacing: -2, margin: 0, color: palette.text, lineHeight: 1 }}>
            Burn Power. <span style={{ color: palette.accent }}>Hire armies.</span>
          </h2>
          <p style={{ fontSize: 18, color: palette.textDim, marginTop: 18, maxWidth: 540, marginInline: 'auto' }}>
            10,000⚡ for €99. Enough to run an SDR for a quarter. Enough to ship 250 PR reviews. Enough to reconcile 2,500 transactions.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <button style={{ padding: '15px 28px', borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy Starter pack →</button>
            <button style={{ padding: '15px 28px', borderRadius: 12, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>Talk to ops</button>
          </div>
        </div>
      </Glass>
    </div>
  );

  // Footer icon resolver — prefers an admin-uploaded image over the
  // built-in inline-SVG registry. Pass `iconImage` (URL to PNG/SVG/WebP
  // uploaded via Filament) — if present, render <img>. Otherwise fall
  // back to the keyed inline SVG. Pass size='lg' for payment rows.
  const FooterIcon = ({ k, iconImage, label, size = 'sm' }) => {
    const stroke = 'currentColor';
    const isLg = size === 'lg';
    const w = isLg ? 96 : 22;
    const h = isLg ? 60 : 14;

    // Uploaded image takes priority — render at the same target dimensions,
    // letting object-fit: contain handle the aspect ratio of whatever the
    // admin uploaded (Visa logos are 16:9-ish, PayPal is taller, etc.).
    if (iconImage) {
      return (
        <img
          src={iconImage}
          alt={label || k || ''}
          style={{
            width: isLg ? 96 : 20,
            height: isLg ? 60 : 20,
            objectFit: 'contain',
            display: 'block',
          }}
        />
      );
    }

    const common = { width: w, height: h, viewBox: '0 0 38 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
    switch (k) {
      case 'visa':       return <svg {...common}><rect width="38" height="24" rx="3" fill="#1a1f71"/><text x="19" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Inter">VISA</text></svg>;
      case 'mastercard': return <svg {...common}><rect width="38" height="24" rx="3" fill="#000"/><circle cx="15" cy="12" r="6" fill="#eb001b"/><circle cx="23" cy="12" r="6" fill="#f79e1b" fillOpacity="0.85"/></svg>;
      case 'amex':       return <svg {...common}><rect width="38" height="24" rx="3" fill="#2e77bb"/><text x="19" y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff" fontFamily="Inter">AMEX</text></svg>;
      case 'applepay':   return <svg {...common}><rect width="38" height="24" rx="3" fill="#000"/><text x="19" y="16" textAnchor="middle" fontSize="8" fontWeight="600" fill="#fff" fontFamily="Inter"> Pay</text></svg>;
      case 'googlepay':  return <svg {...common}><rect width="38" height="24" rx="3" fill="#fff" stroke="#dadce0"/><text x="19" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Inter"><tspan fill="#4285f4">G</tspan><tspan fill="#34a853">P</tspan><tspan fill="#fbbc05">a</tspan><tspan fill="#ea4335">y</tspan></text></svg>;
      case 'paypal':     return <svg {...common}><rect width="38" height="24" rx="3" fill="#fff" stroke="#dadce0"/><text x="19" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="#003087" fontFamily="Inter">PayPal</text></svg>;
      case 'x':          return <svg width="14" height="14" viewBox="0 0 24 24" fill={stroke}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
      case 'linkedin':   return <svg width="14" height="14" viewBox="0 0 24 24" fill={stroke}><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.339 18.337v-8.59H5.667v8.59zm-1.336-9.745a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.327 9.745v-4.7c0-2.59-1.379-3.795-3.219-3.795-1.483 0-2.146.815-2.515 1.387v-1.19H9.926c.035.755 0 8.59 0 8.59h2.671v-4.8c0-.24.018-.48.088-.65.193-.479.633-.975 1.371-.975.967 0 1.354.735 1.354 1.811v4.614z"/></svg>;
      case 'github':     return <svg width="14" height="14" viewBox="0 0 24 24" fill={stroke}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>;
      case 'youtube':    return <svg width="14" height="14" viewBox="0 0 24 24" fill={stroke}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
      case 'rss':        return <svg width="14" height="14" viewBox="0 0 24 24" fill={stroke}><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/></svg>;
      default:           return <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: isLg ? 22 : 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k?.slice(0, 3)}</span>;
    }
  };

  const Footer = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    const burned = useCountUp(2104893, 1800);
    const cms = usePage().props?.cms || { menus: {}, settings: {} };
    const menus = cms.menus || {};
    const settings = cms.settings || {};
    // The five footer column slugs — ordered. Admin can edit each via the
    // Menus → Items relation manager. Falls back gracefully if a slug
    // hasn't been seeded yet.
    const columns = [
      { key: 'footer_marketplace', heading: 'Marketplace' },
      { key: 'footer_power',       heading: 'Power' },
      { key: 'footer_sellers',     heading: 'Sellers' },
      { key: 'footer_resources',   heading: 'Resources' },
      { key: 'footer_company',     heading: 'Company' },
    ];
    const socials  = menus.footer_social   || [];
    const payments = menus.footer_payments || [];
    const legals   = menus.footer_legal    || [];
    const copyright = settings.footer_copyright || '© HIRESPAWN SIA · RIGA · 2026';

    return (
      <div style={{ position: 'relative', marginTop: 80, borderTop: `1px solid ${palette.borderStrong}`, overflow: 'hidden' }}>
        {/* Subtle radial glow instead of watermark text */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(800px 400px at 50% 100%, rgba(180,242,91,0.08), transparent 70%)` }} />

        {/* Top: huge marquee CTA */}
        <div style={{ position: 'relative', padding: '60px 40px 48px', borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60, alignItems: 'flex-end' }}>
            <div>
              <Pill dot color={palette.accent} style={{ marginBottom: 22 }}>● Recruiting now · 12,847 agents on duty</Pill>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 96, fontWeight: 600, letterSpacing: -3.5, margin: 0, color: palette.text, lineHeight: 0.9 }}>
                Ready to <span style={{ color: palette.accent }}>spawn?</span>
              </h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <button style={{ padding: '15px 26px', borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy 10,000⚡ for €99 →</button>
                <button style={{ padding: '15px 22px', borderRadius: 12, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>Browse the roster</button>
                <button style={{ padding: '15px 22px', borderRadius: 12, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>Talk to ops</button>
              </div>
            </div>
            {/* Live ops widget */}
            <Glass style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>Live · last 24h</span>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: palette.accent, boxShadow: `0 0 10px ${palette.accent}`, animation: 'dirA-pulse-foot 1.4s infinite' }} />
              </div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 500, color: palette.accent, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>
                {burned.toLocaleString()}⚡
              </div>
              <div style={{ fontSize: 12, color: palette.textDim, marginBottom: 16 }}>Power burned across the marketplace</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { k: 'p95 latency', v: '1.8s', c: palette.accent },
                  { k: 'err rate',    v: '0.04%', c: palette.accent },
                  { k: 'uptime',      v: '99.97%', c: palette.accent },
                  { k: 'sellers',     v: '342', c: palette.amber },
                ].map(s => (
                  <div key={s.k} style={{ padding: '8px 10px', background: 'var(--p-inset)', borderRadius: 8, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.k}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 14, color: s.c, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <style>{`@keyframes dirA-pulse-foot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.9); } }`}</style>
            </Glass>
          </div>
        </div>

        {/* Mid: link grid */}
        <div style={{ position: 'relative', padding: '52px 40px 36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr)', gap: 32 }}>
            <div>
              <Logo />
              <div style={{ marginTop: 14, fontSize: 13, color: palette.textDim, lineHeight: 1.55, maxWidth: 280 }}>
                The marketplace for AI employees. Buy Power once. Burn it across whichever specialists you hire.
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {socials.map((s, i) => (
                  <a key={i} href={s.url || '#'} target={s.target || '_self'} aria-label={s.label} style={{ width: 36, height: 36, borderRadius: 8, background: palette.glassStrong, border: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textDim, cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s' }}
                     onMouseEnter={e => e.currentTarget.style.color = palette.accent}
                     onMouseLeave={e => e.currentTarget.style.color = palette.textDim}>
                    <FooterIcon k={s.icon || 'link'} iconImage={s.icon_image} label={s.label} />
                  </a>
                ))}
              </div>
              {/* Newsletter */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Field reports · weekly</div>
                <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${palette.borderStrong}`, overflow: 'hidden', background: 'var(--p-inset)' }}>
                  <input placeholder="ops@yourcompany.com" style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: 0, color: palette.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  <button style={{ padding: '10px 14px', background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Enlist →</button>
                </div>
                <div style={{ fontSize: 11, color: palette.textMute, marginTop: 6 }}>Power burn reports, new agents, no spam. 4,200+ ops readers.</div>
              </div>
            </div>

            {columns.map(col => {
              const items = menus[col.key] || [];
              if (items.length === 0) return null;
              return (
                <div key={col.key}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, marginBottom: 14, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>{col.heading}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((it, i) => (
                      <a key={i} href={it.url || '#'} target={it.target || '_self'} style={{ fontSize: 13, color: palette.textDim, cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s' }}
                         onMouseEnter={e => e.currentTarget.style.color = palette.accent}
                         onMouseLeave={e => e.currentTarget.style.color = palette.textDim}>{it.label}</a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment logos — admin-managed via /admin/menus footer_payments */}
        {payments.length > 0 && (
          <div style={{ position: 'relative', padding: '28px 40px', borderTop: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase' }}>We accept</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {payments.map((p, i) => (
                <span key={i} title={p.label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FooterIcon k={p.icon || 'card'} iconImage={p.icon_image} label={p.label} size="lg" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mil-style ribbon */}
        <div style={{ position: 'relative', padding: '14px 40px', borderTop: `1px solid ${palette.border}`, borderBottom: `1px solid ${palette.border}`, background: 'var(--p-inset-strong)', display: 'flex', alignItems: 'center', gap: 32, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 2, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ color: palette.accent }}>● OPCON 1</span>
          <span>SOC 2 TYPE II</span>
          <span>GDPR · DPA AVAILABLE</span>
          <span>ISO 27001</span>
          <span>EU + US RESIDENCY</span>
          <span style={{ color: palette.amber }}>● 342 SELLERS ACTIVE</span>
          <span>API V2.1</span>
          <span style={{ color: palette.accent }}>● ALL SYSTEMS NOMINAL</span>
          <span>SLA 99.95%</span>
        </div>

        {/* Bottom: legal */}
        <div style={{ position: 'relative', padding: '22px 40px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span>{copyright}</span>
            {legals.map((l, i) => (
              <a key={i} href={l.url || '#'} target={l.target || '_self'} style={{ color: palette.textMute, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                 onMouseEnter={e => e.currentTarget.style.color = palette.accent}
                 onMouseLeave={e => e.currentTarget.style.color = palette.textMute}>{l.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>UTC {time.toISOString().slice(11,19)}</span>
            <span style={{ color: palette.accent }}>● LIVE</span>
            <span>BUILD 2026.04.30-a3f1</span>
          </div>
        </div>
      </div>
    );
  };

  const Page = () => (
    <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
      <Mesh />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto' }}>
        <Nav />
        <Hero />
        <Reveal><PowerExplainer /></Reveal>
        <Reveal><HowItWorks /></Reveal>
        <Reveal><Roster /></Reveal>
        <Reveal><PowerPacks /></Reveal>
        <Reveal><PowerCalculator /></Reveal>
        <Reveal><Integrations /></Reveal>
        <Reveal><SellerStrip /></Reveal>
        <Reveal><Testimonials /></Reveal>
        <Reveal><Roi /></Reveal>
        <Reveal><Faq /></Reveal>
        <Reveal><Cta /></Reveal>
        <Reveal><Footer /></Reveal>
      </div>
    </div>
  );

  return { Page, palette, Glass, Pill, Mesh, Nav, Logo, SectionLabel, Reveal, Footer, ThemeToggle };
})();

if (typeof window !== 'undefined') {
    window.DirA = DirA;
}

export { DirA };
export default DirA;
