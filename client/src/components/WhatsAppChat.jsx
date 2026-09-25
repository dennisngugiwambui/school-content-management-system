import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import { asset } from '../lib/api';
import { Icon } from './ui';

const TEASER_KEY = 'wa-teaser-seen';
const WA_GREEN = '#25D366';

/** Turns "0712 345 678", "+254 712…" or a wa.me link into the digits wa.me expects (Kenyan numbers by default). */
export function waNumber(raw) {
  const str = String(raw || '').trim();
  const link = str.match(/wa\.me\/(\d+)/);
  if (link) return link[1];
  const d = str.replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(d)) return `254${d.slice(1)}`;
  if (/^[17]\d{8}$/.test(d)) return `254${d}`;
  return d.length >= 9 ? d : '';
}

const storage = {
  get: () => { try { return sessionStorage.getItem(TEASER_KEY); } catch { return null; } },
  set: () => { try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* private mode */ } },
};

/** Floating WhatsApp button: a greeting pops up after a while, and messages open in WhatsApp. */
export default function WhatsAppChat() {
  const { settings, fill, schoolName } = useSite();
  const reduce = useReducedMotion();
  const chat = settings?.chat ?? {};
  const number = waNumber(chat.number || settings?.social?.whatsapp || settings?.contact?.phone);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [unread, setUnread] = useState(false);
  const [typing, setTyping] = useState(true);
  const [msg, setMsg] = useState('');
  const box = useRef(null);
  const greeting = fill(chat.greeting || 'Hi there 👋 How can we help you today?');
  const title = fill(chat.name || '{school}') || schoolName;
  const delay = Number(chat.delay ?? 15);

  // After the visitor has been here a while, pop the greeting once per visit.
  useEffect(() => {
    if (!chat.enabled || !number || !(delay > 0) || storage.get()) return;
    const t = setTimeout(() => { setTeaser(true); setUnread(true); storage.set(); }, delay * 1000);
    return () => clearTimeout(t);
  }, [chat.enabled, number, delay]);

  // A short "typing…" moment each time the chat opens, then the greeting appears.
  useEffect(() => {
    if (!open) return;
    setTyping(true);
    const t = setTimeout(() => { setTyping(false); box.current?.focus(); }, 900);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); };
  }, [open]);

  if (!chat.enabled || !number) return null;

  const toggle = () => { setOpen((v) => !v); setTeaser(false); setUnread(false); storage.set(); };
  const send = (e) => {
    e?.preventDefault();
    const text = msg.trim();
    window.open(`https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`, '_blank', 'noopener');
    setMsg('');
    if (box.current) box.current.style.height = 'auto';
    setOpen(false);
  };
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logo = settings?.logo ? asset(settings.logo) : '';

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[1025] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog" aria-label={`Chat with ${title} on WhatsApp`}
            initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-[min(360px,calc(100vw-2.5rem))] origin-bottom-right overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: '#075E54' }}>
              <span className="relative grid place-items-center h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
                {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1" /> : <Icon name="building" className="text-brand-700" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 font-bold leading-tight truncate">{title}</p>
                <p className="m-0 text-xs text-white/75 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: WA_GREEN }} />{fill(chat.status || 'Online')}</p>
              </div>
              <button type="button" onClick={toggle} className="grid place-items-center h-8 w-8 rounded-full hover:bg-white/15" aria-label="Close chat"><Icon name="x-lg" /></button>
            </div>

            <div className="min-h-[150px] px-4 py-5" style={{ background: '#efeae2' }}>
              <AnimatePresence mode="wait">
                {typing ? (
                  <motion.div key="typing" exit={{ opacity: 0 }} className="inline-flex gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((k) => (
                      <motion.span key={k} className="h-2 w-2 rounded-full bg-slate-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: k * 0.15 }} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="msg" initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm">
                    <p className="m-0 text-xs font-bold" style={{ color: '#075E54' }}>{title}</p>
                    <p className="m-0 mt-0.5 text-sm text-slate-800 whitespace-pre-line">{greeting}</p>
                    <p className="m-0 mt-1 text-right text-[0.65rem] text-slate-400">{time}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3">
              <textarea
                ref={box} rows={1} value={msg}
                onChange={(e) => { setMsg(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight + 2}px`; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                placeholder={fill(chat.placeholder || 'Type your message…')}
                className="form-control !rounded-2xl resize-none overflow-y-auto text-sm max-h-28 scrollbar-thin" aria-label="Your message"
              />
              <button type="submit" className="grid place-items-center h-10 w-10 shrink-0 rounded-full text-white transition hover:scale-110" style={{ background: WA_GREEN }} aria-label="Send on WhatsApp">
                <Icon name="send-fill" />
              </button>
            </form>
            <p className="m-0 pb-2 text-center text-[0.65rem] text-slate-400">Opens WhatsApp to send your message</p>
          </motion.div>
        )}

        {teaser && !open && (
          <motion.button
            key="teaser" type="button" onClick={toggle}
            initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative max-w-[220px] sm:max-w-[260px] origin-bottom-right rounded-2xl rounded-br-sm bg-white px-4 py-3 pr-8 text-left shadow-xl ring-1 ring-black/5"
          >
            <span className="block text-xs font-bold" style={{ color: '#075E54' }}>{title}</span>
            <span className="block text-sm text-slate-700">{greeting}</span>
            <span role="button" tabIndex={0} aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); setTeaser(false); }}
              className="absolute right-2 top-2 grid place-items-center h-6 w-6 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Icon name="x" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        type="button" onClick={toggle}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        className="relative grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-full text-white shadow-lg"
        style={{ background: WA_GREEN, boxShadow: '0 10px 25px -5px rgba(37,211,102,.55)' }}
        animate={reduce || open ? { y: 0 } : { y: [0, -14, 0, -6, 0] }}
        transition={reduce || open ? {} : { duration: 1.1, repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
      >
        {!open && !reduce && <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: WA_GREEN }} />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? 'x' : 'wa'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="relative text-[1.7rem] leading-none">
            <Icon name={open ? 'x-lg' : 'whatsapp'} />
          </motion.span>
        </AnimatePresence>
        {unread && !open && <span className="absolute -right-0.5 -top-0.5 grid place-items-center h-5 w-5 rounded-full bg-red-500 text-[0.65rem] font-bold ring-2 ring-white">1</span>}
      </motion.button>
    </div>
  );
}
