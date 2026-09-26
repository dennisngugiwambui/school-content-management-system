import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { applyTheme, THEME_PRESETS } from '../lib/color';
import { useSite } from '../context/SiteContext';
import { cx, mapEmbedSrc } from '../lib/utils';
import { Icon } from '../components/ui';
import SchemaForm from './fields/SchemaForm';
import { SETTINGS_TABS } from './schemas';
import SaveBar from './SaveBar';
import useUnsaved from './useUnsaved';

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
const setPath = (obj, path, v) => {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setPath(obj?.[head] ?? {}, rest.join('.'), v) : v };
};

function ThemePreview({ theme }) {
  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-sm">
      <div className="bg-ink-900 px-4 py-1.5 text-[0.7rem] text-white/70 flex gap-3"><span><Icon name="telephone" /> +254 700 000 000</span><span className="rounded-full bg-accent-400 px-2 text-ink-900 font-bold">News</span></div>
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <span className="font-heading font-extrabold text-slate-900" style={{ fontFamily: theme.headingFont }}>Your School</span>
        <span className="flex gap-3 text-xs font-semibold text-slate-600"><span className="text-brand-700 border-b-2 border-brand-600">Home</span><span>About</span><span>Staff</span></span>
      </div>
      <div className="bg-gradient-to-br from-brand-700 to-ink-900 p-6">
        <p className="m-0 text-xs uppercase tracking-widest text-accent-300">Welcome</p>
        <p className="m-0 mt-1 text-2xl font-bold text-white" style={{ fontFamily: theme.headingFont }}>Nurturing Minds</p>
        <p className="m-0 mt-1 text-sm text-white/75" style={{ fontFamily: theme.bodyFont }}>Body text uses {theme.bodyFont}.</p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-theme bg-brand-600 px-4 py-2 text-xs font-semibold text-white">Primary</span>
          <span className="rounded-theme bg-accent-400 px-4 py-2 text-xs font-semibold text-ink-900">Accent</span>
        </div>
      </div>
      <div className="grid grid-cols-11">
        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => <span key={s} className="h-6" style={{ background: `rgb(var(--brand-${s}))` }} title={`brand-${s}`} />)}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { reload, settings: live } = useSite();
  const [original, setOriginal] = useState(null);
  const [value, setValue] = useState(null);
  const [tab, setTab] = useState('identity');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/admin/settings').then((d) => { setOriginal(d); setValue(d); }).catch((e) => toast.error(e.message)); }, []);
  // Live-preview theme edits across the whole admin; revert if the page is left unsaved.
  useEffect(() => { if (value?.theme) applyTheme(value.theme); }, [value?.theme]);
  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => () => { if (liveRef.current?.theme) applyTheme(liveRef.current.theme); }, []);

  const dirty = useMemo(() => value && JSON.stringify(value) !== JSON.stringify(original), [value, original]);
  useUnsaved(dirty);

  const save = async () => {
    setSaving(true);
    try {
      const d = await api.put('/admin/settings', value);
      setOriginal(d);
      setValue(d);
      await reload();
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!value) return <div className="skeleton h-96 max-w-5xl" />;
  const current = SETTINGS_TABS.find((t) => t.key === tab);

  // Tabs either edit a nested object (theme, contact…) or top-level / dotted keys.
  let formValue;
  let onFormChange;
  if (current.nested) {
    formValue = value[current.nested] ?? {};
    onFormChange = (v) => setValue({ ...value, [current.nested]: v });
  } else {
    formValue = Object.fromEntries(current.fields.filter((f) => f.key).map((f) => [f.key, getPath(value, f.key)]));
    onFormChange = (v) => setValue(Object.entries(v).reduce((acc, [k, val]) => (k.startsWith('_') ? acc : setPath(acc, k, val)), value));
  }

  return (
    <div className="max-w-6xl pb-24">
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-6">
        {SETTINGS_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cx('relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition', tab === t.key ? 'text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-700')}>
            {tab === t.key && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-brand-600" />}
            <Icon name={t.icon} className="relative" /><span className="relative">{t.title}</span>
          </button>
        ))}
      </div>

      <div className="row g-4">
        <div className={tab === 'theme' ? 'col-lg-7' : 'col-12'}>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 md:p-7 ring-1 ring-slate-100 shadow-sm">
            {tab === 'theme' && (
              <div className="mb-6">
                <p className="form-label">Quick presets</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_PRESETS.map((p) => (
                    <button key={p.name} type="button" onClick={() => setValue({ ...value, theme: { ...value.theme, primary: p.primary, accent: p.accent, dark: p.dark } })}
                      className={cx('rounded-xl p-2 ring-2 text-left transition hover:scale-[1.03]', value.theme.primary === p.primary ? 'ring-brand-600 bg-brand-50' : 'ring-slate-100')}>
                      <span className="flex h-7 overflow-hidden rounded-lg"><span className="flex-[2]" style={{ background: p.primary }} /><span className="flex-1" style={{ background: p.accent }} /><span className="flex-1" style={{ background: p.dark }} /></span>
                      <span className="block mt-1.5 text-xs font-semibold text-slate-600">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <SchemaForm fields={current.fields} value={formValue} onChange={onFormChange} />
            {tab === 'contact' && (
              <div className="mt-5">
                <p className="form-label">Map preview (as shown on the About page)</p>
                {mapEmbedSrc(value.contact)
                  ? <iframe title="Map preview" src={mapEmbedSrc(value.contact)} className="h-72 w-full rounded-xl ring-1 ring-slate-200" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  : <p className="m-0 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-100"><Icon name="geo-alt" /> Enter a physical location or a place to pin, and the map appears here.</p>}
              </div>
            )}
          </motion.div>
        </div>
        {tab === 'theme' && (
          <div className="col-lg-5">
            <div className="lg:sticky lg:top-24">
              <p className="form-label">Live preview</p>
              <ThemePreview theme={value.theme} />
              <p className="text-xs text-slate-500 mt-3"><Icon name="info-circle" /> The whole admin previews your colours now. Save to publish them on the website.</p>
            </div>
          </div>
        )}
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setValue(original)} />
    </div>
  );
}
