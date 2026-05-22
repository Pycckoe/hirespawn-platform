import '@/setup';
import { useEffect, useRef, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, useRates, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// CLIENT DASHBOARD (Console) — post-login workspace
// Power balance, burn-rate chart, active agents, live ops, billing
//
// All data is read from server props (ConsoleController). No mock
// fallbacks: when the user has no agents / events yet, sections render
// empty states that point at /roster or /power.
// =====================================================================

const Dashboard = (() => {
  const { palette, Glass, Pill, Mesh, Logo, SectionLabel, Reveal, Footer, ThemeToggle } = DirA;

  // ---- Sidebar nav (depends on active agents count, built per-render) ----
  // Items with `href` navigate to another page (Inertia Link).
  // Items without `href` toggle the local Console tab.
  const buildSideItems = (activeAgents, counts = {}, integrationCount = 0) => [
    { id: 'overview',     label: 'Overview',      icon: '◆', count: null },
    { id: 'agents',       label: 'Active agents', icon: '◇', count: activeAgents.filter(a => a.status === 'on').length },
    { id: 'ops',          label: 'Live ops',      icon: '▸', count: null, live: true },
    { id: 'integrations', label: 'Integrations',  icon: '⚷', count: integrationCount || null },
    { id: 'billing',      label: 'Billing',       icon: '⚡', count: null, href: '/settings?tab=billing' },
    { id: 'team',         label: 'Team',          icon: '◈', count: counts.team ?? null, href: '/settings?tab=members' },
    { id: 'keys',         label: 'API keys',      icon: '⌘', count: counts.keys ?? null, href: '/settings?tab=keys' },
    { id: 'settings',     label: 'Settings',      icon: '◌', count: null, href: '/settings' },
  ];

  // ---- Sparkline component (SVG line) ----
  const Sparkline = ({ data, width = 200, height = 60, color = palette.accent, fill = true }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 8) - 4}`).join(' ');
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`spk-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <polyline points={areaPoints} fill={`url(#spk-${color})`} stroke="none" />}
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  // ---- Top bar ----
  const TopBar = ({ isAdmin = false, user = null, workspaceName = 'Workspace' }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    const initials = (user?.name || 'U')
      .split(/\s+/)
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${palette.border}`, background: 'var(--p-topbar-bg)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', position: 'sticky', top: 0, zIndex: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ console</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '4px 9px', background: 'var(--p-chip)', border: `1px solid ${palette.border}`, borderRadius: 6 }}>{workspaceName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span style={{ color: palette.accent }}>● LIVE</span>
          <span>UTC {time.toISOString().slice(11,19)}</span>
          <ThemeToggle size={32} />
          {/* Plain <a> — /admin is the Filament panel, not an Inertia page.
              Inertia's <Link> would XHR-fetch it and render the fragment as a modal. */}
          {isAdmin && <a href="/admin" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.amber}`, color: palette.amber, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Admin →</a>}
          <Link href="/roster" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Hire agent</Link>
          <Link href="/vendor" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.cyan, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Vendor view →</Link>
          <Link href="/settings?tab=billing" style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>Buy Power +</Link>
          <UserMenu user={user} initials={initials} />
        </div>
      </div>
    );
  };

  // Avatar dropdown — Profile / Settings / Sign out
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
          style={{ width: 32, height: 32, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, color: palette.onAccent, border: 0, cursor: 'pointer' }}
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
  const Sidebar = ({ tab, setTab, items = [], powerBalance = 0 }) => (
    <div style={{ width: 220, borderRight: `1px solid ${palette.border}`, padding: '28px 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 65, alignSelf: 'flex-start', height: 'calc(100vh - 65px)' }}>
      {items.map(s => {
        const sel = !s.href && tab === s.id;
        const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: sel ? 600 : 400, transition: 'all 0.2s', textDecoration: 'none' };
        const inner = (
          <>
            <span><span style={{ marginRight: 10, fontFamily: 'Geist Mono, monospace', color: sel ? palette.accent : palette.textMute }}>{s.icon}</span>{s.label}</span>
            {s.count != null && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: sel ? palette.accent : palette.textMute }}>{s.count}</span>}
            {s.live && <span style={{ width: 6, height: 6, borderRadius: 99, background: palette.accent, boxShadow: `0 0 6px ${palette.accent}`, animation: 'dirA-pulse 1.4s ease-in-out infinite' }} />}
          </>
        );
        return s.href
          ? <Link key={s.id} href={s.href} style={rowStyle}>{inner}</Link>
          : <button key={s.id} onClick={() => setTab(s.id)} style={rowStyle}>{inner}</button>;
      })}
      <div style={{ marginTop: 'auto', padding: 12, borderRadius: 8, background: 'rgba(180,242,91,0.05)', border: `1px solid ${palette.accentDim}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Power balance</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4 }}>{powerBalance.toLocaleString()}<span style={{ fontSize: 14, color: palette.accent, marginLeft: 4 }}>⚡</span></div>
        <Link href="/settings?tab=billing" style={{ display: 'inline-block', marginTop: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, textDecoration: 'none' }}>top up →</Link>
      </div>
      <style>{`@keyframes dirA-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );

  // ---- KPI cards row ----
  const Kpi = ({ label, value, sub, color = palette.accent, sparkData, sparkColor }) => (
    <Glass style={{ padding: 22 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, color: color, letterSpacing: -1, marginTop: 6, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim, marginTop: 6 }}>{sub}</div>
      {sparkData && <div style={{ marginTop: 12 }}><Sparkline data={sparkData} width={220} height={42} color={sparkColor || color} /></div>}
    </Glass>
  );

  // ---- Burn-rate chart — fed by series24h/series30d props ----
  const BurnChart = ({ series24h, series30d }) => {
    const [range, setRange] = useState('30d');
    const data = range === '24h' ? series24h : series30d;
    const labels = range === '24h'
      ? Array.from({ length: 24 }).map((_, i) => `${String((i + 0) % 24).padStart(2, '0')}:00`)
      : Array.from({ length: 30 }).map((_, i) => `${30 - i}d`);
    const max = Math.max(...data);
    const total = data.reduce((s, v) => s + v, 0);
    const avg = Math.round(total / data.length);

    return (
      <Glass style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Power burn rate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 500, color: palette.text }}>{total.toLocaleString()}<span style={{ fontSize: 16, color: palette.textMute, marginLeft: 4 }}>⚡</span></span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>avg {avg.toLocaleString()}⚡ / {range === '24h' ? 'hr' : 'day'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--p-inset)', borderRadius: 8, border: `1px solid ${palette.border}` }}>
            {['24h','7d','30d'].map(r => {
              const sel = range === r;
              return <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 11px', borderRadius: 5, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 11, fontFamily: 'Geist Mono, monospace', cursor: 'pointer', fontWeight: sel ? 600 : 400 }}>{r}</button>;
            })}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, padding: '10px 0', borderBottom: `1px solid ${palette.border}` }}>
          {data.map((v, i) => {
            const h = max > 0 ? (v / max) * 140 : 0;
            const isPeak = v === max && v > 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }} title={`${labels[i]}: ${v.toLocaleString()}⚡`}>
                <div style={{
                  width: '100%', height: `${h}px`,
                  background: isPeak ? palette.accent : `linear-gradient(180deg, ${palette.accent}, ${palette.accent}80)`,
                  opacity: isPeak ? 1 : 0.5 + (v / (max || 1)) * 0.5,
                  borderRadius: '3px 3px 0 0',
                  transition: 'all 0.5s cubic-bezier(.2,.7,.2,1)',
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute }}>
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]} (now)</span>
        </div>
      </Glass>
    );
  };

  // ---- Active agents table ----
  const AgentRow = ({ a }) => {
    const [hover, setHover] = useState(false);
    return (
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 0.9fr 0.9fr 0.7fr 1fr 80px', gap: 14, alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${palette.border}`, background: hover ? 'rgba(180,242,91,0.04)' : 'transparent', opacity: a.status === 'paused' ? 0.55 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{CATEGORIES.find(c => c.key === a.tone)?.icon || '◇'}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{a.name}</div>
            <div style={{ fontSize: 11, color: palette.textMute }}>{a.role} · {a.power}⚡/{a.perUnit}</div>
          </div>
        </div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{a.runs24h.toLocaleString()}<span style={{ fontSize: 10, color: palette.textMute, marginLeft: 4 }}>tasks/24h</span></div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{a.spend24h.toLocaleString()}<span style={{ fontSize: 10, color: palette.accent, marginLeft: 4 }}>⚡</span></div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>{a.latency}</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: a.failRate < 0.005 ? palette.accent : palette.amber }}>{(a.failRate * 100).toFixed(2)}%</div>
        <Sparkline data={Array.from({ length: 18 }).map(() => 30 + Math.random() * 70 + (a.runs24h / 50))} width={120} height={32} color={a.tone === 'eng' ? palette.cyan : palette.accent} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: a.status === 'on' ? palette.accent : palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: a.status === 'on' ? palette.accent : palette.textMute, boxShadow: a.status === 'on' ? `0 0 6px ${palette.accent}` : 'none' }} />
            {a.status}
          </span>
          {a.subscriptionId && (
            <>
              <Link href={`/console/subscriptions/${a.subscriptionId}/configure`} title="Configure variables" style={{ color: palette.textMute, textDecoration: 'none', fontSize: 14 }}>⚙</Link>
              <button
                title="File a dispute"
                onClick={() => window.dispatchEvent(new CustomEvent('open-dispute', { detail: { subscriptionId: a.subscriptionId, agentName: a.name } }))}
                style={{ background: 'transparent', border: 0, color: palette.textMute, cursor: 'pointer', fontSize: 14, padding: 0 }}
              >!</button>
            </>
          )}
          <a href={`/agent/${a.id}`} style={{ color: palette.textMute, textDecoration: 'none', fontSize: 14 }}>›</a>
        </div>
      </div>
    );
  };

  const ActiveAgents = ({ agents = [] }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Deployed agents</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{agents.length} on roster · {agents.filter(a => a.status === 'on').length} active</div>
        </div>
        <Link href="/roster" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>+ Hire {agents.length ? 'another' : 'an agent'}</Link>
      </div>
      {agents.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 0.9fr 0.9fr 0.7fr 1fr 80px', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>Agent</span><span>Volume</span><span>Power 24h</span><span>Latency</span><span>Fail rate</span><span>Trend</span><span>Status</span>
          </div>
          {agents.map(a => <AgentRow key={a.id} a={a} />)}
        </>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textDim }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◇</div>
          <div style={{ fontSize: 14, color: palette.text, marginBottom: 4 }}>No agents deployed yet</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginBottom: 14 }}>Browse the roster to hire your first AI agent.</div>
          <Link href="/roster" style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Browse roster →</Link>
        </div>
      )}
    </Glass>
  );

  // ---- Live ops feed — shows real UsageEvents from props, or empty state
  // when the buyer's agents haven't run anything yet.
  const LiveOps = ({ events = [] }) => {
    const items = events.slice(0, 6);
    const isLive = items.length > 0;
    // Track which rows are expanded so a buyer can drill into the
    // actual tool calls the agent made on their behalf.
    const [openIdx, setOpenIdx] = useState(null);
    return (
      <Glass style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Live ops feed</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 2 }}>{isLive ? `last ${items.length} events` : 'no events yet'}</div>
          </div>
          {isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: palette.accent, boxShadow: `0 0 6px ${palette.accent}`, animation: 'dirA-pulse 1.4s infinite' }} />LIVE
            </span>
          )}
        </div>
        {isLive ? (
          <div>
            {items.map((it, i) => {
              const color = it.status === 'fail' ? palette.red : it.status === 'warn' ? palette.amber : palette.accent;
              const toolCalls = it.toolCalls || [];
              const hasTools = toolCalls.length > 0;
              const isOpen = openIdx === i;
              return (
                <div key={it.key || i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, opacity: 1 - i * 0.08 }}>
                  <div
                    onClick={() => hasTools && setOpenIdx(isOpen ? null : i)}
                    style={{ padding: '12px 20px', cursor: hasTools ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}
                  >
                    <span style={{ color: palette.textMute, minWidth: 50 }}>{it.t}</span>
                    <span style={{ color: color, fontWeight: 600 }}>{it.agent}</span>
                    <span style={{ color: palette.textDim, flex: 1 }}>{it.verb} <span style={{ color: palette.text }}>{it.obj}</span></span>
                    {hasTools && (
                      <span style={{ padding: '1px 6px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: 1, borderRadius: 3 }}>
                        {toolCalls.length} {isOpen ? '▾' : '▸'}
                      </span>
                    )}
                    <span style={{ color: palette.accent }}>{it.cost}⚡</span>
                  </div>
                  {isOpen && hasTools && (
                    <div style={{ padding: '4px 20px 12px 80px', background: 'var(--p-inset-soft)' }}>
                      {toolCalls.map((tc, k) => {
                        const ok = tc.success !== false && !tc.error;
                        return (
                          <div key={k} style={{ padding: '6px 0', borderTop: k > 0 ? `1px solid ${palette.border}` : 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>
                            <span style={{ color: ok ? palette.accent : palette.red, width: 10 }}>{ok ? '✓' : '✗'}</span>
                            <span style={{ color: palette.text, fontWeight: 600 }}>{tc.name}</span>
                            <span style={{ color: palette.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.args || '—'}</span>
                            {tc.error && <span style={{ color: palette.red }}>err: {String(tc.error).slice(0, 60)}</span>}
                            {tc.latencyMs != null && <span style={{ color: palette.textMute }}>{tc.latencyMs}ms</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: palette.textDim }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>▸</div>
            <div style={{ fontSize: 13, color: palette.text, marginBottom: 4 }}>Nothing's running yet</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Hire an agent — runs land here in real time.</div>
          </div>
        )}
      </Glass>
    );
  };

  // ---- Billing block ----
  // Renders real invoice rows when the controller ships any; otherwise
  // shows an empty state pointing at /power so the buyer can top up.
  const Billing = ({ rows = [], eurSpent30d = 0 }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Billing & history</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 2 }}>€{eurSpent30d.toLocaleString()} <span style={{ fontSize: 13, color: palette.textDim, fontWeight: 400 }}>· last 30 days</span></div>
        </div>
        <Link href="/settings?tab=billing" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>Full billing →</Link>
      </div>
      {rows.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 100px 100px', gap: 14, padding: '10px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>Date</span><span>Description</span><span>Power</span><span>Amount</span><span>Status</span>
          </div>
          {rows.map((b, i) => {
            const c = b.kind === 'credit' ? palette.amber : b.kind === 'topup' ? palette.cyan : palette.accent;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 100px 100px', gap: 14, padding: '14px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{b.date}</span>
                <span style={{ fontSize: 13, color: palette.text }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: c, marginRight: 8, verticalAlign: 'middle' }} />
                  {b.desc}
                </span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: c }}>+{(b.power || 0).toLocaleString()}⚡</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>€{b.eur}</span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>● {b.status || 'paid'}</span>
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: palette.textDim }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚡</div>
          <div style={{ fontSize: 13, color: palette.text, marginBottom: 4 }}>No invoices yet</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginBottom: 14 }}>Top up power to start your billing history.</div>
          <Link href="/settings?tab=billing" style={{ display: 'inline-block', padding: '9px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Buy Power +</Link>
        </div>
      )}
    </Glass>
  );

  // ---- Quick actions strip ----
  const QuickActions = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {[
        { icon: '⚡', t: 'Buy Power',     d: 'Top up balance',                href: '/settings?tab=billing' },
        { icon: '◇', t: 'Hire agent',    d: 'Browse the roster',             href: '/roster' },
        { icon: '⌘', t: 'API keys',      d: 'Manage in settings',            href: '/settings?tab=keys' },
        { icon: '◈', t: 'Invite team',    d: 'Members & roles',              href: '/settings?tab=members' },
      ].map(a => (
        <Link key={a.t} href={a.href} style={{ textDecoration: 'none' }}>
          <Glass style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{a.t}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{a.d}</div>
            </div>
            <span style={{ color: palette.textMute, fontSize: 16 }}>→</span>
          </Glass>
        </Link>
      ))}
    </div>
  );

  // ---- Integrations tab ----
  // Lists every OAuth provider the admin has registered. Each card shows
  // "Connect" or "Connected as foo@bar" with a Disconnect button. The
  // Connect link bounces through Laravel's /oauth/{provider}/connect
  // which redirects to the provider's authorize_url with our state token.
  const IntegrationsTab = ({ integrations }) => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Third-party integrations</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 2 }}>
          {integrations.filter(i => i.connected).length} of {integrations.length} connected
        </div>
        <div style={{ fontSize: 13, color: palette.textDim, marginTop: 6, lineHeight: 1.5 }}>
          Agents that act on your behalf (send Slack messages, create HubSpot leads, push to GitHub) need access to those services. Connect each provider once — your tokens are encrypted at rest and only used when an agent calls a matching tool.
        </div>
      </div>
      {integrations.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textDim }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚷</div>
          <div style={{ fontSize: 13, color: palette.text, marginBottom: 4 }}>No integrations registered</div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>An admin needs to register OAuth apps at /admin/oauth-apps first.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: 20 }}>
          {integrations.map(i => (
            <div key={i.provider} style={{ padding: 16, borderRadius: 10, background: 'var(--p-inset-soft)', border: `1px solid ${i.connected ? palette.accentDim : palette.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{i.icon || i.provider.slice(0,1).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{i.label}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{i.provider}</div>
                </div>
                {i.connected && !i.expired && <span style={{ padding: '3px 8px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>✓ on</span>}
                {i.connected && i.expired && <span style={{ padding: '3px 8px', background: 'rgba(255,184,77,0.12)', color: palette.amber, fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 4 }}>expired</span>}
              </div>

              {i.scopes && i.scopes.length > 0 && (
                <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginBottom: 12, lineHeight: 1.5 }}>
                  Scopes: {i.scopes.join(', ')}
                </div>
              )}

              {i.connected ? (
                <div>
                  <div style={{ fontSize: 12, color: palette.textDim, marginBottom: 8 }}>
                    Connected{i.accountLabel ? ` as ${i.accountLabel}` : ''}{i.connectedAt ? ` · ${i.connectedAt}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/oauth/${i.provider}/connect?return=${encodeURIComponent('/console?tab=integrations')}`} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'transparent', color: palette.text, border: `1px solid ${palette.border}`, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none', textAlign: 'center' }}>
                      Reconnect
                    </a>
                    <button
                      onClick={() => {
                        if (!confirm(`Disconnect ${i.label}? Agents using it will fail to run until you reconnect.`)) return;
                        router.delete(route('oauth.disconnect', i.provider), { preserveScroll: true });
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <a href={`/oauth/${i.provider}/connect?return=${encodeURIComponent('/console?tab=integrations')}`} style={{ display: 'block', textAlign: 'center', padding: '10px 12px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>
                  Connect {i.label} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Glass>
  );

  // ---- Page ----
  // ---- Dispute modal ----
  // Listens for window 'open-dispute' events (fired by AgentRow's
  // exclamation button). Posts to /console/disputes which creates a
  // SupportTicket(kind=dispute) row visible in /vendor → Disputes.
  const DisputeModal = () => {
    const [ctx, setCtx] = useState(null); // {subscriptionId, agentName} or null
    const { data, setData, post, processing, errors, reset } = useForm({
      subscription_id: '',
      subject: '',
      category: 'sla_breach',
      body: '',
      refund_power: '',
    });

    useEffect(() => {
      const open = (e) => {
        const detail = e.detail || {};
        setCtx(detail);
        setData({
          subscription_id: detail.subscriptionId,
          subject: '',
          category: 'sla_breach',
          body: '',
          refund_power: '',
        });
      };
      window.addEventListener('open-dispute', open);
      return () => window.removeEventListener('open-dispute', open);
    }, []);

    if (!ctx) return null;

    const close = () => { setCtx(null); reset(); };
    const submit = (e) => {
      e.preventDefault();
      post(route('disputes.store'), {
        preserveScroll: true,
        onSuccess: () => close(),
      });
    };

    return (
      <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: 'var(--p-glass-strong)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: `1px solid ${palette.borderStrong}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.amber, letterSpacing: 1, textTransform: 'uppercase' }}>! File a dispute</div>
            <button onClick={close} style={{ background: 'transparent', border: 0, color: palette.textMute, fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, margin: '0 0 6px 0' }}>
            Dispute · {ctx.agentName}
          </h2>
          <p style={{ fontSize: 12, color: palette.textDim, margin: '0 0 18px 0', lineHeight: 1.5 }}>
            We notify the vendor + our support team. SLA-backed runs that failed get Power credited back to your workspace.
          </p>

          <form onSubmit={submit}>
            <DisputeField palette={palette} label="Subject" error={errors.subject}>
              <input value={data.subject} onChange={e => setData('subject', e.target.value)} maxLength={200} placeholder="Latency > 120s on 3 deals" style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.subject ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </DisputeField>
            <DisputeField palette={palette} label="Category" error={errors.category}>
              <select value={data.category} onChange={e => setData('category', e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}>
                <option value="sla_breach">SLA breach</option>
                <option value="incorrect_output">Incorrect / hallucinated output</option>
                <option value="data_leak">Data leak / privacy</option>
                <option value="overcharged">Overcharged Power</option>
                <option value="integration_broken">Integration broken</option>
                <option value="other">Other</option>
              </select>
            </DisputeField>
            <DisputeField palette={palette} label="What happened" error={errors.body}>
              <textarea value={data.body} onChange={e => setData('body', e.target.value)} rows={5} maxLength={8000} placeholder="Include run IDs / timestamps / what you expected vs what happened." style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.body ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
            </DisputeField>
            <DisputeField palette={palette} label="Refund amount (⚡, optional)" error={errors.refund_power}>
              <input type="number" min={0} value={data.refund_power} onChange={e => setData('refund_power', e.target.value)} placeholder="240" style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.refund_power ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 13, outline: 'none' }} />
            </DisputeField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" onClick={close} style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={processing} style={{ padding: '10px 20px', borderRadius: 8, background: palette.amber, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                {processing ? 'Filing…' : 'Open dispute →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DisputeField = ({ palette, label, error, children }) => (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      {children}
      {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
    </label>
  );

  const Page = () => {
    const { subscriptions = [], powerBalance = 0, flash = {}, auth, workspaceName = 'Your workspace', metrics = null, sidebarCounts = {}, billing = [], integrations = [] } = usePage().props;
    const user = auth?.user || null;
    const isAdmin = !!user?.is_admin;
    const firstName = (user?.name || '').split(/\s+/)[0] || 'operator';
    const liveAgents = subscriptions;
    const connectedCount = integrations.filter(i => i.connected).length;
    const sideItems = buildSideItems(liveAgents, sidebarCounts, connectedCount);

    const burn24h = metrics?.burn24h ?? 0;
    const burn30d = metrics?.burn30d ?? 0;
    const series24h = metrics?.burnSeries24h ?? Array(24).fill(0);
    const series30d = metrics?.burnSeries30d ?? Array(30).fill(0);
    const opsEvents = metrics?.opsFeed ?? [];
    const eurSpent30d = metrics?.eurSpent30d ?? 0;
    const rates = useRates();

    const [tab, setTab] = useState('overview');
    const [flashMsg, setFlashMsg] = useState(flash?.status || null);
    useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 4000);
      return () => clearTimeout(t);
    }, [flashMsg]);
    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <TopBar isAdmin={isAdmin} user={user} workspaceName={workspaceName} />
          <DisputeModal />
          {flashMsg && (
            <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 50, padding: '12px 18px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
              {flashMsg}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: 1600, margin: '0 auto' }}>
            <Sidebar tab={tab} setTab={setTab} items={sideItems} powerBalance={powerBalance} />

            <div style={{ padding: '32px 40px 60px', minWidth: 0 }}>
              {/* Greeting */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <Pill dot color={palette.accent} style={{ marginBottom: 12 }}>● {liveAgents.filter(a => a.status === 'on').length} agents on duty · burning {Math.round(burn24h / 24)}⚡/hr</Pill>
                  <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.4, margin: 0, color: palette.text }}>
                    Good evening, <span style={{ color: palette.accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, fontSize: 52, letterSpacing: -1 }}>{firstName}</span>.
                  </h1>
                  <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, margin: '12px 0 0' }}>{liveAgents.length ? "Here's what your roster shipped while you were away." : 'Your workspace is ready — hire your first agent to get started.'}</p>
                </div>
              </div>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                <Kpi label="Power balance" value={`${(powerBalance/1000).toFixed(1)}k`} sub={powerBalance > 0 ? 'live balance' : 'top up to start'} />
                <Kpi label="Burned (24h)" value={burn24h.toLocaleString()} sub={burn24h > 0 ? `≈ €${(burn24h * rates.eurPerPower).toFixed(2)}` : 'no runs yet'} sparkData={burn24h > 0 ? series24h : undefined} />
                <Kpi label="Burned (30d)" value={burn30d >= 1000 ? `${(burn30d/1000).toFixed(burn30d < 10000 ? 1 : 0)}k` : burn30d.toLocaleString()} sub={burn30d > 0 ? `avg ${Math.round(burn30d/30).toLocaleString()}⚡/day` : 'no runs yet'} sparkData={burn30d > 0 ? series30d : undefined} />
                <Kpi label="Active agents" value={`${liveAgents.filter(a => a.status === 'on').length} / ${liveAgents.length}`} sub={liveAgents.length ? `${liveAgents.reduce((s,a) => s + (a.runs24h || 0), 0).toLocaleString()} tasks today` : 'browse the roster'} color={palette.cyan} sparkColor={palette.cyan} />
              </div>

              {/* Burn chart + live ops */}
              {(tab === 'overview' || tab === 'ops') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 22 }}>
                  <BurnChart series24h={series24h} series30d={series30d} />
                  <LiveOps events={opsEvents} />
                </div>
              )}

              {/* Active agents table */}
              {(tab === 'overview' || tab === 'agents') && (
                <div style={{ marginBottom: 22 }}><ActiveAgents agents={liveAgents} /></div>
              )}

              {/* Quick actions — overview only */}
              {tab === 'overview' && <div style={{ marginBottom: 22 }}><QuickActions /></div>}

              {/* Billing — overview only (full billing lives in /settings?tab=billing) */}
              {tab === 'overview' && <Billing rows={billing} eurSpent30d={eurSpent30d} />}

              {tab === 'integrations' && <IntegrationsTab integrations={integrations} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Dashboard.Page;
