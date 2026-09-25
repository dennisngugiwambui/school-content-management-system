import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api, asset } from '../lib/api';
import { cx } from '../lib/utils';
import { Icon, Spinner } from '../components/ui';
import SchemaForm from './fields/SchemaForm';

const ALBUM_FIELDS = [
  { key: 'title', label: 'Album title', required: true, col: 'col-md-8' },
  { key: 'event_date', type: 'date', label: 'Date', col: 'col-md-4' },
  { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
  { key: 'cover', type: 'image', label: 'Cover image (optional — first photo is used otherwise)', col: 'col-md-6' },
  { key: 'is_active', type: 'switch', label: 'Visible on website', col: 'col-md-6' },
];

function Photos({ album, onBack, onChanged }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const load = useCallback(async () => {
    try { setImages(await api.get(`/admin/images?album_id=${album.id}`)); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }, [album.id]);
  useEffect(() => { load(); }, [load]);

  const upload = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(files.length);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i += 8) {
        const out = await api.upload(files.slice(i, i + 8));
        urls.push(...out.map((o) => o.url));
        setUploading(Math.max(files.length - urls.length, 0));
      }
      setImages(await api.post('/admin/images/bulk', { album_id: album.id, urls }));
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} added`);
      onChanged();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(0);
    }
  };

  const caption = async (img, text) => {
    try { await api.put(`/admin/images/${img.id}`, { caption: text }); } catch (e) { toast.error(e.message); }
  };
  const remove = async (img) => {
    setImages((l) => l.filter((i) => i.id !== img.id));
    try { await api.del(`/admin/images/${img.id}`); onChanged(); } catch (e) { toast.error(e.message); load(); }
  };
  const move = async (k, d) => {
    const j = k + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[k], next[j]] = [next[j], next[k]];
    setImages(next);
    try { await api.post('/admin/images/reorder', { ids: next.map((i) => i.id) }); } catch (e) { toast.error(e.message); }
  };
  const makeCover = async (img) => {
    try { await api.put(`/admin/albums/${album.id}`, { cover: img.url }); toast.success('Cover updated'); onChanged(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <button onClick={onBack} className="btn btn-light !rounded-xl mb-4"><Icon name="arrow-left" /> All albums</button>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="m-0 text-2xl font-bold">{album.title}</h2>
          <p className="m-0 text-slate-500">{images.length} photos · Hover a photo to reorder, set as cover or delete. Click a caption to edit it.</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        onClick={() => !uploading && input.current?.click()}
        className={cx('mb-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition', drag ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40')}
      >
        {uploading ? <><Spinner className="h-8 w-8 text-brand-600" /><p className="m-0 font-semibold text-brand-700">Uploading… {uploading} remaining</p></> : (
          <>
            <Icon name="cloud-arrow-up" className="text-4xl text-brand-500" />
            <p className="m-0 font-semibold text-slate-700">Drop photos here or click to choose</p>
            <p className="m-0 text-xs text-slate-400">Select many at once · JPG, PNG, WEBP up to 10 MB each</p>
          </>
        )}
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      </div>

      {loading ? <div className="row g-3">{[0, 1, 2, 3].map((i) => <div key={i} className="col-6 col-md-3"><div className="skeleton aspect-square" /></div>)}</div> : (
        <div className="row g-3">
          <AnimatePresence>
            {images.map((img, k) => (
              <motion.div key={img.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="col-6 col-md-4 col-xl-3">
                <div className="group overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                  <div className="relative aspect-square">
                    <img src={asset(img.url)} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {album.cover === img.url && <span className="absolute left-2 top-2 badge text-bg-warning">Cover</span>}
                    <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-ink-950/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                      {[['arrow-left', 'Move earlier', () => move(k, -1)], ['arrow-right', 'Move later', () => move(k, 1)], ['star', 'Set as cover', () => makeCover(img)]].map(([icon, title, fn]) => (
                        <button key={icon} onClick={fn} title={title} className="grid place-items-center h-8 w-8 rounded-full bg-white/90 text-slate-700 hover:bg-brand-600 hover:text-white"><Icon name={icon} /></button>
                      ))}
                      <button onClick={() => remove(img)} title="Delete" className="grid place-items-center h-8 w-8 rounded-full bg-white/90 text-red-600 hover:bg-red-600 hover:text-white"><Icon name="trash" /></button>
                    </div>
                  </div>
                  <input defaultValue={img.caption} onBlur={(e) => e.target.value !== img.caption && caption(img, e.target.value)} placeholder="Add caption…" className="w-full border-0 px-3 py-2 text-xs focus:outline-none focus:bg-brand-50" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function GalleryAdmin() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await api.get('/admin/albums');
      setAlbums(list);
      setOpen((o) => (o ? list.find((a) => a.id === o.id) ?? null : o));
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = editing.id ? await api.put(`/admin/albums/${editing.id}`, editing) : await api.post('/admin/albums', editing);
      toast.success(editing.id ? 'Album updated' : 'Album created — now add photos');
      setEditing(null);
      await load();
      if (!editing.id) setOpen(saved);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const remove = async () => {
    try { await api.del(`/admin/albums/${confirm.id}`); toast.success('Album deleted'); setConfirm(null); load(); } catch (e) { toast.error(e.message); }
  };
  const move = async (k, d) => {
    const j = k + d;
    if (j < 0 || j >= albums.length) return;
    const next = [...albums];
    [next[k], next[j]] = [next[j], next[k]];
    setAlbums(next);
    try { await api.post('/admin/albums/reorder', { ids: next.map((a) => a.id) }); } catch (e) { toast.error(e.message); }
  };

  if (open) return <div className="max-w-6xl"><Photos album={open} onBack={() => setOpen(null)} onChanged={load} /></div>;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <p className="m-0 text-slate-500 flex-1">Organise photos into albums (events, sports, campus life…). Albums appear as filters on the gallery page.</p>
        <button onClick={() => setEditing({ is_active: 1, event_date: new Date().toISOString().slice(0, 10) })} className="btn btn-primary !rounded-xl !px-5 flex items-center gap-2 self-start shadow-glow"><Icon name="folder-plus" />New album</button>
      </div>
      {loading ? <div className="row g-4">{[0, 1, 2].map((i) => <div key={i} className="col-md-4"><div className="skeleton h-64" /></div>)}</div> : !albums.length ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400"><Icon name="images" className="text-5xl" /><p className="mt-2">No albums yet. Create your first album.</p></div>
      ) : (
        <div className="row g-4">
          {albums.map((a, k) => (
            <motion.div key={a.id} layout className="col-sm-6 col-lg-4">
              <div className={cx('group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm hover:shadow-soft transition', !a.is_active && 'opacity-60')}>
                <button onClick={() => setOpen(a)} className="relative block w-full aspect-[16/10] bg-brand-50">
                  {(a.cover || a.first_image) ? <img src={asset(a.cover || a.first_image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <Icon name="images" className="text-4xl text-brand-300" />}
                  <span className="absolute right-3 top-3 badge text-bg-dark"><Icon name="images" /> {a.image_count}</span>
                  {!a.is_active && <span className="absolute left-3 top-3 badge text-bg-light">Hidden</span>}
                </button>
                <div className="flex items-center gap-2 p-4">
                  <button onClick={() => setOpen(a)} className="min-w-0 flex-1 text-left">
                    <p className="m-0 font-semibold text-slate-800 truncate">{a.title}</p>
                    <p className="m-0 text-xs text-slate-400">{a.event_date || 'No date'}</p>
                  </button>
                  <button onClick={() => move(k, -1)} disabled={k === 0} className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-20" aria-label="Move earlier"><Icon name="arrow-left" /></button>
                  <button onClick={() => move(k, 1)} disabled={k === albums.length - 1} className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-20" aria-label="Move later"><Icon name="arrow-right" /></button>
                  <button onClick={() => setEditing({ ...a })} className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit album"><Icon name="pencil-square" /></button>
                  <button onClick={() => setConfirm(a)} className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete album"><Icon name="trash" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} centered size="lg" backdrop="static">
        <Modal.Header closeButton><Modal.Title as="h5" className="!font-bold">{editing?.id ? 'Edit album' : 'New album'}</Modal.Title></Modal.Header>
        <Modal.Body className="!p-6">{editing && <SchemaForm fields={ALBUM_FIELDS} value={editing} onChange={setEditing} />}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-light !rounded-xl" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn-primary !rounded-xl flex items-center gap-2" onClick={save} disabled={saving}>{saving && <Spinner className="!h-4 !w-4" />}Save</button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(confirm)} onHide={() => setConfirm(null)} centered size="sm">
        <Modal.Body className="!p-6 text-center">
          <span className="inline-grid place-items-center h-14 w-14 rounded-full bg-red-50 text-red-600 text-2xl"><Icon name="exclamation-triangle" /></span>
          <h5 className="mt-3 font-bold">Delete album?</h5>
          <p className="text-sm text-slate-500"><strong>{confirm?.title}</strong> and its {confirm?.image_count} photos will be removed from the website.</p>
          <div className="flex gap-2 justify-center"><button className="btn btn-light !rounded-xl" onClick={() => setConfirm(null)}>Cancel</button><button className="btn btn-danger !rounded-xl" onClick={remove}>Delete</button></div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
