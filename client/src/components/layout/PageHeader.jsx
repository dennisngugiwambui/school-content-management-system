import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSite, usePageTitle } from '../../context/SiteContext';
import { asset } from '../../lib/api';
import { Icon } from '../ui';

const SLIDE_MS = 6000;

/**
 * Banner photos. With several images they cross-fade in turn, and the slow drift
 * alternates so a photo that zoomed in is followed by one that zooms out.
 */
function BannerImages({ images }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const list = images.join('|');
  useEffect(() => {
    if (images.length < 2) return;
    images.forEach((src) => { new Image().src = src; });
    const t = setInterval(() => setN((v) => v + 1), SLIDE_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);
  const src = images[n % images.length];
  const [from, to] = reduce ? [1, 1] : n % 2 === 0 ? [1.15, 1] : [1, 1.15];
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={n}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${src}")` }}
        initial={{ opacity: n === 0 ? 1 : 0, scale: from }}
        animate={{ opacity: 1, scale: to, transition: { opacity: { duration: 1.2 }, scale: { duration: (images.length > 1 ? SLIDE_MS + 1200 : 1800) / 1000, ease: images.length > 1 ? 'linear' : 'easeOut' } } }}
        exit={{ opacity: 0, transition: { duration: 1.2, delay: 0.2 } }}
      />
    </AnimatePresence>
  );
}

/** Animated banner for inner pages. Title, subtitle and images come from the CMS page settings. */
export default function PageHeader({ pageKey, title, subtitle, image, crumbs = [] }) {
  const { page, fill } = useSite();
  const cfg = pageKey ? page(pageKey) : {};
  const heading = fill(title ?? cfg.title ?? cfg.label);
  const sub = fill(subtitle ?? cfg.subtitle);
  const images = [image ?? cfg.image, ...(image ? [] : cfg.images || [])].filter(Boolean).map(asset);
  usePageTitle(title ?? cfg.label ?? cfg.title);

  return (
    <section className="relative overflow-hidden bg-ink-900 pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 md:pb-28">
      {images.length > 0 && <BannerImages images={images} />}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/95 via-brand-900/80 to-brand-700/60" />
      <div className="container relative text-center">
        <motion.nav
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-xs md:text-sm text-white/80 ring-1 ring-white/15"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-white"><Icon name="house-door" /> Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-2">
              <Icon name="chevron-right" className="text-[0.6rem] opacity-60" />
              {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
          <Icon name="chevron-right" className="text-[0.6rem] opacity-60" />
          <span className="text-accent-300 font-semibold">{heading}</span>
        </motion.nav>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-5 sm:mt-6 !text-white text-[2rem] sm:text-5xl lg:text-6xl font-extrabold leading-tight"
        >
          {heading}
        </motion.h1>
        {sub && (
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-white/80"
          >
            {sub}
          </motion.p>
        )}
      </div>
      <svg className="absolute -bottom-px left-0 w-full text-white" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
        <path fill="currentColor" d="M0 60V30Q360 0 720 30T1440 30V60Z" />
      </svg>
    </section>
  );
}
