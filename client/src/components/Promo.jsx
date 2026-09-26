import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import { cx } from '../lib/utils';
import { Icon, Reveal, SmartImage, SmartLink } from './ui';

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** A promotion shows when it is switched on and today falls inside its optional start / end dates. */
export const promoActive = (p) =>
  Boolean(p?.enabled && p.title) && (!p.startDate || localDay() >= p.startDate) && (!p.endDate || localDay() <= p.endDate);

// Remembers that a visitor closed this particular promotion (a new headline shows again).
const seenKey = (p) => `promo-seen:${p.title}`;
const store = (frequency) => {
  try { return frequency === 'day' ? localStorage : sessionStorage; } catch { return null; }
};
function wasSeen(p) {
  if (p.frequency === 'always') return false;
  try {
    const v = store(p.frequency)?.getItem(seenKey(p));
    return p.frequency === 'day' ? v === localDay() : Boolean(v);
  } catch { return false; }
}
function markSeen(p) {
  try { store(p.frequency)?.setItem(seenKey(p), localDay()); } catch { /* private mode */ }
}

function Buttons({ p, onClick, light = false, className }) {
  const { fill } = useSite();
  if (!p.buttonText && !p.button2Text) return null;
  return (
    <div className={cx('flex flex-wrap gap-2.5', className)}>
      {p.buttonText && <SmartLink to={p.buttonLink} onClick={onClick} className="btn-accent !px-5 !py-2.5">{fill(p.buttonText)}<Icon name="arrow-right" /></SmartLink>}
      {p.button2Text && <SmartLink to={p.button2Link} onClick={onClick} className={cx(light ? 'btn-ghost-light' : 'btn-outline-brand', '!px-5 !py-2.5')}>{fill(p.button2Text)}</SmartLink>}
    </div>
  );
}

/** Pop-up promotion (admissions, open day…) that appears a few seconds after a visitor arrives. */
export function PromoPopup() {
  const { content, fill } = useSite();
  const { pathname } = useLocation();
  const p = content.promo?.popup;
  const [open, setOpen] = useState(false);
  const eligible = promoActive(p) && (p.where === 'all' || pathname === '/');

  useEffect(() => {
    if (!eligible || wasSeen(p)) return;
    const t = setTimeout(() => setOpen(true), Math.max(0, Number(p.delay) || 0) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, p?.title]);

  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  });

  const close = () => { setOpen(false); markSeen(p); };

  return (
    <AnimatePresence>
      {open && eligible && (
        <motion.div
          key="promo" className="fixed inset-0 z-[1060] flex items-end sm:items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-labelledby="promo-title"
        >
          <button type="button" className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={close} aria-label="Close" />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={cx('relative w-full max-w-3xl overflow-hidden rounded-theme-lg bg-white shadow-2xl max-h-[92svh] overflow-y-auto', p.image && 'md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]')}
          >
            <button type="button" onClick={close} className="absolute right-3 top-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-black/5 hover:bg-white hover:text-brand-700" aria-label="Close">
              <Icon name="x-lg" />
            </button>
            {p.image && (
              <div className="relative">
                <SmartImage src={p.image} alt="" className="aspect-[16/9] md:aspect-auto md:h-full md:min-h-[380px]" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-ink-950/10" />
              </div>
            )}
            <div className="relative p-6 sm:p-8 md:p-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-100/60 blur-2xl" />
              {p.badge && (
                <span className="relative inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
                  <span className="relative flex h-2 w-2"><span className="absolute inset-0 rounded-full bg-brand-500 animate-ping" /><span className="relative h-2 w-2 rounded-full bg-brand-600" /></span>
                  {fill(p.badge)}
                </span>
              )}
              <h2 id="promo-title" className="relative mt-4 text-2xl sm:text-3xl font-extrabold leading-tight">{fill(p.title)}</h2>
              {p.text && <p className="relative mt-3 mb-0 text-slate-600 leading-relaxed">{fill(p.text)}</p>}
              <Buttons p={p} onClick={close} className="relative mt-6" />
              <button type="button" onClick={close} className="relative mt-5 block text-sm font-medium text-slate-400 hover:text-slate-600">Maybe later</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useCountdown(date) {
  const target = date ? new Date(`${date}T23:59:59`).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  const left = Math.max(0, target - now);
  if (!target || !left) return null;
  return [
    ['Days', Math.floor(left / 86400000)],
    ['Hours', Math.floor(left / 3600000) % 24],
    ['Mins', Math.floor(left / 60000) % 60],
    ['Secs', Math.floor(left / 1000) % 60],
  ];
}

/** Highlighted promotion band on the home page, with an optional countdown to a deadline. */
export function PromoBanner() {
  const { content, fill } = useSite();
  const p = content.promo?.banner;
  const countdown = useCountdown(p?.deadline);
  if (!promoActive(p)) return null;
  return (
    <section className="pt-12 sm:pt-16 md:pt-20">
      <div className="container">
        <Reveal scale={0.97} className="relative overflow-hidden rounded-theme-lg bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 text-white shadow-lift">
          <div className="absolute inset-0 bg-grid-light opacity-70" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
          <div className={cx('relative grid items-center', p.image && 'md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
            <div className="p-6 sm:p-8 md:p-10 lg:p-12">
              {p.badge && (
                <span className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink-900 shadow">
                  <Icon name="megaphone-fill" />{fill(p.badge)}
                </span>
              )}
              <h2 className="mt-4 text-[1.6rem] sm:text-3xl md:text-4xl font-extrabold leading-tight !text-white">{fill(p.title)}</h2>
              {p.text && <p className="mt-3 mb-0 max-w-xl text-white/80">{fill(p.text)}</p>}
              {countdown && (
                <div className="mt-6">
                  {p.deadlineLabel && <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-widest text-accent-300">{fill(p.deadlineLabel)}</p>}
                  <div className="grid max-w-sm grid-cols-4 gap-2">
                    {countdown.map(([label, v]) => (
                      <div key={label} className="rounded-xl bg-white/10 py-2 text-center ring-1 ring-white/15 backdrop-blur-sm">
                        <div className="font-heading text-xl sm:text-2xl font-extrabold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
                        <div className="mt-1 text-[0.6rem] uppercase tracking-wider text-white/60">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Buttons p={p} light className="mt-7" />
            </div>
            {p.image && (
              <div className="relative h-52 sm:h-64 md:h-full md:min-h-[340px]">
                <SmartImage src={p.image} alt="" className="absolute inset-0 !bg-transparent" />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-900/70 to-transparent md:bg-gradient-to-r md:from-brand-800 md:via-brand-800/30 md:to-transparent" />
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
