import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { applyTheme, THEME_PRESETS } from '../lib/color';
import { cx, initials } from '../lib/utils';
import { Icon, Spinner } from '../components/ui';

const STEPS = [
  { title: 'School details', icon: 'building' },
  { title: 'Brand & colours', icon: 'palette' },
  { title: 'Administrator', icon: 'person-lock' },
];

/** First-run wizard: registers the school name, branding and the first admin account. */
export default function Setup() {
  const { reload } = useSite();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(null);
  const [f, setF] = useState({
    schoolName: 'Greenfield School', shortName: 'GFS', motto: 'Learn · Grow · Achieve', established: '1998', contactEmail: 'info@greenfield.co.ke', contactPhone: '+254 700 000 000', contactAddress: 'P.O. Box 1998 – 00100, Nairobi',
    primary: '#16a34a', accent: '#f59e0b', dark: '#0b2e1a',
    adminName: '', email: '', password: '', confirm: '', sampleData: true,
  });
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((s) => {
      const next = { ...s, [k]: v };
      if (['primary', 'accent', 'dark'].includes(k)) applyTheme({ primary: next.primary, accent: next.accent, dark: next.dark });
      return next;
    });
  };
  const preset = (p) => { setF((s) => ({ ...s, ...p })); applyTheme(p); };

  const valid = [
    f.schoolName.trim().length >= 3,
    true,
    f.adminName.trim() && /\S+@\S+\.\S+/.test(f.email) && f.password.length >= 8 && f.password === f.confirm,
  ];

  const submit = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => k !== 'confirm' && fd.append(k, String(v)));
      if (logo) fd.append('logo', logo);
      const { token, user } = await api.post('/setup', fd);
      signIn(token, user);
      await reload();
      toast.success(`${f.schoolName} is ready!`);
      navigate('/admin', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'form-control !py-3 !rounded-xl';
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50/40 py-10 px-4 relative overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-brand-600 text-white text-3xl shadow-glow"><Icon name="mortarboard-fill" /></span>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">Register your school</h1>
          <p className="text-slate-500">Set up your school website in three quick steps. Everything can be changed later from the CMS.</p>
        </motion.div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {STEPS.map((s, k) => (
            <div key={s.title} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className={cx('grid place-items-center h-10 w-10 rounded-full text-sm font-bold transition-all duration-500', k <= step ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-slate-400 ring-1 ring-slate-200')}>
                  {k < step ? <Icon name="check-lg" /> : <Icon name={s.icon} />}
                </span>
                <span className={cx('hidden sm:block text-sm font-semibold', k <= step ? 'text-brand-800' : 'text-slate-400')}>{s.title}</span>
              </div>
              {k < STEPS.length - 1 && <span className={cx('h-0.5 w-6 sm:w-12 rounded-full transition-colors duration-500', k < step ? 'bg-brand-600' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 md:p-10 shadow-lift ring-1 ring-slate-100">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              {step === 0 && (
                <div className="row g-4">
                  <div className="col-12"><label className="form-label">School name *</label><input className={input} value={f.schoolName} onChange={set('schoolName')} placeholder="e.g. Greenfield High School" autoFocus /></div>
                  <div className="col-md-6"><label className="form-label">Short name / initials</label><input className={input} value={f.shortName} onChange={set('shortName')} placeholder="e.g. GHS" /></div>
                  <div className="col-md-6"><label className="form-label">Year established</label><input className={input} value={f.established} onChange={set('established')} placeholder="e.g. 1998" /></div>
                  <div className="col-12"><label className="form-label">Motto</label><input className={input} value={f.motto} onChange={set('motto')} placeholder="e.g. Strong to Serve" /></div>
                  <div className="col-md-6"><label className="form-label">School email</label><input className={input} value={f.contactEmail} onChange={set('contactEmail')} placeholder="info@school.ac.ke" /></div>
                  <div className="col-md-6"><label className="form-label">School phone</label><input className={input} value={f.contactPhone} onChange={set('contactPhone')} placeholder="+254 7xx xxx xxx" /></div>
                  <div className="col-12"><label className="form-label">Postal address</label><input className={input} value={f.contactAddress} onChange={set('contactAddress')} placeholder="P.O. Box 123, Town" /></div>
                </div>
              )}

              {step === 1 && (
                <div className="row g-4">
                  <div className="col-md-5">
                    <label className="form-label">School logo</label>
                    <label className="group flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition">
                      {logo ? <img src={URL.createObjectURL(logo)} alt="Logo preview" className="h-32 w-32 object-contain" /> : <Icon name="cloud-arrow-up" className="text-4xl text-brand-400 group-hover:-translate-y-1 transition" />}
                      <span className="text-sm font-semibold text-brand-700">{logo ? 'Change logo' : 'Upload logo (PNG/JPG)'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div className="col-md-7">
                    <label className="form-label">Colour themes</label>
                    <div className="grid grid-cols-4 gap-2">
                      {THEME_PRESETS.map((p) => (
                        <button key={p.name} type="button" onClick={() => preset(p)} title={p.name}
                          className={cx('rounded-xl p-2 ring-2 transition hover:scale-105', f.primary === p.primary ? 'ring-brand-600' : 'ring-transparent bg-slate-50')}>
                          <span className="flex h-8 overflow-hidden rounded-lg">
                            <span className="flex-[2]" style={{ background: p.primary }} /><span className="flex-1" style={{ background: p.accent }} /><span className="flex-1" style={{ background: p.dark }} />
                          </span>
                          <span className="block mt-1 text-[0.65rem] font-semibold text-slate-600 truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[['primary', 'Main colour'], ['accent', 'Accent'], ['dark', 'Dark tone']].map(([k, label]) => (
                        <label key={k} className="block">
                          <span className="form-label block">{label}</span>
                          <input type="color" value={f[k]} onChange={set(k)} className="form-control form-control-color !w-full !h-12 !rounded-xl" />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-12">
                    <p className="form-label">Live preview</p>
                    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                      <div className="bg-ink-900 px-4 py-1.5 text-[0.7rem] text-white/70">{f.contactPhone || '+254 700 000 000'} · {f.contactEmail || 'info@school.ac.ke'}</div>
                      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {logo ? <img src={URL.createObjectURL(logo)} alt="" className="h-9 w-9 object-contain" /> : <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-600 text-white text-xs font-bold">{initials(f.shortName || f.schoolName || 'School')}</span>}
                          <span className="font-heading font-bold uppercase text-sm text-slate-900">{f.schoolName || 'Your School'}</span>
                        </div>
                        <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Portal</span>
                      </div>
                      <div className="bg-gradient-to-br from-brand-700 to-ink-900 p-6 text-white">
                        <p className="m-0 text-xs uppercase tracking-widest text-accent-300">Welcome</p>
                        <p className="m-0 mt-1 font-heading text-xl font-bold">{f.motto || 'Nurturing Minds, Building Futures'}</p>
                        <span className="mt-3 inline-block rounded-full bg-accent-400 px-4 py-1.5 text-xs font-bold text-ink-900">Discover more</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="row g-4">
                  <div className="col-12"><label className="form-label">Your full name *</label><input className={input} value={f.adminName} onChange={set('adminName')} autoFocus /></div>
                  <div className="col-12"><label className="form-label">Login email *</label><input type="email" className={input} value={f.email} onChange={set('email')} autoComplete="username" /></div>
                  <div className="col-md-6"><label className="form-label">Password * <span className="font-normal text-slate-400">(min 8 characters)</span></label><input type="password" className={input} value={f.password} onChange={set('password')} autoComplete="new-password" /></div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm password *</label>
                    <input type="password" className={cx(input, f.confirm && f.confirm !== f.password && '!border-red-400')} value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
                    {f.confirm && f.confirm !== f.password && <p className="text-xs text-red-500 mt-1 mb-0">Passwords do not match.</p>}
                  </div>
                  <div className="col-12">
                    <label className="flex gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 cursor-pointer">
                      <input type="checkbox" className="form-check-input mt-1 shrink-0" checked={f.sampleData} onChange={set('sampleData')} />
                      <span>
                        <span className="block font-semibold text-slate-800">Load sample content</span>
                        <span className="block text-sm text-slate-500">Adds example departments, staff hierarchy, prefects, gallery albums and news so you can see every page working. Edit or delete them anytime.</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="btn-outline-brand !py-2.5 disabled:invisible"><Icon name="arrow-left" />Back</button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!valid[step]} className="btn-brand !py-2.5 disabled:opacity-50">Continue<Icon name="arrow-right" /></button>
            ) : (
              <button type="button" onClick={submit} disabled={!valid[2] || busy} className="btn-brand !py-2.5 disabled:opacity-50">{busy ? <Spinner /> : <Icon name="rocket-takeoff" />}Launch website</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
