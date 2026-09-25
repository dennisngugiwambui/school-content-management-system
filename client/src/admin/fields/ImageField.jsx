import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, asset } from '../../lib/api';
import { cx } from '../../lib/utils';
import { Icon, Spinner } from '../../components/ui';

/** Image picker: upload (click or drag & drop), paste a URL, preview and remove. */
export default function ImageField({ value, onChange, aspect = 'aspect-video', round = false, noUrl = false }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    setBusy(true);
    try {
      const [out] = await api.upload(file);
      onChange(out.url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
        className={cx(
          'group relative overflow-hidden border-2 border-dashed transition bg-slate-50',
          round ? 'h-36 w-36 rounded-full mx-auto' : `${aspect} w-full rounded-xl`,
          drag ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
        )}
      >
        {value ? (
          <img src={asset(value)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-600">
            <Icon name="cloud-arrow-up" className="text-3xl" />
            <span className="text-xs font-medium px-2 text-center">Click or drop image</span>
          </button>
        )}
        {value && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/55 opacity-0 group-hover:opacity-100 transition">
            <button type="button" onClick={() => input.current?.click()} className="grid place-items-center h-9 w-9 rounded-full bg-white text-slate-700 hover:bg-brand-600 hover:text-white" title="Replace"><Icon name="arrow-repeat" /></button>
            <button type="button" onClick={() => onChange('')} className="grid place-items-center h-9 w-9 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white" title="Remove"><Icon name="trash" /></button>
          </div>
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-white/80 text-brand-600"><Spinner className="h-8 w-8" /></div>}
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className={cx('mt-2 flex items-center gap-2', round && 'justify-center')}>
        <button type="button" onClick={() => input.current?.click()} className="btn btn-sm btn-outline-primary !rounded-lg"><Icon name="upload" /> Upload</button>
        {!noUrl && <button type="button" onClick={() => setUrlMode((v) => !v)} className="btn btn-sm btn-light !rounded-lg"><Icon name="link-45deg" /> URL</button>}
      </div>
      {urlMode && (
        <input className="form-control form-control-sm mt-2" placeholder="https://…" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
