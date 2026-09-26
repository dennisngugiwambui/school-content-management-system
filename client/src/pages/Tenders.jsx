import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useFetch from '../hooks/useFetch';
import { useSite, usePageTitle } from '../context/SiteContext';
import { asset, tenderDownloadUrl } from '../lib/api';
import { cx, fileSize, formatDate } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, ErrorState, Icon, Reveal } from '../components/ui';

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** An open tender whose closing date has passed shows as closed. */
export const tenderStatus = (t) => (t.status === 'open' && t.closing_date && t.closing_date < localDay() ? 'closed' : t.status || 'open');

const STATUS = {
  open: { label: 'Open', icon: 'unlock-fill', chip: 'bg-brand-50 text-brand-800 ring-brand-200', bar: 'bg-brand-600' },
  awarded: { label: 'Awarded', icon: 'award-fill', chip: 'bg-accent-50 text-accent-800 ring-accent-200', bar: 'bg-accent-400' },
  closed: { label: 'Closed', icon: 'lock-fill', chip: 'bg-slate-100 text-slate-600 ring-slate-200', bar: 'bg-slate-300' },
  cancelled: { label: 'Cancelled', icon: 'x-octagon-fill', chip: 'bg-red-50 text-red-700 ring-red-200', bar: 'bg-red-400' },
};

function daysLeft(date) {
  if (!date) return null;
  const ms = new Date(`${date}T23:59:59`).getTime() - Date.now();
  return ms < 0 ? -1 : Math.floor(ms / 86400000);
}

const fileIcon = (t) => {
  const ext = String(t.file_name || t.file || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return ['file-earmark-pdf-fill', 'bg-red-50 text-red-600', 'PDF'];
  if (ext.startsWith('doc')) return ['file-earmark-word-fill', 'bg-blue-50 text-blue-600', 'Word'];
  if (ext.startsWith('xls')) return ['file-earmark-excel-fill', 'bg-emerald-50 text-emerald-700', 'Excel'];
  return ['file-earmark-text-fill', 'bg-slate-100 text-slate-500', 'File'];
};

function TenderCard({ t, index }) {
  const status = tenderStatus(t);
  const s = STATUS[status] ?? STATUS.open;
  const left = status === 'open' ? daysLeft(t.closing_date) : null;
  const [icon, tone, kind] = fileIcon(t);
  return (
    <Reveal delay={(index % 4) * 0.06} y={24}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-theme-lg bg-white ring-1 ring-slate-200/80 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-soft hover:ring-brand-200 md:flex-row">
        <span className={cx('absolute inset-y-0 left-0 w-1', s.bar)} />
        <div className="flex flex-1 gap-4 p-5 pl-6 sm:p-6 sm:pl-7">
          <span className={cx('hidden sm:grid place-items-center h-14 w-14 shrink-0 rounded-2xl text-2xl transition-transform duration-500 group-hover:scale-105', tone)}><Icon name={icon} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ring-1', s.chip)}><Icon name={s.icon} />{s.label}</span>
              {t.reference && <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.72rem] font-semibold text-slate-600">{t.reference}</span>}
              {t.category && <span className="text-xs font-medium text-slate-400">{t.category}</span>}
            </div>
            <h3 className="m-0 mt-2.5 text-[1.05rem] sm:text-lg font-bold leading-snug text-slate-900">{t.title}</h3>
            {t.description && <p className="m-0 mt-1.5 text-sm leading-relaxed text-slate-500 line-clamp-3 whitespace-pre-line">{t.description}</p>}
            <dl className="m-0 mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-6">
              {t.opening_date && (
                <div><dt className="text-[0.65rem] uppercase tracking-wider text-slate-400">Advertised</dt><dd className="m-0 font-semibold text-slate-700">{formatDate(t.opening_date, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
              )}
              {t.closing_date && (
                <div><dt className="text-[0.65rem] uppercase tracking-wider text-slate-400">Closing date</dt><dd className="m-0 font-semibold text-slate-700">{formatDate(t.closing_date, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
              )}
              {left !== null && left >= 0 && (
                <div className="col-span-2 sm:col-auto">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-slate-400">Time left</dt>
                  <dd className={cx('m-0 font-semibold', left <= 3 ? 'text-red-600' : 'text-brand-700')}>
                    {left === 0 ? 'Closes today' : `${left} day${left === 1 ? '' : 's'} left`}
                  </dd>
                </div>
              )}
              {status === 'awarded' && t.awarded_to && (
                <div className="col-span-2 sm:col-auto"><dt className="text-[0.65rem] uppercase tracking-wider text-slate-400">Awarded to</dt><dd className="m-0 font-semibold text-slate-700">{t.awarded_to}</dd></div>
              )}
            </dl>
          </div>
        </div>
        {t.file && (
          <div className="flex gap-2 border-t border-slate-100 bg-slate-50/60 p-4 sm:px-6 md:w-52 md:shrink-0 md:flex-col md:justify-center md:border-l md:border-t-0">
            <a href={asset(t.file)} target="_blank" rel="noreferrer" className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-theme bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-brand-700 hover:ring-brand-300">
              <Icon name="eye" />View
            </a>
            <a href={tenderDownloadUrl(t)} download={t.file_name || true} className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-theme bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-glow">
              <Icon name="download" />Download
            </a>
            <p className="m-0 hidden md:block text-center text-[0.7rem] text-slate-400">{kind}{t.file_size ? ` · ${fileSize(t.file_size)}` : ''}</p>
          </div>
        )}
      </article>
    </Reveal>
  );
}

export default function Tenders() {
  const { page, fill } = useSite();
  const { data, loading, error, reload } = useFetch('/public/tenders', []);
  const [tab, setTab] = useState('open');
  const [q, setQ] = useState('');
  usePageTitle(fill(page('tenders').label || 'Tenders'));

  const counts = useMemo(() => {
    const c = { all: data.length, open: 0, awarded: 0, closed: 0, cancelled: 0 };
    data.forEach((t) => { c[tenderStatus(t)] += 1; });
    return c;
  }, [data]);
  // Default to "Open", but fall back to everything when nothing is open.
  const active = tab === 'open' && !counts.open && data.length ? 'all' : tab;

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data
      .filter((t) => active === 'all' || tenderStatus(t) === active)
      .filter((t) => !term || [t.title, t.reference, t.category, t.description].some((v) => String(v || '').toLowerCase().includes(term)))
      .sort((a, b) => {
        const oa = tenderStatus(a) === 'open';
        const ob = tenderStatus(b) === 'open';
        if (oa !== ob) return oa ? -1 : 1;
        if (oa) return String(a.closing_date || '9999').localeCompare(String(b.closing_date || '9999'));
        return 0;
      });
  }, [data, active, q]);

  const tabs = [['open', 'Open'], ['awarded', 'Awarded'], ['closed', 'Closed'], ['all', 'All']].filter(([k]) => k === 'all' || k === 'open' || counts[k]);
  const note = page('tenders').note;

  return (
    <>
      <PageHeader pageKey="tenders" />
      <section className="section pt-10 sm:pt-12">
        <div className="container">
          {note && (
            <Reveal className="mb-8 flex gap-3 rounded-theme-lg bg-brand-50 p-4 sm:p-5 ring-1 ring-brand-100">
              <Icon name="info-circle-fill" className="mt-0.5 text-lg text-brand-600" />
              <p className="m-0 text-sm sm:text-[0.95rem] text-slate-700">{fill(note)}</p>
            </Reveal>
          )}

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="-mx-4 overflow-x-auto px-4 scrollbar-thin">
              <div className="flex w-max rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200">
                {tabs.map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)} className={cx('relative whitespace-nowrap rounded-full px-4 sm:px-5 py-2 text-sm font-semibold transition-colors', active === k ? 'text-white' : 'text-slate-600 hover:text-brand-700')}>
                    {active === k && <motion.span layoutId="tender-tab" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                    <span className="relative">{label} <span className={cx('ml-1 text-xs', active === k ? 'text-white/75' : 'text-slate-400')}>{counts[k]}</span></span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative md:w-72">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="form-control !rounded-full !pl-10" placeholder="Search tenders…" aria-label="Search tenders" />
            </div>
          </div>

          {loading && <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40" />)}</div>}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !list.length && (
            <EmptyState
              icon="file-earmark-text"
              title={data.length ? 'No tenders match' : 'No tenders at the moment'}
              text={data.length ? 'Try another filter or search term.' : 'New tender opportunities will be published here.'}
            />
          )}
          {!loading && list.length > 0 && (
            <div className="grid gap-4">
              {list.map((t, k) => <TenderCard key={t.id} t={t} index={k} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
