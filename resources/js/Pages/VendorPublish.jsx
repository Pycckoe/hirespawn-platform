import '@/setup';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Vendor → Publish new agent (or edit existing). Single-page form that
// posts to VendorPublishController@store on create or PATCHes to
// @update on edit. On success the user lands back on /vendor with a
// flash toast.
const VendorPublish = (() => {
  const { palette, Glass, Pill, Mesh, Logo, ThemeToggle } = DirA;

  const KNOWN_LANGS = ['EN', 'RU', 'ES', 'DE', 'FR', 'JP', 'PT', 'IT', 'PL', 'NL', 'ANY'];
  const KNOWN_INTEGRATIONS = ['hubspot', 'salesforce', 'slack', 'gmail', 'github', 'gitlab', 'linear', 'notion', 'figma', 'jira', 'snowflake', 'stripe', 'zendesk', 'intercom'];

  const Page = () => {
    const { categories = [], ranks = [], defaults = {}, mode = 'create', agent = null, flash = {} } = usePage().props;
    const isEdit = mode === 'edit' && agent;

    const { data, setData, post, patch, processing, errors } = useForm({
      name: agent?.name ?? '',
      vendor: agent?.vendor ?? defaults.vendor ?? '',
      category: agent?.category ?? categories[0]?.slug ?? '',
      role: agent?.role ?? '',
      rank: agent?.rank ?? defaults.rank ?? 'E-6',
      tagline: agent?.tagline ?? '',
      description: agent?.description ?? '',
      powerCost: agent?.powerCost ?? 10,
      perUnit: agent?.perUnit ?? 'task',
      languages: agent?.languages ?? defaults.languages ?? ['EN'],
      integrations: agent?.integrations ?? defaults.integrations ?? [],
    });

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

                <Section title="Pricing" sub="Power per unit of work. Marketplace takes 30%.">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <NumberField label="Power per unit" value={data.powerCost} onChange={v => setData('powerCost', v)} error={errors.powerCost} suffix="⚡" min={1} max={1000} />
                    <Field label="Unit name" value={data.perUnit} onChange={v => setData('perUnit', v)} error={errors.perUnit} placeholder="lead / PR / ticket / asset pack" maxLength={60} />
                  </div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, marginTop: 12 }}>
                    At Pro rate: <span style={{ color: palette.text }}>≈ €{(Number(data.powerCost || 0) * 0.009).toFixed(3)}</span> per {data.perUnit || 'unit'} · seller earns <span style={{ color: palette.accent }}>€{(Number(data.powerCost || 0) * 0.009 * 0.7).toFixed(3)}</span> after platform fee
                  </div>
                </Section>

                <Section title="Reach" sub="Multi-select. Helps buyers filter the catalog.">
                  <ChipMultiSelect label="Languages" selected={data.languages} onToggle={(v) => toggleArrayValue('languages', v)} options={KNOWN_LANGS} error={errors.languages} />
                  <ChipMultiSelect label="Integrations" selected={data.integrations} onToggle={(v) => toggleArrayValue('integrations', v.toLowerCase())} options={KNOWN_INTEGRATIONS} error={errors.integrations} mono />
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

  const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.6, margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      <Glass style={{ padding: 24 }}>{children}</Glass>
    </div>
  );

  const Field = ({ label, value, onChange, error, placeholder, autoFocus, maxLength, hint }) => (
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

  const TextareaField = ({ label, value, onChange, error, placeholder, maxLength, rows = 4 }) => (
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

  const NumberField = ({ label, value, onChange, error, min, max, suffix }) => (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          style={{ flex: 1, padding: '12px 14px', background: 'var(--p-inset)', border: `1px solid ${error ? palette.red : palette.border}`, borderRadius: 10, color: palette.text, fontFamily: 'Geist Mono, monospace', fontSize: 14, outline: 'none' }}
        />
        {suffix && <span style={{ fontSize: 18, color: palette.accent }}>{suffix}</span>}
      </div>
      {error && <div style={{ fontSize: 11, color: palette.red, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{error}</div>}
    </label>
  );

  const SelectField = ({ label, value, onChange, error, options }) => (
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

  const ChipMultiSelect = ({ label, selected, onToggle, options, error, mono }) => (
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

  return { Page };
})();

export default VendorPublish.Page;
