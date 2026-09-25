import { useSite } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { groupByTier } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import OrgChart from '../components/OrgChart';
import { Avatar, EmptyState, ErrorState, Icon, Reveal } from '../components/ui';
import { useProfileModal } from '../components/people';

/** Leadership levels shown as a stepped ladder (used when no reporting lines are set). */
function TierLadder({ people, tiers, onOpen }) {
  const groups = groupByTier(people, tiers);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {groups.map((g, k) => (
        <Reveal key={g.key} delay={k * 0.08}>
          <div className="relative rounded-theme-lg bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm" style={{ marginInline: `${Math.min(k, 4) * 2}%` }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600 font-heading font-bold text-white">{k + 1}</span>
              <h3 className="m-0 text-lg font-bold">{g.label}</h3>
              <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{g.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {g.items.map((p) => (
                <button key={p.id} type="button" onClick={() => onOpen(p)} className="flex items-center gap-3 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-4 ring-1 ring-slate-200 hover:ring-brand-400 hover:bg-brand-50 transition">
                  <Avatar src={p.photo} name={p.name} className="h-9 w-9 rounded-full" textClassName="text-xs" />
                  <span className="text-left leading-tight">
                    <span className="block text-sm font-semibold text-slate-800">{p.name}</span>
                    <span className="block text-[0.7rem] text-brand-700">{p.position}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function StructureView() {
  const { tiers } = useSite();
  const { data, loading, error, reload } = useFetch('/public/staff', []);
  const { open, modal } = useProfileModal();

  if (loading) return <div className="skeleton h-96 max-w-4xl mx-auto" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState icon="diagram-3" title="Structure not set up yet" text="Add staff and their reporting lines in the CMS to build the hierarchy." />;

  const hasLines = data.some((p) => p.parent_id);
  return (
    <>
      {hasLines ? (
        <>
          <p className="text-center text-sm text-slate-500 mb-8">
            <Icon name="info-circle" className="text-brand-600 mr-1" />
            Tap a person to view their profile. Use the <span className="inline-grid place-items-center h-5 min-w-5 px-1 rounded-full bg-accent-400 text-[0.65rem] font-bold text-ink-900">n</span> badges to expand or collapse teams.
          </p>
          <OrgChart people={data} tiers={tiers.staff} onOpen={open} />
          <div className="mt-16">
            <h3 className="text-center text-2xl font-bold mb-8">Leadership Levels</h3>
            <TierLadder people={data} tiers={tiers.staff} onOpen={open} />
          </div>
        </>
      ) : (
        <TierLadder people={data} tiers={tiers.staff} onOpen={open} />
      )}
      {modal}
    </>
  );
}

export default function Structure() {
  return (
    <>
      <PageHeader pageKey="structure" />
      <section className="section pt-12">
        <div className="container">
          <StructureView />
        </div>
      </section>
    </>
  );
}
