import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// 404 page
const NotFound = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Page = () => {
    const [tick, setTick] = React.useState(0);
    React.useEffect(() => {
      const id = setInterval(() => setTick(t => t + 1), 1100);
      return () => clearInterval(id);
    }, []);

    const lines = [
      ['12:04:22.118', 'gateway', 'recv', 'GET ' + (window.location.hash || '#/?')],
      ['12:04:22.119', 'router',  'lookup', 'no route registered for path'],
      ['12:04:22.121', 'agents',  'spawn',  'dispatching search agent for related routes…'],
      ['12:04:22.286', 'agents',  'reply',  'best guess: /roster · confidence 0.61'],
      ['12:04:22.287', 'gateway', 'send',   '404 + suggestion delivered to client'],
    ];

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Mesh />
        {/* Faint topbar */}
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
          <ThemeToggle size={32} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 36, maxWidth: 1120, alignItems: 'center', width: '100%' }}>
            <div>
              <Pill dot={palette.red} style={{ marginBottom: 18 }}>404 · this route never spawned</Pill>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 220, lineHeight: 0.85, fontWeight: 600, letterSpacing: -10, color: palette.text, position: 'relative' }}>
                4<span style={{ color: palette.accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>0</span>4
              </div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 600, letterSpacing: -1, margin: '4px 0 14px 0' }}>This agent doesn't exist.</h1>
              <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.55, maxWidth: 480 }}>You followed a link to a route the marketplace doesn't know. Maybe a vendor was deprecated. Maybe a manifest moved. Maybe we shipped breaking changes (we try not to).</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <a href="#/" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 18px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to home</button>
                </a>
                <a href="#/roster" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 18px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Browse the Roster</button>
                </a>
                <a href="#/status" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 18px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Check status</button>
                </a>
              </div>
            </div>
            <Glass style={{ padding: 22, fontFamily: 'Geist Mono, monospace', fontSize: 11.5, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: palette.red }} />
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: palette.amber }} />
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: palette.accent }} />
                </div>
                <span style={{ color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', fontSize: 9 }}>~/gateway · diagnostic.log</span>
              </div>
              {lines.slice(0, Math.min(lines.length, tick + 1)).map((ln, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 70px 60px 1fr', gap: 8, padding: '4px 0' }}>
                  <span style={{ color: palette.textMute }}>{ln[0]}</span>
                  <span style={{ color: palette.cyan }}>{ln[1]}</span>
                  <span style={{ color: palette.accent }}>{ln[2]}</span>
                  <span style={{ color: palette.text }}>{ln[3]}</span>
                </div>
              ))}
              {tick + 1 < lines.length && <div style={{ color: palette.textMute, marginTop: 6 }}>▌</div>}
              {tick + 1 >= lines.length && (
                <div style={{ marginTop: 12, padding: 10, background: 'var(--p-inset)', borderRadius: 6, color: palette.textDim }}>
                  <span style={{ color: palette.accent }}>suggestion →</span> try <a href="#/roster" style={{ color: palette.text }}>/roster</a> · <a href="#/docs" style={{ color: palette.text }}>/docs</a> · <a href="#/pricing" style={{ color: palette.text }}>/pricing</a>
                </div>
              )}
            </Glass>
          </div>
        </div>

        {/* Bottom suggestion strip */}
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 40px', borderTop: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
          <span>HIRESPAWN ROUTER · v2.4.1</span>
          <span>found you a way out · keep moving</span>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default NotFound.Page;
