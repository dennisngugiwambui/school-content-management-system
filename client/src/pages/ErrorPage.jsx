import { Component } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageTitle } from '../context/SiteContext';
import { ERRORS } from '../lib/errors';
import { cx } from '../lib/utils';
import { Icon } from '../components/ui';

const RETRY = ['408', '429', '500', '502', '503', '504', 'offline'];
const SUGGESTIONS = [
  { to: '/about', label: 'About us', icon: 'info-circle' },
  { to: '/news', label: 'News & events', icon: 'newspaper' },
  { to: '/gallery', label: 'Gallery', icon: 'images' },
  { to: '/departments', label: 'Departments', icon: 'journal-bookmark' },
];

/** The big status number; each digit takes a turn hopping, like a ball bouncing along. */
function BouncyCode({ code }) {
  const chars = code === 'offline' ? null : code.split('');
  if (!chars) return null;
  return (
    <div aria-hidden className="flex justify-center gap-1 sm:gap-2 font-heading text-[6rem] sm:text-[8rem] md:text-[9rem] font-extrabold leading-none">
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          className="text-gradient inline-block"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: [0, -18, 0], opacity: 1 }}
          transition={{
            opacity: { duration: 0.3, delay: i * 0.1 },
            y: { duration: 0.9, delay: 0.4 + i * 0.15, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

/**
 * A friendly full page for an error: 400, 401, 403, 404, 408, 429, 500, 502, 503, 504 or "offline".
 * `message` replaces the standard explanation; `onRetry` adds a Try again button (5xx pages reload by default).
 * `fullScreen` is for errors shown outside the normal site layout (server unreachable, app crash).
 */
export default function ErrorPage({ code = '404', message, onRetry, fullScreen = false }) {
  const key = ERRORS[code] ? String(code) : '500';
  const info = ERRORS[key];
  const navigate = useNavigate();
  const { pathname } = useLocation();
  usePageTitle(info.title);

  const retry = onRetry || (RETRY.includes(key) ? () => window.location.reload() : null);
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <section className={cx('relative overflow-hidden bg-dots text-center', fullScreen ? 'min-h-screen grid place-items-center px-4 py-12 bg-slate-50' : 'pt-32 pb-20 sm:pt-40 md:pt-44 md:pb-28')}>
      <div className="container relative max-w-2xl">
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="inline-grid place-items-center h-20 w-20 rounded-3xl bg-white text-brand-600 text-4xl shadow-lift ring-1 ring-brand-100"
        >
          <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="inline-flex">
            <Icon name={info.icon} />
          </motion.span>
        </motion.span>

        <BouncyCode code={key} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h1 className={cx('font-extrabold text-ink-950', key === 'offline' ? 'mt-6 text-3xl md:text-4xl' : 'mt-2 text-2xl md:text-3xl')}>{info.title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-500 md:text-lg">{message || info.text}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {key === '401' && (
              <Link to="/portal" state={{ from: pathname }} className="btn-brand"><Icon name="box-arrow-in-right" />Sign in</Link>
            )}
            {retry && <button type="button" onClick={retry} className="btn-brand"><Icon name="arrow-clockwise" />Try again</button>}
            {key === '403' && pathname.startsWith('/admin') ? (
              <Link to="/admin" className={retry ? 'btn-outline-brand' : 'btn-brand'}><Icon name="speedometer2" />Back to dashboard</Link>
            ) : (
              <Link to="/" className={key === '401' || retry ? 'btn-outline-brand' : 'btn-brand'}><Icon name="house-door" />Back to home</Link>
            )}
            {canGoBack && !fullScreen && (
              <button type="button" onClick={() => navigate(-1)} className="btn-outline-brand"><Icon name="arrow-left" />Go back</button>
            )}
          </div>
        </motion.div>

        {key === '404' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Or try one of these</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SUGGESTIONS.map((s) => (
                <Link key={s.to} to={s.to} className="hover-bounce flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 no-underline shadow-soft ring-1 ring-slate-100 hover:text-brand-700">
                  <Icon name={s.icon} className="text-2xl text-brand-600" />{s.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/** Shows the 500 page instead of a blank screen if a page crashes while rendering. */
export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <ErrorPage code="500" fullScreen onRetry={() => window.location.reload()} />;
  }
}
