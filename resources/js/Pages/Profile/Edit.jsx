import '@/setup';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Profile / account page in the Hirespawn design.
// Wires the three Breeze flows (PATCH /profile, PUT /password,
// DELETE /profile) to the standard glassy Hirespawn layout.
const Profile = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      <Glass style={{ padding: 24 }}>{children}</Glass>
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text', error, autoComplete, autoFocus, mono, placeholder, hint }) => (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', fontSize: 14, outline: 'none' }}
      />
      {hint && !error && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
    </label>
  );

  const AccountInfoCard = ({ user, mustVerifyEmail, status }) => {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
      name: user.name || '',
      email: user.email || '',
    });

    const submit = (e) => {
      e.preventDefault();
      patch(route('profile.update'), { preserveScroll: true });
    };

    return (
      <Section title="Account info" sub="Used on invoices, audit logs and anything we email you.">
        <form onSubmit={submit}>
          <Field label="Full name" value={data.name} onChange={(v) => setData('name', v)} error={errors.name} autoComplete="name" autoFocus />
          <Field label="Email" type="email" value={data.email} onChange={(v) => setData('email', v)} error={errors.email} autoComplete="username" mono />

          {mustVerifyEmail && user.email_verified_at === null && (
            <div style={{ marginTop: 4, marginBottom: 14, padding: '12px 14px', background: 'rgba(245,158,11,0.08)', border: `1px solid ${palette.amber}`, borderRadius: 10, fontSize: 13, color: palette.amber, lineHeight: 1.5 }}>
              Your email is not verified yet.
              <Link href={route('verification.send')} method="post" as="button" style={{ marginLeft: 8, color: palette.amber, textDecoration: 'underline', background: 'transparent', border: 0, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                Resend verification email →
              </Link>
              {status === 'verification-link-sent' && (
                <div style={{ marginTop: 6, color: palette.accent, fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>✓ Sent. Check your inbox.</div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {recentlySuccessful && (
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>✓ Saved</span>
            )}
            <button type="submit" disabled={processing} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
              {processing ? 'Saving…' : 'Save info'}
            </button>
          </div>
        </form>
      </Section>
    );
  };

  const PasswordCard = () => {
    const { data, setData, errors, put, processing, reset, recentlySuccessful } = useForm({
      current_password: '',
      password: '',
      password_confirmation: '',
    });

    const submit = (e) => {
      e.preventDefault();
      put(route('password.update'), {
        preserveScroll: true,
        onSuccess: () => reset(),
        onError: (errs) => {
          if (errs.password) reset('password', 'password_confirmation');
          if (errs.current_password) reset('current_password');
        },
      });
    };

    return (
      <Section title="Password" sub="Use at least 8 chars. We hash with bcrypt and never log it.">
        <form onSubmit={submit}>
          <Field label="Current password" type="password" value={data.current_password} onChange={(v) => setData('current_password', v)} error={errors.current_password} autoComplete="current-password" />
          <Field label="New password" type="password" value={data.password} onChange={(v) => setData('password', v)} error={errors.password} autoComplete="new-password" />
          <Field label="Confirm new password" type="password" value={data.password_confirmation} onChange={(v) => setData('password_confirmation', v)} error={errors.password_confirmation} autoComplete="new-password" />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {recentlySuccessful && (
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, letterSpacing: 1, textTransform: 'uppercase' }}>✓ Updated</span>
            )}
            <button type="submit" disabled={processing} style={{ padding: '12px 24px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
              {processing ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </Section>
    );
  };

  const DeleteAccountCard = ({ user }) => {
    const { data, setData, delete: destroy, errors, processing, reset } = useForm({
      password: '',
    });
    const expected = `delete ${(user.email || '').toLowerCase()}`.trim();
    const [confirm, setConfirm] = React.useState('');
    const matches = confirm.trim().toLowerCase() === expected;

    const submit = (e) => {
      e.preventDefault();
      if (!matches) return;
      destroy(route('profile.destroy'), {
        preserveScroll: true,
        onError: () => reset('password'),
      });
    };

    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: palette.red }}>Delete account</h3>
          <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4, lineHeight: 1.5 }}>Permanently wipes your workspace, agents, subscriptions, runs and audit log. We can't bring it back.</div>
        </div>
        <Glass style={{ padding: 24, border: `1px solid ${palette.red}` }}>
          <form onSubmit={submit}>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Confirm phrase</div>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={expected}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 14, outline: 'none' }}
              />
            </label>
            <Field label="Password" type="password" value={data.password} onChange={(v) => setData('password', v)} error={errors.password} autoComplete="current-password" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 12, color: palette.textDim }}>Type <code style={{ color: palette.red, fontFamily: 'Geist Mono, monospace' }}>{expected}</code> and your password to confirm.</div>
              <button
                type="submit"
                disabled={!matches || processing}
                style={{ padding: '12px 20px', borderRadius: 10, background: palette.red, border: 0, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: matches && !processing ? 'pointer' : 'not-allowed', opacity: matches && !processing ? 1 : 0.5 }}
              >
                {processing ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </form>
        </Glass>
      </div>
    );
  };

  const Page = ({ mustVerifyEmail, status }) => {
    const { auth, flash = {} } = usePage().props;
    const user = auth?.user || {};
    const [flashMsg, setFlashMsg] = React.useState(flash?.status || null);

    React.useEffect(() => {
      if (!flashMsg) return;
      const t = setTimeout(() => setFlashMsg(null), 3500);
      return () => clearTimeout(t);
    }, [flashMsg]);

    return (
      <>
        <Head title="Profile" />
        <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
          <Mesh />
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* TopBar */}
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                <span style={{ color: palette.textMute }}>/</span>
                <Link href={route('console')} style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Console</Link>
                <span style={{ color: palette.textMute }}>/</span>
                <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Profile</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{user.email}</span>
                <ThemeToggle size={32} />
              </div>
            </div>

            {flashMsg && (
              <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 50, padding: '12px 18px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
                {flashMsg}
              </div>
            )}

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
              <Pill dot color={palette.accent} style={{ marginBottom: 14 }}>Your account</Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.4, margin: '0 0 8px 0' }}>Profile.</h1>
              <p style={{ color: palette.textDim, fontSize: 15, marginBottom: 36, lineHeight: 1.55 }}>Personal info, password and account-level controls. For workspace billing and team settings see <Link href={route('settings')} style={{ color: palette.accent, textDecoration: 'none' }}>Settings →</Link></p>

              <AccountInfoCard user={user} mustVerifyEmail={mustVerifyEmail} status={status} />
              <PasswordCard />
              <DeleteAccountCard user={user} />
            </div>
          </div>
        </div>
      </>
    );
  };

  return { Page };
})();

export default Profile.Page;
