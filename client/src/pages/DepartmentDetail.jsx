import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useFetch from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import PageHeader from '../components/layout/PageHeader';
import { Avatar, ErrorState, Icon, Reveal, RichText, SmartImage } from '../components/ui';
import { StaffRow, useProfileModal } from '../components/people';

export default function DepartmentDetail() {
  const { slug } = useParams();
  const { page, fill } = useSite();
  const { data, loading, error, reload } = useFetch(`/public/departments/${slug}`);
  const { open, modal } = useProfileModal();
  const crumbs = [{ label: fill(page('departments').label || 'Departments'), to: '/departments' }];

  if (loading) return (<><PageHeader title="Loading…" subtitle="" crumbs={crumbs} /><div className="container section"><div className="skeleton h-96" /></div></>);
  if (error) return (<><PageHeader title="Department not found" subtitle="" crumbs={crumbs} /><div className="container section"><ErrorState error={error} onRetry={reload} /></div></>);

  const { department: d, head, members, others } = data;
  return (
    <>
      <PageHeader title={d.name} subtitle={d.summary} image={d.image || undefined} crumbs={crumbs} />
      <section className="section">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              <Reveal>
                <SmartImage src={d.image} alt={d.name} icon={d.icon} className="aspect-[16/8] rounded-theme-lg shadow-soft" />
              </Reveal>
              <Reveal delay={0.1} className="mt-8">
                <span className="eyebrow">About the department</span>
                <h2 className="mt-3 text-3xl font-extrabold">{d.name}</h2>
                <RichText text={d.description || d.summary} className="mt-4 text-[1.05rem]" />
              </Reveal>

              <div className="mt-10">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3"><Icon name="people-fill" className="text-brand-600" />Department Members <span className="rounded-full bg-brand-50 px-3 py-0.5 text-sm text-brand-700">{members.length}</span></h3>
                {members.length ? (
                  <div className="row g-3">
                    {members.map((m, k) => (
                      <Reveal key={m.id} delay={(k % 2) * 0.08} className="col-md-6"><StaffRow person={m} onOpen={open} /></Reveal>
                    ))}
                  </div>
                ) : <p className="text-slate-500">Members will be listed here soon.</p>}
              </div>
            </div>

            <aside className="col-lg-4">
              <div className="lg:sticky lg:top-28 space-y-6">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="overflow-hidden rounded-theme-lg bg-white shadow-lift ring-1 ring-slate-100">
                  <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 pt-6 pb-16 text-center text-white">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Head of Department</p>
                  </div>
                  <div className="-mt-12 px-6 pb-6 text-center">
                    <Avatar src={head?.photo} name={head?.name || '?'} className="mx-auto h-24 w-24 rounded-full ring-4 ring-white shadow-lg" textClassName="text-2xl" />
                    <h3 className="mt-4 text-xl font-bold">{head?.name || 'To be announced'}</h3>
                    {head && <p className="m-0 text-sm text-brand-700">{head.position}</p>}
                    {head?.qualifications && <p className="m-0 mt-2 text-xs text-slate-500">{head.qualifications}</p>}
                    {head && <button onClick={() => open(head)} className="btn-outline-brand !py-2 !px-5 mt-5 text-sm">View profile</button>}
                  </div>
                </motion.div>

                {others.length > 0 && (
                  <div className="rounded-theme-lg bg-slate-50 p-6 ring-1 ring-slate-100">
                    <h4 className="text-base font-bold mb-4">Other Departments</h4>
                    <div className="space-y-1">
                      {others.map((o) => (
                        <Link key={o.id} to={`/departments/${o.slug}`} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:text-brand-700 hover:shadow-sm transition">
                          <Icon name={o.icon} className="text-brand-600" />{o.name}
                          <Icon name="arrow-right" className="ml-auto opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
      {modal}
    </>
  );
}
