import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { cx, groupByTier } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { Avatar, EmptyState, ErrorState, Icon, Reveal, RichText, SectionHeading, SkeletonGrid } from '../components/ui';
import { StaffCard, StaffRow, useProfileModal } from '../components/people';

function Spotlight({ person, label, onOpen }) {
  return (
    <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 text-white shadow-lift">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="relative row g-0 align-items-center">
        <div className="col-md-5 col-lg-4 p-6 md:p-8">
          <motion.div whileHover={{ rotate: -2, scale: 1.02 }} className="relative mx-auto max-w-[200px] sm:max-w-xs">
            <div className="absolute -inset-3 rounded-[1.75rem] border-2 border-dashed border-white/25" />
            <Avatar src={person.photo} name={person.name} className="relative aspect-[4/5] w-full rounded-3xl shadow-2xl" textClassName="text-7xl" />
          </motion.div>
        </div>
        <div className="col-md-7 col-lg-8 p-6 md:p-10 lg:pr-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-900"><Icon name="award-fill" />{label}</span>
          <h2 className="mt-4 !text-white text-2xl sm:text-3xl md:text-4xl font-extrabold">{person.name}</h2>
          <p className="text-accent-300 font-semibold">{person.position}</p>
          {person.qualifications && <p className="text-white/70 text-sm"><Icon name="mortarboard-fill" className="mr-2" />{person.qualifications}</p>}
          {person.bio && <RichText text={person.bio} className="mt-4 [&_p]:!text-white/80 line-clamp-5" />}
          <button onClick={() => onOpen(person)} className="btn-ghost-light mt-4 !py-2.5">Full profile <Icon name="arrow-right" /></button>
        </div>
      </div>
    </Reveal>
  );
}

export default function Staff() {
  const { tiers } = useSite();
  const { data, loading, error, reload } = useFetch('/public/staff', []);
  const { open, modal } = useProfileModal();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');

  const departments = useMemo(
    () => [...new Map(data.filter((s) => s.department_id).map((s) => [s.department_id, s.department_name])).entries()],
    [data]
  );
  const filtering = q.trim() || dept;
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((s) =>
      (!dept || String(s.department_id) === dept) &&
      (!term || [s.name, s.position, s.department_name].some((v) => v?.toLowerCase().includes(term))));
  }, [data, q, dept]);

  const groups = groupByTier(filtered, tiers.staff);
  const [first, ...rest] = groups;

  return (
    <>
      <PageHeader pageKey="staff" />
      <section className="section pt-12">
        <div className="container">
          <Reveal className="mb-12 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, role or department…" className="form-control !rounded-xl !pl-11 !py-3 !border-slate-200" aria-label="Search staff" />
            </div>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="form-select !rounded-xl !py-3 md:!w-72 !border-slate-200" aria-label="Filter by department">
              <option value="">All departments</option>
              {departments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <Link to="/structure" className="btn-brand !rounded-xl !py-3 whitespace-nowrap"><Icon name="diagram-3" />Hierarchy</Link>
          </Reveal>

          {loading && <SkeletonGrid count={6} className="h-96" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !groups.length && (
            <EmptyState icon="people" title={filtering ? 'No matches' : 'No staff yet'} text={filtering ? 'Try a different search or department.' : 'Staff added in the CMS will appear here.'} />
          )}

          {first && !filtering && first.items.length === 1 && (
            <div className="mb-16"><Spotlight person={first.items[0]} label={first.label} onOpen={open} /></div>
          )}

          {(first && !filtering && first.items.length === 1 ? rest : groups).map((g) => {
            const compact = g.items.length > 8;
            return (
              <div key={g.key} className="mb-16 last:mb-0">
                <SectionHeading eyebrow={`${g.items.length} ${g.items.length === 1 ? 'member' : 'members'}`} title={g.label} className="!mb-8" />
                <div className={cx('row', compact ? 'g-3' : 'g-4 justify-content-center')}>
                  {g.items.map((p, k) => (
                    <Reveal key={p.id} delay={(k % 4) * 0.07} className={compact ? 'col-md-6 col-xl-4' : 'col-6 col-lg-4 col-xl-3'}>
                      {compact ? <StaffRow person={p} onOpen={open} /> : <StaffCard person={p} onOpen={open} />}
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {modal}
    </>
  );
}
