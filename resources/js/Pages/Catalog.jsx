import '@/setup';
import { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// CATALOG / ROSTER PAGE
// Full marketplace — search, filters, sort, rich agent cards, sidebar
// Live data: reads `agents` + `categories` from Inertia props
// (see AgentController@index).
// =====================================================================

const Catalog = (() => {
  const { palette, Glass, Pill, Mesh, Nav, SectionLabel, Reveal, Footer } = DirA;

  // ---- Filter state ----
  const useCatalogState = (roster) => {
    const [query, setQuery]     = useState('');
    const [cat, setCat]         = useState('all');     // category key
    const [maxPower, setMax]    = useState(80);        // filter cap
    const [sort, setSort]       = useState('popular'); // popular|rating|power-asc|power-desc|deployed
    const [view, setView]       = useState('grid');    // grid|table

    const filtered = useMemo(() => {
      let r = (roster || []).filter(a => {
        if (cat !== 'all' && a.tone !== cat) return false;
        if (a.power > maxPower) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          if (!(a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.vendor.toLowerCase().includes(q) || (a.spec || '').toLowerCase().includes(q))) return false;
        }
        return true;
      });
      const sorters = {
        'popular':    (a,b) => b.deployed - a.deployed,
        'rating':     (a,b) => b.rating - a.rating,
        'power-asc':  (a,b) => a.power - b.power,
        'power-desc': (a,b) => b.power - a.power,
        'deployed':   (a,b) => b.deployed - a.deployed,
      };
      return r.sort(sorters[sort] || sorters.popular);
    }, [query, cat, maxPower, sort, roster]);

    return { query, setQuery, cat, setCat, maxPower, setMax, sort, setSort, view, setView, filtered };
  };

  // ---- Header bar (sticky) ----
  const CatalogHeader = ({ filteredCount, query, setQuery, sort, setSort, view, setView }) => (
    <div style={{ position: 'sticky', top: 0, zIndex: 9, padding: '20px 40px', background: 'rgba(5,7,10,0.7)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderBottom: `1px solid ${palette.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>▸</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search agents, vendors, roles..."
            style={{
              width: '100%', padding: '12px 14px 12px 36px',
              background: 'var(--p-inset-strong)', border: `1px solid ${palette.border}`,
              borderRadius: 10, color: palette.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = palette.borderStrong}
            onBlur={e => e.target.style.borderColor = palette.border}
          />
        </div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {filteredCount} <span style={{ color: palette.textDim }}>agents</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px', background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
          {[
            { k: 'popular',    l: 'Popular' },
            { k: 'rating',     l: '★ Rating' },
            { k: 'power-asc',  l: '⚡ Cheap' },
            { k: 'power-desc', l: '⚡ Power' },
          ].map(s => {
            const sel = sort === s.k;
            return (
              <button key={s.k} onClick={() => setSort(s.k)} style={{ padding: '7px 11px', borderRadius: 7, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 12, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5, cursor: 'pointer', fontWeight: sel ? 600 : 400 }}>{s.l}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '4px', background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
          {[
            { k: 'grid', icon: '▦' },
            { k: 'table', icon: '☰' },
          ].map(v => {
            const sel = view === v.k;
            return (
              <button key={v.k} onClick={() => setView(v.k)} style={{ padding: '7px 11px', borderRadius: 7, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>{v.icon}</button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ---- Sidebar filters ----
  const Sidebar = ({ cat, setCat, maxPower, setMax, roster, categories }) => {
    const counts = useMemo(() => {
      const m = { all: (roster || []).length };
      (categories || []).forEach(c => { m[c.key] = (roster || []).filter(a => a.tone === c.key).length; });
      return m;
    }, [roster, categories]);

    return (
      <Glass style={{ padding: 20, position: 'sticky', top: 100 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
          {[{ key: 'all', label: 'All agents', icon: '◆' }, ...(categories || [])].map(c => {
            const sel = cat === c.key;
            return (
              <button key={c.key} onClick={() => setCat(c.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: sel ? 600 : 400 }}>
                <span><span style={{ marginRight: 8, fontFamily: 'Geist Mono, monospace' }}>{c.icon}</span>{c.label}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: sel ? palette.accent : palette.textMute }}>{counts[c.key] || 0}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Max ⚡ per task</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text, marginBottom: 6 }}>
          <span>≤ {maxPower}⚡</span>
          <span style={{ color: palette.textMute }}>{maxPower === 80 ? 'no cap' : 'filtered'}</span>
        </div>
        <input type="range" min={2} max={80} step={2} value={maxPower} onChange={e => setMax(+e.target.value)} style={{ width: '100%', accentColor: palette.accent }} />

        <div style={{ marginTop: 24, padding: 12, background: 'rgba(180,242,91,0.06)', border: `1px solid ${palette.accentDim}`, borderRadius: 10 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Need a custom one?</div>
          <div style={{ fontSize: 13, color: palette.textDim, marginTop: 6, lineHeight: 1.45 }}>Publish your own agent. Set Power cost, share revenue.</div>
          <Link href="/vendor" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: palette.accent, textDecoration: 'none', fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5 }}>Apply as seller →</Link>
        </div>
      </Glass>
    );
  };

  // ---- Rich agent card ----
  const AgentCard = ({ agent }) => {
    const [hover, setHover] = useState(false);
    const intCount = agent.int.length;
    return (
      <a href={`#/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <Glass onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: 22, cursor: 'pointer', transform: hover ? 'translateY(-3px)' : 'translateY(0)', transition: 'transform 0.3s, border-color 0.3s', borderColor: hover ? palette.borderStrong : palette.border, position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top strip: rank, rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, rgba(180,242,91,0.22), rgba(180,242,91,0.04))', border: `1px solid ${palette.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent, fontSize: 20, fontFamily: 'Geist Mono, monospace' }}>{CATEGORIES.find(c => c.key === agent.tone)?.icon || '◇'}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: palette.text, letterSpacing: -0.2 }}>{agent.name}</div>
              <div style={{ fontSize: 12, color: palette.textMute, marginTop: 2 }}>{agent.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ padding: '3px 8px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1, borderRadius: 4 }}>{agent.rank}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.amber }}>★ {agent.rating}</span>
          </div>
        </div>

        {/* Spec terminal */}
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, marginBottom: 14 }}>
          ▸ {agent.spec}
        </div>

        {/* Vendor + integrations */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5, marginBottom: 14 }}>
          <span>by {agent.vendor}</span>
          <span>{intCount} integration{intCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Lang chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 18 }}>
          {agent.langs.slice(0, 4).map(l => (
            <span key={l} style={{ padding: '2px 6px', fontSize: 10, color: palette.textMute, fontFamily: 'Geist Mono, monospace', border: `1px solid ${palette.border}`, borderRadius: 4 }}>{l}</span>
          ))}
        </div>

        {/* Footer: power + deploy */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${palette.border}` }}>
          <div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 500, color: palette.accent, lineHeight: 1 }}>
              {agent.power}<span style={{ fontSize: 14, color: palette.textMute }}>⚡</span>
            </div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 4 }}>per {agent.perUnit} · {agent.deployed.toLocaleString()} deployed</div>
          </div>
          <span style={{ padding: '8px 14px', borderRadius: 8, background: hover ? palette.accent : 'transparent', border: `1px solid ${hover ? palette.accent : palette.borderStrong}`, color: hover ? '#0a0e14' : palette.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.25s' }}>Deploy →</span>
        </div>
      </Glass>
      </a>
    );
  };

  // ---- Table view (compact) ----
  const TableRow = ({ agent }) => {
    const [hover, setHover] = useState(false);
    return (
      <a href={`#/agent/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.8fr 1fr 0.6fr', gap: 14, alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, background: hover ? 'rgba(180,242,91,0.04)' : 'transparent', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{CATEGORIES.find(c => c.key === agent.tone)?.icon || '◇'}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{agent.name}</div>
              <div style={{ fontSize: 11, color: palette.textMute }}>{agent.role}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace' }}>{agent.vendor}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '2px 7px', background: palette.accentDim, color: palette.accent, borderRadius: 4, justifySelf: 'start' }}>{agent.rank}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.amber }}>★ {agent.rating}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{agent.deployed.toLocaleString()}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{agent.spec}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 17, fontWeight: 500, color: palette.accent }}>{agent.power}<span style={{ fontSize: 11, color: palette.textMute }}>⚡</span></span>
            <span style={{ color: hover ? palette.accent : palette.textMute, fontSize: 14 }}>→</span>
          </div>
        </div>
      </a>
    );
  };

  // ---- Empty state ----
  const EmptyState = () => (
    <Glass style={{ padding: 64, textAlign: 'center' }}>
      <div style={{ fontSize: 36, color: palette.textMute, marginBottom: 14 }}>◌</div>
      <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 500, color: palette.text, margin: 0 }}>No agents match those filters.</h3>
      <p style={{ fontSize: 14, color: palette.textDim, marginTop: 10 }}>Try widening the Power range or clearing the search.</p>
    </Glass>
  );

  // ---- Hero strip ----
  const CatalogHero = ({ rosterCount = 0 }) => (
    <div style={{ padding: '50px 40px 30px' }}>
      <Pill dot color={palette.amber} style={{ marginBottom: 14 }}>The roster · {rosterCount} agents on duty</Pill>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'end' }}>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 76, lineHeight: 0.95, fontWeight: 600, letterSpacing: -2.5, margin: 0, color: palette.text }}>
          Browse the roster.<br/>
          <span style={{ color: palette.textDim, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Hire any rank.</span>
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { l: 'Avg deploy', v: '< 90s', k: 'self-installs' },
            { l: 'SLA',         v: '99.9%', k: 'or Power back' },
            { l: 'New / wk',    v: '+12',   k: 'vetted vendors' },
          ].map(s => (
            <div key={s.l} style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 12 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 500, color: palette.text, marginTop: 4 }}>{s.v}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---- Page ----
  const Page = () => {
    const { agents = [], categories = [] } = usePage().props;
    const effectiveCategories = categories.length ? categories : CATEGORIES;
    const s = useCatalogState(agents);
    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto' }}>
          <Nav />
          <CatalogHero rosterCount={agents.length} />
          <CatalogHeader filteredCount={s.filtered.length} query={s.query} setQuery={s.setQuery} sort={s.sort} setSort={s.setSort} view={s.view} setView={s.setView} />

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, padding: '24px 40px 60px', alignItems: 'start' }}>
            <Sidebar cat={s.cat} setCat={s.setCat} maxPower={s.maxPower} setMax={s.setMax} roster={agents} categories={effectiveCategories} />

            <div>
              {s.filtered.length === 0 ? <EmptyState /> :
                s.view === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {s.filtered.map((a, i) => (
                      <Reveal key={a.id} delay={Math.min(i, 8) * 50} y={20}><AgentCard agent={a} /></Reveal>
                    ))}
                  </div>
                ) : (
                  <Glass style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.8fr 1fr 0.6fr', gap: 14, padding: '12px 18px', borderBottom: `1px solid ${palette.borderStrong}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
                      <span>Agent</span><span>Vendor</span><span>Rank</span><span>Rating</span><span>Deployed</span><span>Spec</span><span style={{ textAlign: 'right' }}>⚡ / unit</span>
                    </div>
                    {s.filtered.map(a => <TableRow key={a.id} agent={a} />)}
                  </Glass>
                )
              }
            </div>
          </div>

          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Catalog.Page;
