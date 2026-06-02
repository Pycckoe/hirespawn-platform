import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Sign in — split-screen design from Hirespawn's AuthPage, wired to
// Laravel Breeze's AuthenticatedSessionController via Inertia useForm.
export default function Login({ status, canResetPassword }) {
    const { palette, Glass, Pill, Mesh, Logo } = DirA;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign in" />
            <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
                <Mesh />

                {/* Left — form */}
                <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                        <Link href={route('register')} style={{ fontSize: 13, color: palette.textDim, textDecoration: 'none' }}>New here? Create account →</Link>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
                            <Pill dot color={palette.accent} style={{ marginBottom: 18 }}>Welcome back, operator</Pill>
                            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                                Resume<br/>operations.
                            </h1>
                            <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 28, lineHeight: 1.5 }}>
                                Power balance, agent fleet and runs sync as soon as you sign in.
                            </p>

                            {status && (
                                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(180,242,91,0.08)', border: `1px solid ${palette.accentDim}`, borderRadius: 10, fontSize: 13, color: palette.accent }}>
                                    {status}
                                </div>
                            )}

                            <FieldRow label="Work email" name="email" type="email" value={data.email} onChange={v => setData('email', v)} error={errors.email} placeholder="ops@yourcompany.com" autoFocus autoComplete="username" />
                            <FieldRow label="Password" name="password" type="password" value={data.password} onChange={v => setData('password', v)} error={errors.password} placeholder="••••••••" autoComplete="current-password" />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textDim }}>
                                    <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} style={{ accentColor: palette.accent }} />
                                    Remember me
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} style={{ fontSize: 12, color: palette.textMute, textDecoration: 'none' }}>Forgot password?</Link>
                                )}
                            </div>

                            <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                                {processing ? 'Signing in…' : 'Sign in →'}
                            </button>
                        </form>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <span>SOC 2 · GDPR · ISO 27001</span>
                        <span>v2.1 · gateway.hirespawn.io</span>
                    </div>
                </div>

                {/* Right — preview */}
                <AuthPreview />
            </div>
        </>
    );
}

function FieldRow({ label, name, type = 'text', value, onChange, error, placeholder, autoFocus, autoComplete }) {
    const { palette } = DirA;
    return (
        <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <input
                type={type}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                autoComplete={autoComplete}
                required
                style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
                onFocus={e => { if (!error) e.currentTarget.style.borderColor = palette.accent; }}
                onBlur={e => { if (!error) e.currentTarget.style.borderColor = palette.border; }}
            />
            {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
        </label>
    );
}

function AuthPreview() {
    const { palette, Glass } = DirA;
    return (
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 18, borderLeft: `1px solid ${palette.border}` }}>
            <Glass style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Live · last 60 minutes</div>
                    <span style={{ width: 8, height: 8, background: palette.accent, borderRadius: 99, boxShadow: `0 0 10px ${palette.accent}` }} />
                </div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 38, fontWeight: 500, color: palette.text, letterSpacing: -1 }}>4,184<span style={{ fontSize: 16, color: palette.textDim, marginLeft: 8 }}>tasks shipped</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(60, 1fr)', gap: 2, marginTop: 18, height: 56 }}>
                    {Array.from({ length: 60 }).map((_, i) => {
                        const h = 20 + Math.abs(Math.sin(i * 0.6)) * 36;
                        return <div key={i} style={{ height: h, alignSelf: 'end', background: i > 50 ? palette.accent : 'var(--p-track-fill)', borderRadius: 1 }} />;
                    })}
                </div>
            </Glass>

            <Glass style={{ padding: 22 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Recently spawned</div>
                {[
                    { t: 'Acme · AI SDR', s: '12s ago', p: '47⚡' },
                    { t: 'Kelvin Labs · AI Researcher', s: '38s ago', p: '124⚡' },
                    { t: 'Northwind · AI Closer', s: '1m ago', p: '89⚡' },
                    { t: 'Pivotal · AI QA', s: '2m ago', p: '23⚡' },
                    { t: 'Ironclad · AI Data Steward', s: '3m ago', p: '67⚡' },
                ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${palette.border}` : 0, fontSize: 13 }}>
                        <span style={{ color: palette.text }}>{r.t}</span>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textDim }}>{r.s} · <span style={{ color: palette.accent }}>{r.p}</span></span>
                    </div>
                ))}
            </Glass>

            <Glass style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
                    "We deployed 6 AI SDRs in a Friday afternoon. By Monday we'd booked 41 meetings. The platform just works."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)' }} />
                    <div>
                        <div style={{ fontSize: 13, color: palette.text }}>Maya Okonkwo</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>Head of Revenue · Northwind</div>
                    </div>
                </div>
            </Glass>
        </div>
    );
}
