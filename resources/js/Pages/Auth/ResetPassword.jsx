import { Head, Link, useForm } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

export default function ResetPassword({ token, email }) {
    const { palette, Glass, Pill, Mesh, Logo } = DirA;

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const strength = scorePassword(data.password);

    return (
        <>
            <Head title="Set a new password" />
            <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
                <Mesh />

                <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                        <Link href={route('login')} style={{ fontSize: 13, color: palette.textDim, textDecoration: 'none' }}>Back to sign in →</Link>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
                            <Pill dot color={palette.accent} style={{ marginBottom: 18 }}>One-time reset</Pill>
                            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                                Pick a new<br/>passphrase.
                            </h1>
                            <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 28, lineHeight: 1.5 }}>
                                Use at least 8 characters. Mix in numbers and symbols for a stronger key. After saving, you'll be signed in automatically.
                            </p>

                            <FieldRow label="Work email" name="email" type="email" value={data.email} onChange={v => setData('email', v)} error={errors.email} placeholder="ops@yourcompany.com" autoComplete="username" />
                            <FieldRow label="New password" name="password" type="password" value={data.password} onChange={v => setData('password', v)} error={errors.password} placeholder="••••••••" autoFocus autoComplete="new-password" />

                            <div style={{ marginTop: -8, marginBottom: 14 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} style={{ height: 4, borderRadius: 2, background: i < strength.score ? strength.color : palette.border }} />
                                    ))}
                                </div>
                                <div style={{ fontSize: 11, color: palette.textMute, marginTop: 6, fontFamily: 'Geist Mono, monospace' }}>
                                    Strength: <span style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            </div>

                            <FieldRow label="Confirm password" name="password_confirmation" type="password" value={data.password_confirmation} onChange={v => setData('password_confirmation', v)} error={errors.password_confirmation} placeholder="••••••••" autoComplete="new-password" />

                            <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1, marginTop: 4 }}>
                                {processing ? 'Saving…' : 'Save & sign in →'}
                            </button>
                        </form>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <span>SOC 2 · GDPR · ISO 27001</span>
                        <span>v2.1 · gateway.hirespawn.io</span>
                    </div>
                </div>

                <ResetPreview strength={strength} />
            </div>
        </>
    );
}

function scorePassword(pw) {
    const palette = DirA.palette;
    if (!pw) return { score: 0, label: 'empty', color: palette.textMute };
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    const labels = ['weak', 'okay', 'good', 'strong'];
    const colors = [palette.red, '#f3b34a', '#7dd3ff', palette.accent];
    return { score: s, label: labels[Math.max(0, s - 1)] ?? 'weak', color: colors[Math.max(0, s - 1)] ?? palette.red };
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

function ResetPreview({ strength }) {
    const { palette, Glass } = DirA;
    return (
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 18, borderLeft: `1px solid ${palette.border}` }}>
            <Glass style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Passphrase checklist</div>
                    <span style={{ width: 8, height: 8, background: strength.color, borderRadius: 99 }} />
                </div>
                {[
                    { ok: strength.score >= 1, t: 'At least 8 characters' },
                    { ok: strength.score >= 2, t: '12+ characters (recommended)' },
                    { ok: strength.score >= 3, t: 'Mix of upper and lower case' },
                    { ok: strength.score >= 4, t: 'Digit + symbol included' },
                ].map((r, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontSize: 13 }}>
                        <span style={{ color: palette.text }}>{r.t}</span>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: r.ok ? palette.accent : palette.textMute }}>{r.ok ? 'done' : '—'}</span>
                    </div>
                ))}
            </Glass>

            <Glass style={{ padding: 22 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>What happens next</div>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55 }}>
                    Saving signs you back into the workspace and invalidates every prior session token. Active agent runs continue without interruption.
                </div>
            </Glass>

            <Glass style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Pro tip</div>
                <div style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55 }}>
                    A passphrase like <span style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace' }}>four-random-words-9!</span> beats <span style={{ color: palette.red, fontFamily: 'Geist Mono, monospace' }}>P@ssw0rd</span> by orders of magnitude in real attack scenarios.
                </div>
            </Glass>
        </div>
    );
}
