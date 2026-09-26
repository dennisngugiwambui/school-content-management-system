import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, asset } from '../../lib/api';
import { cx, fileSize } from '../../lib/utils';
import { Icon, Spinner } from '../../components/ui';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx';
const iconFor = (name = '') => ({ pdf: 'file-earmark-pdf-fill', doc: 'file-earmark-word-fill', docx: 'file-earmark-word-fill', xls: 'file-earmark-excel-fill', xlsx: 'file-earmark-excel-fill' }[name.split('.').pop().toLowerCase()] || 'file-earmark-fill');

/** Document picker (PDF, Word, Excel): upload by click or drop, then view, replace or remove. */
export default function FileField({ value, name, size, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!/\.(pdf|docx?|xlsx?)$/i.test(file.name)) return toast.error('Please choose a PDF, Word or Excel document.');
    setBusy(true);
    try {
      const out = await api.uploadDocument(file);
      onChange(out.url, { name: out.name, size: out.size });
      toast.success('Document uploaded');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const label = name || (value ? value.split('/').pop() : '');
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
      className={cx('relative rounded-xl border-2 border-dashed p-4 transition', drag ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50')}
    >
      {value ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-red-50 text-2xl text-red-600"><Icon name={iconFor(label)} /></span>
          <div className="min-w-0 flex-1">
            <p className="m-0 font-semibold text-slate-800 break-all">{label}</p>
            {size > 0 && <p className="m-0 text-xs text-slate-500">{fileSize(size)}</p>}
          </div>
          <div className="flex gap-1.5">
            <a href={asset(value)} target="_blank" rel="noreferrer" className="btn btn-sm btn-light !rounded-lg"><Icon name="eye" /> View</a>
            <button type="button" onClick={() => input.current?.click()} className="btn btn-sm btn-outline-primary !rounded-lg"><Icon name="arrow-repeat" /> Replace</button>
            <button type="button" onClick={() => onChange('', { name: '', size: 0 })} className="btn btn-sm btn-light !rounded-lg text-red-600" aria-label="Remove document"><Icon name="trash" /></button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-1 py-4 text-slate-500 hover:text-brand-700">
          <Icon name="file-earmark-arrow-up" className="text-3xl" />
          <span className="text-sm font-semibold">Click or drop the tender document here</span>
          <span className="text-xs">PDF recommended · Word and Excel also accepted</span>
        </button>
      )}
      {busy && <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/80 text-brand-600"><Spinner className="h-8 w-8" /></div>}
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}
