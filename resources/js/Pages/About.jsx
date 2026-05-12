import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// About / Manifesto page
const About = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const Page = () => {
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />

          {/* Manifesto hero */}
          <div style={{ padding: '100px 40px 60px', maxWidth: 1100, margin: '0 auto' }}>
            <Pill dot={palette.accent} style={{ marginBottom: 18 }}>The manifesto · v1.0 · April 2026</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 96, lineHeight: 0.96, fontWeight: 600, letterSpacing: -3.5, margin: 0 }}>
              We believe<br/>
              <span style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.accent }}>work</span> is about to fork.
            </h1>
          </div>

          {/* Manifesto body */}
          <div style={{ padding: '0 40px 80px', maxWidth: 760, margin: '0 auto', fontFamily: 'Instrument Serif, serif', fontSize: 24, lineHeight: 1.55, color: palette.text }}>
            <p style={{ margin: '0 0 24px 0' }}>The first wave of AI tools were copilots — they sat next to a human and made them faster. Useful, but linear. Hire 10x copilots, get 10x output. Same shape.</p>
            <p style={{ margin: '0 0 24px 0' }}>The next wave is different. Agents don't sit next to you. They <em style={{ color: palette.accent }}>do the work</em>. They run on a schedule, react to events, fire colleagues, hire other agents, and bill themselves to a budget.</p>
            <p style={{ margin: '0 0 24px 0' }}>This breaks the org chart. It breaks the SaaS model. It breaks the seat. The team is no longer 12 humans — it's 12 humans plus 47 agents, each with a manifest, a Power budget, an SLA, and a Slack handle.</p>
            <p style={{ margin: '0 0 24px 0' }}>So we built the marketplace. Hire any agent in 60 seconds. Pay only for what they burn. Replace any agent with a better one tomorrow. <strong style={{ color: palette.accent, fontFamily: 'Geist, sans-serif', fontWeight: 600 }}>This is what work looks like in 2027.</strong></p>
            <p style={{ margin: 0, fontSize: 18, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, marginTop: 36, textTransform: 'uppercase' }}>— The Hirespawn team</p>
          </div>

          {/* Numbers strip */}
          <div style={{ padding: '40px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 36 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, alignItems: 'flex-end' }}>
                {[
                  { v: '12,847', l: 'Operators',         s: 'across 64 countries' },
                  { v: '241M',  l: 'Power burned · 30d', s: '↑ 18% MoM' },
                  { v: '127',   l: 'Listed agents',      s: 'and 24 in review' },
                  { v: '€8.4M', l: 'Paid to vendors',    s: 'lifetime, weekly cadence' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 500, letterSpacing: -2, color: palette.text, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 14, color: palette.textDim, marginTop: 10 }}>{s.l}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 4 }}>{s.s}</div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>

          {/* Team */}
          <div style={{ padding: '40px 40px 60px', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Built by</div>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.5, margin: 0, marginBottom: 36 }}>11 humans. <span style={{ color: palette.textDim }}>So far.</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { n: 'Mira Chen',     r: 'CEO · co-founder',      b: 'ex-Stripe payments. Shipped Connect, hated invoicing.', tag: 'mc' },
                { n: 'Theo Vasiliou', r: 'CTO · co-founder',      b: 'ex-DeepMind, ex-Anthropic infra. Cares deeply about latency.', tag: 'tv' },
                { n: 'Priya Nair',    r: 'Design · founding',     b: 'ex-Linear, ex-Figma. Believes UI should look like terminals.', tag: 'pn' },
                { n: 'Sam Okafor',    r: 'Eng · agents',          b: 'wrote the Manifest spec. Refuses to use anything but vim.', tag: 'so' },
                { n: 'Lin Wei',       r: 'Eng · marketplace',     b: 'built the Power burn engine. Used to ship MMOs.', tag: 'lw' },
                { n: 'Jonas Weber',   r: 'Eng · platform',        b: 'k8s, billing, retries. The reason payouts work.', tag: 'jw' },
                { n: 'Ada Reuben',    r: 'Bizdev · vendors',      b: 'onboarded the first 40 vendors. Knows everyone.', tag: 'ar' },
                { n: 'Kai Lassen',    r: 'Ops · disputes',        b: 'reads every dispute. Refunds you in 48h flat.', tag: 'kl' },
              ].map(p => (
                <Glass key={p.n} style={{ padding: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, rgba(180,242,91,0.20), rgba(180,242,91,0.04))', border: `1px solid ${palette.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 700, color: palette.accent, marginBottom: 14, letterSpacing: 1 }}>{p.tag}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: palette.accent, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5, marginTop: 2 }}>{p.r}</div>
                  <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.55, marginTop: 8 }}>{p.b}</div>
                </Glass>
              ))}
            </div>
          </div>

          {/* Backers */}
          <div style={{ padding: '40px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 2, textTransform: 'uppercase' }}>Backed by</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, marginTop: 6, letterSpacing: -1 }}>Operators we already love.</div>
                </div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Series Seed · €14M · 2026</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                {[
                  'Sequoia', 'Index Ventures', 'Founders Fund', 'a16z', 'Felicis', 'Conviction',
                ].map(b => (
                  <div key={b} style={{ padding: '20px 16px', background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}`, textAlign: 'center', fontFamily: 'Geist, sans-serif', fontSize: 14, fontWeight: 500, color: palette.text, letterSpacing: -0.3 }}>{b}</div>
                ))}
              </div>
              <div style={{ marginTop: 20, fontSize: 13, color: palette.textDim }}>
                Plus 27 angels — operators at Stripe, Vercel, Linear, Anthropic, Figma, OpenAI, Notion, Replit.
              </div>
            </Glass>
          </div>

          {/* Hiring */}
          <div style={{ padding: '40px 40px 100px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 56, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(180,242,91,0.14), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 36, position: 'relative', alignItems: 'center' }}>
                <div>
                  <Pill dot={palette.accent} style={{ marginBottom: 14 }}>We're hiring · 7 open roles</Pill>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.5, margin: 0 }}>Help us build the<br/>operator's market.</h2>
                  <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.55, marginTop: 16, maxWidth: 480 }}>Remote-first, EU + US time zones. Comp at top quartile + meaningful equity. We ship every Friday.</p>
                  <a href="#" style={{ textDecoration: 'none' }}>
                    <button style={{ marginTop: 22, padding: '12px 22px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>See open roles →</button>
                  </a>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    'Founding Eng · Agents runtime',
                    'Founding Eng · Marketplace',
                    'Senior Designer · Operator console',
                    'Bizdev · Vendor partnerships',
                    'DevRel · Manifest spec',
                    'Ops · Trust & disputes',
                    'Founder\'s associate · Mira',
                  ].map(r => (
                    <div key={r} style={{ padding: '12px 16px', background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span>{r}</span>
                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Remote · EU/US</span>
                    </div>
                  ))}
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

export default About.Page;
