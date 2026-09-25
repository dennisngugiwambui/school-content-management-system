import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { asset } from '../../lib/api';
import { cx, initials } from '../../lib/utils';

export default function Brand({ light = false, compact = false, className }) {
  const { settings, schoolName, fill } = useSite();
  const logo = asset(settings?.logo);
  return (
    <Link to="/" className={cx('flex items-center gap-3 min-w-0 group', className)} aria-label={`${schoolName} home`}>
      {logo ? (
        <img src={logo} alt="" className={cx('object-contain shrink-0 transition-transform duration-500 group-hover:scale-105', compact ? 'h-11 w-11' : 'h-12 w-12 md:h-14 md:w-14')} />
      ) : (
        <span className={cx('grid place-items-center shrink-0 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white font-heading font-extrabold shadow-glow', compact ? 'h-11 w-11 text-base' : 'h-12 w-12 md:h-14 md:w-14 text-lg')}>
          {initials(settings?.shortName || schoolName)}
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span className={cx('block font-heading font-extrabold uppercase tracking-wide truncate', compact ? 'text-sm md:text-base' : 'text-sm sm:text-base md:text-lg', light ? 'text-white' : 'text-ink-900')}>
          {schoolName}
        </span>
        {settings?.motto && (
          <span className={cx('block text-[0.68rem] md:text-xs italic truncate', light ? 'text-white/70' : 'text-brand-700')}>{fill(settings.motto)}</span>
        )}
      </span>
    </Link>
  );
}
