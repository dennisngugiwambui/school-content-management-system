import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from '../lib/utils';
import { Icon } from './ui';

/**
 * A table that decides per screen size which columns to show.
 * Each column has a priority: 1 always shows, 2 from 576px, 3 from 768px, 4 from 992px, 5 from 1200px.
 * Columns that do not fit move into a tap-to-open detail panel under each row, so nothing is lost on a phone.
 *
 * columns: [{ key, label, priority, align, render(row), className }]
 * expand(row): optional extra content always shown in the detail panel (e.g. a chart).
 */
const SHOW = { 1: '', 2: 'hidden sm:table-cell', 3: 'hidden md:table-cell', 4: 'hidden lg:table-cell', 5: 'hidden xl:table-cell' };
const HIDE_WHEN_SHOWN = { 1: 'hidden', 2: 'sm:hidden', 3: 'md:hidden', 4: 'lg:hidden', 5: 'xl:hidden' };
const TOGGLE_UNTIL = { 1: 'hidden', 2: 'sm:hidden', 3: 'md:hidden', 4: 'lg:hidden', 5: 'xl:hidden' };

export default function ResponsiveTable({ columns, rows, rowKey = (r, i) => i, expand, onRowClick, activeKey, caption, dark = false }) {
  const [open, setOpen] = useState(null);
  const maxPriority = Math.max(...columns.map((c) => c.priority || 1));
  const hasExtra = typeof expand === 'function';
  const cell = (c, row) => (c.render ? c.render(row) : row[c.key] ?? '—');

  return (
    <div className={cx('overflow-hidden rounded-theme-lg ring-1 shadow-sm', dark ? 'ring-white/15' : 'ring-slate-200 bg-white')}>
      <table className="w-full border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className={cx('text-[0.7rem] uppercase tracking-wider', dark ? 'bg-white/10 text-white/70' : 'bg-slate-50 text-slate-500')}>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx('px-3 py-3 sm:px-4 font-semibold whitespace-nowrap', SHOW[c.priority || 1], c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>{c.label}</th>
            ))}
            <th scope="col" className={cx('w-10 px-2', !hasExtra && TOGGLE_UNTIL[maxPriority])}><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row, i);
            const isOpen = open === key;
            const extra = hasExtra ? expand(row) : null;
            return (
              <Fragment key={key}>
                <tr
                  onClick={() => (onRowClick ? onRowClick(row, i) : setOpen(isOpen ? null : key))}
                  className={cx('cursor-pointer border-t transition-colors', dark ? 'border-white/10 hover:bg-white/5' : 'border-slate-100 hover:bg-brand-50/60', activeKey === key && (dark ? 'bg-white/10' : 'bg-brand-50'))}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cx('px-3 py-3 sm:px-4 align-middle', SHOW[c.priority || 1], c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}>{cell(c, row)}</td>
                  ))}
                  <td className={cx('w-10 px-2 text-right', !(hasExtra && extra) && TOGGLE_UNTIL[maxPriority])}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : key); }} aria-expanded={isOpen} aria-label={isOpen ? 'Hide details' : 'Show details'}
                      className={cx('grid place-items-center h-8 w-8 rounded-full transition', dark ? 'text-white/70 hover:bg-white/10' : 'text-slate-500 hover:bg-brand-100 hover:text-brand-700', isOpen && (dark ? 'bg-white/10' : 'bg-brand-100 text-brand-700'))}>
                      <Icon name="chevron-down" className={cx('text-xs transition-transform duration-300', isOpen && 'rotate-180')} />
                    </button>
                  </td>
                </tr>
                <tr className={cx(!isOpen && 'hidden')}>
                  <td colSpan={columns.length + 1} className="p-0">
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className={cx('px-3 pb-4 pt-1 sm:px-4', dark ? 'bg-white/5' : 'bg-slate-50/70')}>
                            <dl className="m-0 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
                              {columns.filter((c) => (c.priority || 1) > 1).map((c) => (
                                <div key={c.key} className={cx(HIDE_WHEN_SHOWN[c.priority])}>
                                  <dt className={cx('text-[0.65rem] uppercase tracking-wider', dark ? 'text-white/50' : 'text-slate-400')}>{c.label}</dt>
                                  <dd className={cx('m-0 font-semibold', dark ? 'text-white' : 'text-slate-800')}>{cell(c, row)}</dd>
                                </div>
                              ))}
                            </dl>
                            {extra && <div className="pt-3">{extra}</div>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
