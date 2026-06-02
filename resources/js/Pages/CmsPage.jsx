import '@/setup';
import { Head, usePage } from '@inertiajs/react';
import { DirA } from '@/lib/dir-a';

// Renders any admin-edited markdown page at /p/{slug}. Body is pre-rendered
// to HTML server-side via Str::markdown() so we dangerously-set-inner-HTML
// the trusted output. Header/Footer come from the shared DirA chrome.
export default function CmsPage() {
  const { page } = usePage().props;
  const { palette, Glass, Mesh, Logo, Footer, ThemeToggle } = DirA;

  return (
    <>
      <Head>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
      </Head>
      <div style={{ background: palette.bg0, minHeight: '100vh', color: palette.text, fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <Mesh />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top bar */}
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a href="/" style={{ textDecoration: 'none' }}><Logo /></a>
            <ThemeToggle size={32} />
          </div>

          <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px' }}>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: palette.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              Last updated · {page.updatedAt}
            </div>
            <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 52, fontWeight: 600, letterSpacing: -1.6, margin: 0, lineHeight: 1.05, color: palette.text }}>
              {page.title}
            </h1>
            <Glass style={{ padding: 36, marginTop: 32 }}>
              <div
                className="cms-body"
                style={{ fontSize: 15, lineHeight: 1.7, color: palette.textDim }}
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            </Glass>
            <style>{`
              .cms-body h1, .cms-body h2, .cms-body h3 { color: ${palette.text}; font-family: Geist, sans-serif; font-weight: 600; letter-spacing: -0.5px; margin-top: 28px; margin-bottom: 12px; }
              .cms-body h2 { font-size: 24px; }
              .cms-body h3 { font-size: 18px; }
              .cms-body p { margin: 0 0 16px; }
              .cms-body a { color: ${palette.accent}; text-decoration: underline; }
              .cms-body ul, .cms-body ol { padding-left: 22px; margin: 0 0 16px; }
              .cms-body li { margin-bottom: 6px; }
              .cms-body code { font-family: 'Geist Mono', monospace; font-size: 13px; padding: 2px 6px; background: var(--p-inset); border-radius: 4px; }
              .cms-body pre { padding: 14px; background: var(--p-inset); border-radius: 8px; border: 1px solid ${palette.border}; overflow-x: auto; }
              .cms-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
              .cms-body th, .cms-body td { border: 1px solid ${palette.border}; padding: 8px 12px; text-align: left; font-size: 13px; }
              .cms-body th { background: var(--p-inset); font-weight: 600; color: ${palette.text}; }
              .cms-body blockquote { border-left: 3px solid ${palette.accent}; padding-left: 16px; margin: 16px 0; color: ${palette.textMute}; font-style: italic; }
            `}</style>
          </article>

          <Footer />
        </div>
      </div>
    </>
  );
}
