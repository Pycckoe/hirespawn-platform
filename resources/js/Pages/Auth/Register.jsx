import { Head, Link, useForm } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Sign up — split-screen design from Hirespawn's AuthPage, wired to
// Laravel Breeze's RegisteredUserController via Inertia useForm.
export default function Register() {
    const { palette, Glass, Pill, Mesh, Logo } = DirA;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Sign up" />
            <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
                <Mesh />

                {/* Left — form */}
                <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                        <Link href={route('login')} style={{ fontSize: 13, color: palette.textDim, textDecoration: 'none' }}>Have an account? Sign in →</Link>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
                            <Pill dot color={palette.accent} style={{ marginBottom: 18 }}>Enlist · Free Power on signup</Pill>
                            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                                Spawn your<br/>first agent.
                            </h1>
                            <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 28, lineHeight: 1.5 }}>
                                5,000⚡ free Power on activation. Deploy any agent in under 90 seconds.
                            </p>

                            <FieldRow label="Full name" name="name" value={data.name} onChange={v => setData('name', v)} error={errors.name} placeholder="Eva Romero" autoFocus />
                            <FieldRow label="Work email" name="email" type="email" value={data.email} onChange={v => setData('email', v)} error={errors.email} placeholder="ops@yourcompany.com" autoComplete="username" />
                            <FieldRow label="Password" name="password" type="password" value={data.password} onChange={v => setData('password', v)} error={errors.password} placeholder="••••••••" autoComplete="new-password" />
                            <FieldRow label="Confirm password" name="password_confirmation" type="password" value={data.password_confirmation} onChange={v => setData('password_confirmation', v)} error={errors.password_confirmation} placeholder="••••••••" autoComplete="new-password" />

                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textDim, marginBottom: 14 }}>
                                <input type="checkbox" defaultChecked required style={{ accentColor: palette.accent }} />
                                I agree to the <Link href={route('legal')} style={{ color: palette.text, textDecoration: 'none', marginLeft: 4 }}>Terms and Acceptable Use Policy</Link>
                            </label>

                            <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                                {processing ? 'Spawning…' : 'Enlist & claim 5,000⚡ →'}
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

Register.AuthPreview = AuthPreview;
Register.FieldRow = FieldRow;
