import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite, usePageTitle } from '../context/SiteContext';
import { cx } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import Counter from '../components/Counter';
import { Avatar, EmptyState, Icon, Reveal, SectionHeading } from '../components/ui';

const ordinal = (v) => {
  const n = Number(v);
  if (!n) return v;
  const s = ['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10];
  return `${n}${s}`;
};

/** Headline numbers for one exam year. */
function YearFigures({ y, light }) {
  const tiles = [
    y.meanScore && { icon: 'graph-up-arrow', label: 'Mean score', value: y.meanScore, sub: y.meanGrade && `Mean grade ${y.meanGrade}` },
    y.countyPosition && { icon: 'geo-alt', label: y.county ? `Position in ${y.county}` : 'County position', value: ordinal(y.countyPosition) },
    y.subCountyPosition && { icon: 'pin-map', label: 'Sub-county position', value: ordinal(y.subCountyPosition) },
    y.nationalPosition && { icon: 'flag', label: 'National position', value: ordinal(y.nationalPosition) },
    y.candidates && { icon: 'people', label: 'Candidates', count: Number(y.candidates) },
    y.universityQualifiers && { icon: 'mortarboard', label: 'University qualifiers', count: Number(y.universityQualifiers) },
  ].filter(Boolean);
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {tiles.map((t, k) => (
        <Reveal key={t.label} delay={k * 0.07} scale={0.92} y={0}>
          <div className={cx('group h-full rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-500 hover:-translate-y-1', light ? 'bg-white/10 ring-1 ring-white/15 hover:bg-white/15' : 'bg-white ring-1 ring-slate-100 shadow-sm hover:shadow-lift')}>
            <Icon name={t.icon} className={cx('text-base sm:text-xl transition-transform duration-500 group-hover:scale-125', light ? 'text-accent-300' : 'text-brand-600')} />
            <div className={cx('mt-2 sm:mt-3 font-heading text-xl sm:text-3xl md:text-4xl font-extrabold leading-none', light ? 'text-white' : 'text-slate-900')}>
              {t.count ? <Counter value={t.count} /> : t.value}
            </div>
            <p className={cx('m-0 mt-1.5 sm:mt-2 text-[0.58rem] sm:text-xs uppercase tracking-wide sm:tracking-wider leading-tight', light ? 'text-white/70' : 'text-slate-500')}>{t.label}</p>
            {t.sub && <p className={cx('m-0 mt-1 text-[0.65rem] sm:text-sm font-semibold', light ? 'text-accent-300' : 'text-brand-700')}>{t.sub}</p>}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

const MEDALS = ['bg-accent-400 text-ink-900', 'bg-slate-200 text-slate-800', 'bg-orange-300 text-ink-900'];

function TopStudents({ students, light }) {
  if (!students?.length) return null;
  return (
    <div className="grid gap-3">
      {students.map((st, k) => (
        <Reveal key={k} delay={k * 0.1} x={30} y={0}>
          <div className={cx('group flex items-center gap-3 sm:gap-4 rounded-2xl p-2.5 pr-4 sm:p-3 sm:pr-5 transition-all duration-500', light ? 'bg-white/10 ring-1 ring-white/15 hover:bg-white/15' : 'bg-white ring-1 ring-slate-100 shadow-sm hover:shadow-soft')}>
            <div className="relative shrink-0">
              <Avatar src={st.photo} name={st.name} className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl" textClassName="text-base" />
              <span className={cx('absolute -right-2 -top-2 grid place-items-center h-6 w-6 rounded-full text-[0.7rem] font-bold shadow', MEDALS[k] || 'bg-brand-100 text-brand-800')}>{k + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cx('m-0 font-bold truncate', light ? 'text-white' : 'text-slate-900')}>{st.name}</p>
              {st.note && <p className={cx('m-0 text-xs truncate', light ? 'text-white/65' : 'text-slate-500')}>{st.note}</p>}
            </div>
            <div className="text-right">
              <div className={cx('font-heading text-2xl font-extrabold leading-none', light ? 'text-accent-300' : 'text-brand-700')}>{st.grade}</div>
              {st.points && <div className={cx('text-[0.7rem] uppercase tracking-wider', light ? 'text-white/60' : 'text-slate-400')}>{st.points} pts</div>}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** Home page highlight: the most recent year on a deep green band. */
export function ResultsHighlight() {
  const { content, fill } = useSite();
  const r = content.results ?? {};
  const y = r.years?.items?.[0];
  if (!r.intro?.enabled || !y) return null;
  return (
    <section className="section overflow-hidden bg-gradient-to-br from-ink-950 via-brand-900 to-brand-800">
      <div className="container relative">
        <div className="row g-5 align-items-center">
          <div className="col-lg-7">
            <SectionHeading eyebrow={r.intro.eyebrow} title={`${fill(r.intro.title)} ${y.year}`} subtitle={y.note || r.intro.subtitle} align="left" light className="!mb-8" />
            <YearFigures y={y} light />
          </div>
          <div className="col-lg-5">
            <Reveal delay={0.1}><h3 className="text-lg font-bold !text-white mb-4 flex items-center gap-2"><Icon name="trophy-fill" className="text-accent-400" />Top candidates</h3></Reveal>
            <TopStudents students={y.topStudents?.slice(0, 4)} light />
            <Reveal delay={0.3} className="mt-6"><Link to="/results" className="btn-accent">All results <Icon name="arrow-right" /></Link></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Results() {
  const { content, fill } = useSite();
  const r = content.results ?? {};
  const years = r.years?.items ?? [];
  const [sel, setSel] = useState(0);
  usePageTitle(fill(`{exam} Results`));
  const y = years[sel];

  return (
    <>
      <PageHeader pageKey="results" />
      <section className="section pt-12">
        <div className="container">
          {!years.length && <EmptyState icon="bar-chart" title="No results published yet" text="Results will appear here once they are added." />}
          {y && (
            <>
              <div className="flex justify-center mb-10">
                <div className="inline-flex flex-wrap justify-center rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200">
                  {years.map((yr, k) => (
                    <button key={k} onClick={() => setSel(k)} className={cx('relative rounded-full px-6 py-2.5 text-sm font-semibold transition-colors', sel === k ? 'text-white' : 'text-slate-600 hover:text-brand-700')}>
                      {sel === k && <motion.span layoutId="results-year" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                      <span className="relative">{fill('{exam}')} {yr.year}</span>
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={sel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
                  <div className="row g-5">
                    <div className="col-lg-7">
                      <h2 className="text-2xl md:text-3xl font-extrabold">{fill('{exam}')} {y.year} at a glance</h2>
                      {y.note && <p className="text-slate-500">{y.note}</p>}
                      <div className="mt-6"><YearFigures y={y} /></div>
                    </div>
                    <div className="col-lg-5">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Icon name="trophy-fill" className="text-accent-500" />Top candidates</h3>
                      <TopStudents students={y.topStudents} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {years.length > 1 && (
                <Reveal className="mt-16">
                  <h3 className="text-xl font-bold mb-4">Performance over the years</h3>
                  <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-100 shadow-sm">
                    <table className="table table-hover m-0 align-middle">
                      <thead className="table-light">
                        <tr><th>Year</th><th>Candidates</th><th>Mean score</th><th>Mean grade</th><th>County position</th><th>University qualifiers</th></tr>
                      </thead>
                      <tbody>
                        {years.map((yr, k) => (
                          <tr key={k} onClick={() => { setSel(k); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="cursor-pointer">
                            <td className="font-bold">{yr.year}</td><td>{yr.candidates || '—'}</td><td>{yr.meanScore || '—'}</td>
                            <td><span className="badge-soft rounded-full px-3 py-1">{yr.meanGrade || '—'}</span></td>
                            <td>{yr.countyPosition ? ordinal(yr.countyPosition) : '—'}</td><td>{yr.universityQualifiers || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Reveal>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
