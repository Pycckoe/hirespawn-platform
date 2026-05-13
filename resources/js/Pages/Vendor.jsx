import '@/setup';
import { Link, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// SELLER DASHBOARD — view for an AI agent vendor / studio
// Revenue, active subscriptions, payouts, listings, performance, disputes
// =====================================================================

const SellerDash = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  // ---- Demo seller account ----
  const SELLER = {
    studio: 'Acme AI',
    handle: '@acme-ai',
    user: 'Theo Ramos',
    initials: 'TR',
    tier: 'Verified Vendor',
    powerEarned30d: 412840, // ⚡ earned by their listings
    eurEarned30d: 3715,     // payout in € (after platform cut)
    eurPayoutNext: 1284,
    eurHoldReserve: 412,
    nextPayoutDate: 'Mar 5, 2026',
    activeSubs: 84,
    totalRuns30d: 28412,
    avgRating: 4.83,
    listings: 4,
  };

  // Revenue series (30d, in Power)
  const REV_30D = [
    8400, 9200, 8800, 11200, 12400, 11800, 10900, 12400, 13800, 14200, 15100, 14800, 13900, 12800, 14200,
    15400, 16800, 17200, 16400, 15800, 17400, 18900, 19200, 18400, 17800, 16400, 17200, 18800, 19400, 14282,
  ];
  const REV_7D = [124000, 138000, 142000, 156000, 168000, 174000, 142820];
  const REV_24H = Array.from({length: 24}).map((_, i) => 200 + Math.round(Math.sin(i / 3) * 120 + Math.random() * 80) * (i > 8 && i < 22 ? 2 : 1));

  // ---- The seller's agent listings ----
  // Fallback demo data used when the signed-in seller has no agents yet.
  const DEMO_LISTINGS = [
    { id: 'sdr-pro',     name: 'AI SDR',           cat: 'Sales',       icon: '◇', power: 12, perUnit: 'lead',        status: 'live',    subs: 42, runs30d: 14200, rev30d: 170400, rating: 4.91, rev_share: 70 },
    { id: 'enricher',    name: 'AI Lead Enricher', cat: 'Sales',       icon: '◇', power: 3,  perUnit: 'record',      status: 'live',    subs: 28, runs30d: 89400, rev30d: 268200, rating: 4.85, rev_share: 70 },
    { id: 'dialer',      name: 'AI Dialer',        cat: 'Sales',       icon: '◇', power: 24, perUnit: 'call',        status: 'review',  subs: 0,  runs30d: 0,     rev30d: 0,      rating: null, rev_share: 70 },
    { id: 'closer',      name: 'AI Closer',        cat: 'Sales',       icon: '◇', power: 80, perUnit: 'deal',        status: 'paused',  subs: 14, runs30d: 184,  rev30d: 14720,  rating: 4.62, rev_share: 70 },
  ];

  // ---- Active customer subscriptions ----
  const SUBS = [
    { customer: 'Helix Co.',         seat: 'Mara Lindholm',   plan: 'Pro',    listings: ['AI SDR'],                            mrr: 12400, rev30d: 12400, since: 'Sep 2025', status: 'healthy',  trend: [12,14,15,17,16,18,20,19,21,22,24] },
    { customer: 'Northwind Robotics',seat: 'Karim Ait-Saïd',  plan: 'Studio', listings: ['AI SDR','AI Lead Enricher'],         mrr: 28400, rev30d: 28400, since: 'Apr 2025', status: 'healthy',  trend: [22,24,26,25,27,30,31,33,32,35,38] },
    { customer: 'Petrichor.io',      seat: 'Lin Marczak',     plan: 'Pro',    listings: ['AI Lead Enricher'],                  mrr: 8400,  rev30d: 8400,  since: 'Jan 2026', status: 'healthy',  trend: [4,6,8,7,9,10,12,11,13,14,15] },
    { customer: 'Kelvin Labs',       seat: 'Asha Devarajan',  plan: 'Pro',    listings: ['AI Closer'],                         mrr: 14720, rev30d: 14720, since: 'Nov 2025', status: 'at-risk',  trend: [22,18,16,14,13,11,10,9,8,7,6] },
    { customer: 'Bright Coast',      seat: 'Jonas Wei',       plan: 'Solo',   listings: ['AI SDR'],                            mrr: 4200,  rev30d: 4200,  since: 'Feb 2026', status: 'healthy',  trend: [2,3,4,4,5,6,7,7,8,9,10] },
    { customer: 'Modulus.ai',        seat: 'Greta Hoffstad',  plan: 'Studio', listings: ['AI SDR','AI Lead Enricher'],         mrr: 22400, rev30d: 22400, since: 'Aug 2025', status: 'healthy',  trend: [18,20,21,23,22,24,26,28,27,29,32] },
  ];

  // ---- Payout history ----
  // Fallback demo data used when the seller has no real payouts yet.
  const DEMO_PAYOUTS = [
    { date: 'Feb 05, 2026', period: 'Jan 2026',  power: 384200, eur: 3457, fee: 0,    status: 'paid',     ref: 'PO-26-02-A41' },
    { date: 'Jan 05, 2026', period: 'Dec 2025',  power: 412800, eur: 3715, fee: 0,    status: 'paid',     ref: 'PO-26-01-A41' },
    { date: 'Dec 05, 2025', period: 'Nov 2025',  power: 348100, eur: 3133, fee: 0,    status: 'paid',     ref: 'PO-25-12-A41' },
    { date: 'Nov 05, 2025', period: 'Oct 2025',  power: 296400, eur: 2667, fee: 0,    status: 'paid',     ref: 'PO-25-11-A41' },
    { date: 'Oct 05, 2025', period: 'Sep 2025',  power: 224800, eur: 1996, fee: 28,   status: 'paid',     ref: 'PO-25-10-A41' },
  ];

  // ---- Disputes / SLA breaches ----
  const DISPUTES = [
    { id: 'D-481', customer: 'Kelvin Labs',    listing: 'AI Closer', issue: 'Latency >120s on 3 deals',         opened: '2d ago',  state: 'open',     credit: 240 },
    { id: 'D-462', customer: 'Modulus.ai',     listing: 'AI SDR',    issue: 'False positive lead match',         opened: '6d ago',  state: 'investigating', credit: 36 },
    { id: 'D-447', customer: 'Northwind Robotics', listing: 'AI Lead Enricher', issue: 'Webhook delivery delay', opened: '12d ago', state: 'resolved', credit: 88 },
  ];

  // ---- Performance metrics ----
  const PERF = [
    { listing: 'AI SDR',           runs: 14200, success: 99.81, avgLatency: '0.42s', rating: 4.91 },
    { listing: 'AI Lead Enricher', runs: 89400, success: 99.94, avgLatency: '0.18s', rating: 4.85 },
    { listing: 'AI Closer',        runs: 184,   success: 96.20, avgLatency: '2.1s',  rating: 4.62 },
  ];

  // ---- Sidebar items (built per-render to reflect runtime listing count) ----
  const buildSideItems = (listings) => [
    { id: 'overview',  label: 'Overview',      icon: '◆' },
    { id: 'listings',  label: 'Listings',      icon: '◇', count: listings.length },
    { id: 'subs',      label: 'Subscriptions', icon: '◈', count: SUBS.length },
    { id: 'perf',      label: 'Performance',   icon: '▲' },
    { id: 'payouts',   label: 'Payouts',       icon: '⚡' },
    { id: 'disputes',  label: 'Disputes',      icon: '!', count: DISPUTES.filter(d => d.state !== 'resolved').length, alert: true },
    { id: 'manifest',  label: 'Manifest spec', icon: '⌘' },
    { id: 'settings',  label: 'Settings',      icon: '◌' },
  ];

  // ---- Sparkline ----
  const Spark = ({ data, w = 220, h = 42, color = palette.accent, fill = true }) => {
    const max = Math.max(...data), min = Math.min(...data);
    const r = max - min || 1;
    const sx = w / (data.length - 1);
    const points = data.map((v, i) => `${i*sx},${h - ((v - min)/r) * (h - 6) - 3}`).join(' ');
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs><linearGradient id={`sg-${color}-${data.length}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {fill && <polyline points={`0,${h} ${points} ${w},${h}`} fill={`url(#sg-${color}-${data.length})`} stroke="none" />}
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  // ---- Top bar ----
  const TopBar = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${palette.border}`, background: 'rgba(5,7,10,0.7)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', position: 'sticky', top: 0, zIndex: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ vendor</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '4px 9px', background: 'var(--p-chip)', border: `1px solid ${palette.border}`, borderRadius: 6 }}>{SELLER.studio} · {SELLER.handle}</span>
          <span style={{ padding: '3px 8px', background: 'rgba(125,211,255,0.12)', color: palette.cyan, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>✓ {SELLER.tier.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span>UTC {time.toISOString().slice(11,19)}</span>
          <ThemeToggle size={32} />
          <a href="#/console" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Switch to buyer</a>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ New listing</button>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: 'linear-gradient(135deg, #ff9f4a, #b4f25b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, color: palette.onAccent }}>{SELLER.initials}</div>
        </div>
      </div>
    );
  };

  // ---- Sidebar ----
  const Sidebar = ({ tab, setTab, items = [] }) => (
    <div style={{ width: 220, borderRight: `1px solid ${palette.border}`, padding: '28px 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 65, alignSelf: 'flex-start', height: 'calc(100vh - 65px)' }}>
      {items.map(s => {
        const sel = tab === s.id;
        return (
          <button key={s.id} onClick={() => setTab(s.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: sel ? 600 : 400 }}>
            <span><span style={{ marginRight: 10, fontFamily: 'Geist Mono, monospace', color: s.alert ? palette.amber : (sel ? palette.accent : palette.textMute) }}>{s.icon}</span>{s.label}</span>
            {s.count != null && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: s.alert ? palette.amber : (sel ? palette.accent : palette.textMute), background: s.alert ? 'rgba(255,184,77,0.12)' : 'transparent', padding: s.alert ? '1px 6px' : 0, borderRadius: 4 }}>{s.count}</span>}
          </button>
        );
      })}
      <div style={{ marginTop: 'auto', padding: 12, borderRadius: 8, background: 'rgba(180,242,91,0.05)', border: `1px solid ${palette.accentDim}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Next payout</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4 }}>€{SELLER.eurPayoutNext.toLocaleString()}</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>{SELLER.nextPayoutDate}</div>
      </div>
    </div>
  );

  // ---- KPI card ----
  const Kpi = ({ label, value, sub, color = palette.accent, sparkData, sparkColor, delta }) => (
    <Glass style={{ padding: 22 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
        <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, color: color, letterSpacing: -1, lineHeight: 1 }}>{value}</span>
        {delta != null && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: delta > 0 ? palette.accent : palette.red, fontWeight: 600 }}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</span>}
      </div>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 6 }}>{sub}</div>
      {sparkData && <div style={{ marginTop: 12 }}><Spark data={sparkData} color={sparkColor || color} /></div>}
    </Glass>
  );

  // ---- Revenue chart with range toggle ----
  const RevenueChart = () => {
    const [range, setRange] = useState('30d');
    const data = range === '24h' ? REV_24H : range === '7d' ? REV_7D : REV_30D;
    const labels = range === '24h'
      ? Array.from({length: 24}).map((_, i) => `${String(i).padStart(2,'0')}:00`)
      : range === '7d'
      ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      : Array.from({length: 30}).map((_, i) => `${30-i}d`);
    const max = Math.max(...data);
    const total = data.reduce((s, v) => s + v, 0);
    const totalEur = Math.round(total * 0.009 * (SELLER.eurEarned30d / (REV_30D.reduce((s,v)=>s+v,0) * 0.009 || 1)));

    return (
      <Glass style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Revenue · Power earned</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, color: palette.text }}>{total.toLocaleString()}<span style={{ fontSize: 16, color: palette.textMute, marginLeft: 4 }}>⚡</span></span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent }}>≈ €{Math.round(total * 0.009 * 0.7).toLocaleString()} after platform cut</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--p-inset)', borderRadius: 8, border: `1px solid ${palette.border}` }}>
            {['24h','7d','30d'].map(r => {
              const sel = range === r;
              return <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 11px', borderRadius: 5, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 11, fontFamily: 'Geist Mono, monospace', cursor: 'pointer', fontWeight: sel ? 600 : 400 }}>{r}</button>;
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: range === '7d' ? 16 : 3, height: 180, padding: '10px 0', borderBottom: `1px solid ${palette.border}` }}>
          {data.map((v, i) => {
            const h = (v / max) * 160;
            const isPeak = v === max;
            return (
              <div key={i} style={{ flex: 1, position: 'relative' }} title={`${labels[i]}: ${v.toLocaleString()}⚡`}>
                <div style={{
                  width: '100%', height: `${h}px`,
                  background: isPeak ? palette.accent : `linear-gradient(180deg, ${palette.accent}, ${palette.accent}80)`,
                  opacity: isPeak ? 1 : 0.55 + (v / max) * 0.45,
                  borderRadius: '3px 3px 0 0',
                  transition: 'all 0.4s cubic-bezier(.2,.7,.2,1)',
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute }}>
          <span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]} (now)</span>
        </div>
      </Glass>
    );
  };

  // ---- Listings manager ----
  const Listings = ({ items = [] }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Manage listings</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{items.length} agents · {items.filter(l => l.status === 'live').length} live</div>
        </div>
        <Link href={route('vendor.publish.create')} style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>+ Publish new</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 0.9fr 1fr 1fr 0.8fr 100px', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Listing</span><span>Price</span><span>Subs</span><span>Runs (30d)</span><span>Revenue</span><span>Rating</span><span>Status</span>
      </div>
      {items.map((l, i) => {
        const stColor = l.status === 'live' ? palette.accent : l.status === 'review' ? palette.cyan : palette.amber;
        const stBg = l.status === 'live' ? palette.accentDim : l.status === 'review' ? 'rgba(125,211,255,0.12)' : 'rgba(255,184,77,0.12)';
        return (
          <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 0.9fr 1fr 1fr 0.8fr 100px', gap: 14, padding: '16px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center', opacity: l.status === 'paused' ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{l.icon}</div>
              <div>
                <Link href={route('vendor.publish.edit', l.id)} style={{ fontSize: 14, fontWeight: 600, color: palette.text, textDecoration: 'none' }}>{l.name}</Link>
                <div style={{ fontSize: 11, color: palette.textMute }}>{l.cat} · rev share {l.rev_share}%</div>
              </div>
            </div>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{l.power}<span style={{ color: palette.accent }}>⚡</span><span style={{ fontSize: 10, color: palette.textMute, marginLeft: 2 }}>/{l.perUnit}</span></span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{l.subs}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{l.runs30d.toLocaleString()}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent }}>{l.rev30d.toLocaleString()}⚡</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{l.rating ? `★ ${l.rating}` : '—'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ padding: '3px 8px', background: stBg, color: stColor, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>● {l.status}</span>
              <Link href={route('vendor.publish.edit', l.id)} title="Edit listing" style={{ background: 'none', border: 0, color: palette.textMute, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>✎</Link>
            </span>
          </div>
        );
      })}
    </Glass>
  );

  // ---- Active subscriptions ----
  const Subs = () => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Active subscriptions</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{SELLER.activeSubs} customers · {SUBS.reduce((s, x) => s + x.mrr, 0).toLocaleString()}⚡ MRR</div>
        </div>
        <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Export CSV →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.3fr 0.8fr 0.9fr 1.2fr 0.8fr', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Customer</span><span>Listings</span><span>Plan</span><span>30d MRR</span><span>Trend</span><span>Status</span>
      </div>
      {SUBS.map((s, i) => {
        const stCol = s.status === 'healthy' ? palette.accent : palette.amber;
        return (
          <div key={s.customer} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.3fr 0.8fr 0.9fr 1.2fr 0.8fr', gap: 14, padding: '14px 20px', borderBottom: i < SUBS.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{s.customer}</div>
              <div style={{ fontSize: 11, color: palette.textMute }}>{s.seat} · since {s.since}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {s.listings.map(l => <span key={l} style={{ padding: '2px 7px', background: 'rgba(180,242,91,0.06)', color: palette.accent, fontSize: 10, fontFamily: 'Geist Mono, monospace', borderRadius: 4, border: `1px solid ${palette.accentDim}` }}>{l}</span>)}
            </div>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text }}>{s.plan}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent }}>{s.mrr.toLocaleString()}⚡</span>
            <Spark data={s.trend} w={140} h={28} color={stCol} fill={false} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: stCol, letterSpacing: 1, textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: stCol, boxShadow: `0 0 6px ${stCol}` }} />{s.status}
            </span>
          </div>
        );
      })}
    </Glass>
  );

  // ---- Payouts ----
  const Payouts = ({ items = [] }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Next payout</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.accent, marginTop: 4 }}>€{SELLER.eurPayoutNext.toLocaleString()}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 4 }}>scheduled {SELLER.nextPayoutDate} · SEPA</div>
        </div>
        <div style={{ borderLeft: `1px solid ${palette.border}`, paddingLeft: 20 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Hold reserve</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.amber, marginTop: 4 }}>€{SELLER.eurHoldReserve.toLocaleString()}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 4 }}>10% reserve · 30-day chargeback window</div>
        </div>
        <div style={{ borderLeft: `1px solid ${palette.border}`, paddingLeft: 20 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Lifetime earned</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 28, fontWeight: 500, color: palette.text, marginTop: 4 }}>€{(items.reduce((s,p) => s + p.eur, 0) + SELLER.eurEarned30d).toLocaleString()}</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 4 }}>across {items.length + 1} payout cycles</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 1fr 0.8fr 0.8fr 0.6fr', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Date</span><span>Period</span><span>Reference</span><span>Power</span><span>Fee</span><span>Net €</span><span>Status</span>
      </div>
      {items.map((p, i) => (
        <div key={p.ref} style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 1fr 0.8fr 0.8fr 0.6fr', gap: 14, padding: '14px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{p.date}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text }}>{p.period}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textMute }}>{p.ref}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{p.power.toLocaleString()}⚡</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: p.fee > 0 ? palette.amber : palette.textMute }}>€{p.fee}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent, fontWeight: 600 }}>€{p.eur.toLocaleString()}</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>● paid</span>
        </div>
      ))}
    </Glass>
  );

  // ---- Performance ----
  const Performance = () => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Performance · last 30 days</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>SLA: 99.7% · within target</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.9fr 0.7fr 1.2fr', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Listing</span><span>Runs</span><span>Success %</span><span>Avg latency</span><span>Rating</span><span>Health</span>
      </div>
      {PERF.map((p, i) => {
        const ok = p.success >= 99.5;
        return (
          <div key={p.listing} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.9fr 0.7fr 1.2fr', gap: 14, padding: '16px 20px', borderBottom: i < PERF.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{p.listing}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{p.runs.toLocaleString()}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: ok ? palette.accent : palette.amber }}>{p.success.toFixed(2)}%</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{p.avgLatency}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>★ {p.rating}</span>
            <div style={{ position: 'relative', height: 6, background: 'var(--p-track)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, p.success)}%`, background: ok ? palette.accent : palette.amber, borderRadius: 99, transition: 'width 0.6s' }} />
            </div>
          </div>
        );
      })}
    </Glass>
  );

  // ---- Disputes ----
  const Disputes = () => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.amber, letterSpacing: 1, textTransform: 'uppercase' }}>! Disputes & SLA breaches</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{DISPUTES.filter(d => d.state !== 'resolved').length} open · {DISPUTES.length} total this quarter</div>
        </div>
      </div>
      {DISPUTES.map((d, i) => {
        const stCol = d.state === 'open' ? palette.red : d.state === 'investigating' ? palette.amber : palette.accent;
        return (
          <div key={d.id} style={{ padding: '16px 20px', borderBottom: i < DISPUTES.length - 1 ? `1px solid ${palette.border}` : 0, display: 'grid', gridTemplateColumns: '110px 1fr 1.4fr 0.8fr 0.7fr 110px', gap: 14, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: stCol, fontWeight: 600 }}>{d.id}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{d.customer}</div>
              <div style={{ fontSize: 11, color: palette.textMute }}>{d.listing}</div>
            </div>
            <span style={{ fontSize: 13, color: palette.textDim }}>{d.issue}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{d.opened}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.amber }}>−{d.credit}⚡</span>
            <span style={{ padding: '3px 8px', background: stCol === palette.accent ? palette.accentDim : `${stCol}1F`, color: stCol, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4, textAlign: 'center' }}>{d.state}</span>
          </div>
        );
      })}
    </Glass>
  );

  // ---- Page ----
  const Page = () => {
    const { listings = [], payouts = [] } = usePage().props;
    const liveListings = listings.length ? listings : DEMO_LISTINGS;
    const livePayouts = payouts.length ? payouts : DEMO_PAYOUTS;
    const sideItems = buildSideItems(liveListings);
    const [tab, setTab] = useState('overview');

    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <TopBar />
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: 1600, margin: '0 auto' }}>
            <Sidebar tab={tab} setTab={setTab} items={sideItems} />

            <div style={{ padding: '32px 40px 60px', minWidth: 0 }}>
              {/* Greeting */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <Pill dot color={palette.accent} style={{ marginBottom: 12 }}>● {SELLER.activeSubs} active subs · {SELLER.totalRuns30d.toLocaleString()} runs this month</Pill>
                  <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.4, margin: 0, color: palette.text }}>
                    Welcome back, <span style={{ color: palette.accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, fontSize: 52 }}>Theo</span>.
                  </h1>
                  <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, margin: '12px 0 0' }}>Your roster shipped {SELLER.totalRuns30d.toLocaleString()} tasks this cycle. Here's how that turned into Power.</p>
                </div>
              </div>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                <Kpi label="Power earned (30d)" value={`${(SELLER.powerEarned30d/1000).toFixed(0)}k`} sub={`≈ €${Math.round(SELLER.powerEarned30d * 0.009 * 0.7).toLocaleString()} after 30% platform`} sparkData={REV_30D} delta={18} />
                <Kpi label="EUR earned (30d)"   value={`€${SELLER.eurEarned30d.toLocaleString()}`} sub={`net of ${30}% platform · ${10}% reserve`} sparkData={REV_30D} sparkColor={palette.cyan} color={palette.cyan} delta={12} />
                <Kpi label="Active subs"        value={`${SELLER.activeSubs}`} sub={`${SUBS.filter(s=>s.status==='at-risk').length} at-risk · ${SUBS.filter(s=>s.status==='healthy').length} healthy`} delta={8} />
                <Kpi label="Avg rating"         value={`★ ${SELLER.avgRating}`} sub={`across ${SELLER.totalRuns30d.toLocaleString()} runs · 312 ratings`} color={palette.amber} sparkColor={palette.amber} sparkData={[4.6, 4.65, 4.7, 4.72, 4.75, 4.78, 4.8, 4.82, 4.83, 4.83, 4.83]} />
              </div>

              {/* Revenue + Disputes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 22 }}>
                <RevenueChart />
                <Disputes />
              </div>

              {/* Listings manager */}
              <div style={{ marginBottom: 22 }}><Listings items={liveListings} /></div>

              {/* Subscriptions */}
              <div style={{ marginBottom: 22 }}><Subs /></div>

              {/* Performance */}
              <div style={{ marginBottom: 22 }}><Performance /></div>

              {/* Payouts */}
              <Payouts items={livePayouts} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default SellerDash.Page;
