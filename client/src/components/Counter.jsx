import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/** Count up from 0 to `value` once the number scrolls into view. */
export default function Counter({ value = 0, suffix = '', duration = 2000 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(0);
  const target = Number(value) || 0;

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - (1 - p) ** 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}
