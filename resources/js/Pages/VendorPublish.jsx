import '@/setup';
import { useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Vendor → Publish new agent (or edit existing). Single-page form that
// posts to VendorPublishController@store on create or PATCHes to
// @update on edit. On success the user lands back on /vendor with a
// flash toast.
const VendorPublish = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const Page = () => {
    const {
      categories = [], ranks = [], defaults = {}, mode = 'create', agent = null,
      llmModels = [], credentialsByProvider = {}, economics = { eurCentsPerPower: 0.9, sellerSharePct: 70 },
      knownLanguages = [], knownIntegrationTags = [],
    } = usePage().props;
    const isEdit = mode === 'edit' && agent;

    const { data, setData, post, patch, processing, errors } = useForm({
      name: agent?.name ?? '',
      vendor: agent?.vendor ?? defaults.vendor ?? '',
      category: agent?.category ?? categories[0]?.slug ?? '',
      role: agent?.role ?? '',
      rank: agent?.rank ?? defaults.rank ?? 'E-6',
      tagline: agent?.tagline ?? '',
      description: agent?.description ?? '',
      systemPrompt: agent?.systemPrompt ?? defaults.systemPrompt ?? '',
      llmModelId: agent?.llmModelId ?? llmModels[0]?.id ?? null,
      estInputTokens: agent?.estInputTokens ?? defaults.estInputTokens ?? 800,
      estOutputTokens: agent?.estOutputTokens ?? defaults.estOutputTokens ?? 400,
      maxOutputTokens: agent?.maxOutputTokens ?? defaults.maxOutputTokens ?? null,
      powerCost: agent?.powerCost ?? 10,
      perUnit: agent?.perUnit ?? 'task',
      languages: agent?.languages ?? defaults.languages ?? ['EN'],
      integrations: agent?.integrations ?? defaults.integrations ?? [],
      skills: agent?.skills ?? [],
    });

    const oauthProviders = usePage().props.oauthProviders ?? [];

    const addSkill = () => setData('skills', [...data.skills, {
      name: '',
      label: '',
      description: '',
      transport: 'webhook',
      webhookUrl: '',
      requiredOauthProvider: oauthProviders[0]?.provider ?? '',
      parametersSchema: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
      timeoutSeconds: 30,
    }]);
    const updateSkill = (idx, patch) => setData('skills', data.skills.map((s, i) => i === idx ? { ...s, ...patch } : s));
    const removeSkill = (idx) => setData('skills', data.skills.filter((_, i) => i !== idx));

    const submit = (e) => {
      e.preventDefault();
      if (isEdit) {
        patch(route('vendor.publish.update', agent.slug));
      } else {
        post(route('vendor.publish.store'));
      }
    };

    const toggleArrayValue = (key, value) => {
      const next = data[key].includes(value)
        ? data[key].filter(v => v !== value)
        : [...data[key], value];
      setData(key, next);
    };

    const slug = isEdit ? agent.slug : ((data.name || 'new-agent').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-agent');

    // Live margin math. Everything in € so the seller can eyeball the
    // unit economics before clicking submit. providerCostCents comes
    // straight from the model's published rate × estimated tokens.
    const selectedModel = useMemo(
      () => llmModels.find(m => m.id === Number(data.llmModelId)) || null,
      [llmModels, data.llmModelId]
    );
    const credential = selectedModel ? credentialsByProvider[selectedModel.provider] : null;

    const economicsCalc = useMemo(() => {
      const inTok = Number(data.estInputTokens) || 0;
      const outTok = Number(data.estOutputTokens) || 0;
      const power = Number(data.powerCost) || 0;
      const eurPerPower = (economics.eurCentsPerPower || 0.9) / 100; // 0.009
      const sellerShare = (economics.sellerSharePct || 70) / 100;

      const buyerEur = power * eurPerPower;
      const sellerEur = buyerEur * sellerShare;
      const platformEur = buyerEur - sellerEur;

      const providerCostCents = selectedModel
        ? Math.ceil(
            (inTok * selectedModel.inputPriceCentsPer1m + outTok * selectedModel.outputPriceCentsPer1m) / 1_000_000
          )
        : 0;
      const providerCostEur = providerCostCents / 100;

      const marginEur = sellerEur - providerCostEur;
      const marginPct = sellerEur > 0 ? (marginEur / sellerEur) * 100 : 0;

      return {
        buyerEur, sellerEur, platformEur,
        providerCostEur, marginEur, marginPct,
        platformPct: 100 - (economics.sellerSharePct || 70),
        eurPerPower,
      };
    }, [data.estInputTokens, data.estOutputTokens, data.powerCost, selectedModel, economics]);

    return (
      <>
        <Head title={isEdit ? `Edit · ${agent.name}` : 'Publish agent'} />
        <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
          <Mesh />
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* TopBar */}
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href={route('home')} style={{ textDecoration: 'none' }}><Logo /></Link>
                <span style={{ color: palette.textMute }}>/</span>
                <Link href={route('vendor')} style={{ fontSize: 12, color: palette.textDim, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none' }}>Vendor</Link>
                <span style={{ color: palette.textMute }}>/</span>
                <span style={{ fontSize: 12, color: palette.text, fontFamily: 'Geist Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>{isEdit ? 'Edit listing' : 'Publish new'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <ThemeToggle size={32} />
              </div>
            </div>

            <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px 80px' }}>
              <Pill dot color={isEdit ? palette.cyan : palette.accent} style={{ marginBottom: 14 }}>
                {isEdit ? `Edit · status: ${agent.status}` : 'Roster · enlist a new agent'}
              </Pill>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 44, fontWeight: 600, letterSpacing: -1.4, margin: '0 0 8px 0' }}>
                {isEdit ? `Edit ${agent.name}.` : 'Publish an agent.'}
              </h1>
              <p style={{ color: palette.textDim, fontSize: 15, marginBottom: 36, lineHeight: 1.55 }}>
                {isEdit
                  ? <>Changes save immediately. The agent's slug <code style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace' }}>/agent/{slug}</code> stays fixed.</>
                  : <>New listings go into the admin review queue. Once approved you'll show up at <code style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace' }}>/agent/{slug}</code> and buyers can deploy you.</>
                }
              </p>

              <form onSubmit={submit}>
                <Section title="Identity" sub="The name buyers see in the roster and on agent cards.">
                  <Field label="Agent name" value={data.name} onChange={v => setData('name', v)} error={errors.name} placeholder="AI Brand Stylist" autoFocus maxLength={80} hint={`URL · /agent/${slug}`} />
                  <Field label="Vendor / studio" value={data.vendor} onChange={v => setData('vendor', v)} error={errors.vendor} placeholder="Acme AI" maxLength={80} />
                  <SelectField label="Category" value={data.category} onChange={v => setData('category', v)} error={errors.category}
                    options={categories.map(c => ({ value: c.slug, label: `${c.icon} ${c.label}` }))}
                  />
                  <SelectField label="Rank" value={data.rank} onChange={v => setData('rank', v)} error={errors.rank}
                    options={ranks.map(r => ({ value: r, label: r }))}
                  />
                  <Field label="Role" value={data.role} onChange={v => setData('role', v)} error={errors.role} placeholder="Brand design · Locale adaptation" maxLength={80} />
                </Section>

                <Section title="Specs" sub="One-line summary + the long description on /agent/{slug}.">
                  <Field label="One-line spec" value={data.tagline} onChange={v => setData('tagline', v)} error={errors.tagline} placeholder="6 mocks in Figma · brand-tight" maxLength={120} hint="Shown on the catalog card. Keep it punchy." />
                  <TextareaField label="Description" value={data.description} onChange={v => setData('description', v)} error={errors.description} placeholder="What does it do, how does it behave, what tools does it use, what's the failure mode…" maxLength={4000} rows={6} />
                </Section>

                <Section title="LLM model + system prompt" sub={<>Your agent runs on a real LLM call. Pick the model, drop your system prompt, give realistic token estimates so we can show your margin. Manage API keys at <Link href={route('vendor') + '?tab=credentials'} style={{ color: palette.accent, textDecoration: 'none' }}>Vendor → Credentials</Link>.</>}>
                  <LlmPicker
                    palette={palette}
                    models={llmModels}
                    value={data.llmModelId}
                    onChange={(id) => setData('llmModelId', id)}
                    credentialsByProvider={credentialsByProvider}
                    error={errors.llmModelId}
                  />

                  <TextareaField
                    label="System prompt"
                    value={data.systemPrompt}
                    onChange={v => setData('systemPrompt', v)}
                    error={errors.systemPrompt}
                    placeholder="You are a senior brand designer. Given a product brief…"
                    maxLength={8000}
                    rows={6}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <NumberField label="Est. input tokens / run" value={data.estInputTokens} onChange={v => setData('estInputTokens', v)} error={errors.estInputTokens} min={0} max={1000000} />
                    <NumberField label="Est. output tokens / run" value={data.estOutputTokens} onChange={v => setData('estOutputTokens', v)} error={errors.estOutputTokens} min={0} max={1000000} />
                    <NumberField label="Max output tokens (cap)" value={data.maxOutputTokens || ''} onChange={v => setData('maxOutputTokens', v ? Number(v) : null)} error={errors.maxOutputTokens} min={1} max={200000} placeholder="auto" />
                  </div>
                </Section>

                <Section title="Pricing" sub={`Power per unit of work. Marketplace takes ${economicsCalc.platformPct.toFixed(0)}% (admin-managed).`}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <NumberField label="Power per unit" value={data.powerCost} onChange={v => setData('powerCost', v)} error={errors.powerCost} suffix="⚡" min={1} max={10000} />
                    <Field label="Unit name" value={data.perUnit} onChange={v => setData('perUnit', v)} error={errors.perUnit} placeholder="lead / PR / ticket / asset pack" maxLength={60} />
                  </div>

                  <MarginPanel palette={palette} model={selectedModel} calc={economicsCalc} powerCost={data.powerCost} perUnit={data.perUnit} />
                </Section>

                <Section title="Skills (tools the LLM can call)" sub={<>Define functions the model can invoke during a run. Each skill becomes a tool the LLM sees — when it decides to call it, we POST a signed JSON payload to your <code style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace' }}>webhook_url</code>. Your service does the work, replies with JSON, and the model continues.{agent?.webhookSecret && <> The HMAC secret for this agent: <code style={{ color: palette.accent, fontFamily: 'Geist Mono, monospace', userSelect: 'all' }}>{agent.webhookSecret}</code></>}</>}>
                  {data.skills.length === 0 && (
                    <div style={{ padding: '18px 0 6px', fontSize: 13, color: palette.textDim, textAlign: 'center' }}>
                      No skills yet — the agent will only chat. Add one to let it take real actions.
                    </div>
                  )}
                  {data.skills.map((s, idx) => (
                    <SkillEditor
                      key={idx}
                      palette={palette}
                      skill={s}
                      oauthProviders={oauthProviders}
                      onChange={(patch) => updateSkill(idx, patch)}
                      onRemove={() => removeSkill(idx)}
                      errors={errors}
                      idx={idx}
                    />
                  ))}
                  <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <button type="button" onClick={addSkill} style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', color: palette.accent, border: `1px dashed ${palette.accent}`, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      + Add skill
                    </button>
                  </div>
                </Section>

                <Section title="Reach" sub="Multi-select. Helps buyers filter the catalog.">
                  <ChipMultiSelect label="Languages" selected={data.languages} onToggle={(v) => toggleArrayValue('languages', v)} options={knownLanguages} error={errors.languages} />
                  <ChipMultiSelect label="Integrations" selected={data.integrations} onToggle={(v) => toggleArrayValue('integrations', v.toLowerCase())} options={knownIntegrationTags} error={errors.integrations} mono />
                </Section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 14 }}>
                  <Link href={route('vendor')} style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 14, fontFamily: 'inherit', textDecoration: 'none' }}>
                    Cancel
                  </Link>
                  <button type="submit" disabled={processing} style={{ padding: '12px 28px', borderRadius: 10, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: processing ? 'wait' : 'pointer', opacity: processing ? 0.6 : 1 }}>
                    {processing ? (isEdit ? 'Saving…' : 'Submitting…') : (isEdit ? 'Save changes' : 'Submit for review →')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  };

  const LlmPicker = ({ palette, models, value, onChange, credentialsByProvider, error }) => {
    // Group models by provider so the dropdown reads like a tree.
    const groups = useMemo(() => {
      const out = {};
      models.forEach(m => {
        if (!out[m.provider]) out[m.provider] = [];
        out[m.provider].push(m);
      });
      return out;
    }, [models]);

    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>LLM model</div>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
        >
          <option value="">— pick a model —</option>
          {Object.entries(groups).map(([provider, list]) => (
            <optgroup key={provider} label={provider.toUpperCase()}>
              {list.map(m => {
                const has = credentialsByProvider[m.provider];
                return (
                  <option key={m.id} value={m.id}>
                    {has ? '✓' : '⚠'} {m.name} — in €{(m.inputPriceCentsPer1m / 100).toFixed(2)}/1M, out €{(m.outputPriceCentsPer1m / 100).toFixed(2)}/1M
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
        {value && (() => {
          const m = models.find(x => x.id === Number(value));
          if (!m) return null;
          const cred = credentialsByProvider[m.provider];
          return (
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: cred ? 'rgba(180,242,91,0.06)' : 'rgba(255,184,77,0.08)', border: `1px solid ${cred ? palette.accentDim : palette.amber}`, fontFamily: 'Geist Mono, monospace', fontSize: 11, color: cred ? palette.accent : palette.amber, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>
                {cred ? `✓ ${m.provider.toUpperCase()} key on file · ••••${cred.last4 || ''}` : `⚠ no ${m.provider.toUpperCase()} key — agent will fail invocations`}
              </span>
              <span style={{ color: palette.textDim }}>ctx {m.contextWindow >= 1000 ? `${Math.round(m.contextWindow / 1000)}k` : m.contextWindow} · max out {m.maxOutputTokens}</span>
            </div>
          );
        })()}
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </div>
    );
  };

  // Single skill row — collapsible card with all fields the LLM will see.
  const SkillEditor = ({ palette, skill, oauthProviders = [], onChange, onRemove, errors, idx }) => {
    const errPrefix = `skills.${idx}`;
    const err = (field) => errors[`${errPrefix}.${field}`];
    return (
      <div style={{ marginBottom: 14, padding: 16, background: 'var(--p-inset-soft)', border: `1px solid ${palette.border}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Skill #{idx + 1}</span>
          <button type="button" onClick={onRemove} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', color: palette.red, border: `1px solid ${palette.red}`, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>
            Remove
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field
            label="Name (snake_case)"
            value={skill.name}
            onChange={(v) => onChange({ name: v.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            placeholder="send_email"
            error={err('name')}
            hint="What the LLM uses to invoke this tool. Lowercase, underscores only."
            maxLength={60}
          />
          <Field
            label="Display label (optional)"
            value={skill.label}
            onChange={(v) => onChange({ label: v })}
            placeholder="Send email"
            error={err('label')}
            maxLength={120}
          />
        </div>

        <TextareaField
          label="Description (the LLM reads this verbatim)"
          value={skill.description}
          onChange={(v) => onChange({ description: v })}
          placeholder="Send a transactional email. Use when the user asks to email someone. The 'to' must be a valid address."
          error={err('description')}
          maxLength={2000}
          rows={3}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectField
            label="Transport"
            value={skill.transport}
            onChange={(v) => onChange({ transport: v })}
            error={err('transport')}
            options={[
              { value: 'webhook', label: 'Webhook (POST to your server)' },
              { value: 'oauth_proxy', label: 'OAuth proxy (we inject client\'s third-party token)' },
              { value: 'builtin', label: 'Built-in handler (coming soon)' },
            ]}
          />
          <NumberField
            label="Timeout (seconds)"
            value={skill.timeoutSeconds}
            onChange={(v) => onChange({ timeoutSeconds: v })}
            error={err('timeoutSeconds')}
            min={1}
            max={300}
          />
        </div>

        {(skill.transport === 'webhook' || skill.transport === 'oauth_proxy') && (
          <Field
            label="Webhook URL"
            value={skill.webhookUrl}
            onChange={(v) => onChange({ webhookUrl: v })}
            placeholder="https://api.your-domain.com/hirespawn/send_email"
            error={err('webhookUrl')}
            hint="We POST a signed JSON payload. Verify our HMAC header with the secret shown above the form."
            maxLength={500}
          />
        )}

        {skill.transport === 'oauth_proxy' && (
          oauthProviders.length === 0
            ? <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,184,77,0.08)', border: `1px solid ${palette.amber}`, fontSize: 11, fontFamily: 'Geist Mono, monospace', color: palette.amber, marginBottom: 12 }}>
                ⚠ No OAuth providers registered. Admin must add some at /admin/oauth-apps before oauth_proxy skills work.
              </div>
            : <SelectField
                label="Required OAuth provider"
                value={skill.requiredOauthProvider}
                onChange={(v) => onChange({ requiredOauthProvider: v })}
                error={err('requiredOauthProvider')}
                options={oauthProviders.map(p => ({ value: p.provider, label: `${p.icon ?? ''} ${p.label}`.trim() }))}
              />
        )}

        <TextareaField
          label="Parameters JSON Schema"
          value={skill.parametersSchema}
          onChange={(v) => onChange({ parametersSchema: v })}
          placeholder='{"type":"object","properties":{"to":{"type":"string"}},"required":["to"]}'
          error={err('parametersSchema')}
          rows={6}
        />
      </div>
    );
  };

  const MarginPanel = ({ palette, model, calc, powerCost, perUnit }) => {
    const profitable = calc.marginEur > 0;
    const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontFamily: 'Geist Mono, monospace', fontSize: 12 };
    return (
      <div style={{ marginTop: 16, padding: 18, borderRadius: 10, background: 'var(--p-inset-soft)', border: `1px solid ${profitable ? palette.accentDim : 'rgba(255,99,99,0.4)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>Unit economics · per {perUnit || 'unit'}</span>
          <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, color: profitable ? palette.accent : palette.red }}>
            {profitable ? '+' : ''}€{calc.marginEur.toFixed(4)}
            <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: palette.textMute, marginLeft: 6 }}>
              ({calc.marginPct.toFixed(1)}% margin)
            </span>
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 10 }}>
          <div style={{ ...rowStyle, color: palette.textDim }}>
            <span>Buyer pays</span>
            <span style={{ color: palette.text }}>{powerCost}⚡ → €{calc.buyerEur.toFixed(4)}</span>
          </div>
          <div style={{ ...rowStyle, color: palette.textDim }}>
            <span>Platform cut ({calc.platformPct.toFixed(0)}%)</span>
            <span style={{ color: palette.amber }}>−€{calc.platformEur.toFixed(4)}</span>
          </div>
          <div style={{ ...rowStyle, color: palette.textDim, borderTop: `1px dashed ${palette.border}`, marginTop: 4, paddingTop: 8 }}>
            <span>Your revenue</span>
            <span style={{ color: palette.text }}>€{calc.sellerEur.toFixed(4)}</span>
          </div>
          <div style={{ ...rowStyle, color: palette.textDim }}>
            <span>LLM cost {model ? `(${model.name})` : '(pick a model)'}</span>
            <span style={{ color: palette.red }}>−€{calc.providerCostEur.toFixed(4)}</span>
          </div>
          <div style={{ ...rowStyle, color: palette.text, fontWeight: 600, borderTop: `1px solid ${palette.border}`, marginTop: 6, paddingTop: 10 }}>
            <span>Your margin</span>
            <span style={{ color: profitable ? palette.accent : palette.red }}>{profitable ? '+' : ''}€{calc.marginEur.toFixed(4)}</span>
          </div>
        </div>

        {!profitable && model && (
          <div style={{ marginTop: 10, padding: 10, background: 'rgba(255,99,99,0.08)', borderRadius: 6, fontSize: 11, fontFamily: 'Geist Mono, monospace', color: palette.red }}>
            ⚠ You're losing money per run. Raise Power cost or pick a cheaper model.
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, sub, children }) => {
    const { palette, Glass } = DirA;
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0 }}>{title}</h3>
          {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        <Glass style={{ padding: 24 }}>{children}</Glass>
      </div>
    );
  };

  const Field = ({ label, value, onChange, error, placeholder, autoFocus, maxLength, hint }) => {
    const { palette } = DirA;
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
        />
        {hint && !error && <div style={{ fontSize: 11, color: palette.textMute, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{hint}</div>}
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </label>
    );
  };

  const TextareaField = ({ label, value, onChange, error, placeholder, maxLength, rows = 4 }) => {
    const { palette } = DirA;
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
        />
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </label>
    );
  };

  const NumberField = ({ label, value, onChange, error, min, max, suffix, placeholder }) => {
    const { palette } = DirA;
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number"
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            min={min}
            max={max}
            placeholder={placeholder}
            style={{ flex: 1, padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 14, outline: 'none' }}
          />
          {suffix && <span style={{ fontSize: 18, color: palette.accent }}>{suffix}</span>}
        </div>
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </label>
    );
  };

  const SelectField = ({ label, value, onChange, error, options }) => {
    const { palette } = DirA;
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </label>
    );
  };

  const ChipMultiSelect = ({ label, selected, onToggle, options, error, mono }) => {
    const { palette } = DirA;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label} · {selected.length} selected</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {options.map(opt => {
            const isOn = selected.map(s => s.toLowerCase()).includes(opt.toLowerCase());
            return (
              <button key={opt} type="button" onClick={() => onToggle(opt)} style={{
                padding: '6px 12px', borderRadius: 999,
                background: isOn ? palette.accentDim : 'transparent',
                border: `1px solid ${isOn ? palette.accent : palette.border}`,
                color: isOn ? palette.accent : palette.textDim,
                fontSize: 12, fontFamily: mono ? 'Geist Mono, monospace' : 'inherit',
                letterSpacing: mono ? 0.5 : 0, cursor: 'pointer',
              }}>
                {opt}
              </button>
            );
          })}
        </div>
        {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 6, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
      </div>
    );
  };

  return { Page };
})();

export default VendorPublish.Page;
