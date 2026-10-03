import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useFetch from '../hooks/useFetch';
import { useSite } from '../context/SiteContext';
import { cx, formatDate } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, ErrorState, Icon, Reveal, RichText, SkeletonGrid, SmartImage } from '../components/ui';
import { NewsCard } from './Home';

export function NewsList() {
  const [cat, setCat] = useState('');
  const { data, loading, error, reload } = useFetch(`/public/news${cat ? `?category=${cat}` : ''}`, []);
  const tabs = [['', 'All'], ['news', 'News'], ['event', 'Events']];
  return (
    <>
      <PageHeader pageKey="news" />
      <section className="section pt-12">
        <div className="container">
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200">
              {tabs.map(([k, label]) => (
                <button key={k} onClick={() => setCat(k)} className={cx('relative rounded-full px-6 py-2.5 text-sm font-semibold transition-colors', cat === k ? 'text-white' : 'text-slate-600 hover:text-brand-700')}>
                  {cat === k && <motion.span layoutId="news-tab" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>
          {loading && <SkeletonGrid className="h-96" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !data.length && <EmptyState icon="newspaper" title="Nothing published yet" text="News and events will appear here." />}
          {!loading && (
            <div className="row g-4">
              {data.map((n, k) => (
                <Reveal key={n.id} delay={(k % 3) * 0.1} className="col-md-6 col-lg-4"><NewsCard item={n} /></Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function NewsDetail() {
  const { slug } = useParams();
  const { page, fill } = useSite();
  const { data, loading, error, reload } = useFetch(`/public/news/${slug}`);
  const crumbs = [{ label: fill(page('news').label || 'News'), to: '/news' }];

  if (loading) return (<><PageHeader title="Loading…" subtitle="" crumbs={crumbs} /><div className="container section"><div className="skeleton h-96" /></div></>);
  if (error) return (<><PageHeader title={error.status === 404 ? 'Article not found' : 'News & events'} subtitle="" crumbs={crumbs} /><div className="container section"><ErrorState error={error} onRetry={reload} /></div></>);

  const { item, related } = data;
  const isEvent = item.category === 'event';
  return (
    <>
      <PageHeader title={item.title} subtitle={item.excerpt} image={item.image || undefined} crumbs={crumbs} />
      <section className="section">
        <div className="container">
          <div className="row g-5">
            <article className="col-lg-8">
              <Reveal><SmartImage src={item.image} alt={item.title} icon="newspaper" className="aspect-[16/9] rounded-theme-lg shadow-soft" /></Reveal>
              <div className="flex flex-wrap gap-3 my-6">
                <span className={cx('rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider', isEvent ? 'bg-accent-400 text-ink-900' : 'bg-brand-600 text-white')}>{isEvent ? 'Event' : 'News'}</span>
                <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600"><Icon name="calendar3" className="mr-1.5" />Published {formatDate(item.created_at)}</span>
              </div>
              {isEvent && (item.event_date || item.location) && (
                <Reveal className="mb-8 grid sm:grid-cols-2 gap-4">
                  {item.event_date && <div className="flex items-center gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100"><Icon name="calendar-event-fill" className="text-3xl text-brand-600" /><div><p className="m-0 text-xs uppercase tracking-wider text-slate-500">Date</p><p className="m-0 font-bold text-slate-800">{formatDate(item.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>}
                  {item.location && <div className="flex items-center gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100"><Icon name="geo-alt-fill" className="text-3xl text-brand-600" /><div><p className="m-0 text-xs uppercase tracking-wider text-slate-500">Venue</p><p className="m-0 font-bold text-slate-800">{item.location}</p></div></div>}
                </Reveal>
              )}
              <Reveal><RichText text={item.body || item.excerpt} className="text-[1.05rem]" /></Reveal>
              <Link to="/news" className="btn-outline-brand mt-6"><Icon name="arrow-left" />Back to all news</Link>
            </article>
            <aside className="col-lg-4">
              <div className="lg:sticky lg:top-28 rounded-theme-lg bg-slate-50 p-6 ring-1 ring-slate-100">
                <h4 className="text-lg font-bold mb-5">More Stories</h4>
                <div className="space-y-4">
                  {related.map((r) => (
                    <Link key={r.id} to={`/news/${r.slug}`} className="group flex gap-4">
                      <SmartImage src={r.image} alt="" icon="newspaper" zoom className="h-20 w-24 shrink-0 rounded-xl" />
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-bold leading-snug text-slate-800 group-hover:text-brand-700 line-clamp-2">{r.title}</p>
                        <p className="m-0 mt-1 text-xs text-slate-400">{formatDate(r.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                  {!related.length && <p className="text-sm text-slate-500 m-0">No other stories yet.</p>}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
