import { useState } from 'react';
import { useSite } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { cx, groupByTier } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { Avatar, EmptyState, ErrorState, Icon, Reveal } from '../components/ui';
import { useProfileModal } from '../components/people';

/** Levels with more people than this show as a compact list instead of cards. */
const CARD_LIMIT = 8;
const LIST_PREVIEW = 8;

/** Vertical connector with the level name, joining one level of the structure to the next. */
function LevelLabel({ label, count, first }) {
  return (
    <div className="flex flex-col items-center">
      {!first && <span className="h-6 w-px bg-brand-300" />}
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-brand-800 ring-1 ring-brand-100">
        {label}<span className="rounded-full bg-white px-1.5 text-[0.65rem] text-brand-700 ring-1 ring-brand-100">{count}</span>
      </span>
      <span className="h-4 w-px bg-brand-300" />
    </div>
  );
}

/** The head of the school: one wide highlighted card. */
function HeadCard({ p, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(p)} className="group mx-auto flex w-full max-w-sm items-center gap-4 rounded-theme-lg bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-left text-white shadow-glow ring-1 ring-brand-700 transition hover:-translate-y-0.5">
      <Avatar src={p.photo} name={p.name} className="h-16 w-16 shrink-0 rounded-full ring-4 ring-white/25" textClassName="text-lg" />
      <span className="min-w-0">
        <span className="block font-heading text-base sm:text-lg font-bold leading-tight">{p.name}</span>
        <span className="mt-0.5 block text-sm text-white/80">{p.position}</span>
      </span>
      <Icon name="chevron-right" className="ml-auto text-white/60 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </button>
  );
}

/** A person in a small level (deputies, heads of department…). Two per row on phones. */
function PersonCard({ p, onOpen }) {
  return (
    <button
      type="button" onClick={() => onOpen(p)}
      className="group flex w-[calc(50%-0.375rem)] flex-col items-center rounded-theme-lg bg-white p-3.5 text-center ring-1 ring-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300 sm:w-44 sm:p-4"
    >
      <Avatar src={p.photo} name={p.name} className="h-14 w-14 rounded-full ring-4 ring-brand-50" textClassName="text-sm" />
      <span className="mt-2.5 text-[0.82rem] sm:text-sm font-bold leading-tight text-slate-900">{p.name}</span>
      <span className="mt-1 text-[0.72rem] leading-snug text-brand-700 line-clamp-2">{p.position}</span>
    </button>
  );
}

/** A person in a large level (teaching staff…): one compact row. */
function PersonRow({ p, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(p)} className="group flex w-full items-center gap-3 rounded-theme bg-white p-2.5 pr-3 text-left ring-1 ring-slate-200 transition hover:ring-brand-300 hover:shadow-sm">
      <Avatar src={p.photo} name={p.name} className="h-10 w-10 shrink-0 rounded-full" textClassName="text-xs" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">{p.name}</span>
        <span className="block truncate text-xs text-brand-700">{p.position}</span>
      </span>
      <Icon name="chevron-right" className="text-xs text-slate-300 transition group-hover:text-brand-600" />
    </button>
  );
}

function LargeLevel({ items, onOpen }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, LIST_PREVIEW);
  return (
    <div className="rounded-theme-lg bg-slate-50 p-3 sm:p-4 ring-1 ring-slate-100">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((p) => <PersonRow key={p.id} p={p} onOpen={onOpen} />)}
      </div>
      {items.length > LIST_PREVIEW && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
          {all ? 'Show fewer' : `Show all ${items.length}`}<Icon name="chevron-down" className={cx('text-xs transition-transform', all && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}

/**
 * The school structure as levels from the head of school down, joined by connector lines.
 * Levels come from Hierarchy Levels in the CMS, so it stays compact at any size and on any screen.
 */
export function StructureView() {
  const { tiers } = useSite();
  const { data, loading, error, reload } = useFetch('/public/staff', []);
  const { open, modal } = useProfileModal();

  if (loading) return <div className="skeleton h-96 max-w-4xl mx-auto" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState icon="diagram-3" title="Structure not set up yet" text="Add staff and choose their level in the CMS to build the structure." />;

  const names = new Map(data.map((p) => [p.id, p.name]));
  const people = data.map((p) => ({ ...p, reports_to: names.get(p.parent_id) || '' }));
  const groups = groupByTier(people, tiers.staff);
  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-6 text-center text-sm text-slate-500"><Icon name="hand-index" className="mr-1 text-brand-600" />Tap a person to view their profile.</p>
      {groups.map((g, k) => (
        <Reveal key={g.key} delay={Math.min(k, 3) * 0.06} y={20}>
          <LevelLabel label={g.label} count={g.items.length} first={k === 0} />
          {k === 0 && g.items.length === 1 ? (
            <HeadCard p={g.items[0]} onOpen={open} />
          ) : g.items.length <= CARD_LIMIT ? (
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {g.items.map((p) => <PersonCard key={p.id} p={p} onOpen={open} />)}
            </div>
          ) : (
            <LargeLevel items={g.items} onOpen={open} />
          )}
        </Reveal>
      ))}
      {modal}
    </div>
  );
}

export default function Structure() {
  return (
    <>
      <PageHeader pageKey="structure" />
      <section className="section pt-10 sm:pt-12">
        <div className="container">
          <StructureView />
        </div>
      </section>
    </>
  );
}
