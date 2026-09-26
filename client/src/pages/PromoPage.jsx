import { useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { asset } from '../lib/api';
import { cx, formatDate } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { useCountdown } from '../components/Promo';
import { Icon, Reveal, RichText, SmartLink } from '../components/ui';
import NotFound from './NotFound';

/** "/Admissions 2027/" → "admissions-2027" so the admin can type the address loosely. */
export const promoSlug = (s) => String(s || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9/-]+/g, '-').replace(/-+/g, '-');

export function findPromoPage(content, path) {
  const want = promoSlug(path);
  return (content.promo?.pages?.items ?? []).find((pg) => pg.enabled !== false && pg.slug && promoSlug(pg.slug) === want);
}

function Countdown({ date, label }) {
  const { fill } = useSite();
  const parts = useCountdown(date);
  if (!parts) return null;
  return (
    <div>
      {label && <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-widest text-brand-700">{fill(label)}</p>}
      <div className="grid grid-cols-4 gap-2">
        {parts.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-brand-50 py-2.5 text-center ring-1 ring-brand-100">
            <div className="font-heading text-2xl font-extrabold tabular-nums leading-none text-brand-800">{String(v).padStart(2, '0')}</div>
            <div className="mt-1 text-[0.6rem] uppercase tracking-wider text-slate-500">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A ready-made promotion page (admissions, open day, fundraiser…) at an address the admin picks.
 * Every block is optional: anything left empty in Website Content → Promotions is simply not shown.
 */
export default function PromoPage() {
  const { content, fill } = useSite();
  const path = useParams()['*'];
  const pg = findPromoPage(content, path);
  if (!pg) return <NotFound />;

  const dates = (pg.dates ?? []).filter((d) => d.label);
  const requirements = String(pg.requirements || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const steps = (pg.steps ?? []).filter((st) => st.title);
  const highlights = (pg.highlights ?? []).filter((h) => h.title);
  const side = dates.length || pg.document || pg.deadline;

  return (
    <>
      <PageHeader title={fill(pg.title)} subtitle={fill(pg.subtitle)} image={pg.image || undefined} />

      {(pg.intro || side) && (
        <section className="section">
          <div className="container">
            <div className="row g-4 g-lg-5">
              {pg.intro && (
                <div className={side ? 'col-lg-7' : 'col-lg-9 mx-auto'}>
                  <Reveal>
                    {pg.badge && <span className="eyebrow">{fill(pg.badge)}</span>}
                    {pg.introTitle && <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">{fill(pg.introTitle)}</h2>}
                    <RichText text={fill(pg.intro)} className="mt-4 text-slate-600 leading-relaxed" />
                    {pg.buttonText && (
                      <SmartLink to={pg.buttonLink} className="btn-brand mt-6">{fill(pg.buttonText)}<Icon name="arrow-right" /></SmartLink>
                    )}
                  </Reveal>
                </div>
              )}
              {side && (
                <div className={pg.intro ? 'col-lg-5' : 'col-lg-6 mx-auto'}>
                  <Reveal delay={0.1} className="overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-200/80 lg:sticky lg:top-28">
                    {pg.deadline && (
                      <div className="border-b border-slate-100 p-5 sm:p-6"><Countdown date={pg.deadline} label={pg.deadlineLabel} /></div>
                    )}
                    {dates.length > 0 && (
                      <div className="p-5 sm:p-6">
                        <h3 className="m-0 mb-3 flex items-center gap-2 text-base font-bold"><Icon name="calendar-event" className="text-brand-600" />{fill(pg.datesTitle || 'Key dates')}</h3>
                        <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                          {dates.map((d) => (
                            <li key={d.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                              <span className="text-slate-600">{fill(d.label)}</span>
                              <span className="shrink-0 font-semibold text-slate-900">{d.date ? formatDate(d.date, { day: 'numeric', month: 'short', year: 'numeric' }) : 'To be announced'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pg.document && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
                        <a href={asset(pg.document)} target="_blank" rel="noreferrer" download={pg.documentName || true} className="group flex items-center gap-3 rounded-theme bg-white p-3 ring-1 ring-slate-200 transition hover:ring-brand-300">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-xl text-red-600"><Icon name="file-earmark-arrow-down-fill" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900 group-hover:text-brand-700">{fill(pg.documentLabel || 'Download document')}</span>
                            {pg.documentName && <span className="block truncate text-xs text-slate-400">{pg.documentName}</span>}
                          </span>
                          <Icon name="download" className="text-slate-400 group-hover:text-brand-700" />
                        </a>
                      </div>
                    )}
                  </Reveal>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="section bg-slate-50">
          <div className="container">
            <div className={cx('grid gap-4 sm:gap-5', highlights.length === 2 ? 'md:grid-cols-2' : highlights.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3')}>
              {highlights.map((h, k) => (
                <Reveal key={h.title} delay={k * 0.08} className="group flex gap-4 rounded-theme-lg bg-white p-5 ring-1 ring-slate-200/80 shadow-sm transition hover:-translate-y-1 hover:shadow-soft sm:block sm:p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white"><Icon name={h.icon || 'star'} /></span>
                  <div>
                    <h3 className="m-0 text-base sm:mt-4 sm:text-lg font-bold">{fill(h.title)}</h3>
                    {h.text && <p className="m-0 mt-1 text-sm text-slate-500">{fill(h.text)}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {(steps.length > 0 || requirements.length > 0) && (
        <section className="section">
          <div className="container">
            <div className="row g-4 g-lg-5">
              {steps.length > 0 && (
                <div className={requirements.length ? 'col-lg-7' : 'col-lg-8 mx-auto'}>
                  <Reveal><h2 className="text-2xl sm:text-3xl font-extrabold">{fill(pg.stepsTitle || 'How to apply')}</h2></Reveal>
                  <ol className="relative m-0 mt-6 list-none p-0">
                    {steps.map((st, k) => (
                      <Reveal as="li" key={k} delay={k * 0.08} className="relative flex gap-4 pb-6 last:pb-0">
                        {k < steps.length - 1 && <span className="absolute left-5 top-11 bottom-1 w-px bg-brand-200" />}
                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 font-heading font-bold text-white shadow-glow">{k + 1}</span>
                        <div className="pt-1.5">
                          <h3 className="m-0 text-base sm:text-lg font-bold">{fill(st.title)}</h3>
                          {st.text && <p className="m-0 mt-1 text-sm text-slate-500">{fill(st.text)}</p>}
                        </div>
                      </Reveal>
                    ))}
                  </ol>
                </div>
              )}
              {requirements.length > 0 && (
                <div className={steps.length ? 'col-lg-5' : 'col-lg-8 mx-auto'}>
                  <Reveal delay={0.1} className="rounded-theme-lg bg-brand-50/60 p-5 sm:p-7 ring-1 ring-brand-100">
                    <h3 className="m-0 mb-4 text-lg font-bold">{fill(pg.requirementsTitle || 'Requirements')}</h3>
                    <ul className="m-0 grid list-none gap-2.5 p-0">
                      {requirements.map((r) => (
                        <li key={r} className="flex gap-3 text-sm text-slate-700"><Icon name="check-circle-fill" className="mt-0.5 text-brand-600" />{fill(r)}</li>
                      ))}
                    </ul>
                  </Reveal>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {(pg.ctaTitle || pg.ctaText) && (
        <section className="pb-16 sm:pb-20">
          <div className="container">
            <Reveal scale={0.97} className="relative overflow-hidden rounded-theme-lg bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 p-7 text-center text-white shadow-lift sm:p-12">
              <div className="absolute inset-0 bg-grid-light opacity-60" />
              <div className="relative mx-auto max-w-2xl">
                {pg.ctaTitle && <h2 className="m-0 text-2xl sm:text-3xl font-extrabold !text-white">{fill(pg.ctaTitle)}</h2>}
                {pg.ctaText && <p className="m-0 mt-3 text-white/80">{fill(pg.ctaText)}</p>}
                {pg.buttonText && <SmartLink to={pg.buttonLink} className="btn-accent mt-6">{fill(pg.buttonText)}<Icon name="arrow-right" /></SmartLink>}
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
