import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FONT_OPTIONS } from '../../lib/color';
import { cx } from '../../lib/utils';
import { Icon } from '../../components/ui';
import ImageField from './ImageField';
import IconPicker from './IconPicker';

/**
 * Declarative form renderer used by every CMS editor.
 * A field: { key, label, type, col, help, placeholder, options, fields (group/list), itemLabel, newItem, showIf, rows }
 */
export default function SchemaForm({ fields, value = {}, onChange, ctx = {} }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  return (
    <div className="row g-3">
      {fields.map((f, i) => {
        if (f.showIf && !f.showIf(value, ctx)) return null;
        if (f.type === 'heading') {
          return (
            <div key={`h${i}`} className={cx(f.col || 'col-12', 'pt-2')}>
              <h6 className="m-0 text-xs font-bold uppercase tracking-[0.15em] text-brand-700 flex items-center gap-2">{f.icon && <Icon name={f.icon} />}{f.label}</h6>
              {f.help && <p className="m-0 text-xs text-slate-500 mt-1">{f.help}</p>}
            </div>
          );
        }
        return (
          <div key={f.key} className={f.col || 'col-12'}>
            <Field field={f} value={value[f.key]} onChange={(v) => set(f.key, v)} ctx={ctx} parent={value} />
          </div>
        );
      })}
    </div>
  );
}

function Label({ field }) {
  if (!field.label || field.type === 'switch') return null;
  return <label className="form-label">{field.label}{field.required && <span className="text-red-500"> *</span>}</label>;
}

function Help({ field }) {
  return field.help && field.type !== 'switch' ? <p className="text-xs text-slate-500 mt-1 mb-0">{field.help}</p> : null;
}

export function Field({ field: f, value, onChange, ctx, parent }) {
  const common = { className: 'form-control', placeholder: f.placeholder, value: value ?? '', onChange: (e) => onChange(e.target.value) };
  let control;
  switch (f.type) {
    case 'textarea':
      control = <textarea {...common} rows={f.rows || 4} />;
      break;
    case 'number':
      control = <input {...common} type="number" onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
      break;
    case 'date':
      control = <input {...common} type="date" value={String(value ?? '').slice(0, 10)} />;
      break;
    case 'email': case 'url': case 'password':
      control = <input {...common} type={f.type} autoComplete={f.type === 'password' ? 'new-password' : undefined} />;
      break;
    case 'switch':
      control = (
        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 cursor-pointer h-full">
          <span className="form-check form-switch m-0 pt-0.5">
            <input className="form-check-input !ml-0 cursor-pointer" type="checkbox" role="switch" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-700">{f.label}</span>
            {f.help && <span className="block text-xs text-slate-500">{f.help}</span>}
          </span>
        </label>
      );
      break;
    case 'select': {
      const opts = typeof f.options === 'function' ? f.options(ctx, parent) : f.options || [];
      control = (
        <select className="form-select" value={value ?? ''} onChange={(e) => onChange(f.numeric ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}>
          {f.empty !== false && <option value="">{f.empty || '— Select —'}</option>}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    }
    case 'font':
      control = (
        <select className="form-select" value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: value }}>
          {FONT_OPTIONS.map((o) => <option key={o} value={o} style={{ fontFamily: o }}>{o}</option>)}
        </select>
      );
      break;
    case 'color':
      control = (
        <div className="input-group">
          <input type="color" className="form-control form-control-color !w-14 !flex-none" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
          <input className="form-control font-mono uppercase" value={value || ''} onChange={(e) => onChange(e.target.value)} maxLength={7} />
        </div>
      );
      break;
    case 'image':
      control = <ImageField value={value} onChange={onChange} aspect={f.aspect} round={f.round} />;
      break;
    case 'images': {
      const list = Array.isArray(value) ? value : [];
      control = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {list.map((src, k) => (
            <ImageField key={k} value={src} onChange={(v) => onChange(v ? list.map((x, j) => (j === k ? v : x)) : list.filter((_, j) => j !== k))} aspect={f.aspect} noUrl />
          ))}
          <ImageField value="" onChange={(v) => v && onChange([...list, v])} aspect={f.aspect} noUrl />
        </div>
      );
      break;
    }
    case 'icon':
      control = <IconPicker value={value} onChange={onChange} />;
      break;
    case 'group':
      return (
        <div className="rounded-xl ring-1 ring-slate-200 p-4">
          {f.label && <h6 className="text-sm font-bold mb-3">{f.label}</h6>}
          <SchemaForm fields={f.fields} value={value || {}} onChange={onChange} ctx={ctx} />
        </div>
      );
    case 'list':
      control = <ListEditor field={f} value={Array.isArray(value) ? value : []} onChange={onChange} ctx={ctx} />;
      break;
    default:
      control = <input {...common} type="text" maxLength={f.maxLength} />;
  }
  return (
    <>
      <Label field={f} />
      {control}
      <Help field={f} />
    </>
  );
}

/** Repeatable items (slides, stats, values…) with add, reorder, duplicate and delete. */
export function ListEditor({ field: f, value, onChange, ctx }) {
  const [open, setOpen] = useState(null);
  const update = (i, item) => onChange(value.map((v, k) => (k === i ? item : v)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open === j ? i : open);
  };
  const add = () => {
    const item = typeof f.newItem === 'function' ? f.newItem() : { ...(f.newItem || {}) };
    onChange([...value, item]);
    setOpen(value.length);
  };
  const label = (item, i) => (f.itemLabel ? f.itemLabel(item, i) : item.title || item.label || item.name) || `${f.singular || 'Item'} ${i + 1}`;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {value.map((item, i) => (
          <motion.div key={i} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex flex-1 min-w-0 items-center gap-2 text-left text-sm font-semibold text-slate-700">
                <Icon name="chevron-right" className={cx('text-xs transition-transform', open === i && 'rotate-90')} />
                {item.icon && <Icon name={item.icon} className="text-brand-600" />}
                <span className="truncate">{label(item, i)}</span>
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                <IconBtn icon="arrow-up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
                <IconBtn icon="arrow-down" title="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1} />
                <IconBtn icon="copy" title="Duplicate" onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])} />
                <IconBtn icon="trash" title="Remove" danger onClick={() => { onChange(value.filter((_, k) => k !== i)); setOpen(null); }} />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-4"><SchemaForm fields={f.fields} value={item} onChange={(v) => update(i, v)} ctx={ctx} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
      {!value.length && <p className="text-sm text-slate-400 m-0 py-2">No {f.plural || 'items'} yet.</p>}
      {(!f.max || value.length < f.max) && (
        <button type="button" onClick={add} className="btn btn-sm btn-outline-primary !rounded-lg"><Icon name="plus-lg" /> Add {f.singular || 'item'}</button>
      )}
    </div>
  );
}

function IconBtn({ icon, title, onClick, disabled, danger }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={cx('grid place-items-center h-8 w-8 rounded-lg text-sm transition disabled:opacity-30', danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-white hover:text-brand-700')}>
      <Icon name={icon} />
    </button>
  );
}
