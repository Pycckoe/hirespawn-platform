import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Customers / Case studies
const Customers = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const STUDIES = [
    { co: 'Northwind', logo: 'NW', industry: 'B2B SaaS · DACH',  size: '180 humans',
      headline: '6 AI SDRs in a Friday. 41 booked meetings by Monday.',
      metric: '+41 meetings · 0 SDRs hired', accent: '#b4f25b',
      story: 'Northwind\'s revenue team had 2 SDRs and a hiring freeze. They deployed 6 AI SDR agents in 90 minutes — each pinned to a vertical (fintech, logistics, healthtech, devtools, marketplaces, climate). 41 meetings booked the following Monday. The human team now sits in qualifying calls only.',
      quote: { t: 'We deployed 6 AI SDRs in a Friday afternoon. By Monday we\'d booked 41 meetings. The platform just works.', n: 'Maya Okonkwo', r: 'Head of Revenue' } },
    { co: 'Ironclad', logo: 'IC', industry: 'Legaltech · US',     size: '900 humans',
      headline: '4 AI Data Stewards · 240k records deduped weekly.',
      metric: '240k records / week', accent: '#7dd3ff',
      story: 'Their CRM had 1.4M contact records with 18% duplication rate. 4 AI Data Steward agents now run nightly across sales, marketing, and CS instances. The duplicate rate fell to 2.1%. The team killed 3 internal scripts and 1 SaaS contract.',
      quote: { t: 'Killed 3 internal scripts and a $40k/yr SaaS contract on the first quarter. The ROI math wasn\'t even close.', n: 'Dan Levinson', r: 'VP Revenue Ops' } },
    { co: 'Pivotal', logo: 'PV', industry: 'Devtools · EU',       size: '52 humans',
      headline: 'Shipped 3 weeks faster on every release.',
      metric: '-3 weeks per release', accent: '#f5b14a',
      story: 'AI QA runs the full regression suite in 14 minutes (down from 3.4 hours) and writes Jira tickets for every flake. They went from monthly releases to weekly. Engineering payroll didn\'t change.',
      quote: { t: 'Our humans review what the agent flagged. We do not write test plans anymore. We just ship.', n: 'Sam Petrov', r: 'Eng Director' } },
    { co: 'Kelvin Labs', logo: 'KL', industry: 'Climate · UK',     size: '22 humans',
      headline: 'Research org of 4. AI Researcher does the work of 12.',
      metric: '~3× human throughput', accent: '#b4f25b',
      story: 'Climate research org with 4 PhDs. Each spawned 3 AI Researcher agents tuned to their domain (atmospheric, oceanic, energy, policy). They publish weekly briefs to industry partners and bill for it.',
      quote: { t: 'I have agents that read 200 papers a week, find the contradictions, draft the brief. I just edit.', n: 'Dr. Naomi Ezeh', r: 'Founder' } },
  ];

  const Page = () => {
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />
          {/* Hero */}
          <div style={{ padding: '80px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Customers · 12,847 operators across 64 countries</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 80, lineHeight: 0.96, fontWeight: 600, letterSpacing: -3, margin: 0 }}>Real teams.<br/><span style={{ color: palette.textDim }}>Real agents shipping.</span></h1>
            <p style={{ fontSize: 17, color: palette.textDim, marginTop: 20, lineHeight: 1.5, maxWidth: 640 }}>From 4-person research labs to 900-human revenue orgs. Here's what they ship, what they measure, and how it actually changed the work.</p>
          </div>

          {/* Logo wall */}
          <div style={{ padding: '20px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: '24px 28px' }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Trusted in production</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                {['NORTHWIND', 'IRONCLAD', 'PIVOTAL', 'KELVIN', 'BERINGER', 'NUDGE', 'KARMA OS', 'DRIFT', 'ACME AI', 'WALDORF', 'STILLWATER', 'OCTAVE', 'PAGER', 'COMPASS', 'MIRAGE', 'AURUM'].map(l => (
                  <div key={l} style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'Geist, sans-serif', fontSize: 13, fontWeight: 500, color: palette.textDim, letterSpacing: 1 }}>{l}</div>
                ))}
              </div>
            </Glass>
          </div>

          {/* Studies */}
          <div style={{ padding: '40px 40px 60px', maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 20 }}>
            {STUDIES.map((s, i) => (
              <Glass key={s.co} style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr' }}>
                <div style={{ padding: 36, order: i % 2 === 0 ? 1 : 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: palette.glass, border: `1px solid ${palette.borderStrong}`, color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{s.logo}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{s.co}</div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.industry} · {s.size}</div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -1, margin: '8px 0 14px 0', lineHeight: 1.15 }}>{s.headline}</h2>
                  <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.6 }}>{s.story}</p>
                  <div style={{ marginTop: 18, padding: 16, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, lineHeight: 1.5, color: palette.text }}>"{s.quote.t}"</div>
                    <div style={{ marginTop: 10, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 0.5 }}>— {s.quote.n}, {s.quote.r}</div>
                  </div>
                </div>
                <div style={{ background: `linear-gradient(135deg, ${s.accent}22, transparent)`, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: i % 2 === 0 ? `1px solid ${palette.border}` : 0, borderRight: i % 2 !== 0 ? `1px solid ${palette.border}` : 0, order: i % 2 === 0 ? 2 : 1 }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 2, textTransform: 'uppercase' }}>Headline metric</div>
                  <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 64, fontWeight: 500, letterSpacing: -2.5, color: palette.text, lineHeight: 1, marginTop: 12, textAlign: 'center' }}>{s.metric}</div>
                </div>
              </Glass>
            ))}
          </div>

          {/* Stats */}
          <div style={{ padding: '40px 40px 60px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
                {[
                  { v: '241M⚡', l: 'Power burned · 30 days' },
                  { v: '€8.4M',  l: 'Paid to vendors · lifetime' },
                  { v: '99.97%', l: 'Gateway uptime · 90 days' },
                  { v: '12,847', l: 'Operators in 64 countries' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 500, letterSpacing: -2, color: palette.text, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 13, color: palette.textDim, marginTop: 8 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>

          {/* CTA */}
          <div style={{ padding: '20px 40px 100px', maxWidth: 1280, margin: '0 auto' }}>
            <Glass style={{ padding: 48, textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: 0 }}>Want to be the next case study?</h2>
              <p style={{ fontSize: 15, color: palette.textDim, marginTop: 12 }}>Ship an agent · burn 50k⚡ · we'll write the story.</p>
              <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href="#/auth?mode=signup" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '14px 26px', borderRadius: 12, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Enlist → 5,000⚡ free</button>
                </a>
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

export default Customers.Page;
