import { useState } from 'react';
import { useSite, usePageTitle } from '../context/SiteContext';
import { downloadUrl, zipUrl } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import Lightbox from '../components/Lightbox';
import { EmptyState, Icon, Reveal, SmartImage } from '../components/ui';

/** Fee structure documents (photos or scans) that parents can view full screen or download. */
export default function Fees() {
  const { content, fill } = useSite();
  const fees = content.fees ?? {};
  const intro = fees.intro ?? {};
  const docs = (fees.documents?.items ?? []).filter((d) => d.image);
  const [idx, setIdx] = useState(null);
  usePageTitle('Fee Structure');
  const payment = [
    intro.bank && { icon: 'bank', text: intro.bank },
    intro.mpesa && { icon: 'phone', text: intro.mpesa },
    intro.contact && { icon: 'telephone', text: intro.contact },
  ].filter(Boolean);

  return (
    <>
      <PageHeader pageKey="fees" />
      <section className="section pt-12">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              {docs.length > 1 && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-sm text-slate-500">Tap a fee structure to view it full screen, or download them all at once.</p>
                  <a href={zipUrl('/fees/download')} download className="btn-brand !py-2.5"><Icon name="file-earmark-zip" />Download all ({docs.length})</a>
                </div>
              )}
              {!docs.length && <EmptyState icon="file-earmark-text" title="Fee structures coming soon" text="The school office will publish the current fee structures here." />}
              <div className="row g-4">
                {docs.map((d, k) => (
                  <Reveal key={k} delay={(k % 2) * 0.1} className="col-md-6">
                    <div className="group h-full overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 card-lift">
                      <button type="button" onClick={() => setIdx(k)} className="relative block w-full" aria-label={`View ${d.title}`}>
                        <SmartImage src={d.image} alt={d.title} icon="file-earmark-text" zoom className="aspect-[3/4] bg-slate-50" imgClassName="!object-contain" />
                        <span className="absolute inset-0 grid place-items-center bg-brand-900/0 transition-colors duration-500 group-hover:bg-brand-900/40">
                          <span className="grid place-items-center h-14 w-14 rounded-full bg-white text-brand-700 text-xl opacity-0 scale-50 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100"><Icon name="zoom-in" /></span>
                        </span>
                      </button>
                      <div className="flex items-center gap-3 p-5">
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 text-lg font-bold truncate">{fill(d.title)}</h3>
                          {d.note && <p className="m-0 text-sm text-slate-500">{fill(d.note)}</p>}
                        </div>
                        <a href={downloadUrl(d.image, d.title)} download target="_blank" rel="noreferrer" className="grid place-items-center h-11 w-11 shrink-0 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white transition" aria-label={`Download ${d.title}`}>
                          <Icon name="download" />
                        </a>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="col-lg-4">
              <Reveal x={30} y={0} className="lg:sticky lg:top-28">
                <div className="rounded-theme-lg bg-gradient-to-br from-brand-700 to-ink-950 p-7 text-white shadow-lift">
                  {intro.eyebrow && <span className="eyebrow !text-accent-300">{fill(intro.eyebrow)}</span>}
                  <h2 className="mt-2 text-2xl font-extrabold !text-white">How to pay</h2>
                  {intro.text && <p className="text-white/80">{fill(intro.text)}</p>}
                  <ul className="m-0 mt-4 space-y-3 p-0 list-none">
                    {payment.map((p) => (
                      <li key={p.icon} className="flex gap-3 rounded-xl bg-white/10 p-3 text-sm"><Icon name={p.icon} className="text-accent-300 mt-0.5" /><span>{fill(p.text)}</span></li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
      <Lightbox images={docs.map((d) => ({ url: d.image, caption: fill(d.title) }))} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />
    </>
  );
}
