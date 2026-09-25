import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { cx } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { Avatar, EmptyState, ErrorState, Icon, Reveal, SkeletonGrid, SmartImage } from '../components/ui';
import { StructureView } from './Structure';

function DepartmentGrid() {
  const { data, loading, error, reload } = useFetch('/public/departments', []);
  if (loading) return <SkeletonGrid className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState icon="building" title="No departments yet" text="Departments added in the CMS will appear here." />;

  return (
    <div className="row g-4">
      {data.map((d, k) => (
        <Reveal key={d.id} delay={(k % 3) * 0.1} className="col-md-6 col-lg-4">
          <Link to={`/departments/${d.slug}`} className="group flex h-full flex-col overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 card-lift">
            <div className="relative">
              <SmartImage src={d.image} alt={d.name} icon={d.icon} zoom className="aspect-[16/10]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <h3 className="m-0 text-xl font-bold !text-white">{d.name}</h3>
                <span className="grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-white/15 backdrop-blur text-white text-xl ring-1 ring-white/25 transition group-hover:bg-accent-400 group-hover:text-ink-900"><Icon name={d.icon} /></span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-sm text-slate-500 flex-1">{d.summary}</p>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-brand-50/70 p-3 ring-1 ring-brand-100">
                <Avatar src={d.head_photo} name={d.head_name || '?'} className="h-12 w-12 rounded-full ring-2 ring-white" textClassName="text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-700">Head of Department</p>
                  <p className="m-0 text-sm font-bold text-slate-800 truncate">{d.head_name || 'To be announced'}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap"><Icon name="people" className="mr-1" />{d.staff_count}</span>
              </div>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export default function Departments() {
  const { page, fill } = useSite();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('view') === 'structure' ? 'structure' : 'departments');
  const tabs = [
    { key: 'departments', label: fill(page('departments').label || 'Departments'), icon: 'grid-3x3-gap' },
    { key: 'structure', label: fill(page('structure').label || 'School Structure'), icon: 'diagram-3' },
  ];
  const choose = (k) => { setTab(k); setParams(k === 'structure' ? { view: 'structure' } : {}, { replace: true }); };

  return (
    <>
      <PageHeader pageKey="departments" />
      <section className="section pt-12">
        <div className="container">
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200" role="tablist">
              {tabs.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => choose(t.key)}
                  className={cx('relative rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold transition-colors', tab === t.key ? 'text-white' : 'text-slate-600 hover:text-brand-700')}>
                  {tab === t.key && <motion.span layoutId="dept-tab" className="absolute inset-0 rounded-full bg-brand-600 shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="relative flex items-center gap-2"><Icon name={t.icon} />{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              {tab === 'departments' ? <DepartmentGrid /> : <StructureView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
