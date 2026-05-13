import '@/setup';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Admin · Agent review queue. Lists every agent grouped by status with
// inline Approve / Reject / Suspend actions. Gated by the `admin`
// middleware in routes/web.php — non-admins get a 403.
const AdminAgents = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const STATUS_STYLES = {
    pending_review: { color: 'amber', label: 'Pending review' },
    approved:       { color: 'accent', label: 'Approved · live' },
    rejected:       { color: 'red', label: 'Rejected' },
    suspended:      { color: 'red', label: 'Suspended' },
    draft:          { color: 'cyan', label: 'Draft' },
  };

  const TABS = [
    { k: 'pending', label: 'Pending', filter: ['pending_review'] },
    { k: 'approved', label: 'Approved', filter: ['approved'] },
    { k: 'rejected', label: 'Rejected', filter: ['rejected', 'suspended'] },
    { k: 'all', label: 'All', filter: null },
  ];

  const Page = () => {
    const { agents = [], counts = {}, flash = {} } = usePage().props;
    const [tab, setTab] = React.useState('pending');
    const [flashMsg, setFlashMsg] = React.useState(flash?.status || null);

    React.useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 3500);
      return () => clearTimeout(t);
    }, [flashMsg]);

    const activeFilter = TABS.find(t => t.k === tab)?.filter;
    const visible = activeFilter
      ? agents.filter(a => activeFilter.includes(a.status))
      : agents;

    return (
      <>
        <Head title="Admin · Agent review" />
        <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
          <Mesh />
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* TopBar */}
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                <span style={{ color: palette.textMute }}>/</span>
                <span style={{ fontSize: 12, color: palette.amber, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Admin</span>
                <span style={{ color: palette.textMute }}>/</span>
                <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Agent review</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href={route('console')} style={{ fontSize: 12, color: palette.textDim, textDecoration: 'none' }}>Back to console →</Link>
                <ThemeToggle size={32} />
              </div>
            </div>

            {flashMsg && (
              <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 50, padding: '12px 18px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
                {flashMsg}
              </div>
            )}

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
              <Pill dot color={palette.amber} style={{ marginBottom: 14 }}>Admin · Agent moderation</Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.4, margin: '0 0 8px 0' }}>Review queue.</h1>
              <p style={{ color: palette.textDim, fontSize: 15, marginBottom: 28, lineHeight: 1.55 }}>
                Approve sends the listing live in the catalog. Reject sends it back to the seller. Suspend pulls a previously-live agent.
              </p>

              {/* Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                <CountCard label="Pending" value={counts.pending || 0} color={palette.amber} />
                <CountCard label="Approved" value={counts.approved || 0} color={palette.accent} />
                <CountCard label="Rejected" value={counts.rejected || 0} color={palette.red} />
                <CountCard label="Suspended" value={counts.suspended || 0} color={palette.red} />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}`, marginBottom: 18, width: 'fit-content' }}>
                {TABS.map(t => {
                  const sel = tab === t.k;
                  return (
                    <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: '7px 14px', borderRadius: 7, background: sel ? palette.accentDim : 'transparent', border: 0, color: sel ? palette.accent : palette.textDim, fontSize: 12, fontWeight: sel ? 600 : 400, fontFamily: 'Geist Mono, monospace', letterSpacing: 0.5, cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {visible.length === 0 ? (
                <Glass style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, color: palette.textMute, marginBottom: 14 }}>◌</div>
                  <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, margin: 0 }}>Nothing here.</h3>
                  <p style={{ fontSize: 14, color: palette.textDim, marginTop: 8 }}>Switch tabs to see other statuses.</p>
                </Glass>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visible.map(a => <AgentRow key={a.id} agent={a} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const CountCard = ({ label, value, color }) => (
    <Glass style={{ padding: 20 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 36, fontWeight: 500, color, letterSpacing: -1, marginTop: 6, lineHeight: 1 }}>{value}</div>
    </Glass>
  );

  const AgentRow = ({ agent }) => {
    const meta = STATUS_STYLES[agent.status] || { color: 'textMute', label: agent.status };
    const color = palette[meta.color] || palette.textMute;

    const approve = () => router.post(route('admin.agents.approve', agent.slug), {}, { preserveScroll: true });
    const reject = () => router.post(route('admin.agents.reject', agent.slug), {}, { preserveScroll: true });
    const suspend = () => router.post(route('admin.agents.suspend', agent.slug), {}, { preserveScroll: true });

    return (
      <Glass style={{ padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <Link href={route('agent.show', agent.slug)} style={{ fontSize: 18, fontWeight: 600, color: palette.text, textDecoration: 'none' }}>{agent.name}</Link>
              <span style={{ padding: '3px 10px', background: `${color}1F`, color, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>● {meta.label}</span>
              <span style={{ padding: '2px 8px', background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 4 }}>{agent.rank}</span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>/agent/{agent.slug}</span>
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 10 }}>
              {agent.role} · {agent.category || 'Uncategorised'} · <span style={{ color: palette.accent }}>{agent.powerCost}⚡/{agent.perUnit}</span>
            </div>
            <div style={{ fontSize: 14, color: palette.text, lineHeight: 1.5, marginBottom: 10 }}>
              {agent.tagline}
            </div>
            <details style={{ marginBottom: 10 }}>
              <summary style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}>Full description</summary>
              <p style={{ fontSize: 13, color: palette.textDim, marginTop: 8, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{agent.description}</p>
            </details>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>
              by <span style={{ color: palette.text }}>{agent.vendor}</span> · seller {agent.seller?.email || '—'} · submitted {formatRelative(agent.submittedAt)}
            </div>
            {(agent.languages?.length > 0 || agent.integrations?.length > 0) && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
                {agent.languages?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {agent.languages.map(l => <span key={l} style={{ padding: '2px 7px', fontSize: 10, color: palette.textDim, fontFamily: 'Geist Mono, monospace', border: `1px solid ${palette.border}`, borderRadius: 4 }}>{l}</span>)}
                  </div>
                )}
                {agent.integrations?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {agent.integrations.map(i => <span key={i} style={{ padding: '2px 7px', fontSize: 10, color: palette.cyan, fontFamily: 'Geist Mono, monospace', border: `1px solid rgba(125,211,255,0.3)`, borderRadius: 4 }}>{i}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            {agent.status === 'pending_review' && (
              <>
                <button onClick={approve} style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Approve · go live</button>
                <button onClick={reject} style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.red}`, color: palette.red, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Reject</button>
              </>
            )}
            {agent.status === 'approved' && (
              <button onClick={suspend} style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.red}`, color: palette.red, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Suspend</button>
            )}
            {agent.status === 'rejected' && (
              <button onClick={approve} style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Approve anyway</button>
            )}
            {agent.status === 'suspended' && (
              <button onClick={approve} style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Reinstate</button>
            )}
            <Link href={route('vendor.publish.edit', agent.slug)} style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 13, fontFamily: 'inherit', textDecoration: 'none', textAlign: 'center' }}>Edit listing →</Link>
          </div>
        </div>
      </Glass>
    );
  };

  const formatRelative = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
  };

  return { Page };
})();

export default AdminAgents.Page;
