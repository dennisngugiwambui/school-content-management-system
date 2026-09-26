import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Accordion from 'react-bootstrap/Accordion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useSite } from '../context/SiteContext';
import { Icon } from '../components/ui';
import SchemaForm from './fields/SchemaForm';
import { CONTENT_SCHEMAS } from './schemas';
import SaveBar from './SaveBar';
import useUnsaved from './useUnsaved';

export default function ContentEditor() {
  const { key } = useParams();
  const schema = CONTENT_SCHEMAS[key];
  const { reload } = useSite();
  const [original, setOriginal] = useState(null);
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(null);
    api.get(`/admin/content/${key}`).then((d) => { setOriginal(d); setValue(d); }).catch((e) => toast.error(e.message));
  }, [key]);

  const dirty = useMemo(() => value && JSON.stringify(value) !== JSON.stringify(original), [value, original]);
  useUnsaved(dirty);

  const save = async () => {
    setSaving(true);
    try {
      const d = await api.put(`/admin/content/${key}`, value);
      setOriginal(d);
      setValue(d);
      await reload();
      toast.success('Changes published to the website');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!schema) return <p>Unknown section.</p>;
  if (!value) return <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>;

  return (
    <div className="max-w-5xl pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="m-0 text-slate-500 max-w-2xl">{schema.description}</p>
        {schema.preview && <a href={schema.preview} target="_blank" rel="noreferrer" className="btn btn-outline-primary !rounded-xl shrink-0"><Icon name="eye" /> Preview page</a>}
      </div>
      <Accordion defaultActiveKey={schema.sections[0].key} alwaysOpen className="space-y-3">
        {schema.sections.map((s) => {
          const sectionValue = s.whole ? value : value[s.key] ?? {};
          const enabled = s.whole ? true : sectionValue.enabled;
          return (
            <Accordion.Item key={s.key} eventKey={s.key} className="!rounded-2xl !border-0 ring-1 ring-slate-200 overflow-hidden bg-white shadow-sm">
              <Accordion.Header>
                <span className="flex items-center gap-3 w-full pr-3">
                  <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-50 text-brand-700"><Icon name={s.icon} /></span>
                  <span className="font-semibold text-slate-800">{s.title}</span>
                  {enabled === false && <span className="ml-auto badge text-bg-light">Hidden</span>}
                </span>
              </Accordion.Header>
              <Accordion.Body>
                {s.help && <p className="text-sm text-slate-500 flex gap-2"><Icon name="info-circle" className="text-brand-600" />{s.help}</p>}
                <SchemaForm
                  fields={s.fields}
                  value={sectionValue}
                  onChange={(v) => setValue(s.whole ? v : { ...value, [s.key]: v })}
                  ctx={{ content: value }}
                />
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setValue(original)} />
    </div>
  );
}
