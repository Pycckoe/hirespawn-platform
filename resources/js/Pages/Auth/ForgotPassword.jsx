import { Head, Link, useForm } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

export default function ForgotPassword({ status }) {
    const { palette, Glass, Pill, Mesh, Logo } = DirA;

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Recover access" />
            <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
                <Mesh />

                <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                        <Link href={route('login')} style={{ fontSize: 13, color: palette.textDim, textDecoration: 'none' }}>Back to sign in →</Link>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
                            <Pill dot color={palette.accent} style={{ marginBottom: 18 }}>Account recovery</Pill>
                            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                                Reset<br/>your key.
                            </h1>
                            <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 28, lineHeight: 1.5 }}>
                                Enter the email on your workspace. We'll send a one-time link to reset your password. Active agents keep running while you do this.
                            </p>

                            {status && (
                                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(180,242,91,0.08)', border: `1px solid ${palette.accentDim}`, borderRadius: 10, fontSize: 13, color: palette.accent }}>
                                    {status}
                                </div>
                            )}

                            <FieldRow label="Work email" name="email" type="email" value={data.email} onChange={v => setData('email', v)} error={errors.email} placeholder="ops@yourcompany.com" autoFocus autoComplete="username" />

                            <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1, marginTop: 4 }}>
                                {processing ? 'Sending…' : 'Email reset link →'}
                            </button>

                            <div style={{ marginTop: 18, fontSize: 12, color: palette.textMute, lineHeight: 1.55, fontFamily: 'Geist Mono, monospace' }}>
                                Links expire in 60 minutes. Power balance is never affected by sign-in flows.
                            </div>
                        </form>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <span>SOC 2 · GDPR · ISO 27001</span>
                        <span>v2.1 · gateway.hirespawn.io</span>
                    </div>
                </div>

                <RecoveryPreview />
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

function RecoveryPreview() {
    const { palette, Glass } = DirA;
    return (
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 18, borderLeft: `1px solid ${palette.border}` }}>
            <Glass style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Recovery steps</div>
                    <span style={{ width: 8, height: 8, background: palette.accent, borderRadius: 99, boxShadow: `0 0 10px ${palette.accent}` }} />
                </div>
                {[
                    { n: '01', t: 'Drop your email', s: 'We match it against your workspace.' },
                    { n: '02', t: 'Check inbox', s: 'A signed link arrives within 30 seconds.' },
                    { n: '03', t: 'Set new password', s: 'Min 8 chars. Confirm. Sign back in.' },
                    { n: '04', t: 'Agents resume', s: 'Subscriptions and balance are untouched.' },
                ].map((r, i, arr) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0 }}>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent, minWidth: 24 }}>{r.n}</div>
                        <div>
                            <div style={{ fontSize: 13, color: palette.text, marginBottom: 2 }}>{r.t}</div>
                            <div style={{ fontSize: 12, color: palette.textDim }}>{r.s}</div>
                        </div>
                    </div>
                ))}
            </Glass>

            <Glass style={{ padding: 22 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Need a hand?</div>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55 }}>
                    Email blocked? Reach <span style={{ color: palette.accent }}>recover@hirespawn.io</span> and a human will verify you within one business hour.
                </div>
            </Glass>

            <Glass style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
                    "I lost my laptop on a Friday and was running our SDR fleet from a hotel by Saturday morning. Recovery just worked."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg, #b4f25b, #7dd3ff)' }} />
                    <div>
                        <div style={{ fontSize: 13, color: palette.text }}>Devon Park</div>
                        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>RevOps · Pivotal</div>
                    </div>
                </div>
            </Glass>
        </div>
    );
}
