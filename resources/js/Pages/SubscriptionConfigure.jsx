import '@/setup';
import { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Buyer-side configure page: lists every variable the vendor declared
// for this agent (AgentSettingDef) and lets the buyer pick a value per
// row. Submits to SubscriptionSettingsController@update — values land
// on subscriptions.settings and feed system_prompt substitution.
const SubscriptionConfigure = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Page = () => {
    const { subscription, defs = [], values = {}, connections = [], routing = {}, acceptsKnowledge = false, knowledgeReady = false, knowledge = [], mcpConnections = [], mcpCatalog = [], github = { ready: false, connected: false, repos: [], selectedRepos: [] } } = usePage().props;

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

    // Knowledge + MCP are available to every deployment, so the page always
    // has something. nothingToConfigure only reflects vendor-declared fields.
    const nothingToConfigure = defs.length === 0 && connections.length === 0;
    const hasFormFields = connections.length > 0 || defs.length > 0 || github.ready;

    const toggleGithubRepo = (fullName) => {
      const current = data.routing?.github?.repos ?? [];
      const next = current.includes(fullName) ? current.filter(r => r !== fullName) : [...current, fullName];
      setData('routing', { ...data.routing, github: { ...(data.routing?.github || {}), repos: next } });
    };
    // MCP is available to every deployment — it enriches any agent with the
    // buyer's own tools, independent of what the vendor declared.

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

              {nothingToConfigure && (
                <Glass style={{ padding: 24, textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>◌</div>
                  <div style={{ fontSize: 14, color: palette.text, marginBottom: 4 }}>No vendor setup needed</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute }}>This agent runs without integrations or variables — just chat with it, or enrich it with MCP tools below.</div>
                </Glass>
              )}
              {(
                <>
                {hasFormFields && (
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

                  {github.ready && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>GitHub · repos this agent listens to</div>
                      <Glass style={{ padding: 24 }}>
                        {!github.connected ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>Install the Hirespawn GitHub App on the repos you want this agent to review / triage / answer in. After install you'll come back here to pick repos.</div>
                            <a href={route('github.install', { return: window.location.pathname })} style={{ padding: '10px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}>Install on GitHub →</a>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.accent }}>✓ installed on {github.accountLogin}</div>
                              <a href={route('github.install', { return: window.location.pathname })} style={{ fontSize: 12, color: palette.textDim, fontFamily: 'inherit', textDecoration: 'underline' }}>Manage repos on GitHub →</a>
                            </div>
                            {github.repos.length === 0 ? (
                              <div style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace' }}>No repos accessible. Grant access on GitHub and reload.</div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                                {github.repos.map(repo => {
                                  const selected = (data.routing?.github?.repos ?? []).includes(repo.full_name);
                                  return (
                                    <label key={repo.full_name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: selected ? palette.accentDim : 'var(--p-inset-soft)', border: `1px solid ${selected ? palette.accent : palette.border}`, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={selected} onChange={() => toggleGithubRepo(repo.full_name)} style={{ accentColor: palette.accent }} />
                                      <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.full_name}</span>
                                      {repo.private && <span style={{ fontSize: 9, color: palette.amber, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>priv</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: palette.textMute, marginTop: 10 }}>The agent will react to events in the selected repos: new issues (triage), new/updated PRs (review), and @-mentions in comments.</div>
                          </>
                        )}
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

                <KnowledgeSection palette={palette} subscriptionId={subscription.id} ready={knowledgeReady} items={knowledge} recommended={acceptsKnowledge} />

                <McpSection palette={palette} subscriptionId={subscription.id} items={mcpConnections} catalog={mcpCatalog} />
                </>
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
    const [state, setState] = useState({ loading: true, connected: false, channels: [], error: null, privateSupported: false });

    useEffect(() => {
      let alive = true;
      fetch('/oauth/slack/channels', { headers: { Accept: 'application/json' } })
        .then(r => r.json())
        .then(d => { if (alive) setState({ loading: false, connected: !!d.connected, channels: d.channels || [], error: d.error || null, privateSupported: !!d.private_supported }); })
        .catch(() => { if (alive) setState({ loading: false, connected: false, channels: [], error: 'request_failed', privateSupported: false }); });
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
      <>
        <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {!isRequired && <option value="">— none —</option>}
          {!value && isRequired && <option value="">— pick a channel —</option>}
          {state.channels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div style={{ fontSize: 11, color: palette.textMute, marginTop: 6 }}>
          {state.privateSupported
            ? 'Private channels appear only if the Slack bot has been invited to them (open the channel → type /invite @YourBot).'
            : 'Only public channels are listed. To include private channels, add the groups:read scope in the Slack app + /admin/oauth-apps, then reconnect.'}
        </div>
      </>
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

  // Knowledge base (RAG): buyer uploads files / pastes text the agent can
  // retrieve from at run time. Add + delete go through dedicated endpoints
  // (separate from the main configure form), ingested synchronously so the
  // status badge is accurate after the page reloads.
  const KnowledgeSection = ({ palette, subscriptionId, ready, items = [], recommended = false }) => {
    const [mode, setMode] = useState('text');
    const { data, setData, post, processing, errors, reset } = useForm({ kind: 'text', title: '', content: '', file: null });

    const pickMode = (m) => { setMode(m); setData('kind', m); };

    const submitAdd = (e) => {
      e.preventDefault();
      post(route('subscriptions.knowledge.store', subscriptionId), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => { reset(); setData('kind', mode); },
      });
    };

    const remove = (id) => {
      if (!window.confirm('Remove this from the knowledge base?')) return;
      router.delete(route('subscriptions.knowledge.destroy', [subscriptionId, id]), { preserveScroll: true });
    };

    const statusColor = (s) => s === 'ready' ? palette.accent : s === 'failed' ? palette.red : palette.amber;
    const statusBg = (s) => s === 'ready' ? palette.accentDim : s === 'failed' ? 'rgba(255,80,80,0.12)' : 'rgba(255,184,77,0.12)';

    const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' };
    const tabStyle = (on) => ({ padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? palette.accentDim : palette.border}`, background: on ? palette.accentDim : 'transparent', color: on ? palette.accent : palette.textDim, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' });

    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Knowledge base · what the agent knows about you</div>
          {recommended && <span style={{ padding: '2px 7px', borderRadius: 4, background: palette.accentDim, color: palette.accent, fontFamily: 'Geist Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>recommended</span>}
        </div>
        <Glass style={{ padding: 24 }}>
          {!ready && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,184,77,0.08)', border: `1px solid ${palette.amber}`, fontSize: 12, color: palette.amber, marginBottom: 16 }}>
              Knowledge indexing is temporarily unavailable. Your uploads will be saved but won't be searchable until it's back — please try again later.
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginBottom: 18 }}>No knowledge added yet. Upload docs or paste text below — the agent will pull the relevant parts into its answers.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
              {items.map(row => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: palette.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                      {row.sourceType === 'file' ? (row.filename || 'file') : 'text'}
                      {row.status === 'ready' && ` · ${row.chunkCount} chunks`}
                      {row.status === 'failed' && row.error && ` · ${row.error}`}
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 4, background: statusBg(row.status), color: statusColor(row.status), fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{row.status}</span>
                  <button type="button" onClick={() => remove(row.id)} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textDim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitAdd} style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" onClick={() => pickMode('text')} style={tabStyle(mode === 'text')}>Paste text</button>
              <button type="button" onClick={() => pickMode('file')} style={tabStyle(mode === 'file')}>Upload file</button>
            </div>
            <input type="text" placeholder="Title (e.g. Refund policy, Product FAQ)" value={data.title} onChange={e => setData('title', e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
            {errors.title && <div style={{ fontSize: 11, color: palette.red, marginBottom: 8, fontFamily: 'Geist Mono, monospace' }}>{errors.title}</div>}
            {mode === 'text' ? (
              <>
                <textarea rows={5} placeholder="Paste the knowledge text here…" value={data.content} onChange={e => setData('content', e.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                {errors.content && <div style={{ fontSize: 11, color: palette.red, marginTop: 6, fontFamily: 'Geist Mono, monospace' }}>{errors.content}</div>}
              </>
            ) : (
              <>
                <input type="file" accept=".txt,.md,.markdown,.csv,.json,.pdf" onChange={e => setData('file', e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: 8 }} />
                <div style={{ fontSize: 11, color: palette.textMute, marginTop: 6 }}>txt, md, csv, json, pdf · up to 5 MB. (PDF needs the server parser enabled.)</div>
                {errors.file && <div style={{ fontSize: 11, color: palette.red, marginTop: 6, fontFamily: 'Geist Mono, monospace' }}>{errors.file}</div>}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="submit" disabled={processing || !ready} style={{ padding: '9px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: (processing || !ready) ? 'not-allowed' : 'pointer', opacity: (processing || !ready) ? 0.5 : 1 }}>
                {processing ? 'Indexing…' : 'Add to knowledge'}
              </button>
            </div>
          </form>
        </Glass>
      </div>
    );
  };

  // MCP servers: the buyer connects remote MCP servers; their tools are
  // exposed to the agent at run time. Available to every deployment.
  const McpSection = ({ palette, subscriptionId, items = [], catalog = [] }) => {
    const [showAdd, setShowAdd] = useState(items.length === 0);
    const [testingId, setTestingId] = useState(null);
    const [hint, setHint] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ label: '', url: '', auth_type: 'none', token: '' });

    // Prefill the add form from a catalog entry (CRM / ticketing / finance…).
    const pickCatalog = (s) => {
      setData('label', s.name);
      setData('url', s.url || '');
      setData('auth_type', s.authType || 'bearer');
      setData('token', '');
      setHint(s.setupHint ? { text: s.setupHint, docs: s.docsUrl } : null);
      setShowAdd(true);
    };

    const submitAdd = (e) => {
      e.preventDefault();
      post(route('subscriptions.mcp.store', subscriptionId), {
        preserveScroll: true,
        onSuccess: () => { reset(); setShowAdd(false); setHint(null); },
      });
    };

    const test = (id) => router.post(route('subscriptions.mcp.test', [subscriptionId, id]), {}, {
      preserveScroll: true, onStart: () => setTestingId(id), onFinish: () => setTestingId(null),
    });
    const remove = (id) => {
      if (!window.confirm('Disconnect this MCP server?')) return;
      router.delete(route('subscriptions.mcp.destroy', [subscriptionId, id]), { preserveScroll: true });
    };

    const statusColor = (s) => s === 'ok' ? palette.accent : s === 'failed' ? palette.red : palette.amber;
    const statusBg = (s) => s === 'ok' ? palette.accentDim : s === 'failed' ? 'rgba(255,80,80,0.12)' : 'rgba(255,184,77,0.12)';
    const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--p-inset)', border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' };

    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>MCP servers · extra tools for the agent</div>
        <Glass style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: palette.textMute, marginBottom: 16, lineHeight: 1.5 }}>
            Connect remote MCP servers (Model Context Protocol) to give this agent extra tools — your own data, services, and actions. The agent can call them during a run. Only HTTP/remote MCP servers are supported.
          </div>

          {items.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
              {items.map(c => (
                <div key={c.id} style={{ padding: '12px 14px', background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: palette.text, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.url}{c.status === 'ok' && ` · ${c.toolCount} tools`}{c.status === 'failed' && c.statusMessage && ` · ${c.statusMessage}`}
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 4, background: statusBg(c.status), color: statusColor(c.status), fontFamily: 'Geist Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{c.status}</span>
                    <button type="button" disabled={testingId === c.id} onClick={() => test(c.id)} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.accent}`, color: palette.accent, fontSize: 12, cursor: testingId === c.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{testingId === c.id ? 'Testing…' : 'Test'}</button>
                    <button type="button" onClick={() => remove(c.id)} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textDim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                  </div>
                  {c.status === 'ok' && (c.tools || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {c.tools.map(t => <span key={t.name} title={t.description || ''} style={{ padding: '2px 7px', background: 'var(--p-chip)', color: palette.textDim, fontSize: 10, fontFamily: 'Geist Mono, monospace', borderRadius: 4 }}>{t.name}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {catalog.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Popular services · click to prefill</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {catalog.map(s => (
                  <button key={s.slug} type="button" onClick={() => pickCatalog(s)} title={s.summary || ''} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, cursor: 'pointer', color: palette.text, fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{s.icon || '◇'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: palette.textMute, fontFamily: 'Geist Mono, monospace', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAdd ? (
            <form onSubmit={submitAdd} style={{ borderTop: (items.length > 0 || catalog.length > 0) ? `1px solid ${palette.border}` : 0, paddingTop: (items.length > 0 || catalog.length > 0) ? 16 : 0 }}>
              {hint && (
                <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--p-inset)', border: `1px solid ${palette.border}`, fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
                  {hint.text}{hint.docs && <> · <a href={hint.docs} target="_blank" rel="noreferrer" style={{ color: palette.accent }}>docs ↗</a></>}
                </div>
              )}
              <input type="text" placeholder="Label (e.g. My Notion MCP)" value={data.label} onChange={e => setData('label', e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
              {errors.label && <div style={{ fontSize: 11, color: palette.red, marginBottom: 8, fontFamily: 'Geist Mono, monospace' }}>{errors.label}</div>}
              <input type="url" placeholder="https://your-mcp-server.example.com/mcp" value={data.url} onChange={e => setData('url', e.target.value)} style={{ ...inputStyle, marginBottom: 10, fontFamily: 'Geist Mono, monospace' }} />
              {errors.url && <div style={{ fontSize: 11, color: palette.red, marginBottom: 8, fontFamily: 'Geist Mono, monospace' }}>{errors.url}</div>}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <select value={data.auth_type} onChange={e => setData('auth_type', e.target.value)} style={{ ...inputStyle, flex: '0 0 160px' }}>
                  <option value="none">No auth</option>
                  <option value="bearer">Bearer token</option>
                </select>
                {data.auth_type === 'bearer' && (
                  <input type="password" placeholder="Token" value={data.token} onChange={e => setData('token', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {items.length > 0 && <button type="button" onClick={() => { reset(); setShowAdd(false); setHint(null); }} style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.border}`, color: palette.textDim, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>}
                <button type="submit" disabled={processing} style={{ padding: '9px 18px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.5 : 1 }}>{processing ? 'Connecting…' : 'Connect & test'}</button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setShowAdd(true)} style={{ padding: '9px 16px', borderRadius: 8, background: palette.accent, color: palette.onAccent, border: 0, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Add MCP server</button>
            </div>
          )}
        </Glass>
      </div>
    );
  };

  return { Page };
})();

export default SubscriptionConfigure.Page;
