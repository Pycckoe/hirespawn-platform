import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Blog index + a single post view
const Blog = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const POSTS = [
    { slug: 'why-power-not-seats',     date: 'May 06, 2026', author: 'Eva Romero',     readTime: '8 min', tag: 'Manifesto', featured: true,
      title: 'Why we priced agents by Power, not seats.', dek: 'The seat-license model is a hack we inherited from the desktop era. It does not survive contact with software that does its own work. Here\'s the argument, in full.' },
    { slug: 'manifest-v2',             date: 'Apr 28, 2026', author: 'Mark Patel',     readTime: '6 min', tag: 'Engineering',
      title: 'Manifest v2 · declaring an SLA you can be held to.', dek: 'The new top-level sla block lets vendors put their margin where their mouth is.' },
    { slug: 'firecracker-rationale',   date: 'Apr 12, 2026', author: 'Iris Volkov',    readTime: '11 min', tag: 'Engineering',
      title: 'Why we picked Firecracker over Wasm for agent isolation.', dek: 'A pragmatic look at sandbox tradeoffs when your tenants are someone else\'s LLMs.' },
    { slug: 'sdr-economics',           date: 'Mar 30, 2026', author: 'Maya Okonkwo',   readTime: '5 min', tag: 'Customer story',
      title: 'Northwind\'s actual numbers · 6 AI SDRs, one quarter in.', dek: 'Not a marketing case study. The raw spreadsheet, with permission.' },
    { slug: 'agent-design-principles', date: 'Mar 14, 2026', author: 'Sam Petrov',     readTime: '9 min', tag: 'Design',
      title: 'Twelve principles for agents you can actually deploy.', dek: 'After 18 months of watching agents succeed and fail in production, these patterns held up.' },
    { slug: 'eu-data-residency',       date: 'Feb 22, 2026', author: 'Eva Romero',     readTime: '4 min', tag: 'Compliance',
      title: 'Why we launched in Frankfurt before San Francisco.', dek: 'GDPR is not a tax. It is a moat. Here is why our EU-first stance is a feature.' },
    { slug: 'vendor-bond-policy',      date: 'Feb 05, 2026', author: 'Yara Halilović', readTime: '3 min', tag: 'Policy',
      title: 'The 2,000⚡ vendor bond, and why it works.', dek: 'A small refundable deposit aligns incentives more powerfully than any TOS clause.' },
  ];

  const Index = () => (
    <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <Mesh />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Nav />

        <div style={{ padding: '72px 40px 32px', maxWidth: 1180, margin: '0 auto' }}>
          <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Field notes</Pill>
          <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 80, lineHeight: 0.96, fontWeight: 600, letterSpacing: -3, margin: 0 }}>The <span style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.accent }}>Spawn</span> log.</h1>
          <p style={{ fontSize: 17, color: palette.textDim, marginTop: 18, lineHeight: 1.55, maxWidth: 640 }}>Engineering, policy, customer numbers — written by the people building the marketplace. No outsourced ghostwriting. No SEO bait.</p>
        </div>

        {/* Featured */}
        <div style={{ padding: '20px 40px', maxWidth: 1180, margin: '0 auto' }}>
          {POSTS.filter(p => p.featured).map(p => (
            <a key={p.slug} href={`#/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Glass style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.3fr 1fr', cursor: 'pointer' }}>
                <div style={{ padding: 40 }}>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', background: palette.accentDim, borderRadius: 4 }}>Featured · {p.tag}</span>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.5, margin: '18px 0 14px 0', lineHeight: 1.1 }}>{p.title}</h2>
                  <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.55, margin: 0 }}>{p.dek}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 22, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 0.5 }}>
                    <span>{p.author}</span><span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime}</span>
                  </div>
                </div>
                <div style={{ background: `linear-gradient(140deg, ${palette.accent}33, transparent 60%), radial-gradient(ellipse at 70% 30%, ${palette.cyan}22, transparent 50%)`, borderLeft: `1px solid ${palette.border}`, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 96, lineHeight: 1, color: palette.text, opacity: 0.85, textAlign: 'center', letterSpacing: -3 }}>Power<br/><span style={{ fontSize: 56 }}>not seats.</span></div>
                </div>
              </Glass>
            </a>
          ))}
        </div>

        {/* Grid */}
        <div style={{ padding: '32px 40px 80px', maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {POSTS.filter(p => !p.featured).map(p => (
              <a key={p.slug} href={`#/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Glass style={{ padding: 22, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.cyan, letterSpacing: 1.5, textTransform: 'uppercase' }}>{p.tag}</span>
                  <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: '10px 0 10px 0', lineHeight: 1.2 }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.55, margin: 0, flex: 1 }}>{p.dek}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 0.5 }}>
                    <span>{p.author}</span><span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime}</span>
                  </div>
                </Glass>
              </a>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );

  const Post = ({ slug }) => {
    const post = POSTS.find(p => p.slug === slug) || POSTS[0];
    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />

          <article style={{ maxWidth: 780, margin: '0 auto', padding: '60px 40px 100px' }}>
            <a href="#/blog" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>← Blog</a>
            <Pill dot={palette.cyan} style={{ marginTop: 22, marginBottom: 18 }}>{post.tag}</Pill>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, lineHeight: 1.05, fontWeight: 600, letterSpacing: -1.8, margin: 0 }}>{post.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, paddingBottom: 22, borderBottom: `1px solid ${palette.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 99, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600 }}>{post.author.split(' ').map(s => s[0]).join('')}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{post.author}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{post.date} · {post.readTime}</div>
              </div>
            </div>

            <div style={{ fontSize: 19, color: palette.textDim, fontStyle: 'italic', lineHeight: 1.55, margin: '32px 0', fontFamily: 'Instrument Serif, serif' }}>{post.dek}</div>

            <div style={{ fontSize: 16.5, lineHeight: 1.75, color: palette.text }}>
              <p>The seat-license model was invented for desktop software in 1987. The unit of value was a human, sitting at a workstation, doing work. Charge per workstation. Charge per human. Multiply.</p>

              <p>That model survived the migration to SaaS because the math still worked: a seat in the cloud was still a human, still doing work. The marginal cost of the next seat for the vendor was nearly zero. The margin was the moat.</p>

              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -0.8, margin: '40px 0 14px 0' }}>Then the seat stopped being a human.</h2>

              <p>An AI SDR doesn't sit. It doesn't log in. It doesn't burn the same compute on Tuesday as on Saturday. If you charge for it by the seat, you've made one of two errors:</p>

              <ol style={{ paddingLeft: 24, lineHeight: 1.8 }}>
                <li>You priced the seat too low — and the vendor goes broke when a customer scales agents 100×.</li>
                <li>You priced the seat too high — and the customer overpays for the 80% of days the agent is idle.</li>
              </ol>

              <p>There is no setting of the dial that makes seat licensing work for software that does its own work. The unit is wrong.</p>

              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -0.8, margin: '40px 0 14px 0' }}>Power is the right unit.</h2>

              <p>Power is what an agent burns to do one unit of work. A simple data lookup is 4⚡. A multi-step research task with browsing and synthesis is 250⚡. Each agent declares its rate in the manifest. Operators see the rate before they hire. The ledger settles in real time.</p>

              <Glass style={{ padding: 22, margin: '28px 0', borderLeft: `3px solid ${palette.accent}` }}>
                <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, fontStyle: 'italic', lineHeight: 1.45 }}>"You don't pay for an SDR who's asleep. You shouldn't pay for one that's idle either."</div>
              </Glass>

              <p>This alignment is the whole game. The vendor's revenue scales with the work the agent does — not with how aggressively they upsell. The customer's bill scales with their actual outcomes. The marketplace rewards agents that are efficient, not agents that are merely deployed.</p>

              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 600, letterSpacing: -0.8, margin: '40px 0 14px 0' }}>The objections, addressed.</h2>

              <p><strong>"Customers want predictable bills."</strong> They do. That's why Power is bought in packs upfront. You always know what you've spent because you can see what you bought.</p>

              <p><strong>"Variable pricing punishes heavy users."</strong> The opposite. Volume discount is built into the packs: a Fleet customer pays under 0.007€/⚡, while a Starter pays 0.0099€. You scale into a better rate.</p>

              <p><strong>"What about SLA breaches?"</strong> Refunded in Power within 48h, automatically. The ledger does the work.</p>

              <p>The seat license served its era. This one is over.</p>
            </div>

            {/* Author + share */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Share · X', 'Copy link', 'Email'].map(b => (
                  <button key={b} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.textDim, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>{b}</button>
                ))}
              </div>
              <a href="#/blog" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>More posts →</a>
            </div>
          </article>

          <Footer />
        </div>
      </div>
    );
  };

  return { Index, Post };
})();

export default Blog.Post;
