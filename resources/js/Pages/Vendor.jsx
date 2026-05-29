import '@/setup';
import { useEffect, useRef, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, useRates, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// SELLER DASHBOARD — view for an AI agent vendor / studio
// Revenue, active subscriptions, payouts, listings, performance, disputes
//
// All data is read from server props (VendorController). Empty tabs
// render real empty states pointing at /vendor/publish so a new seller
// has a clear next step.
// =====================================================================

const SellerDash = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const buildSideItems = (listings, methodsCount, availableCents, subsCount, openDisputes, credentialsCount) => [
    { id: 'overview',    label: 'Overview',      icon: '◆' },
    { id: 'listings',    label: 'Listings',      icon: '◇', count: listings.length },
    { id: 'subs',        label: 'Subscriptions', icon: '◈', count: subsCount },
    { id: 'perf',        label: 'Performance',   icon: '▲' },
    { id: 'credentials', label: 'LLM keys',      icon: '⚷', count: credentialsCount },
    { id: 'payouts',     label: 'Payouts',       icon: '⚡', count: methodsCount, badge: availableCents >= 1000 ? 'ready' : null },
    { id: 'disputes',    label: 'Disputes',      icon: '!', count: openDisputes, alert: openDisputes > 0 },
    { id: 'manifest',    label: 'Manifest spec', icon: '⌘' },
    { id: 'settings',    label: 'Settings',      icon: '◌', href: '/settings' },
  ];

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

  const fmtMoney = (cents, ccy = 'EUR') => {
    const v = (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return ccy === 'EUR' ? `€${v}` : `${ccy} ${v}`;
  };

  // ---- Top bar ----
  const TopBar = ({ user, studioLabel, handle, tier }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    const initials = (user?.name || 'V')
      .split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${palette.border}`, background: 'var(--p-topbar-bg)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', position: 'sticky', top: 0, zIndex: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ vendor</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '4px 9px', background: 'var(--p-chip)', border: `1px solid ${palette.border}`, borderRadius: 6 }}>{studioLabel} · {handle}</span>
          <span style={{ padding: '3px 8px', background: 'rgba(125,211,255,0.12)', color: palette.cyan, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>✓ {tier.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span>UTC {time.toISOString().slice(11,19)}</span>
          <ThemeToggle size={32} />
          <Link href="/console" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Switch to buyer</Link>
          <Link href={route('vendor.publish.create')} style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>+ New listing</Link>
          <UserMenu user={user} initials={initials} />
        </div>
      </div>
    );
  };

  // Avatar dropdown — Profile / Settings / Sign out. Same pattern as Console.
  const UserMenu = ({ user, initials }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const onClick = (e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const signOut = () => {
      setOpen(false);
      router.post('/logout');
    };

    return (
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Account menu"
          style={{ width: 32, height: 32, borderRadius: 99, background: 'linear-gradient(135deg, #ff9f4a, #b4f25b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, color: palette.onAccent, border: 0, cursor: 'pointer' }}
        >
          {initials}
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220, background: 'var(--p-glass-strong, rgba(15,17,23,0.95))', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: `1px solid ${palette.borderStrong}`, borderRadius: 10, padding: 6, boxShadow: '0 12px 36px rgba(0,0,0,0.45)', zIndex: 30 }}>
            <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${palette.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{user?.name || 'You'}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{user?.email || ''}</div>
            </div>
            <MenuLink href="/profile" label="Profile" />
            <MenuLink href="/settings" label="Settings" />
            <MenuLink href="/console" label="Switch to buyer" />
            <div style={{ height: 1, background: palette.border, margin: '4px 6px' }} />
            <button
              onClick={signOut}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, background: 'transparent', color: palette.red, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,99,99,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  };

  const MenuLink = ({ href, label }) => (
    <Link
      href={href}
      style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: palette.text, textDecoration: 'none', borderRadius: 6 }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(180,242,91,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {label}
    </Link>
  );

  // ---- Sidebar ----
  const Sidebar = ({ tab, setTab, items = [], availableCents = 0, lifetimeCents = 0 }) => (
    <div style={{ width: 220, borderRight: `1px solid ${palette.border}`, padding: '28px 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 65, alignSelf: 'flex-start', height: 'calc(100vh - 65px)' }}>
      {items.map(s => {
        const sel = !s.href && tab === s.id;
        const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: sel ? 600 : 400, textDecoration: 'none' };
        const inner = (
          <>
            <span><span style={{ marginRight: 10, fontFamily: 'Geist Mono, monospace', color: s.alert ? palette.amber : (sel ? palette.accent : palette.textMute) }}>{s.icon}</span>{s.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.badge && <span style={{ padding: '1px 6px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>{s.badge}</span>}
              {s.count != null && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: s.alert ? palette.amber : (sel ? palette.accent : palette.textMute), background: s.alert ? 'rgba(255,184,77,0.12)' : 'transparent', padding: s.alert ? '1px 6px' : 0, borderRadius: 4 }}>{s.count}</span>}
            </span>
          </>
        );
        return s.href
          ? <Link key={s.id} href={s.href} style={rowStyle}>{inner}</Link>
          : <button key={s.id} onClick={() => setTab(s.id)} style={rowStyle}>{inner}</button>;
      })}
      <div style={{ marginTop: 'auto', padding: 12, borderRadius: 8, background: 'rgba(180,242,91,0.05)', border: `1px solid ${palette.accentDim}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Available cash-out</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4 }}>{fmtMoney(availableCents)}</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>of {fmtMoney(lifetimeCents)} earned</div>
        <button onClick={() => setTab('payouts')} style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 6, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>Cash out →</button>
      </div>
    </div>
  );

  // ---- KPI ----
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

  // ---- Revenue chart — driven by metrics.revSeries24h/7d/30d ----
  const RevenueChart = ({ series24h = [], series7d = [], series30d = [] }) => {
    const [range, setRange] = useState('30d');
    const data = range === '24h' ? series24h : range === '7d' ? series7d : series30d;
    const labels = range === '24h'
      ? Array.from({length: 24}).map((_, i) => `${String(i).padStart(2,'0')}:00`)
      : range === '7d'
      ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      : Array.from({length: 30}).map((_, i) => `${30-i}d`);
    const max = Math.max(...data, 1);
    const total = data.reduce((s, v) => s + v, 0);
    const rates = useRates();

    return (
      <Glass style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Revenue · Power earned</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, color: palette.text }}>{total.toLocaleString()}<span style={{ fontSize: 16, color: palette.textMute, marginLeft: 4 }}>⚡</span></span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.accent }}>≈ €{Math.round(total * rates.eurPerPower * rates.sellerShare).toLocaleString()} after platform cut</span>
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
            const isPeak = v > 0 && v === max;
            return (
              <div key={i} style={{ flex: 1, position: 'relative' }} title={`${labels[i]}: ${v.toLocaleString()}⚡`}>
                <div style={{ width: '100%', height: `${h}px`, background: isPeak ? palette.accent : `linear-gradient(180deg, ${palette.accent}, ${palette.accent}80)`, opacity: isPeak ? 1 : 0.55 + (v / max) * 0.45, borderRadius: '3px 3px 0 0', transition: 'all 0.4s cubic-bezier(.2,.7,.2,1)' }} />
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

  // ---- Listings ----
  const Listings = ({ items = [] }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Manage listings</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{items.length} agents · {items.filter(l => l.status === 'live').length} live</div>
        </div>
        <Link href={route('vendor.publish.create')} style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>+ Publish new</Link>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textDim }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◇</div>
          <div style={{ fontSize: 14, color: palette.text, marginBottom: 4 }}>No listings yet</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginBottom: 14 }}>Publish your first agent to start earning Power.</div>
          <Link href={route('vendor.publish.create')} style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>+ Publish new</Link>
        </div>
      ) : (
      <>
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
      </>
      )}
    </Glass>
  );

  // ---- Subscriptions ----
  const Subs = ({ items = [], activeSubs }) => {
    const totalMrr = items.reduce((s, x) => s + (x.mrr || 0), 0);
    return (
      <Glass style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Active subscriptions</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{activeSubs} customers{totalMrr > 0 ? ` · ${totalMrr.toLocaleString()}⚡ MRR` : ''}</div>
          </div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textDim }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>◈</div>
            <div style={{ fontSize: 14, color: palette.text, marginBottom: 4 }}>No subscriptions yet</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Customers appear here once they hire one of your listings.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.3fr 0.8fr 0.9fr 1.2fr 0.8fr', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
              <span>Customer</span><span>Listings</span><span>Plan</span><span>30d MRR</span><span>Trend</span><span>Status</span>
            </div>
            {items.map((s, i) => {
              const stCol = s.status === 'healthy' ? palette.accent : palette.amber;
              return (
                <div key={`${s.customer}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.3fr 0.8fr 0.9fr 1.2fr 0.8fr', gap: 14, padding: '14px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{s.customer}</div>
                    <div style={{ fontSize: 11, color: palette.textMute }}>{s.seat} · since {s.since}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(s.listings || []).map(l => <span key={l} style={{ padding: '2px 7px', background: 'rgba(180,242,91,0.06)', color: palette.accent, fontSize: 10, fontFamily: 'Geist Mono, monospace', borderRadius: 4, border: `1px solid ${palette.accentDim}` }}>{l}</span>)}
                  </div>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text }}>{s.plan}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent }}>{(s.mrr || 0).toLocaleString()}⚡</span>
                  <Spark data={s.trend || [0,0,0,0,0,0,0,0,0,0,0]} w={140} h={28} color={stCol} fill={false} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: stCol, letterSpacing: 1, textTransform: 'uppercase' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: stCol, boxShadow: `0 0 6px ${stCol}` }} />{s.status}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </Glass>
    );
  };

  // ---- Performance ----
  const Performance = ({ items = [] }) => {
    const avgSuccess = items.length ? items.reduce((s, p) => s + (p.success || 0), 0) / items.length : 0;
    return (
      <Glass style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}` }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Performance · last 30 days</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{items.length ? `SLA: ${avgSuccess.toFixed(1)}%${avgSuccess >= 99.5 ? ' · within target' : ' · below target'}` : 'No data yet'}</div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: palette.textDim, fontSize: 12 }}>Publish a listing to start collecting performance data.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.9fr 0.7fr 1.2fr', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
              <span>Listing</span><span>Runs</span><span>Success %</span><span>Avg latency</span><span>Rating</span><span>Health</span>
            </div>
            {items.map((p, i) => {
              const ok = p.success >= 99.5;
              return (
                <div key={p.listing} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.9fr 0.7fr 1.2fr', gap: 14, padding: '16px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{p.listing}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{(p.runs || 0).toLocaleString()}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: ok ? palette.accent : palette.amber }}>{(p.success || 0).toFixed(2)}%</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{p.avgLatency || '—'}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{p.rating ? `★ ${p.rating}` : '—'}</span>
                  <div style={{ position: 'relative', height: 6, background: 'var(--p-track)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, p.success || 0)}%`, background: ok ? palette.accent : palette.amber, borderRadius: 99, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Glass>
    );
  };

  // ---- Disputes ----
  const Disputes = ({ items = [] }) => {
    const open = items.filter(d => d.state !== 'resolved').length;
    return (
      <Glass style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: open ? palette.amber : palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{open ? '! ' : ''}Disputes & SLA breaches</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{open} open · {items.length} total this quarter</div>
          </div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: palette.textDim }}>
            <div style={{ fontSize: 24, marginBottom: 6, color: palette.accent }}>✓</div>
            <div style={{ fontSize: 13, color: palette.text, marginBottom: 4 }}>No disputes</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>All good. Any SLA breach will show up here.</div>
          </div>
        ) : items.map((d, i) => {
          const stCol = d.state === 'open' ? palette.red : d.state === 'investigating' ? palette.amber : palette.accent;
          return (
            <div key={d.id} style={{ padding: '16px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, display: 'grid', gridTemplateColumns: '110px 1fr 1.4fr 0.8fr 0.7fr 110px', gap: 14, alignItems: 'center' }}>
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
  };

  // ---- Manifest (overview-only) ----
  const ManifestStub = () => (
    <Glass style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Manifest spec</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 500, color: palette.text }}>Static YAML preview · live editor ships next.</div>
      <pre style={{ marginTop: 14, padding: 16, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 12, overflow: 'auto', lineHeight: 1.55 }}>{`name: ai-sdr
power_cost: 12
per_unit: lead
inputs:
  - prompt: string
  - lead_query: string
outputs:
  - leads: array<Lead>
sla:
  uptime: 99.7%
  latency_p95_ms: 800`}</pre>
    </Glass>
  );

  // ---- Payouts (full section with methods + cash-out + history) ----
  const Section = ({ title, sub, action, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, gap: 14 }}>
        <div>
          <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>{title}</h3>
          {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <Glass style={{ padding: 22 }}>{children}</Glass>
    </div>
  );

  const Stat = ({ label, value, color = palette.text, sub }) => (
    <div style={{ padding: 16, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  // Add-method form
  const AddMethodForm = ({ onClose }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
      type: 'bank',
      label: '',
      holderName: '',
      country: 'DE',
      currency: 'EUR',
      identifier: '',
      routingHint: '',
      makeDefault: false,
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('vendor.payout.methods.store'), {
        preserveScroll: true,
        onSuccess: () => { reset(); onClose(); },
      });
    };

    const placeholders = {
      bank: { id: 'DE89 3704 0044 0532 0130 00 (IBAN)', hint: 'IBAN · we only store country + last 4' },
      card: { id: '4242 4242 4242 4242 (debit card)', hint: 'Card number · we only store last 4' },
      paypal: { id: 'payouts@yourstudio.com', hint: 'PayPal address' },
      wise: { id: 'GB29 NWBK 6016 1331 9268 19', hint: 'Wise multi-currency account' },
      crypto: { id: '0xAbC123... (wallet)', hint: 'Wallet address · we only store last 4' },
    };

    return (
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Type">
            <select value={data.type} onChange={e => setData('type', e.target.value)} style={inputStyle()}>
              <option value="bank">Bank · SEPA</option>
              <option value="card">Debit card</option>
              <option value="paypal">PayPal</option>
              <option value="wise">Wise</option>
              <option value="crypto">Crypto wallet</option>
            </select>
          </Field>
          <Field label="Currency">
            <select value={data.currency} onChange={e => setData('currency', e.target.value)} style={inputStyle()}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
              <option value="USDC">USDC</option>
            </select>
          </Field>
          <Field label="Country (ISO)">
            <input value={data.country} onChange={e => setData('country', e.target.value.toUpperCase().slice(0,2))} maxLength={2} placeholder="DE" style={inputStyle('mono')} />
          </Field>
        </div>

        <Field label="Label" hint="Shown in your payout list (e.g. 'Acme Holding GmbH').">
          <input value={data.label} onChange={e => setData('label', e.target.value)} placeholder="Studio operating account" style={inputStyle()} />
          {errors.label && <ErrorMsg msg={errors.label} />}
        </Field>

        <Field label="Holder name" hint="Legal name on the destination.">
          <input value={data.holderName} onChange={e => setData('holderName', e.target.value)} placeholder="Acme Holding GmbH" style={inputStyle()} />
        </Field>

        <Field label={placeholders[data.type].hint} hint={`We hash this input. Only country + last 4 are stored.`}>
          <input value={data.identifier} onChange={e => setData('identifier', e.target.value)} placeholder={placeholders[data.type].id} style={inputStyle('mono')} />
          {errors.identifier && <ErrorMsg msg={errors.identifier} />}
        </Field>

        {(data.type === 'crypto' || data.type === 'wise') && (
          <Field label={data.type === 'crypto' ? 'Network' : 'Routing / SWIFT'}>
            <input value={data.routingHint} onChange={e => setData('routingHint', e.target.value)} placeholder={data.type === 'crypto' ? 'ETH / Polygon / Base' : 'BARCGB22'} style={inputStyle('mono')} />
          </Field>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textDim }}>
          <input type="checkbox" checked={data.makeDefault} onChange={e => setData('makeDefault', e.target.checked)} style={{ accentColor: palette.accent }} />
          Use as default destination
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 14px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={processing} style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>{processing ? 'Saving…' : 'Add method'}</button>
        </div>
      </form>
    );
  };

  const Field = ({ label, hint, children }) => (
    <div>
      <div style={{ fontSize: 11, color: palette.textMute, marginBottom: 4, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const ErrorMsg = ({ msg }) => <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{msg}</div>;

  const inputStyle = (font = 'sans') => ({
    width: '100%',
    padding: '10px 12px',
    background: 'var(--p-inset)',
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    color: palette.text,
    fontFamily: font === 'mono' ? 'Geist Mono, monospace' : 'inherit',
    fontSize: 13,
    outline: 'none',
  });

  // Cash-out form
  const CashOutForm = ({ methods, cashOut }) => {
    const defaultMethod = methods.find(m => m.isDefault) || methods[0];
    const { data, setData, post, processing, errors, reset } = useForm({
      amountCents: cashOut.availableCents,
      methodId: defaultMethod?.id || null,
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('vendor.payout.request'), {
        preserveScroll: true,
        onSuccess: () => reset('amountCents'),
      });
    };

    const amountEur = (data.amountCents / 100).toFixed(2);
    const feeCents = Math.round(data.amountCents * 0.01);
    const netCents = data.amountCents - feeCents;
    const maxEur = (cashOut.availableCents / 100).toFixed(2);
    const minEur = (cashOut.minCashoutCents / 100).toFixed(2);
    const tooSmall = data.amountCents < cashOut.minCashoutCents;
    const tooBig = data.amountCents > cashOut.availableCents;
    const noMethod = !data.methodId;
    const blocked = tooSmall || tooBig || noMethod || cashOut.availableCents < cashOut.minCashoutCents;

    if (cashOut.availableCents < cashOut.minCashoutCents) {
      return (
        <div style={{ padding: '14px 0', fontSize: 13, color: palette.textDim }}>
          You need at least <strong style={{ color: palette.text }}>{fmtMoney(cashOut.minCashoutCents)}</strong> of cleared earnings to request a payout. Currently available: <strong style={{ color: palette.accent }}>{fmtMoney(cashOut.availableCents)}</strong>.
        </div>
      );
    }

    return (
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Field label="Amount (€)" hint={`Min ${minEur} · max ${maxEur}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                step="0.01"
                min={minEur}
                max={maxEur}
                value={amountEur}
                onChange={e => setData('amountCents', Math.round((parseFloat(e.target.value) || 0) * 100))}
                style={{ ...inputStyle('mono'), flex: 1 }}
              />
              <button type="button" onClick={() => setData('amountCents', cashOut.availableCents)} style={{ padding: '10px 12px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 11, fontFamily: 'Geist Mono, monospace', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>Max</button>
            </div>
            {errors.amountCents && <ErrorMsg msg={errors.amountCents} />}
          </Field>
          <Field label="Destination">
            <select value={data.methodId || ''} onChange={e => setData('methodId', e.target.value ? parseInt(e.target.value) : null)} style={inputStyle()}>
              {methods.length === 0 && <option value="">— add a method first —</option>}
              {methods.map(m => (
                <option key={m.id} value={m.id}>{m.display}{m.isDefault ? ' · default' : ''}</option>
              ))}
            </select>
            {errors.methodId && <ErrorMsg msg={errors.methodId} />}
          </Field>
        </div>

        <div style={{ padding: 14, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: palette.textDim, padding: '4px 0' }}>
            <span>Requested</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', color: palette.text }}>{fmtMoney(data.amountCents)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: palette.textDim, padding: '4px 0' }}>
            <span>Gateway fee · {cashOut.feePercent}%</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', color: palette.amber }}>−{fmtMoney(feeCents)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: palette.text, padding: '8px 0 0', borderTop: `1px solid ${palette.border}`, marginTop: 6 }}>
            <span style={{ fontWeight: 600 }}>You receive</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', color: palette.accent, fontWeight: 600 }}>{fmtMoney(netCents)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>
            Settles in 1–3 business days for bank / Wise · instantly for PayPal · within an hour for crypto.
          </div>
          <button type="submit" disabled={blocked || processing} style={{ padding: '12px 22px', borderRadius: 10, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: (blocked || processing) ? 'not-allowed' : 'pointer', opacity: (blocked || processing) ? 0.5 : 1 }}>
            {processing ? 'Requesting…' : 'Request payout →'}
          </button>
        </div>
      </form>
    );
  };

  const PayoutMethodsList = ({ methods }) => {
    if (methods.length === 0) {
      return (
        <div style={{ padding: '22px 0', textAlign: 'center', fontSize: 13, color: palette.textMute }}>
          No payout destinations yet. Add one to request a cash-out.
        </div>
      );
    }

    const typeIcon = (t) => ({ bank: '🏦', card: '💳', paypal: '🅿', wise: '⚡', crypto: '₿' }[t] || '◇');

    return (
      <div>
        {methods.map((m, i) => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 90px auto', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: i < methods.length - 1 ? `1px solid ${palette.border}` : 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{typeIcon(m.type)}</div>
            <div>
              <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{m.display}</div>
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace' }}>{m.currency}{m.country ? ` · ${m.country}` : ''}</div>
            <div>
              {m.isDefault ? (
                <span style={{ padding: '3px 8px', background: palette.accentDim, color: palette.accent, fontSize: 10, fontFamily: 'Geist Mono, monospace', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>default</span>
              ) : (
                <button onClick={() => router.post(route('vendor.payout.methods.default', m.id), {}, { preserveScroll: true })} style={{ background: 'transparent', border: 0, color: palette.accent, fontSize: 11, fontFamily: 'Geist Mono, monospace', cursor: 'pointer', textDecoration: 'underline' }}>set default</button>
              )}
            </div>
            <button
              onClick={() => {
                if (!confirm(`Remove ${m.label}? Pending payouts to this destination will continue.`)) return;
                router.delete(route('vendor.payout.methods.destroy', m.id), { preserveScroll: true });
              }}
              style={{ padding: '7px 12px', borderRadius: 8, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };

  const PayoutsHistory = ({ items }) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 100px 110px 110px 100px', gap: 14, padding: '8px 0', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Date</span><span>Period</span><span>Reference</span><span>Method</span><span>Fee</span><span>Net €</span><span>Status</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '20px 0', fontSize: 13, color: palette.textMute, textAlign: 'center' }}>No payouts yet. Request one above once your balance clears the minimum.</div>
      ) : items.map((p, i) => {
        const stColor = p.status === 'paid' ? palette.accent : p.status === 'pending' || p.status === 'processing' ? palette.amber : p.status === 'failed' ? palette.red : palette.textMute;
        return (
          <div key={p.ref} style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 100px 110px 110px 100px', gap: 14, padding: '14px 0', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{p.date}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text }}>{p.period}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{p.ref}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, textTransform: 'uppercase' }}>{p.method || 'bank'}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: p.fee > 0 ? palette.amber : palette.textMute }}>€{p.fee}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.accent, fontWeight: 600 }}>€{p.eur.toLocaleString()}</span>
            <span style={{ padding: '3px 8px', background: `${stColor}1A`, color: stColor, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4, textAlign: 'center' }}>● {p.status}</span>
          </div>
        );
      })}
    </div>
  );

  const PayoutsTab = ({ payoutMethods, cashOut, payouts }) => {
    const [showAdd, setShowAdd] = useState(payoutMethods.length === 0);
    const rates = useRates();

    return (
      <div>
        {/* Balance summary */}
        <Section title="Cash-out balance" sub="Earned — already requested — already paid. Updates after every agent run.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <Stat label="Available" value={fmtMoney(cashOut.availableCents)} color={palette.accent} sub="ready to withdraw" />
            <Stat label="Lifetime earned" value={fmtMoney(cashOut.lifetimeEarnedCents)} sub={`after ${(100 - rates.sellerSharePct).toFixed(0)}% platform`} />
            <Stat label="Pending" value={fmtMoney(cashOut.pendingCents)} color={palette.amber} sub="in transit" />
            <Stat label="Paid out" value={fmtMoney(cashOut.paidCents)} sub="settled to your accounts" />
          </div>
        </Section>

        {/* Cash-out form */}
        <Section title="Request a payout" sub={`Min €${(cashOut.minCashoutCents/100).toFixed(0)} · gateway fee ${cashOut.feePercent}%`}>
          <CashOutForm methods={payoutMethods} cashOut={cashOut} />
        </Section>

        {/* Methods CRUD */}
        <Section
          title={`Payout destinations · ${payoutMethods.length}`}
          sub="Card, bank, PayPal, Wise, or crypto wallet. We mask identifiers — only country + last 4 are stored."
          action={!showAdd && (
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Add method</button>
          )}
        >
          {showAdd && (
            <div style={{ padding: 14, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, marginBottom: payoutMethods.length > 0 ? 18 : 0 }}>
              <AddMethodForm onClose={() => setShowAdd(false)} />
            </div>
          )}
          <PayoutMethodsList methods={payoutMethods} />
        </Section>

        {/* History */}
        <Section title="Payout history" sub="Last 12 cycles.">
          <PayoutsHistory items={payouts} />
        </Section>
      </div>
    );
  };

  // ---- LLM Credentials tab ----
  // One row per provider — seller stores their own API key, all agents
  // built on that provider re-use the same credential at invocation time.
  // We never display the full key; only last4 + verified state.
  const AddCredentialForm = ({ providers, onClose }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
      provider: providers[0] || 'openai',
      api_key: '',
      label: '',
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('vendor.credentials.store'), {
        preserveScroll: true,
        onSuccess: () => { reset(); onClose(); },
      });
    };

    return (
      <form onSubmit={submit} style={{ padding: 14, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
          <Field label="Provider">
            <select value={data.provider} onChange={e => setData('provider', e.target.value)} style={inputStyle()}>
              {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </Field>
          <Field label="Label (optional)" hint="Shown in the list. e.g. 'Acme studio production'.">
            <input value={data.label} onChange={e => setData('label', e.target.value)} placeholder="My OpenAI prod key" style={inputStyle()} />
          </Field>
        </div>
        <Field label="API key" hint="Encrypted at rest. We only display the last 4 characters in the UI.">
          <input
            type="password"
            value={data.api_key}
            onChange={e => setData('api_key', e.target.value)}
            placeholder={data.provider === 'anthropic' ? 'sk-ant-api03-...' : data.provider === 'openai' ? 'sk-proj-...' : `${data.provider} key`}
            style={inputStyle('mono')}
            autoComplete="off"
          />
          {errors.api_key && <ErrorMsg msg={errors.api_key} />}
          {errors.provider && <ErrorMsg msg={errors.provider} />}
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 14px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={processing} style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
            {processing ? 'Saving…' : 'Save key'}
          </button>
        </div>
      </form>
    );
  };

  const CredentialsTab = ({ credentials, providers }) => {
    const [showAdd, setShowAdd] = useState(credentials.length === 0);
    const [verifyingId, setVerifyingId] = useState(null);
    const verifyError = usePage().props.errors?.credential;
    return (
      <div>
        <Section title="LLM API keys" sub="Add one key per provider — the key powers every agent you publish that uses that provider's models. We encrypt with Laravel Crypt and never display the full key.">
          {verifyError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,80,80,0.1)', border: `1px solid ${palette.red}`, color: palette.red, fontSize: 12 }}>
              {verifyError}
            </div>
          )}
          {showAdd && providers.length > 0 && (
            <AddCredentialForm providers={providers} onClose={() => setShowAdd(false)} />
          )}
          {!showAdd && (
            <div style={{ marginBottom: 18, textAlign: 'right' }}>
              <button onClick={() => setShowAdd(true)} style={{ padding: '10px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Add key
              </button>
            </div>
          )}
          {credentials.length === 0 ? (
            <div style={{ padding: '22px 0', textAlign: 'center', fontSize: 13, color: palette.textMute }}>
              No keys yet. Add one above to wire your agents to a real LLM.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {credentials.map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto auto', gap: 14, alignItems: 'center', padding: 14, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                    {c.provider.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: palette.text, fontWeight: 600 }}>{c.label || `${c.provider} key`}</div>
                    <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{c.provider} · ••••{c.last4} · added {c.createdAt}</div>
                  </div>
                  <span style={{ padding: '3px 8px', background: c.verifiedAt ? palette.accentDim : 'rgba(255,184,77,0.12)', color: c.verifiedAt ? palette.accent : palette.amber, fontSize: 10, fontFamily: 'Geist Mono, monospace', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>
                    {c.verifiedAt ? `✓ verified ${c.verifiedAt}` : 'not verified'}
                  </span>
                  <button
                    disabled={verifyingId === c.id}
                    onClick={() => router.post(route('vendor.credentials.verify', c.id), {}, {
                      preserveScroll: true,
                      onStart: () => setVerifyingId(c.id),
                      onFinish: () => setVerifyingId(null),
                    })}
                    style={{ padding: '7px 12px', borderRadius: 8, background: 'transparent', color: palette.accent, border: `1px solid ${palette.accent}`, fontSize: 11, fontFamily: 'inherit', cursor: verifyingId === c.id ? 'wait' : 'pointer', opacity: verifyingId === c.id ? 0.6 : 1 }}
                  >
                    {verifyingId === c.id ? 'Verifying…' : 'Verify'}
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Remove ${c.provider} key? Agents using it will fail to run until you add a new one.`)) return;
                      router.delete(route('vendor.credentials.destroy', c.id), { preserveScroll: true });
                    }}
                    style={{ padding: '7px 12px', borderRadius: 8, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    );
  };

  // ---- Page ----
  const Page = () => {
    const {
      listings = [], payouts = [], metrics = null, auth,
      payoutMethods = [], cashOut = { availableCents: 0, lifetimeEarnedCents: 0, pendingCents: 0, paidCents: 0, minCashoutCents: 1000, feePercent: 1 },
      subs = [], disputes = [], perf = [],
      llmCredentials = [], llmProviders = [],
      flash = {},
    } = usePage().props;
    const rates = useRates();

    const sellerStats = {
      powerEarned30d: metrics?.powerEarned30d ?? 0,
      eurEarned30d: metrics?.eurEarned30d ?? 0,
      activeSubs: metrics?.activeSubs ?? 0,
      totalRuns30d: metrics?.totalRuns30d ?? 0,
      avgRating: metrics?.avgRating ?? 0,
    };
    const series24h = metrics?.revSeries24h ?? Array(24).fill(0);
    const series7d = metrics?.revSeries7d ?? Array(7).fill(0);
    const series30d = metrics?.revSeries30d ?? Array(30).fill(0);
    const openDisputes = disputes.filter(d => d.state !== 'resolved').length;

    const firstName = (auth?.user?.name || '').split(/\s+/)[0] || 'vendor';
    const studioLabel = auth?.user?.name ? `${firstName}'s studio` : 'Your studio';
    const handle = auth?.user?.email ? '@'+(auth.user.email.split('@')[0]) : '@vendor';
    const tier = 'Vendor';

    const initialTab = (() => {
      if (typeof window === 'undefined') return 'overview';
      const q = new URLSearchParams(window.location.search).get('tab');
      const allowed = ['overview', 'listings', 'subs', 'perf', 'credentials', 'payouts', 'disputes', 'manifest'];
      return allowed.includes(q) ? q : 'overview';
    })();
    const [tab, setTab] = useState(initialTab);
    const [flashMsg, setFlashMsg] = useState(flash?.status || null);

    useEffect(() => { setFlashMsg(flash?.status || null); }, [flash?.status]);
    useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 4000);
      return () => clearTimeout(t);
    }, [flashMsg]);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (tab === 'overview') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }, [tab]);

    const sideItems = buildSideItems(listings, payoutMethods.length, cashOut.availableCents, subs.length, openDisputes, llmCredentials.length);

    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <TopBar user={auth?.user} studioLabel={studioLabel} handle={handle} tier={tier} />

          {flashMsg && (
            <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 50, padding: '12px 18px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
              {flashMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: 1600, margin: '0 auto' }}>
            <Sidebar tab={tab} setTab={setTab} items={sideItems} availableCents={cashOut.availableCents} lifetimeCents={cashOut.lifetimeEarnedCents} />

            <div style={{ padding: '32px 40px 60px', minWidth: 0 }}>
              {/* Greeting */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <Pill dot color={palette.accent} style={{ marginBottom: 12 }}>● {sellerStats.activeSubs} active subs · {sellerStats.totalRuns30d.toLocaleString()} runs this month</Pill>
                  <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.4, margin: 0, color: palette.text }}>
                    Welcome back, <span style={{ color: palette.accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, fontSize: 52 }}>{firstName}</span>.
                  </h1>
                  <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, margin: '12px 0 0' }}>
                    {tab === 'payouts'
                      ? `Available to cash out: ${fmtMoney(cashOut.availableCents)} of ${fmtMoney(cashOut.lifetimeEarnedCents)} earned.`
                      : listings.length === 0
                        ? 'Publish your first agent to start earning Power.'
                        : `Your roster shipped ${sellerStats.totalRuns30d.toLocaleString()} tasks this cycle. Here's how that turned into Power.`}
                  </p>
                </div>
              </div>

              {tab === 'overview' && (
                <>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                    <Kpi label="Power earned (30d)" value={sellerStats.powerEarned30d >= 1000 ? `${(sellerStats.powerEarned30d/1000).toFixed(sellerStats.powerEarned30d < 10000 ? 1 : 0)}k` : sellerStats.powerEarned30d.toLocaleString()} sub={sellerStats.powerEarned30d > 0 ? `≈ €${Math.round(sellerStats.powerEarned30d * rates.eurPerPower * rates.sellerShare).toLocaleString()} after ${(100 - rates.sellerSharePct).toFixed(0)}% platform` : 'No runs yet'} sparkData={sellerStats.powerEarned30d > 0 ? series30d : undefined} />
                    <Kpi label="EUR earned (30d)" value={`€${sellerStats.eurEarned30d.toLocaleString()}`} sub={sellerStats.eurEarned30d > 0 ? 'net of 30% platform' : 'No earnings yet'} sparkData={sellerStats.eurEarned30d > 0 ? series30d : undefined} sparkColor={palette.cyan} color={palette.cyan} />
                    <Kpi label="Active subs" value={`${sellerStats.activeSubs}`} sub={listings.length > 0 ? `${listings.length} listing${listings.length === 1 ? '' : 's'} live` : 'No listings yet'} />
                    <Kpi label="Avg rating" value={sellerStats.avgRating > 0 ? `★ ${sellerStats.avgRating}` : '—'} sub={sellerStats.avgRating > 0 ? `across ${sellerStats.totalRuns30d.toLocaleString()} runs` : 'No ratings yet'} color={palette.amber} sparkColor={palette.amber} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 22 }}>
                    <RevenueChart series24h={series24h} series7d={series7d} series30d={series30d} />
                    <Disputes items={disputes} />
                  </div>

                  <div style={{ marginBottom: 22 }}><Listings items={listings} /></div>
                  <div style={{ marginBottom: 22 }}><Subs items={subs} activeSubs={sellerStats.activeSubs} /></div>
                  <div style={{ marginBottom: 22 }}><Performance items={perf} /></div>
                </>
              )}

              {tab === 'listings' && <Listings items={listings} />}
              {tab === 'subs' && <Subs items={subs} activeSubs={sellerStats.activeSubs} />}
              {tab === 'perf' && <Performance items={perf} />}
              {tab === 'disputes' && <Disputes items={disputes} />}
              {tab === 'manifest' && <ManifestStub />}
              {tab === 'credentials' && (
                <CredentialsTab credentials={llmCredentials} providers={llmProviders} />
              )}
              {tab === 'payouts' && (
                <PayoutsTab payoutMethods={payoutMethods} cashOut={cashOut} payouts={payouts} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default SellerDash.Page;
