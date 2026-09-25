import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSite } from '../../context/SiteContext';
import { asset } from '../../lib/api';
import { Icon, SmartLink } from '../../components/ui';

const text = {
  hidden: { opacity: 0, y: 40 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

/** Transition styles the slider rotates through; "mix" uses a new one on every change. */
export const HERO_EFFECTS = [
  { value: 'tiles', label: 'Tile break' },
  { value: 'zoomIn', label: 'Zoom in' },
  { value: 'zoomOut', label: 'Zoom out' },
  { value: 'slices', label: 'Vertical slices' },
  { value: 'blinds', label: 'Blinds' },
  { value: 'circle', label: 'Circle reveal' },
  { value: 'diagonal', label: 'Diagonal wipe' },
];
const REVEAL_MS = 1500;
const DRIFT = 1.08; // how far the photo drifts while a slide is on screen
// Slides alternate: one slowly zooms in, the next slowly zooms out.
const driftFor = (n) => (n % 2 === 0 ? [1, DRIFT] : [DRIFT, 1]);
const ease = [0.65, 0, 0.35, 1];

/** One rectangular window onto the full image, so pieces line up exactly as `cover`. */
function Piece({ url, r, c, rows, cols, ...motionProps }) {
  return (
    <motion.div
      className="absolute overflow-hidden"
      style={{ left: `${(c * 100) / cols}%`, top: `${(r * 100) / rows}%`, width: `${100 / cols + 0.05}%`, height: `${100 / rows + 0.05}%` }}
      {...motionProps}
    >
      <div
        className="absolute bg-cover bg-center"
        style={{ backgroundImage: `url("${url}")`, width: `${cols * 100}%`, height: `${rows * 100}%`, left: `${-c * 100}%`, top: `${-r * 100}%` }}
      />
    </motion.div>
  );
}

function grid(rows, cols) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ r, c, key: `${r}-${c}` });
  return out;
}

/** Plays one reveal of `url` on top of the previous slide. */
function Reveal({ url, effect }) {
  const full = (props) => <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }} {...props} />;
  switch (effect) {
    case 'tiles': {
      const rows = 4, cols = 6;
      return grid(rows, cols).map(({ r, c, key }) => (
        <Piece
          key={key} url={url} r={r} c={c} rows={rows} cols={cols}
          initial={{ opacity: 0, scale: 0.3, rotate: (r + c) % 2 ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: (r + c) * 0.07, ease: 'easeOut' }}
        />
      ));
    }
    case 'slices': {
      const cols = 8;
      return grid(1, cols).map(({ c, key }) => (
        <Piece
          key={key} url={url} r={0} c={c} rows={1} cols={cols}
          initial={{ clipPath: c % 2 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0% 0 0% 0)' }}
          transition={{ duration: 0.75, delay: c * 0.08, ease }}
        />
      ));
    }
    case 'blinds': {
      const rows = 6;
      return grid(rows, 1).map(({ r, key }) => (
        <Piece
          key={key} url={url} r={r} c={0} rows={rows} cols={1}
          initial={{ clipPath: r % 2 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0%)' }}
          transition={{ duration: 0.8, delay: r * 0.09, ease }}
        />
      ));
    }
    case 'zoomIn':
      return full({ initial: { opacity: 0, scale: 1.45, filter: 'blur(8px)' }, animate: { opacity: 1, scale: 1, filter: 'blur(0px)' }, transition: { duration: 1.3, ease: 'easeOut' } });
    case 'zoomOut':
      return full({ initial: { opacity: 0, scale: 0.55, borderRadius: '40%' }, animate: { opacity: 1, scale: 1, borderRadius: '0%' }, transition: { duration: 1.3, ease } });
    case 'circle':
      return full({ initial: { clipPath: 'circle(0% at 70% 50%)' }, animate: { clipPath: 'circle(150% at 70% 50%)' }, transition: { duration: 1.4, ease } });
    case 'diagonal':
      return full({ initial: { clipPath: 'polygon(0 0, 0 0, 0 0, 0 0)' }, animate: { clipPath: 'polygon(0 0, 200% 0, 0 200%, 0 0)' }, transition: { duration: 1.3, ease } });
    default:
      return full({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1 } });
  }
}

export default function Hero({ hero }) {
  const { fill } = useSite();
  const reduce = useReducedMotion();
  const slides = hero?.slides?.length ? hero.slides : [{ title: 'Welcome to {school}' }];
  const [state, setState] = useState({ i: 0, prev: null, n: 0, prevScale: 1 });
  const [settledAt, setSettledAt] = useState(-1);
  const drift = useRef(null);
  const [paused, setPaused] = useState(false);
  const interval = Math.max(4, Number(hero?.interval) || 6) * 1000;
  const { i, prev, n, prevScale } = state;
  const settled = settledAt === n;

  const go = useCallback((target) => {
    // Freeze the outgoing photo at its current zoom so nothing jumps under the reveal.
    const el = drift.current;
    const scale = el ? new DOMMatrix(getComputedStyle(el).transform).a || 1 : 1;
    setState((s) => {
      const next = (target + slides.length) % slides.length;
      return next === s.i ? s : { i: next, prev: s.i, n: s.n + 1, prevScale: scale };
    });
  }, [slides.length]);

  // Every change uses the next style in the list (or the one chosen in the CMS).
  // The first slide zooms in, so the list is offset to make the second one zoom out.
  const chosen = hero?.transition && hero.transition !== 'mix' ? hero.transition : null;
  const effect = reduce ? 'fade' : chosen || (n === 0 ? 'zoomIn' : HERO_EFFECTS[(n + 1) % HERO_EFFECTS.length].value);
  const [from, to] = reduce ? [1, 1] : driftFor(n);

  useEffect(() => {
    const t = setTimeout(() => setSettledAt(n), REVEAL_MS);
    return () => clearTimeout(t);
  }, [n]);

  useEffect(() => {
    if (!hero?.autoplay || paused || slides.length < 2) return;
    const t = setTimeout(() => go(i + 1), interval);
    return () => clearTimeout(t);
  }, [i, paused, hero?.autoplay, interval, go, slides.length]);

  // Warm the cache so reveals never start on a half-loaded image.
  useEffect(() => {
    slides.forEach((s) => { if (s.image) new Image().src = asset(s.image); });
  }, [slides]);

  const s = slides[i];
  const url = s.image ? asset(s.image) : '';
  const prevUrl = url && prev !== null && slides[prev]?.image ? asset(slides[prev].image) : '';
  // Pause on mouse hover only; on touch screens a tap would otherwise stop autoplay for good.
  const hover = (on) => (e) => { if (e.pointerType === 'mouse') setPaused(on); };

  return (
    <section className="relative h-[78svh] sm:h-[88svh] min-h-[500px] sm:min-h-[560px] max-h-[860px] overflow-hidden bg-ink-950" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      {prevUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${prevUrl}")`, transform: `scale(${prevScale})` }} />}
      {url && !settled && <div key={`r${n}`} className="absolute inset-0" style={{ transform: `scale(${from})` }}><Reveal url={url} effect={effect} /></div>}
      {url && settled && (
        <motion.div
          key={`k${n}`}
          ref={drift}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${url}")` }}
          initial={{ scale: from }}
          animate={{ scale: to }}
          transition={{ duration: interval / 1000, ease: 'linear' }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />

      <div className="container relative h-full flex items-center pt-24">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial="hidden" animate="show" exit="exit">
              {s.eyebrow && (
                <motion.span variants={text} custom={0} className="inline-flex items-center gap-2 border-l-4 border-accent-400 pl-3 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-accent-300">
                  {fill(s.eyebrow)}
                </motion.span>
              )}
              <motion.h1 variants={text} custom={1} className="mt-5 !text-white text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05]">
                {fill(s.title)}
              </motion.h1>
              {s.subtitle && (
                <motion.p variants={text} custom={2} className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-white/85 leading-relaxed">
                  {fill(s.subtitle)}
                </motion.p>
              )}
              <motion.div variants={text} custom={3} className="mt-9 flex flex-wrap gap-3">
                {s.ctaText && <SmartLink to={s.ctaLink} className="btn-brand">{fill(s.ctaText)}<Icon name="arrow-right" /></SmartLink>}
                {s.cta2Text && <SmartLink to={s.cta2Link} className="btn-ghost-light">{fill(s.cta2Text)}</SmartLink>}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-24 md:bottom-28 inset-x-0">
          <div className="container flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {slides.map((_, k) => (
                <button key={k} onClick={() => go(k)} className="relative h-1.5 w-10 md:w-16 overflow-hidden rounded-full bg-white/25" aria-label={`Go to slide ${k + 1}`}>
                  {k === i && (
                    <motion.span
                      key={`${n}-${paused}`}
                      className="absolute inset-0 origin-left bg-accent-400"
                      initial={{ scaleX: hero?.autoplay && !paused ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: hero?.autoplay && !paused ? interval / 1000 : 0, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={() => go(i - 1)} className="grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-brand-600 transition" aria-label="Previous slide"><Icon name="arrow-left" /></button>
              <button onClick={() => go(i + 1)} className="grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-brand-600 transition" aria-label="Next slide"><Icon name="arrow-right" /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
