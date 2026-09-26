import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite, usePageTitle } from '../context/SiteContext';
import { cx } from '../lib/utils';
import { gradeBreakdown, gradeScale, ordinal } from '../lib/results';
import PageHeader from '../components/layout/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { Avatar, EmptyState, Icon, Reveal } from '../components/ui';

/** KCSE mean scores are out of 12; anything larger is treated as a percentage. */
const scoreMax = (v) => (Number(v) > 12 ? 100 : 12);
const has = (v) => v !== '' && v !== undefined && v !== null;
const pct = (n, total) => (total ? (n / total) * 100 : 0);
const fmtPct = (p, n) => (n && p < 1 ? '<1%' : `${p >= 10 || !p ? Math.round(p) : p.toFixed(1)}%`);

/** The year's key figures in one bordered strip, divided like a table row (2 → 4 → all columns as space allows). */
function SummaryStrip({ y, light = false }) {
  const uni = Number(y.universityQualifiers);
  const cand = Number(y.candidates);
  const items = [
    has(y.meanScore) && { label: 'Mean score', value: y.meanScore, unit: `/ ${scoreMax(y.meanScore)}` },
    has(y.meanGrade) && { label: 'Mean grade', value: y.meanGrade, strong: true },
    has(y.candidates) && { label: 'Candidates', value: cand.toLocaleString() },
    has(y.universityQualifiers) && { label: 'University entry', value: uni.toLocaleString(), sub: cand ? `${Math.round(pct(uni, cand))}% of candidates` : '' },
    has(y.countyPosition) && { label: y.county ? `Position in ${y.county}` : 'County position', value: ordinal(y.countyPosition) },
    has(y.subCountyPosition) && { label: 'Sub-county position', value: ordinal(y.subCountyPosition) },
    has(y.nationalPosition) && { label: 'National position', value: ordinal(y.nationalPosition) },
  ].filter(Boolean);
  if (!items.length) return null;
  // The home band sits in a narrower column, so it stays at three per row there.
  const cols = light ? '' : items.length >= 6 ? 'lg:grid-cols-6' : items.length === 5 ? 'lg:grid-cols-5' : items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <dl className={cx('m-0 grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-theme-lg ring-1', cols, light ? 'bg-white/15 ring-white/15' : 'bg-slate-200 ring-slate-200 shadow-sm')}>
      {items.map((it, k) => (
        <div key={it.label} className={cx('px-4 py-3.5 sm:px-5 sm:py-4', light ? 'bg-ink-950/40 backdrop-blur-sm' : 'bg-white', items.length % 2 === 1 && k === items.length - 1 && 'col-span-2 sm:col-span-1')}>
          <dt className={cx('text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-wider leading-tight', light ? 'text-white/60' : 'text-slate-500')}>{it.label}</dt>
          <dd className="m-0 mt-1.5 flex items-baseline gap-1">
            <span className={cx('font-heading text-2xl sm:text-[1.7rem] font-extrabold leading-none tabular-nums', it.strong ? (light ? 'text-accent-300' : 'text-brand-700') : light ? 'text-white' : 'text-slate-900')}>{it.value}</span>
            {it.unit && <span className={cx('text-xs font-semibold', light ? 'text-white/50' : 'text-slate-400')}>{it.unit}</span>}
          </dd>
          {it.sub && <p className={cx('m-0 mt-1 text-[0.7rem] font-medium', light ? 'text-accent-300' : 'text-brand-700')}>{it.sub}</p>}
        </div>
      ))}
    </dl>
  );
}

/**
 * Grade analysis for one year. Wide screens read it the way schools print it (grades across, counts below);
 * phones get the same numbers as a vertical table with a thin bar per grade.
 */
function GradeTable({ breakdown, exam, year }) {
  const { rows, total } = breakdown;
  const top = Math.max(...rows.map((r) => r.count));
  return (
    <div className="overflow-hidden rounded-theme-lg bg-white ring-1 ring-slate-200 shadow-sm">
      {/* md and up: grades across */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm tabular-nums">
          <caption className="sr-only">{exam} {year} grade analysis</caption>
          <thead>
            <tr className="bg-brand-700 text-white">
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Grade</th>
              {rows.map((r) => <th key={r.grade} scope="col" className="px-2 py-3 font-heading font-bold">{r.grade}</th>)}
              <th scope="col" className="bg-brand-800 px-3 py-3 text-xs font-semibold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <th scope="row" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Candidates</th>
              {rows.map((r) => (
                <td key={r.grade} className={cx('px-2 py-3 font-semibold', r.count ? 'text-slate-900' : 'text-slate-300', r.count === top && top > 0 && 'bg-brand-50 text-brand-800')}>{r.count}</td>
              ))}
              <td className="bg-slate-50 px-3 py-3 font-bold text-slate-900">{total}</td>
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">% of total</th>
              {rows.map((r) => (
                <td key={r.grade} className={cx('px-2 py-3 text-xs', r.count ? 'text-slate-500' : 'text-slate-300', r.count === top && top > 0 && 'bg-brand-50 font-semibold text-brand-700')}>{fmtPct(r.pct, r.count)}</td>
              ))}
              <td className="bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-500">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* phones: grades down */}
      <table className="md:hidden w-full border-collapse text-sm tabular-nums">
        <caption className="sr-only">{exam} {year} grade analysis</caption>
        <thead>
          <tr className="bg-brand-700 text-left text-[0.7rem] uppercase tracking-wider text-white">
            <th scope="col" className="px-4 py-2.5 font-semibold">Grade</th>
            <th scope="col" className="px-2 py-2.5 text-right font-semibold">Candidates</th>
            <th scope="col" className="w-[42%] px-4 py-2.5 font-semibold">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.grade} className="border-t border-slate-100">
              <th scope="row" className="px-4 py-2 text-left font-heading font-bold text-slate-900">{r.grade}</th>
              <td className={cx('px-2 py-2 text-right font-semibold', r.count ? 'text-slate-900' : 'text-slate-300')}>{r.count}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${r.bar}%` }} />
                  </span>
                  <span className="w-9 text-right text-xs text-slate-500">{fmtPct(r.pct, r.count)}</span>
                </div>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <th scope="row" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
            <td className="px-2 py-2.5 text-right font-bold text-slate-900">{total}</td>
            <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const RANK = ['bg-accent-400 text-ink-900', 'bg-slate-200 text-slate-800', 'bg-orange-200 text-orange-900'];

/** Ranked list of candidates as a clean table: position, name (with photo if any), grade, points. */
function CandidatesTable({ students, light = false, showNotes = false }) {
  const withPoints = students.some((s) => has(s.points));
  return (
    <table className={cx('w-full border-collapse text-sm', light ? 'text-white' : '')}>
      <thead>
        <tr className={cx('text-left text-[0.68rem] uppercase tracking-wider', light ? 'text-white/55' : 'text-slate-500 bg-slate-50')}>
          <th scope="col" className="w-12 px-3 py-2.5 text-center font-semibold">Pos</th>
          <th scope="col" className="px-2 py-2.5 font-semibold">Name</th>
          <th scope="col" className="px-2 py-2.5 text-center font-semibold">Grade</th>
          {withPoints && <th scope="col" className="px-3 py-2.5 text-right font-semibold">Points</th>}
        </tr>
      </thead>
      <tbody>
        {students.map((st, k) => (
          <tr key={k} className={cx('border-t', light ? 'border-white/10' : 'border-slate-100')}>
            <td className="px-3 py-2.5 text-center">
              <span className={cx('inline-grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-bold', RANK[k] || (light ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-600'))}>{k + 1}</span>
            </td>
            <td className="px-2 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {st.photo && <Avatar src={st.photo} name={st.name} className="h-8 w-8 shrink-0 rounded-full" textClassName="text-[0.6rem]" />}
                <div className="min-w-0">
                  <p className={cx('m-0 font-semibold leading-tight', light ? 'text-white' : 'text-slate-900')}>{st.name}</p>
                  {showNotes && st.note && <p className={cx('m-0 mt-0.5 text-xs', light ? 'text-white/60' : 'text-slate-500')}>{st.note}</p>}
                </div>
              </div>
            </td>
            <td className="px-2 py-2.5 text-center">
              <span className={cx('inline-block min-w-[2.4rem] rounded-md px-2 py-0.5 font-heading font-bold', light ? 'bg-white/10 text-accent-300' : 'bg-brand-50 text-brand-800')}>{st.grade || '—'}</span>
            </td>
            {withPoints && <td className={cx('px-3 py-2.5 text-right tabular-nums', light ? 'text-white/80' : 'text-slate-600')}>{st.points || '—'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Full list of top candidates in a dialog. */
function CandidatesDialog({ open, onClose, title, students }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [open, onClose]);
  // Portal to <body>: the list sits inside animated (transformed) blocks, which would trap a fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[1060] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative flex max-h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-theme-lg bg-white text-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h3 className="m-0 flex items-center gap-2 text-base sm:text-lg font-bold"><Icon name="trophy-fill" className="text-accent-500" />{title}</h3>
              <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-600 hover:text-white" aria-label="Close"><Icon name="x-lg" /></button>
            </div>
            <div className="overflow-y-auto"><CandidatesTable students={students} showNotes /></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Top N candidates with a "View all" button when the admin listed more. */
function TopCandidates({ y, exam, limit, light = false }) {
  const [open, setOpen] = useState(false);
  const list = (y.topStudents ?? []).filter((s) => s.name);
  if (!list.length) return null;
  const more = list.length > limit;
  return (
    <>
      <div className={cx('overflow-hidden rounded-theme-lg ring-1', light ? 'bg-white/5 ring-white/15' : 'bg-white ring-slate-200 shadow-sm')}>
        <CandidatesTable students={list.slice(0, limit)} light={light} />
        {more && (
          <button type="button" onClick={() => setOpen(true)} className={cx('flex w-full items-center justify-center gap-2 border-t px-4 py-3 text-sm font-semibold transition', light ? 'border-white/10 text-accent-300 hover:bg-white/5' : 'border-slate-100 text-brand-700 hover:bg-brand-50')}>
            View all {list.length} top candidates <Icon name="arrow-right" />
          </button>
        )}
      </div>
      <CandidatesDialog open={open} onClose={() => setOpen(false)} title={`${exam} ${y.year} top candidates`} students={list} />
    </>
  );
}

const topLimit = (r) => Math.max(1, Number(r.intro?.topCount) || 5);

/** Home page highlight: the most recent year on a deep brand band. */
export function ResultsHighlight() {
  const { content, fill } = useSite();
  const r = content.results ?? {};
  const y = r.years?.items?.[0];
  if (!r.intro?.enabled || !y) return null;
  const exam = fill('{exam}');
  const hasTop = (y.topStudents ?? []).some((s) => s.name);
  return (
    <section className="section overflow-hidden bg-gradient-to-br from-ink-950 via-brand-900 to-brand-800">
      <div className="absolute inset-0 bg-grid-light opacity-60" />
      <div className="container relative">
        <div className="row g-4 g-lg-5 align-items-center">
          <div className={hasTop ? 'col-lg-7' : 'col-12'}>
            <Reveal>
              <span className="eyebrow !text-accent-300">{fill(r.intro.eyebrow)}</span>
              <h2 className="mt-3 text-[1.7rem] sm:text-3xl md:text-4xl font-extrabold !text-white leading-tight">{fill(r.intro.title)} {y.year}</h2>
              {(y.note || r.intro.subtitle) && <p className="mt-3 mb-6 text-white/75 max-w-2xl">{fill(y.note || r.intro.subtitle)}</p>}
            </Reveal>
            <Reveal delay={0.1}><SummaryStrip y={y} light /></Reveal>
            <Reveal delay={0.2} className="mt-6"><Link to="/results" className="btn-accent">Full results &amp; grade analysis <Icon name="arrow-right" /></Link></Reveal>
          </div>
          {hasTop && (
            <div className="col-lg-5">
              <Reveal delay={0.15}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold !text-white"><Icon name="trophy-fill" className="text-accent-400" />Top candidates</h3>
                <TopCandidates y={y} exam={exam} limit={topLimit(r)} light />
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Card({ title, sub, action, children, className }) {
  return (
    <Reveal className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="m-0 text-lg sm:text-xl font-bold">{title}</h3>
          {sub && <p className="m-0 mt-0.5 text-sm text-slate-500">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </Reveal>
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

  const dash = (v) => (has(v) ? v : <span className="text-slate-300">—</span>);
  const gradeUsed = (g) => years.some((yr) => has(yr.grades?.[g]));
  const columns = [
    { key: 'year', label: 'Year', priority: 1, render: (yr) => <span className="font-heading font-bold text-slate-900">{yr.year}</span> },
    { key: 'candidates', label: 'Entry', priority: 2, align: 'center', render: (yr) => dash(yr.candidates) },
    ...scale.filter(gradeUsed).map((g) => ({
      key: `g-${g}`, label: g, priority: 5, align: 'center', className: 'tabular-nums',
      render: (yr) => (has(yr.grades?.[g]) ? <span className={Number(yr.grades[g]) ? 'text-slate-800' : 'text-slate-300'}>{yr.grades[g]}</span> : dash()),
    })),
    { key: 'meanScore', label: 'Mean', priority: 1, align: 'center', render: (yr) => <span className="font-semibold tabular-nums">{dash(yr.meanScore)}</span> },
    { key: 'meanGrade', label: 'Grade', priority: 1, align: 'center', render: (yr) => (yr.meanGrade ? <span className="inline-block min-w-[2.4rem] rounded-md bg-brand-50 px-2 py-0.5 font-heading font-bold text-brand-800">{yr.meanGrade}</span> : dash()) },
    { key: 'universityQualifiers', label: 'University', priority: 3, align: 'center', render: (yr) => dash(yr.universityQualifiers) },
    { key: 'countyPosition', label: 'County pos.', priority: 4, align: 'center', render: (yr) => (has(yr.countyPosition) ? ordinal(yr.countyPosition) : dash()) },
  ].filter((c) => c.key === 'year' || c.key.startsWith('g-') || years.some((yr) => has(yr[c.key])));

  return (
    <>
      <PageHeader pageKey="results" />
      <section className="section pt-10 sm:pt-12">
        <div className="container">
          {!years.length && <EmptyState icon="bar-chart" title="No results published yet" text="Results will appear here once they are added." />}
          {y && (
            <>
              <div id="year-view" className="scroll-mt-28 -mx-4 mb-8 overflow-x-auto px-4 scrollbar-thin">
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
                <motion.div key={sel} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-10 sm:space-y-12">
                  <div>
                    <h2 className="m-0 text-2xl md:text-3xl font-extrabold">{exam} {y.year} summary</h2>
                    {y.note && <p className="m-0 mt-1.5 text-slate-500">{fill(y.note)}</p>}
                    <div className="mt-5"><SummaryStrip y={y} /></div>
                  </div>

                  {breakdown && (
                    <Card title="Grade analysis" sub={`Number of candidates per grade · ${exam} ${y.year}`}>
                      <GradeTable breakdown={breakdown} exam={exam} year={y.year} />
                    </Card>
                  )}

                  {(y.topStudents ?? []).some((s) => s.name) && (
                    <Card title="Top candidates" sub={`Best performers in ${exam} ${y.year}`} className="max-w-3xl">
                      <TopCandidates y={y} exam={exam} limit={topLimit(r)} />
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>

              {years.length > 1 && (
                <Card
                  className="mt-12 sm:mt-16"
                  title="Performance over the years"
                  sub={<><span className="xl:hidden">Tap a year to see its grade counts.</span><span className="hidden xl:inline">Grade counts, mean score and mean grade for every year.</span></>}
                >
                  <ResponsiveTable
                    caption={`${exam} results by year`}
                    columns={columns}
                    rows={years}
                    activeKey={sel}
                    compact
                    detailClassName="grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
                    expand={(yr) => {
                      const k = years.indexOf(yr);
                      return k === sel ? null : (
                        <button type="button" onClick={() => { setSel(k); document.getElementById('year-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="btn-outline-brand !px-4 !py-1.5 text-sm">
                          Open {exam} {yr.year} <Icon name="arrow-up" />
                        </button>
                      );
                    }}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
