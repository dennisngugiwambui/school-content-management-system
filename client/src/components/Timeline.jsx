import { motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import { cx } from '../lib/utils';
import { Icon, Reveal } from './ui';

/**
 * Vertical timeline with an animated centre line and alternating cards.
 * Items: { year, title, text, icon? }. Used for the history and the learner journey.
 */
export default function Timeline({ items }) {
  const { fill } = useSite();
  return (
    <div className="relative mx-auto max-w-5xl">
      <motion.div
        className="absolute left-5 md:left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 origin-top bg-gradient-to-b from-brand-600 via-brand-400 to-accent-400 rounded-full"
        initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      <div className="space-y-5 md:space-y-10">
        {items.map((h, k) => {
          const right = k % 2 === 1;
          return (
            <div key={k} className="relative md:grid md:grid-cols-2 md:gap-14">
              <span className="absolute left-5 md:left-1/2 top-5 sm:top-6 -translate-x-1/2 z-10 grid place-items-center h-5 w-5 rounded-full bg-white ring-4 ring-brand-600">
                <span className="h-2 w-2 rounded-full bg-accent-500" />
              </span>
              <Reveal x={right ? 40 : -40} y={0} className={cx('pl-12 md:pl-0', right ? 'md:col-start-2' : 'md:text-right')}>
                <div className="group rounded-theme-lg bg-white p-4 sm:p-6 shadow-soft ring-1 ring-slate-100 hover:shadow-lift transition-shadow duration-500">
                  <div className={cx('flex items-center gap-3', !right && 'md:flex-row-reverse')}>
                    <span className="inline-block rounded-full bg-brand-600 px-4 py-1 font-heading text-sm font-bold text-white">{fill(h.year)}</span>
                    {h.icon && <Icon name={h.icon} className="text-xl text-brand-600 transition-transform duration-500 group-hover:scale-125" />}
                  </div>
                  <h3 className="mt-3 text-lg sm:text-xl font-bold">{fill(h.title)}</h3>
                  <p className="m-0 text-sm sm:text-base text-slate-500">{fill(h.text)}</p>
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
