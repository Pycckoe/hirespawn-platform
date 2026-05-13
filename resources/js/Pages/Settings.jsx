import '@/setup';
import { router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Settings — workspace, members, API keys, billing, integrations, RBAC.
// Live wiring (this PR): Workspace tab persists company_name / country /
// vat_number to buyer_profiles via PATCH /settings/workspace; Danger zone
// deletes the account via DELETE /profile (Breeze). Other tabs still
// render the design's demo data until their features land.
const Settings = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const TABS = [
    { k: 'workspace',    l: 'Workspace' },
    { k: 'members',      l: 'Members' },
    { k: 'keys',         l: 'API keys' },
    { k: 'billing',      l: 'Billing' },
    { k: 'integrations', l: 'Integrations' },
    { k: 'security',     l: 'Security' },
    { k: 'notifications',l: 'Notifications' },
    { k: 'danger',       l: 'Danger zone' },
  ];

  const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>{sub}</div>}
      </div>
      <Glass style={{ padding: 22 }}>{children}</Glass>
    </div>
  );

  // Read-only field for sections we don't persist yet.
  const StaticField = ({ label, value, mono, hint, suffix }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${palette.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input defaultValue={value} readOnly style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 13, outline: 'none' }} />
        {suffix && <span style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{suffix}</span>}
      </div>
    </div>
  );

  // Controlled field bound to a useForm.
  const Field = ({ label, value, onChange, error, mono, hint, suffix, placeholder, maxLength }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${palette.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 13, outline: 'none' }}
          />
          {suffix && <span style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{suffix}</span>}
        </div>
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </div>
    </div>
  );

  const WorkspaceTab = ({ workspace, account }) => {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
      companyName: workspace.companyName || '',
      country: workspace.country || '',
      vatNumber: workspace.vatNumber || '',
    });

    const submit = (e) => {
      e.preventDefault();
      patch(route('settings.workspace.update'), { preserveScroll: true });
    };

    const slug = (data.companyName || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';

    return (
      <form onSubmit={submit}>
        <Section title="Profile" sub="Visible to vendors when you hire an agent.">
          <Field
            label="Workspace name"
            value={data.companyName}
            onChange={v => setData('companyName', v)}
            error={errors.companyName}
            hint="Shown in vendor analytics"
            maxLength={120}
          />
          <StaticField label="Slug" value={slug} mono suffix=".hirespawn.io" hint="Auto-derived from name" />
          <StaticField label="Region" value="EU · West-1 (Frankfurt)" hint="Cannot be changed after first run" />
          <Field
            label="Country (ISO)"
            value={data.country}
            onChange={v => setData('country', v.toUpperCase().slice(0, 2))}
            error={errors.country}
            mono
            placeholder="DE"
            hint="2-letter ISO code · billing address"
            maxLength={2}
          />
          <Field
            label="VAT number"
            value={data.vatNumber}
            onChange={v => setData('vatNumber', v)}
            error={errors.vatNumber}
            mono
            placeholder="DE 814 421 098"
            hint="Optional · used on invoices"
            maxLength={32}
          />
        </Section>

        <Section title="Account · signed in as" sub="To change your personal name / password use Profile.">
          <StaticField label="Name" value={account.name || ''} />
          <StaticField label="Email" value={account.email || ''} mono />
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 8 }}>
          {recentlySuccessful && (
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>✓ Saved</span>
          )}
          <button type="submit" disabled={processing} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
            {processing ? 'Saving…' : 'Save workspace'}
          </button>
        </div>
      </form>
    );
  };

  const DangerZone = ({ workspace }) => {
    const expected = `delete ${(workspace.companyName || 'workspace').toLowerCase()}`.trim();
    const { data, setData, delete: destroy, processing, errors } = useForm({
      password: '',
    });
    const [confirm, setConfirm] = React.useState('');
    const matches = confirm.trim().toLowerCase() === expected;

    const submit = (e) => {
      e.preventDefault();
      if (!matches) return;
      destroy(route('profile.destroy'), { preserveScroll: true });
    };

    return (
      <div>
        <Section title="Transfer workspace ownership" sub="Hand the keys to another admin.">
          <div style={{ fontSize: 13, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>Coming soon · email support@hirespawn.com to transfer for now.</div>
        </Section>

        <Section title="Export everything" sub="Download a ZIP of all runs, agents, billing, audit logs.">
          <div style={{ fontSize: 13, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>Coming soon.</div>
        </Section>

        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0, color: palette.red }}>Delete account</h3>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>Irreversible. Wipes the workspace, subscriptions, payouts and audit logs.</div>
          </div>
          <Glass style={{ padding: 22, border: `1px solid ${palette.red}` }}>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${palette.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Confirm phrase</div>
                <input
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={expected}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Password</div>
                <div>
                  <input
                    type="password"
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.password ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
                  />
                  {errors.password && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{errors.password}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <div style={{ fontSize: 12, color: palette.textDim }}>Type <code style={{ color: palette.red, fontFamily: 'Geist Mono, monospace' }}>{expected}</code> and your password to confirm.</div>
                <button
                  type="submit"
                  disabled={!matches || processing}
                  style={{ padding: '10px 18px', borderRadius: 8, background: palette.red, border: 0, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: matches && !processing ? 'pointer' : 'not-allowed', opacity: matches && !processing ? 1 : 0.5 }}
                >
                  {processing ? 'Deleting…' : 'Permanently delete'}
                </button>
              </div>
            </form>
          </Glass>
        </div>
      </div>
    );
  };

  const Page = () => {
    const { workspace = {}, account = {}, flash = {} } = usePage().props;
    const [tab, setTab] = React.useState('workspace');
    const [flashMsg, setFlashMsg] = React.useState(flash?.status || null);

    React.useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 3500);
      return () => clearTimeout(t);
    }, [flashMsg]);

    const workspaceLabel = workspace.companyName || 'Your workspace';

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* TopBar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href={route('home')} style={{ textDecoration: 'none' }}><Logo /></a>
              <span style={{ color: palette.textMute }}>/</span>
              <a href={route('console')} style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Console</a>
              <span style={{ color: palette.textMute }}>/</span>
              <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Settings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{account.email || ''} · owner</span>
              <ThemeToggle size={32} />
            </div>
          </div>

          {flashMsg && (
            <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 50, padding: '12px 18px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
              {flashMsg}
            </div>
          )}

          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
            {/* Sidebar */}
            <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
              <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Workspace · {workspaceLabel}</Pill>
              <div style={{ display: 'grid', gap: 2 }}>
                {TABS.map(t => (
                  <button key={t.k} onClick={() => setTab(t.k)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: tab === t.k ? palette.accentDim : 'transparent', color: tab === t.k ? palette.accent : palette.textDim, border: 0, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: tab === t.k ? 600 : 400 }}>{t.l}</button>
                ))}
              </div>
            </div>

            <div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 600, letterSpacing: -1.2, margin: '0 0 28px 0' }}>{TABS.find(t => t.k === tab).l}</h1>

              {tab === 'workspace' && <WorkspaceTab workspace={workspace} account={account} />}

              {tab === 'members' && <ComingSoonTab subject="Team & roles" />}
              {tab === 'keys' && <ComingSoonTab subject="API keys" />}
              {tab === 'billing' && <ComingSoonTab subject="Billing" linkHref={route('power')} linkLabel="Buy Power →" />}
              {tab === 'integrations' && <ComingSoonTab subject="Integrations" />}
              {tab === 'security' && <ComingSoonTab subject="Security & audit log" />}
              {tab === 'notifications' && <ComingSoonTab subject="Notification channels" />}

              {tab === 'danger' && <DangerZone workspace={workspace} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ComingSoonTab = ({ subject, linkHref, linkLabel }) => (
    <Section title={`${subject} · coming soon`} sub="Not yet wired to a backend. The design is locked in — the data layer ships in a follow-up PR.">
      <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6 }}>
        We surface this in the navigation so the shape of the kabinet stays visible. Track progress in
        <a href={route('changelog')} style={{ color: palette.accent, textDecoration: 'none', marginLeft: 4 }}>the changelog</a>.
      </div>
      {linkHref && (
        <div style={{ marginTop: 14 }}>
          <a href={linkHref} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{linkLabel}</button>
          </a>
        </div>
      )}
    </Section>
  );

  return { Page };
})();

export default Settings.Page;
