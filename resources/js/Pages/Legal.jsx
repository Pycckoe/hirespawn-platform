import '@/setup';
import { DirA } from '@/lib/dir-a';
import {
    AGENTS, CATEGORIES, OPS_FEED, POWER_PACKS, FAQS, INTEGRATIONS,
    useCountUp, useLiveFeed, useTheme, fmt, fmtCurrency,
} from '@/lib/shared';

// Legal — Terms / Privacy / DPA / Acceptable use
const Legal = (() => {
  const { palette, Glass, Pill, Mesh, Nav, Footer } = DirA;

  const DOCS = {
    terms: {
      title: 'Terms of Service',
      eff: 'Effective May 01, 2026 · v3.1',
      sections: [
        { h: '1. Acceptance',           p: 'By signing in to Hirespawn ("the Service"), you agree to these Terms. If you accept on behalf of a company, you confirm authority to bind that company.' },
        { h: '2. The Marketplace',      p: 'Hirespawn operates a marketplace connecting agent operators ("Operators") with agent vendors ("Vendors"). We are not a party to transactions between Operators and Vendors, except as the payment processor and ledger of record.' },
        { h: '3. Power · the unit of value', p: 'Power (⚡) is a prepaid consumption credit. One ⚡ is consumed per declared unit of agent work. Power balances never expire. Refunds for unused Power are available within 14 days of purchase.' },
        { h: '4. Operator obligations', p: 'You are responsible for all agent runs initiated under your workspace API keys. You will not use the Service to violate law, infringe rights, or process data you are not authorized to process.' },
        { h: '5. Vendor obligations',   p: 'Vendors maintain accurate manifests, honor declared SLAs, and respond to disputes within 5 business days. SLA breaches refund as Power per the manifest.' },
        { h: '6. Fees',                 p: 'Hirespawn retains a 12% platform fee on Power burned, net of refunds. Vendors receive 88% of Power burn at the Power-to-EUR conversion rate at time of settlement.' },
        { h: '7. Intellectual property',p: 'You retain all rights in Operator content. Vendors retain all rights in their agent code and manifests. You grant Hirespawn a limited license to operate the Service.' },
        { h: '8. Limitation of liability', p: 'To the maximum extent permitted by law, Hirespawn\'s aggregate liability is limited to fees paid in the 12 months preceding the claim. Neither party is liable for indirect damages.' },
        { h: '9. Termination',          p: 'You may terminate any time. We may terminate for material breach with 30 days notice (immediate for security or legal cause). Remaining Power is refunded to the original payment method within 30 days.' },
        { h: '10. Governing law',       p: 'These Terms are governed by the laws of Germany. Disputes are resolved in the courts of Berlin, except where local consumer protection law provides otherwise.' },
      ],
    },
    privacy: {
      title: 'Privacy Notice',
      eff: 'Effective May 01, 2026 · GDPR + CCPA compliant',
      sections: [
        { h: '1. Who we are',            p: 'Hirespawn GmbH, Friedrichstraße 88, 10117 Berlin, Germany. Data Protection Officer reachable at dpo@hirespawn.io.' },
        { h: '2. What we collect',       p: 'Account data (email, name, workspace info), billing data (via Stripe — we never see card numbers), agent run metadata (timestamps, Power consumed, success/failure), and content you choose to send through the Service.' },
        { h: '3. Why we collect it',     p: 'To operate the marketplace, settle payments, prevent fraud, comply with law, and improve the Service. We never sell personal data. We never train models on your content.' },
        { h: '4. Lawful basis (GDPR)',   p: 'Contract performance for account and billing data. Legitimate interest for security and fraud prevention. Consent for optional analytics, withdrawable at any time.' },
        { h: '5. Data residency',        p: 'EU customers: data hosted in Frankfurt (eu-central-1). US customers: data hosted in Virginia (us-east-1). Data does not cross regions, including replicas.' },
        { h: '6. Retention',             p: 'Account data: lifetime of account + 7 years (tax law). Run logs: 90 days (Starter), 180 days (Pro), 365 days (Scale), custom (Fleet). Audit log: 7 years, immutable.' },
        { h: '7. Your rights',           p: 'Access, rectification, erasure, portability, restriction, objection, withdrawal of consent. Exercise at privacy@hirespawn.io. We respond within 30 days.' },
        { h: '8. Sub-processors',        p: 'AWS, Stripe, Cloudflare, HashiCorp Vault, Sentry, Postmark, Snyk, Bishop Fox. Full list and DPAs at /security.' },
        { h: '9. Cookies',               p: 'Strictly necessary cookies for authentication. Optional analytics cookies with consent (granular toggles in the banner). No advertising cookies, ever.' },
        { h: '10. Contact + complaints', p: 'privacy@hirespawn.io for any inquiry. You may also lodge a complaint with your local supervisory authority. In Germany: Berliner Beauftragte für Datenschutz.' },
      ],
    },
    dpa: {
      title: 'Data Processing Addendum',
      eff: 'v2.4 · auto-included for all paid plans',
      sections: [
        { h: '1. Scope',                 p: 'This DPA forms part of the Terms of Service where Hirespawn processes personal data on behalf of a Customer acting as Controller. It implements Article 28 GDPR.' },
        { h: '2. Roles',                 p: 'Customer is the Controller. Hirespawn is the Processor. Vendors are sub-Processors under this DPA for the scope of their agent\'s manifest.' },
        { h: '3. Instructions',          p: 'Hirespawn processes personal data only on documented instructions from Customer, including with regard to international transfers.' },
        { h: '4. Confidentiality',       p: 'Personnel authorized to process personal data are bound by confidentiality obligations and receive annual privacy training.' },
        { h: '5. Security measures',     p: 'Technical and organizational measures per Annex II — encryption at rest and in transit, sandboxed execution, audit logging, access controls, incident response. See /security.' },
        { h: '6. Sub-processors',        p: 'Customer authorizes the sub-processors at /security. Hirespawn provides 30 days notice of any addition or replacement. Customer may object on reasonable grounds.' },
        { h: '7. Data subject rights',   p: 'Hirespawn assists Customer in fulfilling data subject requests via API endpoints documented at /docs/privacy. Response within 72h.' },
        { h: '8. Incident notification', p: 'Hirespawn notifies Customer of a personal data breach without undue delay, in any event within 72 hours of becoming aware.' },
        { h: '9. International transfers', p: 'EU-to-US transfers (where applicable) covered by Standard Contractual Clauses (2021/914) and supplementary measures per Schrems II guidance.' },
        { h: '10. Return / deletion',    p: 'On termination, Hirespawn returns or deletes personal data within 30 days, subject to legal retention requirements (tax law, audit log).' },
        { h: '11. Audit',                p: 'Customer may audit compliance annually, on 30 days notice, during business hours, at Customer expense. SOC 2 + ISO 27001 reports available under NDA in lieu.' },
      ],
    },
    aup: {
      title: 'Acceptable Use Policy',
      eff: 'v1.8 · binds Operators and Vendors',
      sections: [
        { h: 'No illegal use',       p: 'You may not use Hirespawn to violate any law, including but not limited to sanctions, export controls, anti-spam (CAN-SPAM, CASL, GDPR), or anti-fraud statutes.' },
        { h: 'No unauthorized access', p: 'You may not attempt to access systems or data you are not authorized to access. This includes other tenants\' data, vendor source code beyond what manifests expose, and platform infrastructure.' },
        { h: 'No abuse of agents',   p: 'You may not configure agents to harass, defraud, deceive, or harm individuals. You may not impersonate real persons or entities without authorization.' },
        { h: 'No high-volume spam',  p: 'Outbound email volume above 10,000/day requires prior approval. Sending lists must be opt-in with documented proof. Bounce rate must stay under 4%.' },
        { h: 'No financial advice / medical advice without license', p: 'Agents offering regulated advice (finance, medical, legal) must be operated by licensed professionals in the relevant jurisdiction.' },
        { h: 'No CSAM, no terrorism content', p: 'Zero tolerance. Reported to authorities. Workspace terminated immediately, no refund.' },
        { h: 'No platform abuse',    p: 'No DDoS, no resource exhaustion attempts, no manifest exploits, no review manipulation. Each carries permanent ban + bond forfeiture for vendors.' },
        { h: 'Reporting abuse',      p: 'Report violations to abuse@hirespawn.io. Average response 4h. We protect reporter identity.' },
      ],
    },
  };

  const Page = () => {
    const [tab, setTab] = React.useState('terms');
    const doc = DOCS[tab];

    return (
      <div style={{ minHeight: '100vh', background: palette.bg0, color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Nav />

          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 40px 100px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40 }}>
            {/* Sidebar */}
            <div style={{ position: 'sticky', top: 32, alignSelf: 'flex-start' }}>
              <Pill dot={palette.accent} style={{ marginBottom: 16 }}>Legal</Pill>
              <div style={{ display: 'grid', gap: 2 }}>
                {[
                  ['terms',   'Terms of Service'],
                  ['privacy', 'Privacy Notice'],
                  ['dpa',     'Data Processing Addendum'],
                  ['aup',     'Acceptable Use Policy'],
                ].map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: tab === k ? palette.accentDim : 'transparent', color: tab === k ? palette.accent : palette.textDim, border: 0, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: tab === k ? 600 : 400 }}>{l}</button>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 14, background: 'var(--p-inset)', borderRadius: 10, border: `1px solid ${palette.border}` }}>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Questions?</div>
                <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>legal@hirespawn.io<br/>dpo@hirespawn.io · GDPR<br/>privacy@hirespawn.io · CCPA</div>
              </div>
              <div style={{ marginTop: 14, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.textMute, letterSpacing: 0.5 }}>Available in: EN · DE · FR · ES · NL</div>
            </div>

            {/* Doc */}
            <article>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: palette.accent, letterSpacing: 1.5, textTransform: 'uppercase' }}>{doc.eff}</div>
              <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 600, letterSpacing: -1.8, margin: '12px 0 8px 0' }}>{doc.title}</h1>
              <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.55, margin: '0 0 28px 0' }}>Plain language wherever possible. Where law requires specific wording, we keep it but add a footnote. Download as PDF · sign as DOCX · all under MIT-compatible license for your own legal review.</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                <button style={{ padding: '8px 14px', borderRadius: 8, background: palette.accent, border: 0, color: palette.onAccent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Download PDF</button>
                <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Download DOCX</button>
                <button style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${palette.borderStrong}`, color: palette.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>View redlines</button>
              </div>

              {doc.sections.map((s, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, letterSpacing: -0.3, margin: '0 0 8px 0' }}>{s.h}</h2>
                  <p style={{ fontSize: 14, color: palette.textDim, lineHeight: 1.65, margin: 0 }}>{s.p}</p>
                </div>
              ))}
            </article>
          </div>

          <Footer />
        </div>
      </div>
    );
  };

  return { Page };
})();

export default Legal.Page;
