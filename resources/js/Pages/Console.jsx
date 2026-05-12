import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// =====================================================================
// CLIENT DASHBOARD (Console) — post-login workspace
// Power balance, burn-rate chart, active agents, live ops, billing
// =====================================================================

const Dashboard = (() => {
  const { palette, Glass, Pill, Mesh, Logo, SectionLabel, Reveal, Footer, ThemeToggle } = DirA;

  // ---- Demo state for the logged-in account ----
  const ACCOUNT = {
    org: 'Helix Co.',
    plan: 'Pro',
    seat: 'Mara Lindholm',
    role: 'Owner',
    powerBalance: 243891,
    powerPack: 50000,    // per refresh cycle
    burn24h: 18472,
    burn7d: 124300,
    burn30d: 487120,
    nextRefresh: 'Mar 1, 2026',
    eurSpent30d: 4384,
  };

  // Active agents the org has deployed
  const ACTIVE_AGENTS = [
    { id: 'sdr-pro',  name: 'AI SDR',           role: 'Cold Outreach', tone: 'sales',   power: 12, perUnit: 'lead',        runs24h: 412, runs7d: 2880,  failRate: 0.002, latency: '0.4s', spend24h: 4944, status: 'on'  },
    { id: 'review',   name: 'AI Code Reviewer', role: 'Engineering',   tone: 'eng',     power: 38, perUnit: 'PR',          runs24h: 84,  runs7d: 612,   failRate: 0.001, latency: '78s',  spend24h: 3192, status: 'on'  },
    { id: 'support',  name: 'AI Support Agent', role: 'Customer Care', tone: 'support', power: 6,  perUnit: 'ticket',      runs24h: 1241,runs7d: 8420,  failRate: 0.004, latency: '22s',  spend24h: 7446, status: 'on'  },
    { id: 'books',    name: 'AI Bookkeeper',    role: 'Finance',       tone: 'finance', power: 4,  perUnit: 'transaction', runs24h: 580, runs7d: 4112,  failRate: 0.000, latency: '0.7s', spend24h: 2320, status: 'on'  },
    { id: 'analyst',  name: 'AI Data Analyst',  role: 'Research',      tone: 'research',power: 22, perUnit: 'query',       runs24h: 28,  runs7d: 184,   failRate: 0.011, latency: '15s',  spend24h: 616,  status: 'paused' },
  ];

  // Burn-rate sparkline data (24 points = last 24h)
  const BURN_SERIES = [320, 410, 380, 290, 250, 220, 180, 240, 310, 480, 620, 740, 820, 880, 920, 1040, 1180, 1220, 1140, 1020, 980, 860, 720, 610];
  // Per-day burn for last 30 days
  const BURN_30D = [
    9200, 11400, 12100, 14200, 13800, 12400, 11900, 13200, 15400, 16800, 17200, 18900, 19400, 18700, 17400,
    16100, 14800, 16400, 18200, 19800, 21200, 22400, 21800, 20100, 18700, 19400, 20800, 22100, 21400, 18472,
  ];

  // Recent ops events
  const OPS = [
    { agent: 'AI SDR',        verb: 'sent personalized email to', obj: 'lead@northwind.io',    cost: 12, t: '2s ago',  status: 'ok' },
    { agent: 'AI Support',    verb: 'resolved ticket',             obj: '#88472 (refund)',      cost: 6,  t: '4s ago',  status: 'ok' },
    { agent: 'AI Bookkeeper', verb: 'reconciled',                  obj: '142 Stripe tx',        cost: 568,t: '11s ago', status: 'ok' },
    { agent: 'AI Code Reviewer', verb: 'reviewed PR',              obj: '#4291 monorepo/payments',cost: 38,t: '23s ago', status: 'ok' },
    { agent: 'AI Support',    verb: 'failed to resolve',           obj: '#88471 (escalated)',   cost: 6,  t: '34s ago', status: 'fail' },
    { agent: 'AI SDR',        verb: 'booked',                      obj: 'demo with Petrichor',  cost: 12, t: '52s ago', status: 'ok' },
    { agent: 'AI Bookkeeper', verb: 'flagged',                     obj: '€8,400 mismatch',      cost: 4,  t: '1m ago',  status: 'warn' },
    { agent: 'AI Data Analyst',verb: 'answered',                   obj: '"MRR by region Q1"',   cost: 22, t: '1m ago',  status: 'ok' },
  ];

  // Billing events
  const BILLING = [
    { date: 'Feb 14, 2026', desc: 'Pro pack refresh',      power: 50000,  eur: 449,   kind: 'pack' },
    { date: 'Feb 03, 2026', desc: 'Top-up (overflow)',     power: 10000,  eur: 90,    kind: 'topup' },
    { date: 'Jan 14, 2026', desc: 'Pro pack refresh',      power: 50000,  eur: 449,   kind: 'pack' },
    { date: 'Dec 14, 2025', desc: 'Pro pack refresh',      power: 50000,  eur: 449,   kind: 'pack' },
    { date: 'Dec 02, 2025', desc: 'SLA credit · AI Support',power: 240,   eur: 0,     kind: 'credit' },
    { date: 'Nov 14, 2025', desc: 'Pro pack refresh',      power: 50000,  eur: 449,   kind: 'pack' },
  ];

  // ---- Sidebar nav ----
  const SIDE_ITEMS = [
    { id: 'overview', label: 'Overview',     icon: '◆', count: null },
    { id: 'agents',   label: 'Active agents', icon: '◇', count: ACTIVE_AGENTS.filter(a => a.status === 'on').length },
    { id: 'ops',      label: 'Live ops',     icon: '▸', count: null, live: true },
    { id: 'billing',  label: 'Billing',      icon: '⚡', count: null },
    { id: 'team',     label: 'Team',         icon: '◈', count: 5 },
    { id: 'keys',     label: 'API keys',     icon: '⌘', count: 3 },
    { id: 'settings', label: 'Settings',     icon: '◌', count: null },
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
  const TopBar = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${palette.border}`, background: 'rgba(5,7,10,0.7)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', position: 'sticky', top: 0, zIndex: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="#/" style={{ textDecoration: 'none' }}><Logo /></a>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>/ console</span>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.text, padding: '4px 9px', background: 'var(--p-chip)', border: `1px solid ${palette.border}`, borderRadius: 6 }}>{ACCOUNT.org}</span>
          <span style={{ padding: '3px 8px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>{ACCOUNT.plan.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
          <span style={{ color: palette.accent }}>● LIVE</span>
          <span>UTC {time.toISOString().slice(11,19)}</span>
          <ThemeToggle size={32} />
          <a href="#/roster" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Hire agent</a>
          <a href="#/vendor" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.cyan, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Vendor view →</a>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy Power +</button>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 700, color: palette.onAccent }}>ML</div>
        </div>
      </div>
    );
  };

  // ---- Sidebar ----
  const Sidebar = ({ tab, setTab }) => (
    <div style={{ width: 220, borderRight: `1px solid ${palette.border}`, padding: '28px 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 65, alignSelf: 'flex-start', height: 'calc(100vh - 65px)' }}>
      {SIDE_ITEMS.map(s => {
        const sel = tab === s.id;
        return (
          <button key={s.id} onClick={() => setTab(s.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: sel ? 600 : 400, transition: 'all 0.2s' }}>
            <span><span style={{ marginRight: 10, fontFamily: 'Geist Mono, monospace', color: sel ? palette.accent : palette.textMute }}>{s.icon}</span>{s.label}</span>
            {s.count != null && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: sel ? palette.accent : palette.textMute }}>{s.count}</span>}
            {s.live && <span style={{ width: 6, height: 6, borderRadius: 99, background: palette.accent, boxShadow: `0 0 6px ${palette.accent}`, animation: 'dirA-pulse 1.4s ease-in-out infinite' }} />}
          </button>
        );
      })}
      <div style={{ marginTop: 'auto', padding: 12, borderRadius: 8, background: 'rgba(180,242,91,0.05)', border: `1px solid ${palette.accentDim}` }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>Power balance</div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4 }}>{ACCOUNT.powerBalance.toLocaleString()}<span style={{ fontSize: 14, color: palette.accent, marginLeft: 4 }}>⚡</span></div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginTop: 2 }}>refresh {ACCOUNT.nextRefresh}</div>
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

  // ---- Burn-rate chart ----
  const BurnChart = () => {
    const [range, setRange] = useState('30d');
    const data = range === '24h' ? BURN_SERIES : BURN_30D;
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
            const h = (v / max) * 140;
            const isPeak = v === max;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }} title={`${labels[i]}: ${v.toLocaleString()}⚡`}>
                <div style={{
                  width: '100%', height: `${h}px`,
                  background: isPeak ? palette.accent : `linear-gradient(180deg, ${palette.accent}, ${palette.accent}80)`,
                  opacity: isPeak ? 1 : 0.5 + (v / max) * 0.5,
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
          <a href={`#/agent/${a.id}`} style={{ color: palette.textMute, textDecoration: 'none', fontSize: 14 }}>›</a>
        </div>
      </div>
    );
  };

  const ActiveAgents = () => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Deployed agents</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 2 }}>{ACTIVE_AGENTS.length} on roster · {ACTIVE_AGENTS.filter(a => a.status === 'on').length} active</div>
        </div>
        <a href="#/roster" style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none' }}>+ Hire another</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 0.9fr 0.9fr 0.7fr 1fr 80px', gap: 14, padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Agent</span><span>Volume</span><span>Power 24h</span><span>Latency</span><span>Fail rate</span><span>Trend</span><span>Status</span>
      </div>
      {ACTIVE_AGENTS.map(a => <AgentRow key={a.id} a={a} />)}
    </Glass>
  );

  // ---- Live ops feed (auto-rotating) ----
  const LiveOps = () => {
    const [items, setItems] = useState(OPS.slice(0, 6));
    const idx = useRef(6);
    useEffect(() => {
      const t = setInterval(() => {
        setItems(prev => {
          const next = OPS[idx.current % OPS.length];
          idx.current++;
          return [{ ...next, key: idx.current, t: 'just now' }, ...prev.slice(0, 5).map((p, i) => ({ ...p, t: i === 0 ? '4s ago' : i === 1 ? '12s ago' : i === 2 ? '34s ago' : i === 3 ? '1m ago' : '2m ago' }))];
        });
      }, 2200);
      return () => clearInterval(t);
    }, []);

    return (
      <Glass style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Live ops feed</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 2 }}>last 5 events</div>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: palette.accent, boxShadow: `0 0 6px ${palette.accent}`, animation: 'dirA-pulse 1.4s infinite' }} />LIVE
          </span>
        </div>
        <div>
          {items.map((it, i) => {
            const color = it.status === 'fail' ? palette.red : it.status === 'warn' ? palette.amber : palette.accent;
            return (
              <div key={it.key || i} style={{ padding: '12px 20px', borderBottom: i < items.length - 1 ? `1px solid ${palette.border}` : 0, opacity: 1 - i * 0.08, animation: i === 0 ? 'dirA-slidein 0.5s ease' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>
                  <span style={{ color: palette.textMute, minWidth: 50 }}>{it.t}</span>
                  <span style={{ color: color, fontWeight: 600 }}>{it.agent}</span>
                  <span style={{ color: palette.textDim, flex: 1 }}>{it.verb} <span style={{ color: palette.text }}>{it.obj}</span></span>
                  <span style={{ color: palette.accent }}>{it.cost}⚡</span>
                </div>
              </div>
            );
          })}
        </div>
        <style>{`@keyframes dirA-slidein { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </Glass>
    );
  };

  // ---- Billing block ----
  const Billing = () => (
    <Glass style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.borderStrong}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Billing & history</div>
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 2 }}>€{ACCOUNT.eurSpent30d.toLocaleString()} <span style={{ fontSize: 13, color: palette.textDim, fontWeight: 400 }}>· last 30 days</span></div>
        </div>
        <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Download invoices →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 100px 100px', gap: 14, padding: '10px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>Date</span><span>Description</span><span>Power</span><span>Amount</span><span>Status</span>
      </div>
      {BILLING.map((b, i) => {
        const c = b.kind === 'credit' ? palette.amber : b.kind === 'topup' ? palette.cyan : palette.accent;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 100px 100px', gap: 14, padding: '14px 20px', borderBottom: i < BILLING.length - 1 ? `1px solid ${palette.border}` : 0, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.textDim }}>{b.date}</span>
            <span style={{ fontSize: 13, color: palette.text }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: c, marginRight: 8, verticalAlign: 'middle' }} />
              {b.desc}
            </span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: c }}>+{b.power.toLocaleString()}⚡</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: palette.text }}>€{b.eur}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>● paid</span>
          </div>
        );
      })}
    </Glass>
  );

  // ---- Quick actions strip ----
  const QuickActions = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {[
        { icon: '⚡', t: 'Buy Power',     d: 'Top up balance',         href: '#/' },
        { icon: '◇', t: 'Hire agent',    d: '18 in roster',           href: '#/roster' },
        { icon: '⌘', t: 'Create API key', d: '3 keys active',         href: '#/' },
        { icon: '◈', t: 'Invite team',    d: '5 of 5 seats used',     href: '#/' },
      ].map(a => (
        <a key={a.t} href={a.href} style={{ textDecoration: 'none' }}>
          <Glass style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{a.t}</div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{a.d}</div>
            </div>
            <span style={{ color: palette.textMute, fontSize: 16 }}>→</span>
          </Glass>
        </a>
      ))}
    </div>
  );

  // ---- Page ----
  const Page = () => {
    const [tab, setTab] = useState('overview');
    return (
      <div style={{ background: palette.bg0, minHeight: '100vh', position: 'relative', color: palette.text, fontFamily: 'Inter, sans-serif' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <TopBar />
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: 1600, margin: '0 auto' }}>
            <Sidebar tab={tab} setTab={setTab} />

            <div style={{ padding: '32px 40px 60px', minWidth: 0 }}>
              {/* Greeting */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <Pill dot color={palette.accent} style={{ marginBottom: 12 }}>● 5 agents on duty · burning {Math.round(ACCOUNT.burn24h / 24)}⚡/hr</Pill>
                  <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.4, margin: 0, color: palette.text }}>
                    Good evening, <span style={{ color: palette.accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, fontSize: 52, letterSpacing: -1 }}>Mara</span>.
                  </h1>
                  <p style={{ fontSize: 14, color: palette.textDim, marginTop: 12, margin: '12px 0 0' }}>Here's what your roster shipped while you were away.</p>
                </div>
              </div>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                <Kpi label="Power balance" value={`${(ACCOUNT.powerBalance/1000).toFixed(1)}k`} sub={`of ${(ACCOUNT.powerPack).toLocaleString()}⚡ pack · refresh ${ACCOUNT.nextRefresh}`} />
                <Kpi label="Burned (24h)" value={ACCOUNT.burn24h.toLocaleString()} sub={`≈ €${Math.round(ACCOUNT.burn24h * 0.009)} at Pro rate`} sparkData={BURN_SERIES} />
                <Kpi label="Burned (30d)" value={`${(ACCOUNT.burn30d/1000).toFixed(0)}k`} sub={`avg ${Math.round(ACCOUNT.burn30d/30).toLocaleString()}⚡/day`} sparkData={BURN_30D} />
                <Kpi label="Active agents" value={`${ACTIVE_AGENTS.filter(a => a.status === 'on').length} / ${ACTIVE_AGENTS.length}`} sub={`${ACTIVE_AGENTS.reduce((s,a) => s + a.runs24h, 0).toLocaleString()} tasks today`} color={palette.cyan} sparkColor={palette.cyan} sparkData={[8, 14, 21, 18, 26, 32, 28, 35, 42, 38, 45, 51, 48, 55, 62]} />
              </div>

              {/* Burn chart + live ops */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 22 }}>
                <BurnChart />
                <LiveOps />
              </div>

              {/* Active agents table */}
              <div style={{ marginBottom: 22 }}><ActiveAgents /></div>

              {/* Quick actions */}
              <div style={{ marginBottom: 22 }}><QuickActions /></div>

              {/* Billing */}
              <Billing />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Dashboard.Page;
