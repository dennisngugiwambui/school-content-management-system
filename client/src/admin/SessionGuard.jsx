import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/ui';

const WARN_MS = 60 * 1000; // warn this long before an inactivity sign-out
const PING_MS = 4 * 60 * 1000; // keep the server session alive while someone is working
const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'];

/**
 * Signs the admin out after a period of inactivity (the same limit the server enforces).
 * While the user is active, the server session is refreshed in the background;
 * a minute before the limit a countdown offers to stay signed in.
 */
export default function SessionGuard() {
  const { session, logout } = useAuth();
  const idleMs = (session?.idleMinutes || 30) * 60 * 1000;
  const lastActive = useRef(Date.now());
  const lastPing = useRef(Date.now());
  const [left, setLeft] = useState(null); // seconds remaining while the warning shows

  useEffect(() => {
    let last = 0;
    const mark = () => {
      const now = Date.now();
      if (now - last < 1000) return; // mousemove fires constantly
      last = now;
      lastActive.current = now;
    };
    EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const tick = setInterval(() => {
      const now = Date.now();
      const idle = now - lastActive.current;
      if (idle >= idleMs) {
        clearInterval(tick);
        logout('expired');
        return;
      }
      if (idle >= idleMs - WARN_MS) {
        setLeft(Math.ceil((idleMs - idle) / 1000));
        return;
      }
      setLeft(null);
      // Only ping when the person has actually done something since the last ping.
      if (now - lastPing.current > PING_MS && lastActive.current > lastPing.current) {
        lastPing.current = now;
        api.get('/auth/me').catch(() => {});
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      EVENTS.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [idleMs, logout]);

  const stay = () => {
    lastActive.current = Date.now();
    lastPing.current = Date.now();
    setLeft(null);
    api.get('/auth/me').catch(() => {});
  };

  return (
    <AnimatePresence>
      {left !== null && (
        <motion.div className="fixed inset-0 z-[2000] grid place-items-center bg-ink-950/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="alertdialog" aria-labelledby="idle-title" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-amber-100 text-amber-600 text-2xl"><Icon name="hourglass-split" /></span>
            <h2 id="idle-title" className="mt-4 text-xl font-bold">Are you still there?</h2>
            <p className="text-slate-500 text-sm">For security, you will be signed out in <strong className="text-slate-900">{left}s</strong> because of inactivity.</p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
              <button type="button" onClick={() => logout()} className="btn btn-light flex-1 !rounded-xl">Sign out</button>
              <button type="button" onClick={stay} className="btn btn-primary flex-1 !rounded-xl" autoFocus>Stay signed in</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
