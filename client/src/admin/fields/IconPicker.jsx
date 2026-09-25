import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from '../../lib/utils';
import { Icon } from '../../components/ui';

const ICONS = [
  'mortarboard', 'mortarboard-fill', 'book', 'book-half', 'journal-bookmark', 'journal-text', 'pencil', 'backpack', 'building', 'bank',
  'flask', 'calculator', 'translate', 'globe', 'globe2', 'globe-europe-africa', 'globe-americas', 'cpu', 'laptop', 'pc-display',
  'palette', 'palette2', 'music-note-beamed', 'mic', 'camera', 'film', 'brush', 'heart', 'heart-pulse', 'bandaid', 'capsule',
  'people', 'people-fill', 'person', 'person-badge', 'person-check', 'person-hearts', 'award', 'award-fill', 'trophy', 'trophy-fill',
  'star', 'star-fill', 'stars', 'gem', 'lightbulb', 'bullseye', 'eye', 'shield-check', 'hand-thumbs-up', 'emoji-smile',
  'dribbble', 'bicycle', 'tree', 'flower1', 'sun', 'water', 'house', 'house-door', 'bus-front', 'cup-hot', 'egg-fried',
  'calendar-event', 'calendar3', 'clock', 'clock-history', 'bell', 'megaphone', 'newspaper', 'chat-quote', 'quote', 'envelope',
  'telephone', 'geo-alt', 'map', 'compass', 'diagram-3', 'grid', 'images', 'image', 'rocket-takeoff', 'tools', 'gear', 'briefcase',
  'graph-up-arrow', 'bar-chart', 'check2-circle', 'patch-check', 'box-seam', 'puzzle', 'controller', 'boxes',
];

export default function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const list = ICONS.filter((i) => i.includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <div className="input-group">
        <button type="button" onClick={() => setOpen((v) => !v)} className="input-group-text !bg-brand-50 !text-brand-700 !text-lg !px-3" aria-label="Choose icon">
          <Icon name={value || 'question-circle'} />
        </button>
        <input className="form-control" value={value || ''} onChange={(e) => onChange(e.target.value.replace(/^bi-?/, ''))} placeholder="icon name" onFocus={() => setOpen(true)} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute z-30 mt-2 w-full min-w-[260px] rounded-xl bg-white p-3 shadow-lift ring-1 ring-slate-200">
            <input className="form-control form-control-sm mb-2" placeholder="Search icons…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-52 overflow-y-auto scrollbar-thin">
              {list.map((i) => (
                <button key={i} type="button" title={i} onClick={() => { onChange(i); setOpen(false); }}
                  className={cx('grid place-items-center aspect-square rounded-lg text-lg transition', value === i ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700')}>
                  <Icon name={i} />
                </button>
              ))}
            </div>
            <a href="https://icons.getbootstrap.com/" target="_blank" rel="noreferrer" className="block mt-2 text-xs text-brand-700 hover:underline">Browse 2,000+ more icons — type any name above</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
