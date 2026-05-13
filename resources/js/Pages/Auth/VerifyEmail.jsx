import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

export default function VerifyEmail({ status }) {
    const { palette, Glass, Pill, Mesh, Logo } = DirA;
    const user = usePage().props?.auth?.user;

    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const sent = status === 'verification-link-sent';

    return (
        <>
            <Head title="Verify your email" />
            <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
                <Mesh />

                <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                        <Link href={route('logout')} method="post" as="button" style={{ background: 'transparent', border: 0, fontSize: 13, color: palette.textDim, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</Link>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <form onSubmit={submit} style={{ width: '100%', maxWidth: 460 }}>
                            <Pill dot color={palette.accent} style={{ marginBottom: 18 }}>One step left</Pill>
                            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 42, fontWeight: 600, letterSpacing: -1.4, margin: 0, lineHeight: 1.05 }}>
                                Confirm<br/>your email.
                            </h1>
                            <p style={{ color: palette.textDim, fontSize: 15, marginTop: 12, marginBottom: 22, lineHeight: 1.5 }}>
                                We sent a verification link to {user?.email ? <span style={{ color: palette.text }}>{user.email}</span> : 'the email on file'}. Click it once to unlock spawning, billing, and the seller dashboard.
                            </p>

                            {sent && (
                                <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(180,242,91,0.08)', border: `1px solid ${palette.accentDim}`, borderRadius: 10, fontSize: 13, color: palette.accent }}>
                                    A fresh verification link is on its way. Check spam if it doesn't show in 30 seconds.
                                </div>
                            )}

                            <Glass style={{ padding: 18, marginBottom: 18 }}>
                                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>What's blocked until verified</div>
                                {[
                                    'Spawning new agents into the fleet',
                                    'Topping up power balance',
                                    'Publishing listings on the seller side',
                                    'Inviting workspace members',
                                ].map((t, i, arr) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontSize: 13, color: palette.textDim }}>
                                        <span style={{ width: 6, height: 6, borderRadius: 99, background: palette.textMute }} />
                                        {t}
                                    </div>
                                ))}
                            </Glass>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" disabled={processing} style={{ flex: 1, padding: '14px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                                    {processing ? 'Sending…' : 'Resend verification email →'}
                                </button>
                            </div>

                            <div style={{ marginTop: 16, fontSize: 12, color: palette.textMute, lineHeight: 1.55, fontFamily: 'Geist Mono, monospace' }}>
                                Wrong address? <Link href={route('logout')} method="post" as="button" style={{ background: 'transparent', border: 0, color: palette.accent, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Sign out</Link> and register again.
                            </div>
                        </form>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: palette.textMute, fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <span>SOC 2 · GDPR · ISO 27001</span>
                        <span>v2.1 · gateway.hirespawn.io</span>
                    </div>
                </div>

                <VerifyPreview email={user?.email} />
            </div>
        </>
    );
}

function VerifyPreview({ email }) {
    const { palette, Glass } = DirA;
    return (
        <div style={{ position: 'relative', zIndex: 2, padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 18, borderLeft: `1px solid ${palette.border}` }}>
            <Glass style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: '#ff5f57' }} />
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: '#febc2e' }} />
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: '#28c840' }} />
                    </div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Inbox preview</div>
                </div>
                <div style={{ padding: 22 }}>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginBottom: 4 }}>FROM</div>
                    <div style={{ fontSize: 13, color: palette.text, marginBottom: 12 }}>noreply@hirespawn.io</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginBottom: 4 }}>TO</div>
                    <div style={{ fontSize: 13, color: palette.text, marginBottom: 12 }}>{email ?? 'you@yourcompany.com'}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, marginBottom: 4 }}>SUBJECT</div>
                    <div style={{ fontSize: 14, color: palette.text, marginBottom: 18 }}>Confirm your Hirespawn account</div>

                    <div style={{ padding: 14, background: 'var(--p-inset)', borderRadius: 10, border: `1px dashed ${palette.border}`, fontSize: 13, color: palette.textDim, lineHeight: 1.55 }}>
                        Welcome to Hirespawn. Click the button below to confirm this email and unlock spawning, billing and seller tools for your workspace.
                        <div style={{ marginTop: 14, padding: '10px 16px', background: palette.accent, color: palette.onAccent, borderRadius: 8, display: 'inline-block', fontSize: 13, fontWeight: 600 }}>Confirm email →</div>
                    </div>
                </div>
            </Glass>

            <Glass style={{ padding: 22 }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Not seeing it?</div>
                {[
                    'Check the spam/promotions folder.',
                    'Allow noreply@hirespawn.io in your filters.',
                    'Wait 60 seconds, then resend.',
                    'Still stuck? Email recover@hirespawn.io.',
                ].map((t, i, arr) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.border}` : 0, fontSize: 13, color: palette.textDim }}>
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>{String(i + 1).padStart(2, '0')}</span>
                        {t}
                    </div>
                ))}
            </Glass>
        </div>
    );
}
