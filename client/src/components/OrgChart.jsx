import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, Icon } from './ui';
import { cx } from '../lib/utils';

/** Turn a flat staff list (parent_id = "reports to") into a tree. */
export function buildTree(people, tierRank) {
  const byId = new Map(people.map((p) => [p.id, { ...p, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    const parent = node.parent_id && byId.get(node.parent_id);
    (parent ? parent.children : roots).push(node);
  }
  const sort = (list) => {
    list.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.sort_order - b.sort_order);
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function NodeCard({ node, tierLabel, onOpen, expanded, onToggle, depth }) {
  const top = depth === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(depth * 0.08, 0.3) }}
      className="relative z-[1]"
    >
      <button
        type="button"
        onClick={() => onOpen(node)}
        className={cx(
          'group flex w-48 flex-col items-center rounded-2xl p-4 text-center ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
          top ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white ring-brand-700 shadow-glow' : 'bg-white ring-slate-200 shadow-soft'
        )}
      >
        <Avatar src={node.photo} name={node.name} className={cx('h-16 w-16 rounded-full ring-4', top ? 'ring-white/30' : 'ring-brand-50')} textClassName="text-lg" />
        <span className={cx('mt-3 text-sm font-bold leading-tight', top ? 'text-white' : 'text-slate-900')}>{node.name}</span>
        <span className={cx('mt-1 text-xs leading-snug', top ? 'text-white/80' : 'text-brand-700')}>{node.position}</span>
        {tierLabel && <span className={cx('mt-2 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide', top ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-700')}>{tierLabel}</span>}
      </button>
      {node.children.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-[2] grid place-items-center h-6 min-w-6 px-1.5 rounded-full bg-accent-400 text-ink-900 text-[0.7rem] font-bold shadow ring-2 ring-white hover:scale-110 transition"
          aria-label={expanded ? 'Hide team' : 'Show team'}
        >
          {expanded ? <Icon name="dash" /> : node.children.length}
        </button>
      )}
    </motion.div>
  );
}

function TreeNode({ node, depth, tierLabel, onOpen, defaultDepth }) {
  const [expanded, setExpanded] = useState(depth < defaultDepth);
  return (
    <li>
      <NodeCard node={node} depth={depth} tierLabel={tierLabel(node.tier)} onOpen={onOpen} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      {expanded && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} tierLabel={tierLabel} onOpen={onOpen} defaultDepth={defaultDepth} />)}
        </ul>
      )}
    </li>
  );
}

function VerticalNode({ node, depth, tierLabel, onOpen }) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <li className="relative">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onOpen(node)} className={cx('flex flex-1 items-center gap-3 rounded-xl p-3 text-left ring-1 transition hover:shadow-soft', depth === 0 ? 'bg-gradient-to-r from-brand-600 to-brand-800 text-white ring-brand-700' : 'bg-white ring-slate-200')}>
          <Avatar src={node.photo} name={node.name} className="h-12 w-12 shrink-0 rounded-full" textClassName="text-sm" />
          <span className="min-w-0">
            <span className={cx('block text-sm font-bold truncate', depth === 0 ? 'text-white' : 'text-slate-900')}>{node.name}</span>
            <span className={cx('block text-xs truncate', depth === 0 ? 'text-white/80' : 'text-brand-700')}>{node.position || tierLabel(node.tier)}</span>
          </span>
        </button>
        {node.children.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-700" aria-label={open ? 'Collapse' : 'Expand'}>
            <Icon name="chevron-down" className={cx('transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && node.children.length > 0 && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden list-none m-0 pl-5 ml-6 mt-2 space-y-2 border-l-2 border-brand-200">
            {node.children.map((c) => <VerticalNode key={c.id} node={c} depth={depth + 1} tierLabel={tierLabel} onOpen={onOpen} />)}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function OrgChart({ people, tiers, onOpen, defaultDepth = 3 }) {
  const tierRank = useMemo(() => {
    const m = new Map(tiers.map((t, i) => [t.key, i]));
    return (k) => (m.has(k) ? m.get(k) : tiers.length);
  }, [tiers]);
  const tierLabel = (k) => tiers.find((t) => t.key === k)?.label ?? '';
  const roots = useMemo(() => buildTree(people, tierRank), [people, tierRank]);

  return (
    <>
      <div className="hidden md:block overflow-x-auto scrollbar-thin pb-8">
        <div className="org-tree min-w-max px-4 mx-auto w-max">
          <ul>{roots.map((r) => <TreeNode key={r.id} node={r} depth={0} tierLabel={tierLabel} onOpen={onOpen} defaultDepth={defaultDepth} />)}</ul>
        </div>
      </div>
      <ul className="md:hidden list-none p-0 m-0 space-y-3">
        {roots.map((r) => <VerticalNode key={r.id} node={r} depth={0} tierLabel={tierLabel} onOpen={onOpen} />)}
      </ul>
    </>
  );
}
