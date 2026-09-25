import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { groupByTier } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { Avatar, EmptyState, ErrorState, Icon, Reveal, SectionHeading } from '../components/ui';

/** Large "selfie" card used for head boy / head girl and other photo tiers. */
function PhotoCard({ p, featured, onOpen, delay }) {
  return (
    <Reveal delay={delay} scale={0.92} y={40}>
      <motion.button type="button" onClick={() => onOpen(p)} whileHover={{ y: -10 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="group relative block w-full overflow-hidden rounded-[1.75rem] bg-white text-left shadow-soft ring-1 ring-slate-100 hover:shadow-lift">
        <div className={featured ? 'relative aspect-[4/5]' : 'relative aspect-square'}>
          <Avatar src={p.photo} name={p.name} className="h-full w-full transition-transform duration-700 group-hover:scale-110" textClassName={featured ? 'text-7xl' : 'text-5xl'} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
          {featured && (
            <span className="absolute top-3 left-3 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 rounded-full bg-accent-400 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[0.6rem] sm:text-xs font-bold uppercase tracking-wider text-ink-900 shadow-lg">
              <Icon name="star-fill" />{p.position}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6">
            <h3 className={featured ? 'm-0 !text-white text-lg sm:text-2xl md:text-3xl font-extrabold leading-tight' : 'm-0 !text-white text-sm sm:text-lg font-bold leading-tight'}>{p.name}</h3>
            {!featured && <p className="m-0 text-xs sm:text-sm text-accent-300 font-semibold">{p.position}</p>}
            {p.class_name && <p className="m-0 mt-1 text-xs sm:text-sm text-white/70">{p.class_name}{p.house && ` · ${p.house}`}</p>}
            {featured && p.quote && <p className="hidden sm:block m-0 mt-3 text-white/85 italic line-clamp-2">“{p.quote}”</p>}
          </div>
        </div>
      </motion.button>
    </Reveal>
  );
}

function NameList({ items, onOpen }) {
  return (
    <div className="row g-3">
      {items.map((p, k) => (
        <Reveal key={p.id} delay={(k % 3) * 0.06} className="col-sm-6 col-lg-4">
          <button type="button" onClick={() => onOpen(p)} className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-100 shadow-sm hover:ring-brand-300 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300">
            <span className="grid place-items-center h-11 w-11 shrink-0 rounded-xl bg-brand-50 text-brand-700 text-lg transition group-hover:bg-brand-600 group-hover:text-white"><Icon name="person-check" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-slate-800 truncate">{p.name}</span>
              <span className="block text-sm text-brand-700 truncate">{p.position}</span>
            </span>
            {p.class_name && <span className="hidden sm:inline shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-500">{p.class_name}</span>}
          </button>
        </Reveal>
      ))}
    </div>
  );
}

export default function Prefects() {
  const { tiers } = useSite();
  const { data, loading, error, reload } = useFetch('/public/prefects', []);
  const [active, setActive] = useState(null);
  const groups = groupByTier(data, tiers.prefects);

  return (
    <>
      <PageHeader pageKey="prefects" />
      <section className="section pt-12 overflow-hidden">
        <div className="container relative">
          {loading && <div className="row g-4 justify-content-center">{[0, 1].map((i) => <div key={i} className="col-md-5"><div className="skeleton aspect-[4/5]" /></div>)}</div>}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !data.length && <EmptyState icon="stars" title="Prefects not announced yet" text="The prefects body will be published here." />}

          {groups.map((g, gi) => {
            const withPhotos = g.items.filter((p) => g.showPhotos || p.show_photo);
            const namesOnly = g.items.filter((p) => !(g.showPhotos || p.show_photo));
            const featured = gi === 0;
            return (
              <div key={g.key} className="mb-20 last:mb-0">
                <SectionHeading eyebrow={featured ? 'Leading by example' : `${g.items.length} ${g.items.length === 1 ? 'leader' : 'leaders'}`} title={g.label} className="!mb-10" />
                {withPhotos.length > 0 && (
                  <div className="row g-4 justify-content-center mb-6">
                    {withPhotos.map((p, k) => (
                      <div key={p.id} className={featured ? 'col-6 col-lg-5 col-xl-4' : 'col-6 col-md-4 col-lg-3'}>
                        <PhotoCard p={p} featured={featured} onOpen={setActive} delay={k * 0.12} />
                      </div>
                    ))}
                  </div>
                )}
                {namesOnly.length > 0 && <NameList items={namesOnly} onOpen={setActive} />}
              </div>
            );
          })}
        </div>
      </section>

      <Modal show={Boolean(active)} onHide={() => setActive(null)} centered>
        {active && (
          <div className="relative text-center p-8">
            <button onClick={() => setActive(null)} className="absolute right-4 top-4 grid place-items-center h-10 w-10 rounded-full bg-slate-100 hover:bg-brand-600 hover:text-white transition" aria-label="Close"><Icon name="x-lg" /></button>
            <Avatar src={active.photo} name={active.name} className="mx-auto h-32 w-32 rounded-full ring-4 ring-brand-100 shadow-lg" textClassName="text-4xl" />
            <span className="eyebrow mt-5">{active.position}</span>
            <h3 className="mt-2 text-2xl font-extrabold">{active.name}</h3>
            {(active.class_name || active.house) && <p className="text-slate-500 m-0">{[active.class_name, active.house].filter(Boolean).join(' · ')}</p>}
            {active.quote && <p className="mt-5 mb-0 font-heading text-lg italic text-slate-700">“{active.quote}”</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
