import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { formatDate } from '../lib/utils';
import { Icon } from '../components/ui';
import Counter from '../components/Counter';

const CARDS = [
  ['departments', 'Departments', 'building', '/admin/departments'],
  ['staff', 'Teachers & Staff', 'person-badge', '/admin/staff'],
  ['prefects', 'Prefects', 'stars', '/admin/prefects'],
  ['albums', 'Gallery Albums', 'collection', '/admin/gallery'],
  ['images', 'Photos', 'images', '/admin/gallery'],
  ['news', 'News & Events', 'newspaper', '/admin/news'],
];

// Bundled sample photos (and the old remote placeholders) count as not yet replaced.
const isDefaultPhoto = (url) => /^\/images\/|picsum\.photos/.test(String(url || ''));

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { settings, schoolName, content } = useSite();
  const { data } = useFetch('/admin/stats');
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const checklist = [
    { done: Boolean(settings?.logo), label: 'Upload the school logo', to: '/admin/settings' },
    { done: settings?.schoolName && !['Our School', 'Greenfield School'].includes(settings.schoolName), label: 'Set the school name & motto', to: '/admin/settings' },
    { done: !content.home?.hero?.slides?.some((s) => isDefaultPhoto(s.image)), label: 'Replace the default homepage photos with your own', to: '/admin/content/home' },
    { done: Boolean(content.home?.welcome?.image) && !isDefaultPhoto(content.home?.welcome?.image), label: 'Add the principal’s photo & message', to: '/admin/content/home' },
    { done: Boolean(settings?.contact?.mapEmbed), label: 'Add the Google Maps location', to: '/admin/settings' },
    { done: (data?.staff ?? 0) > 0, label: 'Add teachers & staff', to: '/admin/staff' },
  ];
  const progress = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 p-6 md:p-10 text-white">
        <div className="absolute inset-0 bg-grid-light" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[40px] border-white/5 animate-spin-slow" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="m-0 text-accent-300 font-semibold">{greet},</p>
            <h2 className="m-0 !text-white text-2xl md:text-3xl font-extrabold">{user?.name}</h2>
            <p className="mt-2 mb-0 text-white/75 max-w-xl">You are managing <strong className="text-white">{schoolName}</strong>. Every change you make here updates the public website instantly.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/news" className="btn-accent !py-2.5"><Icon name="plus-lg" />Post news</Link>
            <a href="/" target="_blank" rel="noreferrer" className="btn-ghost-light !py-2.5"><Icon name="box-arrow-up-right" />View site</a>
          </div>
        </div>
      </motion.div>

      <div className="row g-3 g-md-4">
        {CARDS.map(([k, label, icon, to], i) => (
          <motion.div key={k} className="col-6 col-md-4 col-xl-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={to} className="group block h-full rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all">
              <span className="icon-tile !h-11 !w-11 !text-xl"><Icon name={icon} /></span>
              <div className="mt-3 font-heading text-3xl font-extrabold text-slate-900">{data ? <Counter value={data[k]} duration={900} /> : '–'}</div>
              <p className="m-0 text-xs font-medium text-slate-500">{label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="h-full rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="m-0 text-lg font-bold">Website setup checklist</h3>
              <span className="text-sm font-bold text-brand-700">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
            </div>
            <ul className="list-none p-0 m-0 space-y-2">
              {checklist.filter((c) => isAdmin || !c.to.includes('settings')).map((c) => (
                <li key={c.label}>
                  <Link to={c.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition">
                    <span className={c.done ? 'grid place-items-center h-6 w-6 rounded-full bg-brand-600 text-white text-xs' : 'grid place-items-center h-6 w-6 rounded-full ring-2 ring-slate-200'}>{c.done && <Icon name="check-lg" />}</span>
                    <span className={c.done ? 'text-sm text-slate-400 line-through' : 'text-sm font-medium text-slate-700'}>{c.label}</span>
                    {!c.done && <Icon name="arrow-right" className="ml-auto text-slate-300" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="h-full rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="m-0 text-lg font-bold">Recent news & events</h3>
              <Link to="/admin/news" className="text-sm font-semibold text-brand-700">Manage</Link>
            </div>
            {data?.recentNews?.length ? (
              <ul className="list-none p-0 m-0 divide-y divide-slate-100">
                {data.recentNews.map((n) => (
                  <li key={n.id} className="flex items-center gap-3 py-3">
                    <span className={n.category === 'event' ? 'grid place-items-center h-10 w-10 rounded-xl bg-accent-100 text-accent-700' : 'grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-700'}><Icon name={n.category === 'event' ? 'calendar-event' : 'newspaper'} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                      <p className="m-0 text-xs text-slate-400">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.is_published && <span className="badge text-bg-secondary">Draft</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No posts yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
