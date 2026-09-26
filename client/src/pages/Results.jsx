import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite, usePageTitle } from '../context/SiteContext';
import { cx } from '../lib/utils';
import { gradeBreakdown, gradeScale, gradeTone, ordinal } from '../lib/results';
import PageHeader from '../components/layout/PageHeader';
import Counter from '../components/Counter';
import ResponsiveTable from '../components/ResponsiveTable';
import { Avatar, EmptyState, Icon, Reveal } from '../components/ui';

/** KCSE mean scores are out of 12; anything larger is treated as a percentage. */
const scoreMax = (v) => (Number(v) > 12 ? 100 : 12);

/** Circular gauge showing the mean score, with the mean grade in the middle. */
function Gauge({ value, grade, light }) {
  const pct = Math.max(0, Math.min(1, (Number(value) || 0) / scoreMax(value)));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className={light ? 'stroke-white/15' : 'stroke-brand-100'} />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={c}
          className={light ? 'stroke-accent-400' : 'stroke-brand-600'}
          initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - pct) }} viewport={{ once: true }} transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cx('font-heading text-2xl sm:text-3xl font-extrabold leading-none', light ? 'text-white' : 'text-slate-900')}>{grade || '—'}</div>
          <div className={cx('mt-1 text-[0.6rem] uppercase tracking-widest', light ? 'text-white/60' : 'text-slate-400')}>Grade</div>
        </div>
      </div>
    </div>
  );
}

/** Headline figures for one exam year: a mean-score card beside a tidy grid of the other numbers. */
function YearFigures({ y, light }) {
  const tiles = [
    y.countyPosition && { icon: 'geo-alt', label: y.county ? `Position in ${y.county}` : 'County position', value: ordinal(y.countyPosition) },
    y.subCountyPosition && { icon: 'pin-map', label: 'Sub-county position', value: ordinal(y.subCountyPosition) },
    y.nationalPosition && { icon: 'flag', label: 'National position', value: ordinal(y.nationalPosition) },
    y.candidates && { icon: 'people', label: 'Candidates', count: Number(y.candidates) },
    y.universityQualifiers && {
      icon: 'mortarboard', label: 'University qualifiers', count: Number(y.universityQualifiers),
      sub: Number(y.candidates) ? `${Math.round((Number(y.universityQualifiers) / Number(y.candidates)) * 100)}% of candidates` : '',
    },
  ].filter(Boolean);
  const card = light ? 'bg-white/10 ring-1 ring-white/15 backdrop-blur-sm' : 'bg-white ring-1 ring-slate-200/80 shadow-sm';

  return (
    <div className={cx('grid gap-3', y.meanScore && tiles.length && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
      {y.meanScore && (
        <Reveal scale={0.95} y={0} className={cx('flex items-center gap-4 sm:gap-5 rounded-theme-lg p-4 sm:p-5 lg:flex-col lg:items-start lg:justify-center', card)}>
          <Gauge value={y.meanScore} grade={y.meanGrade} light={light} />
          <div className="min-w-0">
            <p className={cx('m-0 text-[0.7rem] font-semibold uppercase tracking-widest', light ? 'text-accent-300' : 'text-brand-700')}>Mean score</p>
            <p className={cx('m-0 font-heading text-4xl sm:text-5xl font-extrabold leading-none', light ? 'text-white' : 'text-slate-900')}>
              {y.meanScore}<span className={cx('ml-1 text-base font-semibold', light ? 'text-white/50' : 'text-slate-400')}>/ {scoreMax(y.meanScore)}</span>
            </p>
            {y.meanGrade && <p className={cx('m-0 mt-2 text-sm', light ? 'text-white/75' : 'text-slate-500')}>Mean grade <strong className={light ? 'text-white' : 'text-slate-800'}>{y.meanGrade}</strong></p>}
          </div>
        </Reveal>
      )}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t, k) => (
            <Reveal key={t.label} delay={k * 0.06} scale={0.95} y={0} className={cx(tiles.length % 2 === 1 && k === tiles.length - 1 && 'col-span-2')}>
              <div className={cx('group flex h-full flex-col rounded-theme-lg p-3.5 sm:p-4 transition-all duration-500 hover:-translate-y-0.5', card, !light && 'hover:shadow-soft hover:ring-brand-200')}>
                <div className="flex items-center gap-2">
                  <span className={cx('grid place-items-center h-8 w-8 shrink-0 rounded-lg text-sm transition-transform duration-500 group-hover:scale-110', light ? 'bg-white/10 text-accent-300' : 'bg-brand-50 text-brand-700')}>
                    <Icon name={t.icon} />
                  </span>
                  <p className={cx('m-0 text-[0.68rem] sm:text-xs font-medium uppercase tracking-wide leading-tight', light ? 'text-white/70' : 'text-slate-500')}>{t.label}</p>
                </div>
                <div className={cx('mt-2.5 font-heading text-2xl sm:text-3xl font-extrabold leading-none', light ? 'text-white' : 'text-slate-900')}>
                  {t.count ? <Counter value={t.count} /> : t.value}
                </div>
                {t.sub && <p className={cx('m-0 mt-1.5 text-xs font-semibold', light ? 'text-accent-300' : 'text-brand-700')}>{t.sub}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

const MEDALS = ['bg-accent-400 text-ink-900', 'bg-slate-200 text-slate-800', 'bg-orange-300 text-ink-900'];

function TopStudents({ students, light }) {
  if (!students?.length) return null;
  return (
    <ol className="m-0 grid list-none gap-2.5 p-0">
      {students.map((st, k) => (
        <Reveal as="li" key={k} delay={k * 0.08} x={24} y={0}>
          <div className={cx('group flex items-center gap-3 rounded-theme-lg p-2.5 pr-3.5 sm:p-3 sm:pr-5 transition-all duration-500', light ? 'bg-white/10 ring-1 ring-white/15 hover:bg-white/15' : 'bg-white ring-1 ring-slate-200/80 shadow-sm hover:shadow-soft')}>
            <div className="relative shrink-0">
              <Avatar src={st.photo} name={st.name} className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl" textClassName="text-sm" />
              <span className={cx('absolute -right-1.5 -top-1.5 grid place-items-center h-5 w-5 rounded-full text-[0.65rem] font-bold shadow', MEDALS[k] || 'bg-brand-100 text-brand-800')}>{k + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cx('m-0 font-bold leading-tight truncate', light ? 'text-white' : 'text-slate-900')}>{st.name}</p>
              {st.note && <p className={cx('m-0 mt-0.5 text-xs truncate', light ? 'text-white/65' : 'text-slate-500')}>{st.note}</p>}
            </div>
            <div className="shrink-0 text-right">
              <div className={cx('font-heading text-xl sm:text-2xl font-extrabold leading-none', light ? 'text-accent-300' : 'text-brand-700')}>{st.grade}</div>
              {st.points && <div className={cx('mt-0.5 text-[0.65rem] uppercase tracking-wider', light ? 'text-white/60' : 'text-slate-400')}>{st.points} pts</div>}
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

const BAR = { brand: 'bg-brand-600', accent: 'bg-accent-400', slate: 'bg-slate-400' };
const CHIP = { brand: 'bg-brand-50 text-brand-800 ring-brand-100', accent: 'bg-accent-50 text-accent-800 ring-accent-100', slate: 'bg-slate-100 text-slate-700 ring-slate-200' };

/** Grade distribution as horizontal bars; on wider screens two columns read top to bottom (A…C- left, D+…E right). */
function GradeChart({ breakdown, compact = false }) {
  const { rows } = breakdown;
  const half = Math.ceil(rows.length / 2);
  return (
    <div
      className={cx('grid gap-x-8', compact
        ? 'gap-y-1.5 sm:grid-flow-col sm:grid-cols-2 sm:[grid-template-rows:repeat(var(--rows),auto)]'
        : 'gap-y-2.5 md:grid-flow-col md:grid-cols-2 md:[grid-template-rows:repeat(var(--rows),auto)]')}
      style={{ '--rows': half }}
    >
      {rows.map((r, k) => {
        const tone = gradeTone(k, rows.length);
        return (
          <div key={r.grade} className="flex items-center gap-3">
            <span className={cx('grid place-items-center shrink-0 rounded-lg font-heading font-bold ring-1', compact ? 'h-6 w-9 text-xs' : 'h-8 w-11 text-sm', CHIP[tone])}>{r.grade}</span>
            <div className={cx('relative flex-1 overflow-hidden rounded-full bg-slate-100', compact ? 'h-2' : 'h-2.5')}>
              <motion.span
                className={cx('absolute inset-y-0 left-0 rounded-full', BAR[tone])}
                initial={{ width: 0 }} whileInView={{ width: `${r.bar}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: k * 0.04, ease: 'easeOut' }}
              />
            </div>
            <span className={cx('shrink-0 text-right tabular-nums', compact ? 'w-16 text-xs' : 'w-20 text-sm')}>
              <strong className="text-slate-800">{r.count}</strong>
              <span className="text-slate-400"> · {r.pct < 1 && r.count ? '<1' : Math.round(r.pct)}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Home page highlight: the most recent year on a deep brand band. */
export function ResultsHighlight() {
  const { content, fill } = useSite();
  const r = content.results ?? {};
  const y = r.years?.items?.[0];
  if (!r.intro?.enabled || !y) return null;
  return (
    <section className="section overflow-hidden bg-gradient-to-br from-ink-950 via-brand-900 to-brand-800">
      <div className="absolute inset-0 bg-grid-light opacity-60" />
      <div className="container relative">
        <div className="row g-5 align-items-center">
          <div className="col-lg-7">
            <Reveal>
              <span className="eyebrow !text-accent-300">{fill(r.intro.eyebrow)}</span>
              <h2 className="mt-3 text-[1.7rem] sm:text-3xl md:text-4xl font-extrabold !text-white leading-tight">{fill(r.intro.title)} {y.year}</h2>
              {(y.note || r.intro.subtitle) && <p className="mt-3 mb-6 text-white/75 max-w-2xl">{fill(y.note || r.intro.subtitle)}</p>}
            </Reveal>
            <YearFigures y={y} light />
          </div>
          <div className="col-lg-5">
            <Reveal delay={0.1}><h3 className="text-lg font-bold !text-white mb-3 flex items-center gap-2"><Icon name="trophy-fill" className="text-accent-400" />Top candidates</h3></Reveal>
            <TopStudents students={y.topStudents?.slice(0, 4)} light />
            <Reveal delay={0.3} className="mt-6"><Link to="/results" className="btn-accent">Full results <Icon name="arrow-right" /></Link></Reveal>
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
  const scale = gradeScale(r.intro?.gradeScale);
  const [sel, setSel] = useState(0);
  usePageTitle(fill('{exam} Results'));
  const y = years[sel];
  const breakdown = y && gradeBreakdown(y, scale);
  const exam = fill('{exam}');

  const pick = (k) => { setSel(k); document.getElementById('year-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const dash = (v) => (v === '' || v === undefined || v === null ? '—' : v);
  const columns = [
    { key: 'year', label: 'Year', priority: 1, render: (yr) => <span className="font-heading font-bold text-slate-900">{yr.year}</span> },
    { key: 'meanScore', label: 'Mean', priority: 1, render: (yr) => <span className="font-semibold tabular-nums">{dash(yr.meanScore)}</span> },
    { key: 'meanGrade', label: 'Grade', priority: 1, render: (yr) => (yr.meanGrade ? <span className="badge-soft inline-block min-w-[2.5rem] rounded-full px-2.5 py-1 text-center">{yr.meanGrade}</span> : '—') },
    { key: 'candidates', label: 'Candidates', priority: 2, render: (yr) => dash(yr.candidates) },
    { key: 'universityQualifiers', label: 'University', priority: 3, render: (yr) => dash(yr.universityQualifiers) },
    { key: 'countyPosition', label: 'County pos.', priority: 3, render: (yr) => (yr.countyPosition ? ordinal(yr.countyPosition) : '—') },
    { key: 'subCountyPosition', label: 'Sub-county pos.', priority: 4, render: (yr) => (yr.subCountyPosition ? ordinal(yr.subCountyPosition) : '—') },
    { key: 'nationalPosition', label: 'National pos.', priority: 5, render: (yr) => (yr.nationalPosition ? ordinal(yr.nationalPosition) : '—') },
    ...scale.slice(0, 3).map((g) => ({ key: `g-${g}`, label: g, priority: 5, align: 'center', render: (yr) => dash(yr.grades?.[g]) })),
  ].filter((c) => c.key === 'year' || years.some((yr) => (c.key.startsWith('g-') ? yr.grades?.[c.label] !== undefined && yr.grades?.[c.label] !== '' : yr[c.key])));

  return (
    <>
      <PageHeader pageKey="results" />
      <section className="section pt-10 sm:pt-12">
        <div className="container">
          {!years.length && <EmptyState icon="bar-chart" title="No results published yet" text="Results will appear here once they are added." />}
          {y && (
            <>
              <div id="year-view" className="scroll-mt-28 -mx-4 mb-8 sm:mb-10 overflow-x-auto px-4 scrollbar-thin">
                <div className="mx-auto flex w-max rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200">
                  {years.map((yr, k) => (
                    <button key={k} onClick={() => setSel(k)} className={cx('relative whitespace-nowrap rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold transition-colors', sel === k ? 'text-white' : 'text-slate-600 hover:text-brand-700')}>
                      {sel === k && <motion.span layoutId="results-year" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                      <span className="relative">{exam} {yr.year}</span>
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={sel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
                  <div className="row g-4 g-lg-5">
                    <div className="col-lg-7">
                      <h2 className="text-2xl md:text-3xl font-extrabold">{exam} {y.year} at a glance</h2>
                      {y.note && <p className="text-slate-500">{fill(y.note)}</p>}
                      <div className="mt-5"><YearFigures y={y} /></div>
                    </div>
                    <div className="col-lg-5">
                      {y.topStudents?.length > 0 && <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Icon name="trophy-fill" className="text-accent-500" />Top candidates</h3>}
                      <TopStudents students={y.topStudents} />
                    </div>
                  </div>

                  {breakdown && (
                    <div className="mt-8 sm:mt-10 rounded-theme-lg bg-white p-4 sm:p-6 md:p-8 ring-1 ring-slate-200/80 shadow-sm">
                      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h3 className="m-0 text-lg sm:text-xl font-bold">Grade distribution</h3>
                          <p className="m-0 text-sm text-slate-500">{exam} {y.year} · {breakdown.total} candidates</p>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" />Top</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-400" />Middle</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Lower</span>
                        </div>
                      </div>
                      <GradeChart breakdown={breakdown} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {years.length > 1 && (
                <Reveal className="mt-12 sm:mt-16">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <h3 className="m-0 text-xl font-bold">Performance over the years</h3>
                    <p className="m-0 text-xs text-slate-500"><Icon name="hand-index" className="mr-1" />Tap a year for the full breakdown</p>
                  </div>
                  <ResponsiveTable
                    caption={`${exam} results by year`}
                    columns={columns}
                    rows={years}
                    activeKey={sel}
                    expand={(yr) => {
                      const k = years.indexOf(yr);
                      const b = gradeBreakdown(yr, scale);
                      return (
                        <div className="space-y-3">
                          {b && <GradeChart breakdown={b} compact />}
                          {k !== sel && <button type="button" onClick={() => pick(k)} className="btn-outline-brand !px-4 !py-1.5 text-sm">View {exam} {yr.year} in full <Icon name="arrow-up" /></button>}
                        </div>
                      );
                    }}
                  />
                </Reveal>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
