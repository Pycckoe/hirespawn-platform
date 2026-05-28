import '@/setup';
import { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Buyer-side configure page: lists every variable the vendor declared
// for this agent (AgentSettingDef) and lets the buyer pick a value per
// row. Submits to SubscriptionSettingsController@update — values land
// on subscriptions.settings and feed system_prompt substitution.
const SubscriptionConfigure = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Page = () => {
    const { subscription, defs = [], values = {}, connections = [], routing = {} } = usePage().props;

    const initial = Object.fromEntries(
      defs.map(d => [d.key, values[d.key] ?? d.defaultValue ?? (d.type === 'boolean' ? false : '')])
    );
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
      values: initial,
      routing: routing || {},
    });

    const submit = (e) => {
      e.preventDefault();
      patch(route('subscriptions.configure.update', subscription.id), { preserveScroll: true });
    };

    const setVal = (k, v) => setData('values', { ...data.values, [k]: v });
    const setRouting = (provider, field, v) => setData('routing', {
      ...data.routing,
      [provider]: { ...(data.routing[provider] || {}), [field]: v },
    });

    const nothingToConfigure = defs.length === 0 && connections.length === 0;

    return (
      <>
        <Head title={`Configure · ${subscription.agentName}`} />
        <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
          <Mesh />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
                <span style={{ color: palette.textMute }}>/</span>
                <Link href={route('console')} style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Console</Link>
                <span style={{ color: palette.textMute }}>/</span>
                <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>Configure</span>
              </div>
              <ThemeToggle size={32} />
            </div>

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
              <Pill dot={palette.accent} style={{ marginBottom: 14 }}>{subscription.agentName} · status {subscription.status}</Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 40, fontWeight: 600, letterSpacing: -1.2, margin: '0 0 8px 0' }}>Configure {subscription.agentName}.</h1>
              <p style={{ fontSize: 15, color: palette.textDim, lineHeight: 1.55, marginBottom: 28 }}>
                Connect the services this agent needs + pick where it acts. Variable values feed the agent's system prompt on every run.
              </p>

              {nothingToConfigure ? (
                <Glass style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>◌</div>
                  <div style={{ fontSize: 14, color: palette.text, marginBottom: 4 }}>No setup needed</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginBottom: 16 }}>This agent runs without integrations or variables — just chat with it.</div>
                  <Link href={`/agent/${subscription.agentSlug}`} style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Open agent →</Link>
                </Glass>
              ) : (
                <form onSubmit={submit}>
                  {/* Connections — services the agent's skills require */}
                  {connections.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Connections · where this agent acts</div>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {connections.map(c => (
                          <ConnectionCard
                            key={c.provider}
                            palette={palette}
                            conn={c}
                            channel={data.routing[c.provider]?.channel ?? ''}
                            onChannel={(v) => setRouting(c.provider, 'channel', v)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vendor-declared variables */}
                  {defs.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Variables</div>
                      <Glass style={{ padding: 24 }}>
                        {defs.map(d => (
                          <DefField
                            key={d.key}
                            palette={palette}
                            def={d}
                            value={data.values[d.key]}
                            onChange={(v) => setVal(d.key, v)}
                            error={errors[`values.${d.key}`]}
                          />
                        ))}
                      </Glass>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                    {recentlySuccessful && <span style={{ fontSize: 12, color: palette.accent, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>✓ Saved</span>}
                    <Link href={route('console')} style={{ padding: '10px 18px', borderRadius: 8, background: 'transparent', color: palette.textDim, border: `1px solid ${palette.border}`, fontSize: 13, fontFamily: 'inherit', textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={processing} style={{ padding: '10px 20px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                      {processing ? 'Saving…' : 'Save configuration'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  // A single integration the agent needs. Shows connect status; for
  // Slack, an inline channel picker once connected.
  const ConnectionCard = ({ palette, conn, channel, onChannel }) => {
    const ready = conn.connected && !conn.expired;
    return (
      <Glass style={{ padding: 18, border: `1px solid ${ready ? palette.accentDim : palette.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: palette.accentDim, color: palette.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{conn.icon || conn.provider.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{conn.label}</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: ready ? palette.accent : palette.textMute, marginTop: 2 }}>
              {ready ? `✓ connected${conn.accountLabel ? ' · ' + conn.accountLabel : ''}` : conn.expired ? 'expired · reconnect' : 'not connected'}
            </div>
          </div>
          <a href={`/oauth/${conn.provider}/connect?return=${encodeURIComponent(window.location.pathname)}`} style={{ padding: '8px 14px', borderRadius: 8, background: ready ? 'transparent' : palette.accent, color: ready ? palette.textDim : palette.onAccent, border: ready ? `1px solid ${palette.border}` : 0, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none' }}>
            {ready ? 'Reconnect' : `Connect ${conn.label} →`}
          </a>
        </div>

        {/* Channel picker — only once Slack is connected */}
        {ready && conn.supportsChannelPicker && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Post to channel</div>
            <SlackChannelPicker
              palette={palette}
              value={channel}
              onChange={onChannel}
              inputStyle={{ width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
              isRequired={false}
            />
            <div style={{ fontSize: 11, color: palette.textMute, marginTop: 6 }}>The agent posts here when it has something to share. Public channels work out of the box; for private channels, add the app to the channel via Slack → channel → Integrations → Add app.</div>
          </div>
        )}
      </Glass>
    );
  };

  // One row in the configure form. Switches input based on def.type.
  // Live Slack channel dropdown — fetches the buyer's real channels
  // from /oauth/slack/channels (which calls Slack's conversations.list
  // with their stored token). Falls back to a "connect Slack" prompt
  // when they haven't authorised yet.
  const SlackChannelPicker = ({ palette, value, onChange, inputStyle, isRequired }) => {
    const [state, setState] = useState({ loading: true, connected: false, channels: [], error: null });

    useEffect(() => {
      let alive = true;
      fetch('/oauth/slack/channels', { headers: { Accept: 'application/json' } })
        .then(r => r.json())
        .then(d => { if (alive) setState({ loading: false, connected: !!d.connected, channels: d.channels || [], error: d.error || null }); })
        .catch(() => { if (alive) setState({ loading: false, connected: false, channels: [], error: 'request_failed' }); });
      return () => { alive = false; };
    }, []);

    if (state.loading) {
      return <div style={{ ...inputStyle, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>Loading channels…</div>;
    }

    if (!state.connected) {
      return (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,184,77,0.08)', border: `1px solid ${palette.amber}`, fontSize: 12, color: palette.amber, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>Slack not connected.</span>
          <a href={`/oauth/slack/connect?return=${encodeURIComponent(window.location.pathname)}`} style={{ color: palette.amber, fontWeight: 600, textDecoration: 'underline' }}>Connect Slack →</a>
        </div>
      );
    }

    // Slack returned an error — surface what it actually was so the
    // admin knows it's a scope problem, not a "missing channels" one.
    if (state.error) {
      const hint = {
        missing_scope: 'The Slack app is missing the channels:read scope. Add it in the Slack app + /admin/oauth-apps, then reconnect.',
        invalid_auth: 'Slack rejected the token. Reconnect Slack below.',
        account_inactive: 'The Slack token belongs to a deactivated account. Reconnect.',
      }[state.error] || `Slack error: ${state.error}.`;
      return (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,184,77,0.08)', border: `1px solid ${palette.amber}`, fontSize: 12, color: palette.amber }}>
          {hint}{' '}
          <a href={`/oauth/slack/connect?return=${encodeURIComponent(window.location.pathname)}`} style={{ color: palette.amber, fontWeight: 600, textDecoration: 'underline' }}>Reconnect →</a>
        </div>
      );
    }

    if (state.channels.length === 0) {
      return (
        <div style={{ ...inputStyle, color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
          No channels found in this workspace.
        </div>
      );
    }

    return (
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
        {!isRequired && <option value="">— none —</option>}
        {!value && isRequired && <option value="">— pick a channel —</option>}
        {state.channels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    );
  };

  const DefField = ({ palette, def, value, onChange, error }) => {
    const inputStyle = {
      width: '100%',
      padding: '10px 12px',
      background: 'var(--p-inset)',
      border: `1px solid ${error ? palette.red : palette.border}`,
      borderRadius: 8,
      color: palette.text,
      fontFamily: 'inherit',
      fontSize: 13,
      outline: 'none',
    };

    const render = () => {
      switch (def.type) {
        case 'textarea':
          return (
            <textarea
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          );
        case 'select':
          return (
            <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
              {!def.isRequired && <option value="">— none —</option>}
              {(def.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          );
        case 'slack_channel':
          return <SlackChannelPicker palette={palette} value={value} onChange={onChange} inputStyle={inputStyle} isRequired={def.isRequired} />;
        case 'number':
          return (
            <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace' }} />
          );
        case 'boolean':
          return (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!value}
                onChange={e => onChange(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: palette.accent, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: palette.textDim }}>{value ? 'On' : 'Off'}</span>
            </label>
          );
        default:
          return (
            <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
          );
      }
    };

    return (
      <div style={{ padding: '14px 0', borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <label style={{ fontSize: 13, color: palette.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {def.label}
            <code style={{ color: palette.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 10, padding: '1px 6px', background: 'var(--p-inset-soft)', borderRadius: 3 }}>{'{{'}{def.key}{'}}'}</code>
            {def.isRequired && <span style={{ color: palette.red, fontSize: 11 }}>·required</span>}
          </label>
        </div>
        {render()}
        {def.description && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 4 }}>{def.description}</div>}
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </div>
    );
  };

  return { Page };
})();

export default SubscriptionConfigure.Page;
