import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api, asset } from '../lib/api';
import { useSite } from '../context/SiteContext';
import { cx, initials } from '../lib/utils';
import { Icon, Spinner } from '../components/ui';
import SchemaForm from './fields/SchemaForm';

/** Generic list + modal editor driven by a resource config (see resourceConfigs.js). */
export default function ResourceManager({ config }) {
  const site = useSite();
  const [rows, setRows] = useState([]);
  const [related, setRelated] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({});
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const endpoint = `/admin/${config.resource}`;

  const load = useCallback(async () => {
    try {
      const [list, ...rel] = await Promise.all([api.get(endpoint), ...(config.needs ?? []).map((r) => api.get(`/admin/${r}`))]);
      setRows(list);
      setRelated(Object.fromEntries((config.needs ?? []).map((r, i) => [r, rel[i]])));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, config.needs]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const ctx = useMemo(() => ({ ...related, [config.resource]: rows, tiers: site.tiers, editing }), [related, rows, site.tiers, config.resource, editing]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) =>
      Object.entries(filters).every(([k, v]) => v === '' || v === undefined || String(r[k] ?? '') === String(v)) &&
      (!term || (config.searchKeys ?? ['name']).some((k) => String(r[k] ?? '').toLowerCase().includes(term))));
  }, [rows, q, filters, config.searchKeys]);
  const canReorder = config.reorderable && !q && !Object.values(filters).some(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const body = config.beforeSave ? config.beforeSave(editing) : editing;
      if (editing.id) await api.put(`${endpoint}/${editing.id}`, body);
      else await api.post(endpoint, body);
      toast.success(`${config.singular} ${editing.id ? 'updated' : 'added'}`);
      setEditing(null);
      await load();
      if (config.reloadSite) site.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.del(`${endpoint}/${confirm.id}`);
      toast.success(`${config.singular} deleted`);
      setConfirm(null);
      await load();
      if (config.reloadSite) site.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /** Quick change from the list (e.g. mark a tender awarded) without opening the editor. */
  const quick = async (row, patch, message) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    try {
      await api.put(`${endpoint}/${row.id}`, patch);
      if (message) toast.success(message);
      if (config.reloadSite) site.reload();
    } catch (e) {
      toast.error(e.message);
      load();
    }
  };

  const toggle = async (row, key) => {
    const next = row[key] ? 0 : 1;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [key]: next } : r)));
    try {
      await api.put(`${endpoint}/${row.id}`, { [key]: next });
      if (config.reloadSite) site.reload();
    } catch (e) {
      toast.error(e.message);
      load();
    }
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    setRows(next);
    try {
      await api.post(`${endpoint}/reorder`, { ids: next.map((r) => r.id) });
      if (config.reloadSite) site.reload();
    } catch (e) {
      toast.error(e.message);
      load();
    }
  };

  const fields = typeof config.fields === 'function' ? config.fields(ctx) : config.fields;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <p className="m-0 text-slate-500 flex-1">{config.description}</p>
        <button onClick={() => setEditing(config.defaults ? config.defaults(ctx) : {})} className="btn btn-primary !rounded-xl !px-5 flex items-center gap-2 self-start lg:self-auto shadow-glow">
          <Icon name="plus-lg" />Add {config.singular.toLowerCase()}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="form-control !pl-10 !rounded-xl" placeholder={`Search ${config.title.toLowerCase()}…`} />
        </div>
        {(config.filters ?? []).map((f) => (
          <select key={f.key} value={filters[f.key] ?? ''} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} className="form-select !rounded-xl md:!w-56">
            <option value="">{f.label}: all</option>
            {f.options(ctx).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>{filtered.length} {filtered.length === 1 ? config.singular.toLowerCase() : config.title.toLowerCase()}</span>
          {config.reorderable && <span className="hidden sm:block normal-case tracking-normal font-normal">{canReorder ? 'Use the arrows to set the display order' : 'Clear search & filters to reorder'}</span>}
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : !filtered.length ? (
          <div className="p-12 text-center text-slate-400"><Icon name={config.icon} className="text-4xl" /><p className="mt-2 mb-0">No {config.title.toLowerCase()} found.</p></div>
        ) : (
          <ul className="list-none m-0 p-0 divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {filtered.map((row) => {
                const index = rows.indexOf(row);
                const img = config.imageKey && row[config.imageKey];
                const inactive = config.activeKey && !row[config.activeKey];
                return (
                  <motion.li key={row.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
                    className={cx('flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50/80 transition-colors', inactive && 'opacity-60')}>
                    {canReorder && (
                      <div className="flex flex-col shrink-0">
                        <button onClick={() => move(index, -1)} disabled={index === 0} className="h-5 w-6 text-slate-400 hover:text-brand-600 disabled:opacity-20" aria-label="Move up"><Icon name="caret-up-fill" /></button>
                        <button onClick={() => move(index, 1)} disabled={index === rows.length - 1} className="h-5 w-6 text-slate-400 hover:text-brand-600 disabled:opacity-20" aria-label="Move down"><Icon name="caret-down-fill" /></button>
                      </div>
                    )}
                    {config.imageKey !== undefined && (
                      img ? <img src={asset(img)} alt="" className={cx('h-10 w-10 sm:h-12 sm:w-12 shrink-0 object-cover', config.roundImage ? 'rounded-full' : 'rounded-xl')} />
                        : <span className={cx('grid place-items-center h-10 w-10 sm:h-12 sm:w-12 shrink-0 bg-brand-50 text-brand-700 font-bold text-sm', config.roundImage ? 'rounded-full' : 'rounded-xl')}>
                          {config.fallbackIcon ? <Icon name={row.icon || config.fallbackIcon} className="text-lg" /> : initials(row[config.titleKey])}
                        </span>
                    )}
                    <button onClick={() => setEditing({ ...row })} className="min-w-0 flex-1 text-left">
                      <p className="m-0 font-semibold text-slate-800 truncate hover:text-brand-700">{row[config.titleKey]}</p>
                      <p className="m-0 text-sm text-slate-500 truncate">{config.subtitle?.(row, ctx)}</p>
                    </button>
                    <div className="hidden md:flex flex-wrap gap-1.5 justify-end max-w-[40%]">
                      {config.badges?.(row, ctx).filter(Boolean).map((b) => <span key={b.label} className={cx('badge !font-semibold', b.tone === 'accent' ? 'text-bg-warning' : b.tone === 'muted' ? 'text-bg-light' : 'badge-soft')}>{b.label}</span>)}
                    </div>
                    {config.activeKey && (
                      <span className="form-check form-switch m-0 shrink-0" title={inactive ? 'Hidden from website' : 'Visible on website'}>
                        <input className="form-check-input !ml-0 cursor-pointer" type="checkbox" role="switch" checked={!inactive} onChange={() => toggle(row, config.activeKey)} aria-label="Visible on website" />
                      </span>
                    )}
                    <div className="flex shrink-0">
                      {config.actions?.(row).filter(Boolean).map((a) => (
                        <button key={a.label} onClick={() => quick(row, a.patch, a.done)} title={a.label} aria-label={a.label}
                          className={cx('grid place-items-center h-9 w-9 rounded-lg transition', a.active ? 'text-accent-600 bg-accent-50 hover:bg-accent-100' : 'text-slate-400 hover:bg-brand-50 hover:text-brand-700')}>
                          <Icon name={a.icon} />
                        </button>
                      ))}
                      <button onClick={() => setEditing({ ...row })} className="hidden sm:grid place-items-center h-9 w-9 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><Icon name="pencil-square" /></button>
                      <button onClick={() => setConfirm(row)} className="grid place-items-center h-9 w-9 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Icon name="trash" /></button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} size={config.modalSize || 'lg'} centered scrollable backdrop="static">
        <Modal.Header closeButton className="!px-6">
          <Modal.Title as="h5" className="!font-bold flex items-center gap-2"><Icon name={config.icon} className="text-brand-600" />{editing?.id ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="!p-6 bg-slate-50/50">
          {editing && <SchemaForm fields={fields} value={editing} onChange={setEditing} ctx={ctx} />}
        </Modal.Body>
        <Modal.Footer className="!px-6">
          <button className="btn btn-light !rounded-xl" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary !rounded-xl !px-5 flex items-center gap-2" onClick={save} disabled={saving}>{saving ? <Spinner className="!h-4 !w-4" /> : <Icon name="check2" />}Save</button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(confirm)} onHide={() => setConfirm(null)} centered size="sm">
        <Modal.Body className="!p-6 text-center">
          <span className="inline-grid place-items-center h-14 w-14 rounded-full bg-red-50 text-red-600 text-2xl"><Icon name="exclamation-triangle" /></span>
          <h5 className="mt-3 font-bold">Delete {config.singular.toLowerCase()}?</h5>
          <p className="text-sm text-slate-500"><strong>{confirm?.[config.titleKey]}</strong> will be permanently removed.{config.deleteNote && ` ${config.deleteNote}`}</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-light !rounded-xl" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger !rounded-xl" onClick={remove}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
