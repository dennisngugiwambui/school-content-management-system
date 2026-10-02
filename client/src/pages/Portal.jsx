import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSite, usePageTitle } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { asset, schoolPortalUrl } from '../lib/api';
import Brand from '../components/layout/Brand';
import { Icon, Spinner } from '../components/ui';

/** Link to the school management system, where students, parents and staff sign in. */
export function SchoolPortalCard({ cfg, fill }) {
  const url = schoolPortalUrl(cfg.erpUrl);
  if (!url || cfg.erpEnabled === false) return null;
  return (
    <a href={`${url}/login`} className="group mt-8 flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 no-underline transition hover:border-brand-300 hover:shadow-soft">
      <span className="grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-brand-600 text-white text-xl"><Icon name="mortarboard" /></span>
      <span className="flex-1 text-left">
        <span className="block font-bold text-ink-950">{fill(cfg.erpTitle) || 'School portal'}</span>
        <span className="block text-sm text-slate-500">{fill(cfg.erpText) || 'Students, parents, teachers and staff sign in here.'}</span>
      </span>
      <Icon name="box-arrow-up-right" className="text-brand-600 transition group-hover:translate-x-0.5" />
    </a>
  );
}

export default function Portal() {
  const { page, fill, settings, schoolName } = useSite();
  const { user, login, checking, expired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cfg = page('portal');
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  usePageTitle(cfg.label || 'Portal');

  useEffect(() => { setError(''); }, [form]);
  if (!checking && user) return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Visual side */}
      <div className="relative hidden lg:block overflow-hidden bg-ink-950">
        {cfg.image && (
          <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${asset(cfg.image)}")` }} initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 2 }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/90 via-brand-900/85 to-ink-950/95" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Brand light />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <Icon name="quote" className="text-6xl text-accent-400" />
            <p className="mt-2 font-heading text-3xl xl:text-4xl font-bold leading-snug text-white">{fill(settings?.motto) || schoolName}</p>
            <p className="mt-4 text-white/60">{schoolName}</p>
          </motion.div>
          <p className="text-xs text-white/40 m-0">© {new Date().getFullYear()} {schoolName}</p>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-md">
          <div className="lg:hidden mb-10"><Brand /></div>
          <span className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-brand-600 text-white text-2xl shadow-glow"><Icon name="shield-lock" /></span>
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold">{fill(cfg.title) || 'Welcome back'}</h1>
          <p className="text-slate-500">{fill(cfg.subtitle)}</p>

          <SchoolPortalCard cfg={cfg} fill={fill} />
          <div className="mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />{fill(cfg.adminLabel) || 'Website administrators'}<span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            {expired && !error && (
              <div className="alert alert-warning !rounded-xl flex items-center gap-2 !mb-0 text-sm">
                <Icon name="clock-history" />Your session ended for security. Please sign in again.
              </div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }} className="alert alert-danger !rounded-xl flex items-center gap-2 !mb-0 text-sm">
                <Icon name="exclamation-circle-fill" />{error}
              </motion.div>
            )}
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="relative">
                <Icon name="envelope" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-control !pl-11 !py-3 !rounded-xl" placeholder="you@school.ac.ke" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-control !pl-11 !pr-12 !py-3 !rounded-xl" placeholder="••••••••" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100" aria-label={show ? 'Hide password' : 'Show password'}>
                  <Icon name={show ? 'eye-slash' : 'eye'} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy || !form.email || !form.password} className="btn-brand w-full !py-3.5 disabled:opacity-60 disabled:hover:translate-y-0">
              {busy ? <Spinner /> : <Icon name="box-arrow-in-right" />}{busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {cfg.note && <p className="mt-6 flex gap-2 text-xs text-slate-500"><Icon name="info-circle" className="text-brand-600" />{fill(cfg.note)}</p>}
          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 link-underline"><Icon name="arrow-left" />Back to website</Link>
        </motion.div>
      </div>
    </div>
  );
}
