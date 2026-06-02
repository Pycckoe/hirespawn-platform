import '@/setup';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Contact / support — public form. Posts to SupportController@store
// which creates a SupportTicket row (kind=support). Pre-fills name
// + email when the visitor is signed in.
const Support = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const CATEGORIES = [
    { v: 'general',         l: 'General question' },
    { v: 'billing',         l: 'Billing or invoice' },
    { v: 'agent_failure',   l: 'Agent run failed' },
    { v: 'integrations',    l: 'Integration broken' },
    { v: 'account',         l: 'Account / login' },
    { v: 'abuse',           l: 'Report abuse' },
    { v: 'feature_request', l: 'Feature request' },
  ];

  const Page = () => {
    const { prefill = {}, supportEmail = 'support@hirespawn.com', avgResponseHours = 12, flash = {} } = usePage().props;
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
      name: prefill.name || '',
      email: prefill.email || '',
      subject: '',
      category: 'general',
      body: '',
    });

    const submit = (e) => {
      e.preventDefault();
      post(route('support.store'), {
        preserveScroll: true,
        onSuccess: () => reset('subject', 'body'),
      });
    };

    return (
      <>
        <Head title="Support · Hirespawn" />
        <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
          <Mesh />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto' }}>
            <Nav />

            <div style={{ padding: '60px 40px 40px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48 }}>
              <div>
                <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Support · live ops</Pill>
                <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 600, letterSpacing: -1.8, margin: '0 0 14px 0', lineHeight: 1.05 }}>
                  Talk to us.
                </h1>
                <p style={{ fontSize: 16, color: palette.textDim, lineHeight: 1.6, marginBottom: 24 }}>
                  Drop a ticket — humans + agents triage and reply within {avgResponseHours} hours on average. Billing and agent-failure tickets are usually answered same-day.
                </p>

                <div style={{ display: 'grid', gap: 10 }}>
                  <Channel icon="✉" label="Email" value={supportEmail} href={`mailto:${supportEmail}`} palette={palette} />
                  <Channel icon="◇" label="Docs" value="docs.hirespawn.io" href="/docs" palette={palette} />
                  <Channel icon="◈" label="Status" value="status.hirespawn.io" href="/status" palette={palette} />
                </div>

                <div style={{ marginTop: 28, padding: 18, background: 'var(--p-inset-soft)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>SLA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {[
                      { l: 'First response', v: `${avgResponseHours}h` },
                      { l: 'Critical (downtime)', v: '< 1h' },
                      { l: 'Billing', v: '< 4h' },
                    ].map(s => (
                      <div key={s.l}>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 0.5 }}>{s.l}</div>
                        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Glass style={{ padding: 28 }}>
                {flash?.status && recentlySuccessful && (
                  <div style={{ padding: '12px 14px', background: palette.accentDim, border: `1px solid ${palette.accent}`, color: palette.accent, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {flash.status}
                  </div>
                )}

                <form onSubmit={submit}>
                  <Row palette={palette} label="Your name" error={errors.name}>
                    <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Jane Doe" style={inputStyle(palette, errors.name)} />
                  </Row>
                  <Row palette={palette} label="Email" error={errors.email}>
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="jane@company.com" style={inputStyle(palette, errors.email, 'mono')} />
                  </Row>
                  <Row palette={palette} label="Subject" error={errors.subject}>
                    <input value={data.subject} onChange={e => setData('subject', e.target.value)} placeholder="Quick question about pricing" maxLength={200} style={inputStyle(palette, errors.subject)} />
                  </Row>
                  <Row palette={palette} label="Category" error={errors.category}>
                    <select value={data.category} onChange={e => setData('category', e.target.value)} style={inputStyle(palette, errors.category)}>
                      {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                  </Row>
                  <Row palette={palette} label="Message" error={errors.body}>
                    <textarea value={data.body} onChange={e => setData('body', e.target.value)} rows={7} maxLength={8000} placeholder="Tell us what's going on. Include any error messages, agent slugs, or invoice references that might help." style={{ ...inputStyle(palette, errors.body), resize: 'vertical', lineHeight: 1.55 }} />
                  </Row>

                  <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                    {processing ? 'Sending…' : 'Send ticket →'}
                  </button>
                  <div style={{ fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', marginTop: 12, textAlign: 'center' }}>
                    We never sell your email · GDPR + DPA on file
                  </div>
                </form>
              </Glass>
            </div>

            <Footer />
          </div>
        </div>
      </>
    );
  };

  const Channel = ({ icon, label, value, href, palette }) => (
    <a href={href} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 16px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 10, textDecoration: 'none', color: palette.text, transition: 'border-color 0.2s' }}>
      <span style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>{value}</div>
      </div>
      <span style={{ color: palette.textMute, fontSize: 14 }}>→</span>
    </a>
  );

  const Row = ({ palette, label, error, children }) => (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
      {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
    </label>
  );

  const inputStyle = (palette, error, font = 'sans') => ({
    width: '100%',
    padding: '11px 13px',
    background: 'var(--p-inset)',
    border: `1px solid ${error ? palette.red : palette.border}`,
    borderRadius: 8,
    color: palette.text,
    fontFamily: font === 'mono' ? 'Geist Mono, monospace' : 'inherit',
    fontSize: 13,
    outline: 'none',
  });

  return { Page };
})();

export default Support.Page;
