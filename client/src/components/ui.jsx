import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { asset } from '../lib/api';
import { cx, initials, isExternal } from '../lib/utils';
import { useSite } from '../context/SiteContext';

const EASE = [0.21, 0.47, 0.32, 0.98];

/** Fade/slide children in when they scroll into view. */
export function Reveal({ children, delay = 0, y = 32, x = 0, scale, className, as = 'div', amount = 0.2, ...rest }) {
  const M = motion[as] ?? motion.div;
  return (
    <M
      initial={{ opacity: 0, y, x, ...(scale ? { scale } : {}) }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </M>
  );
}

export function Icon({ name, className }) {
  if (!name) return null;
  return <i className={cx(`bi bi-${String(name).replace(/^bi-/, '')}`, className)} aria-hidden="true" />;
}

/** Router link for internal paths, anchor for external/mailto/tel. */
export function SmartLink({ to = '', children, ...rest }) {
  if (!to) return <span {...rest}>{children}</span>;
  if (isExternal(to)) return <a href={to} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...rest}>{children}</a>;
  return <Link to={to} {...rest}>{children}</Link>;
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false, className }) {
  const { fill } = useSite();
  const center = align === 'center';
  return (
    <div className={cx('mb-8 sm:mb-10 md:mb-14', center && 'text-center mx-auto max-w-3xl', className)}>
      {eyebrow && (
        <Reveal y={16}>
          <span className={cx('eyebrow', light && '!text-accent-300')}>{fill(eyebrow)}</span>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <h2 className={cx('mt-3 text-[1.7rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold leading-tight', light && '!text-white')}>{fill(title)}</h2>
      </Reveal>
      {center && (
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="block h-1 w-20 mx-auto mt-5 rounded-full bg-gradient-to-r from-brand-600 to-accent-400 origin-left"
        />
      )}
      {subtitle && (
        <Reveal delay={0.16}>
          <p className={cx('mt-5 text-base md:text-lg leading-relaxed', light ? 'text-white/75' : 'text-slate-500')}>{fill(subtitle)}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Lazy image with fade-in and a branded fallback when the source is missing or broken. */
export function SmartImage({ src, alt = '', className, imgClassName, icon = 'image', zoom = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = asset(src);
  return (
    <div className={cx('relative overflow-hidden bg-brand-50', className)}>
      {(!url || failed) ? (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-100 via-brand-50 to-white">
          <Icon name={icon} className="text-4xl text-brand-300" />
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 skeleton !rounded-none" />}
          <img
            src={url}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cx(
              'h-full w-full object-cover transition-all duration-700',
              loaded ? 'opacity-100' : 'opacity-0',
              zoom && 'group-hover:scale-110',
              imgClassName
            )}
          />
        </>
      )}
    </div>
  );
}

export function Avatar({ src, name, className, textClassName }) {
  const [failed, setFailed] = useState(false);
  const url = asset(src);
  if (url && !failed) {
    return <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className={cx('object-cover', className)} />;
  }
  return (
    <div className={cx('grid place-items-center bg-gradient-to-br from-brand-500 to-brand-800 text-white font-heading font-bold select-none', className)}>
      <span className={textClassName}>{initials(name)}</span>
    </div>
  );
}

export function Spinner({ className }) {
  return <span className={cx('inline-block h-5 w-5 rounded-full border-2 border-current border-r-transparent animate-spin', className)} />;
}

export function EmptyState({ icon = 'inbox', title = 'Nothing here yet', text }) {
  return (
    <Reveal className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-brand-100 bg-brand-50/40">
      <Icon name={icon} className="text-5xl text-brand-300" />
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      {text && <p className="text-slate-500 mt-2 mb-0">{text}</p>}
    </Reveal>
  );
}

export function SkeletonGrid({ count = 6, className = 'h-72' }) {
  return (
    <div className="row g-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-sm-6 col-lg-4"><div className={cx('skeleton', className)} /></div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-16">
      <Icon name="wifi-off" className="text-5xl text-slate-300" />
      <p className="mt-3 text-slate-500">{error?.message || 'Something went wrong.'}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline-brand mt-2">Try again</button>}
    </div>
  );
}

/** Split plain text into paragraphs, respecting single line breaks. */
export function RichText({ text, className }) {
  const { fill } = useSite();
  const parts = String(fill(text) || '').split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className={cx('prose-school', className)}>
      {parts.map((p, i) => (
        <p key={i}>{p.split('\n').map((line, j) => (j ? [<br key={j} />, line] : line))}</p>
      ))}
    </div>
  );
}
