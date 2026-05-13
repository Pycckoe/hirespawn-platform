import '@/setup';
import { router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Settings — workspace, members, API keys, billing, integrations, RBAC.
// Live wiring: Workspace tab persists to buyer_profiles; API keys + Members
// + Billing read from real tables; Danger zone deletes via Breeze profile.
// The remaining tabs (integrations / security / notifications) still render
// the "coming soon" placeholder.
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

  const Section = ({ title, sub, children, action }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, gap: 14 }}>
        <div>
          <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, margin: 0 }}>{title}</h3>
          {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>{sub}</div>}
        </div>
        {action}
      </div>
      <Glass style={{ padding: 22 }}>{children}</Glass>
    </div>
  );

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

  const Field = ({ label, value, onChange, error, mono, hint, suffix, placeholder, maxLength, type = 'text', autoFocus }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${palette.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus={autoFocus}
            style={{ flex: 1, padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 13, outline: 'none' }}
          />
          {suffix && <span style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{suffix}</span>}
        </div>
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </div>
    </div>
  );

  // -------- Workspace --------
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
          <Field label="Workspace name" value={data.companyName} onChange={v => setData('companyName', v)} error={errors.companyName} hint="Shown in vendor analytics" maxLength={120} />
          <StaticField label="Slug" value={slug} mono suffix=".hirespawn.io" hint="Auto-derived from name" />
          <StaticField label="Region" value="EU · West-1 (Frankfurt)" hint="Cannot be changed after first run" />
          <Field label="Country (ISO)" value={data.country} onChange={v => setData('country', v.toUpperCase().slice(0, 2))} error={errors.country} mono placeholder="DE" hint="2-letter ISO code · billing address" maxLength={2} />
          <Field label="VAT number" value={data.vatNumber} onChange={v => setData('vatNumber', v)} error={errors.vatNumber} mono placeholder="DE 814 421 098" hint="Optional · used on invoices" maxLength={32} />
        </Section>

        <Section title="Account · signed in as" sub="To change your personal name / password use Profile.">
          <StaticField label="Name" value={account.name || ''} />
          <StaticField label="Email" value={account.email || ''} mono />
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 8 }}>
          {recentlySuccessful && <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>✓ Saved</span>}
          <button type="submit" disabled={processing} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
            {processing ? 'Saving…' : 'Save workspace'}
          </button>
        </div>
      </form>
    );
  };

  // -------- API keys --------
  const KeysTab = ({ apiKeys, apiKeySecret }) => {
    const [showCreate, setShowCreate] = React.useState(false);
    const [revealed, setRevealed] = React.useState(apiKeySecret || null);

    React.useEffect(() => {
      if (apiKeySecret) {
        setRevealed(apiKeySecret);
        setShowCreate(false);
      }
    }, [apiKeySecret?.id]);

    const { data, setData, post, processing, errors, reset } = useForm({
      name: '',
      environment: 'live',
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('settings.keys.store'), {
        preserveScroll: true,
        onSuccess: () => reset(),
      });
    };

    const revoke = (id, name) => {
      if (!confirm(`Revoke ${name}? This breaks any integration using it.`)) return;
      router.delete(route('settings.keys.revoke', id), { preserveScroll: true });
    };

    const copy = (txt) => {
      if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(txt);
    };

    const active = apiKeys.filter(k => k.status === 'active');
    const revoked = apiKeys.filter(k => k.status === 'revoked');

    return (
      <div>
        {revealed && (
          <div style={{ marginBottom: 24 }}>
            <Glass style={{ padding: 22, border: `1px solid ${palette.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>New key · shown once</div>
                <button onClick={() => setRevealed(null)} style={{ background: 'transparent', border: 0, color: palette.textMute, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss ×</button>
              </div>
              <div style={{ fontSize: 14, color: palette.textDim, marginBottom: 12 }}>
                Copy and store <span style={{ color: palette.text }}>{revealed.name}</span> in your secrets manager now — we hash on save, so this is the only chance to see it.
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <code style={{ flex: 1, padding: '12px 14px', background: 'var(--p-inset)', border: `1px dashed ${palette.accentDim}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 13, wordBreak: 'break-all' }}>
                  {revealed.secret}
                </code>
                <button onClick={() => copy(revealed.secret)} style={{ padding: '12px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Copy</button>
              </div>
            </Glass>
          </div>
        )}

        <Section
          title="Active keys"
          sub="Bearer tokens for the runtime API. Treat them like passwords."
          action={!showCreate && (
            <button onClick={() => setShowCreate(true)} style={{ padding: '10px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ New key</button>
          )}
        >
          {showCreate && (
            <form onSubmit={submit} style={{ padding: '14px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto auto', gap: 10, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 11, color: palette.textMute, marginBottom: 4, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Label</div>
                  <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Production · gateway" autoFocus style={{ width: '100%', padding: '10px 12px', background: palette.bg0, border: `1px solid ${errors.name ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                  {errors.name && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{errors.name}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: palette.textMute, marginBottom: 4, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Env</div>
                  <select value={data.environment} onChange={e => setData('environment', e.target.value)} style={{ width: '100%', padding: '10px 12px', background: palette.bg0, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 13, outline: 'none' }}>
                    <option value="live">live</option>
                    <option value="test">test</option>
                  </select>
                </div>
                <button type="submit" disabled={processing} style={{ alignSelf: 'flex-end', padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>{processing ? 'Creating…' : 'Create'}</button>
                <button type="button" onClick={() => { setShowCreate(false); reset(); }} style={{ alignSelf: 'flex-end', padding: '10px 14px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          )}

          {active.length === 0 && !showCreate && (
            <div style={{ padding: '24px 0', fontSize: 13, color: palette.textMute, textAlign: 'center' }}>
              No keys yet. Click <strong style={{ color: palette.text }}>+ New key</strong> to create one.
            </div>
          )}

          {active.map((k, i) => (
            <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 120px auto', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: i < active.length - 1 ? `1px solid ${palette.border}` : 0 }}>
              <div>
                <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{k.name}</div>
                <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{k.prefix}_••••••••••••••••••••••</div>
              </div>
              <Pill color={k.environment === 'live' ? palette.accent : palette.textDim}>{k.environment}</Pill>
              <div style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace' }}>{k.lastUsed}</div>
              <div style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>{k.createdAt}</div>
              <button onClick={() => revoke(k.id, k.name)} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Revoke</button>
            </div>
          ))}
        </Section>

        {revoked.length > 0 && (
          <Section title={`Revoked · ${revoked.length}`} sub="Kept for audit. Cannot authenticate.">
            {revoked.map((k, i) => (
              <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 1fr', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: i < revoked.length - 1 ? `1px solid ${palette.border}` : 0, opacity: 0.55 }}>
                <div>
                  <div style={{ fontSize: 13, color: palette.text }}>{k.name}</div>
                  <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{k.prefix}_••••••••</div>
                </div>
                <Pill color={palette.textMute}>{k.environment}</Pill>
                <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>revoked {k.revokedAt}</div>
                <div />
              </div>
            ))}
          </Section>
        )}

        <Section title="Using the key" sub="Send the bearer token on every request to gateway.hirespawn.io">
          <pre style={{ margin: 0, padding: 16, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 12, overflow: 'auto', lineHeight: 1.55 }}>{`curl -X POST https://gateway.hirespawn.io/v1/agents/sdr-pro/run \\
  -H "Authorization: Bearer hsp_live_xxx..." \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Find 20 B2B SaaS founders in Berlin"}'`}</pre>
        </Section>
      </div>
    );
  };

  // -------- Members --------
  const MembersTab = ({ members }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
      email: '',
      role: 'member',
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('settings.members.store'), {
        preserveScroll: true,
        onSuccess: () => reset(),
      });
    };

    const remove = (m) => {
      if (m.isOwner) return;
      if (!confirm(`Remove ${m.email} from the workspace?`)) return;
      router.delete(route('settings.members.destroy', m.id), { preserveScroll: true });
    };

    const roleColor = (r) => r === 'owner' ? palette.accent : r === 'admin' ? '#7dd3ff' : palette.textDim;
    const statusColor = (s) => s === 'active' ? palette.accent : s === 'invited' ? '#f3b34a' : palette.textMute;

    return (
      <div>
        <Section title="Invite a teammate" sub="They get a link to set their password and join this workspace.">
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 10, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 11, color: palette.textMute, marginBottom: 4, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Work email</div>
                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="teammate@yourcompany.com" style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.email ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                {errors.email && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{errors.email}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: palette.textMute, marginBottom: 4, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Role</div>
                <select value={data.role} onChange={e => setData('role', e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}>
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                </select>
              </div>
              <button type="submit" disabled={processing} style={{ alignSelf: 'flex-end', padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>{processing ? 'Sending…' : 'Send invite'}</button>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>
              <strong>admin</strong> manages agents & billing · <strong>member</strong> runs agents · <strong>viewer</strong> read-only on console
            </div>
          </form>
        </Section>

        <Section title={`People · ${members.length}`} sub="Owner is always listed first.">
          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 130px auto', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: i < members.length - 1 ? `1px solid ${palette.border}` : 0 }}>
              <div>
                <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{m.name || m.email}</div>
                {m.name && <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 2 }}>{m.email}</div>}
              </div>
              <Pill color={roleColor(m.role)}>{m.role}</Pill>
              <Pill color={statusColor(m.status)} dot={m.status === 'active'}>{m.status}</Pill>
              <div style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>
                {m.status === 'active' ? (m.acceptedAt || '—') : (m.invitedAt ? `invited ${m.invitedAt}` : '—')}
              </div>
              {m.isOwner ? (
                <span style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>you</span>
              ) : (
                <button onClick={() => remove(m)} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Remove</button>
              )}
            </div>
          ))}
        </Section>
      </div>
    );
  };

  // -------- Billing --------
  const BillingTab = ({ billing, invoices }) => {
    const fmtMoney = (cents, ccy = 'EUR') => {
      const v = (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return ccy === 'EUR' ? `€${v}` : `${ccy} ${v}`;
    };

    return (
      <div>
        <Section title="Power balance" sub="Power is consumed by agent runs. Buy more anytime — packs never expire.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <Stat label="Balance" value={`${billing.powerBalance.toLocaleString()}⚡`} />
            <Stat label="Burn · 30d" value={`${billing.burn30d.toLocaleString()}⚡`} />
            <Stat label="Spent · 30d" value={fmtMoney(billing.spent30dCents)} />
            <Stat label="Lifetime" value={fmtMoney(billing.lifetimeSpentCents)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <a href={route('power')} style={{ textDecoration: 'none' }}>
              <button style={{ padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Buy Power →</button>
            </a>
          </div>
        </Section>

        <Section title="Payment method" sub="Stripe wiring lands in the next deploy.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: palette.text }}>No card on file</div>
              <div style={{ fontSize: 12, color: palette.textMute, marginTop: 4 }}>Top-ups are paid per pack until the auto-charge integration ships.</div>
            </div>
            <button disabled style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', color: palette.textMute, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'not-allowed' }}>Add card · soon</button>
          </div>
        </Section>

        <Section title="Auto top-up" sub="Refill power automatically when balance dips below a threshold.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: palette.text }}>Currently {billing.autoTopup ? 'enabled' : 'disabled'}</div>
              <div style={{ fontSize: 12, color: palette.textMute, marginTop: 4 }}>Requires a saved payment method.</div>
            </div>
            <button disabled style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', color: palette.textMute, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', cursor: 'not-allowed' }}>Configure · soon</button>
          </div>
        </Section>

        <Section title={`Invoices · ${invoices.length}`} sub="Generated when a billing period closes.">
          {invoices.length === 0 ? (
            <div style={{ padding: '20px 0', fontSize: 13, color: palette.textMute, textAlign: 'center' }}>
              No invoices yet. They appear here at the end of each billing cycle.
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 130px auto', gap: 14, padding: '8px 0', borderBottom: `1px solid ${palette.border}`, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
                <span>Period</span>
                <span>Status</span>
                <span>VAT</span>
                <span>Total</span>
                <span />
              </div>
              {invoices.map((inv, i) => (
                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 130px auto', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: i < invoices.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                  <div style={{ fontSize: 13, color: palette.text }}>{inv.period}</div>
                  <Pill color={inv.status === 'paid' ? palette.accent : inv.status === 'pending' ? '#f3b34a' : palette.textMute} dot={inv.status === 'paid'}>{inv.status}</Pill>
                  <div style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace' }}>{fmtMoney(inv.vatCents, inv.currency)}</div>
                  <div style={{ fontSize: 13, color: palette.text, fontFamily: 'Geist Mono, monospace' }}>{fmtMoney(inv.totalCents, inv.currency)}</div>
                  {inv.pdfUrl ? (
                    <a href={inv.pdfUrl} style={{ fontSize: 12, color: palette.accent, textDecoration: 'none' }}>PDF ↓</a>
                  ) : (
                    <span style={{ fontSize: 11, color: palette.textMute }}>—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    );
  };

  const Stat = ({ label, value }) => (
    <div style={{ padding: 16, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, letterSpacing: -0.5 }}>{value}</div>
    </div>
  );

  // -------- Danger zone --------
  const DangerZone = ({ workspace }) => {
    const expected = `delete ${(workspace.companyName || 'workspace').toLowerCase()}`.trim();
    const { data, setData, delete: destroy, processing, errors } = useForm({ password: '' });
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
                <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={expected} style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Password</div>
                <div>
                  <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} autoComplete="current-password" style={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${errors.password ? palette.red : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                  {errors.password && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{errors.password}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <div style={{ fontSize: 12, color: palette.textDim }}>Type <code style={{ color: palette.red, fontFamily: 'Geist Mono, monospace' }}>{expected}</code> and your password to confirm.</div>
                <button type="submit" disabled={!matches || processing} style={{ padding: '10px 18px', borderRadius: 8, background: palette.red, border: 0, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: matches && !processing ? 'pointer' : 'not-allowed', opacity: matches && !processing ? 1 : 0.5 }}>
                  {processing ? 'Deleting…' : 'Permanently delete'}
                </button>
              </div>
            </form>
          </Glass>
        </div>
      </div>
    );
  };

  const ComingSoonTab = ({ subject, linkHref, linkLabel }) => (
    <Section title={`${subject} · coming soon`} sub="Design is locked in — the data layer ships next.">
      <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6 }}>
        Track progress in <a href={route('changelog')} style={{ color: palette.accent, textDecoration: 'none' }}>the changelog</a>.
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

  const Page = () => {
    const {
      workspace = {}, account = {}, apiKeys = [], members = [], invoices = [], billing = {},
      flash = {},
    } = usePage().props;

    // Deep-link via ?tab=keys, ?tab=members, etc.
    const initialTab = (() => {
      if (typeof window === 'undefined') return 'workspace';
      const q = new URLSearchParams(window.location.search).get('tab');
      return TABS.find(t => t.k === q) ? q : 'workspace';
    })();

    const [tab, setTab] = React.useState(initialTab);
    const [flashMsg, setFlashMsg] = React.useState(flash?.status || null);

    React.useEffect(() => {
      setFlashMsg(flash?.status || null);
    }, [flash?.status]);

    React.useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 3500);
      return () => clearTimeout(t);
    }, [flashMsg]);

    React.useEffect(() => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (tab === 'workspace') url.searchParams.delete('tab');
      else url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }, [tab]);

    const workspaceLabel = workspace.companyName || 'Your workspace';

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
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

              {tab === 'workspace'    && <WorkspaceTab workspace={workspace} account={account} />}
              {tab === 'members'      && <MembersTab members={members} />}
              {tab === 'keys'         && <KeysTab apiKeys={apiKeys} apiKeySecret={flash?.apiKeySecret} />}
              {tab === 'billing'      && <BillingTab billing={billing} invoices={invoices} />}
              {tab === 'integrations' && <ComingSoonTab subject="Integrations" />}
              {tab === 'security'     && <ComingSoonTab subject="Security & audit log" />}
              {tab === 'notifications'&& <ComingSoonTab subject="Notification channels" />}
              {tab === 'danger'       && <DangerZone workspace={workspace} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Settings.Page;
