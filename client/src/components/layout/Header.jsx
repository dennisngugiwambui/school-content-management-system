import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite } from '../../context/SiteContext';
import { cx } from '../../lib/utils';
import { Icon } from '../ui';
import Brand from './Brand';
import { buildNav, SOCIALS, socialHref } from './navItems';

function TopBar() {
  const { settings, fill } = useSite();
  const c = settings?.contact ?? {};
  const t = settings?.topbar ?? {};
  const socials = SOCIALS.filter(([k]) => settings?.social?.[k]);
  return (
    <div className="bg-ink-900 text-white/80 text-[0.8rem]">
      <div className="container flex items-center gap-4 py-2">
        <div className="hidden md:flex items-center gap-5 shrink-0">
          {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 hover:text-accent-300 transition-colors"><Icon name="telephone" className="text-accent-400" />{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-accent-300 transition-colors"><Icon name="envelope" className="text-accent-400" />{c.email}</a>}
        </div>
        {t.enabled && t.announcement ? (
          <div className="relative flex-1 overflow-hidden min-w-0 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
              {[0, 1].map((i) => (
                <span key={i} className="flex items-center gap-2 pr-24 whitespace-nowrap" aria-hidden={i === 1}>
                  <span className="rounded-full bg-accent-400 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ink-900">News</span>
                  {t.link ? <Link to={t.link} className="hover:text-white">{fill(t.announcement)}</Link> : fill(t.announcement)}
                </span>
              ))}
            </div>
          </div>
        ) : <div className="flex-1" />}
        <div className="flex items-center gap-3 shrink-0">
          {socials.map(([k, icon]) => (
            <a key={k} href={socialHref(k, settings.social[k])} target="_blank" rel="noreferrer" aria-label={k} className="hover:text-accent-300 transition-colors hover:-translate-y-0.5 inline-block">
              <Icon name={icon} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopItem({ item, solid }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const active = item.end ? pathname === item.to : pathname.startsWith(item.to) || (item.match || []).some((p) => pathname.startsWith(p));
  const color = solid ? 'text-slate-700 hover:text-brand-700' : 'text-white/90 hover:text-white';

  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <NavLink to={item.to} end={item.end} className={cx('relative flex items-center gap-1 whitespace-nowrap px-2.5 xl:px-3 py-2 font-semibold text-[0.9rem] transition-colors', color, active && (solid ? '!text-brand-700' : '!text-white'))}>
        {item.label}
        {item.children && <Icon name="chevron-down" className={cx('text-[0.65rem] transition-transform duration-300', open && 'rotate-180')} />}
        {active && <motion.span layoutId="nav-underline" className={cx('absolute left-2.5 right-2.5 xl:left-3 xl:right-3 -bottom-0.5 h-[3px] rounded-full', solid ? 'bg-brand-600' : 'bg-accent-400')} />}
      </NavLink>

      <AnimatePresence>
        {open && item.children && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className={cx('absolute top-full pt-3 z-50', item.mega ? 'left-1/2 -translate-x-1/2' : 'left-0')}
          >
            <div className={cx('rounded-2xl bg-white shadow-lift ring-1 ring-slate-100 p-3', item.mega ? 'w-[560px]' : 'w-64')}>
              <div className={cx(item.mega && 'grid grid-cols-2 gap-1')}>
                {item.children.filter((c) => !c.divider).map((c) => (
                  <Link key={c.to + c.label} to={c.to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800 transition-colors">
                    <span className="grid place-items-center h-9 w-9 shrink-0 rounded-lg bg-brand-50 text-brand-700 transition-all group-hover:bg-brand-600 group-hover:text-white"><Icon name={c.icon} /></span>
                    <span className="truncate">{c.label}</span>
                  </Link>
                ))}
              </div>
              {item.children.some((c) => c.divider) && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  {item.children.filter((c) => c.divider).map((c) => (
                    <Link key={c.to} to={c.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                      <Icon name={c.icon} />{c.label}<Icon name="arrow-right" className="text-xs" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function MobileMenu({ open, onClose, nav }) {
  const [expanded, setExpanded] = useState(null);
  const { settings } = useSite();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[1040] bg-ink-950/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[1050] w-[88%] max-w-sm bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
              <Brand compact />
              <button onClick={onClose} className="grid place-items-center h-10 w-10 shrink-0 rounded-full bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white transition" aria-label="Close menu"><Icon name="x-lg" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {nav.items.map((item, i) => (
                <motion.div key={item.key} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                  <div className="flex items-center">
                    <NavLink to={item.to} end={item.end} onClick={onClose} className={({ isActive }) => cx('flex-1 rounded-xl px-4 py-3 font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700')}>
                      {item.label}
                    </NavLink>
                    {item.children && (
                      <button onClick={() => setExpanded(expanded === item.key ? null : item.key)} className="grid place-items-center h-11 w-11 rounded-xl text-slate-500 hover:bg-slate-100" aria-label={`Show ${item.label} links`}>
                        <Icon name="chevron-down" className={cx('transition-transform', expanded === item.key && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {expanded === item.key && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                        {item.children.map((c) => (
                          <Link key={c.to + c.label} to={c.to} onClick={onClose} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:text-brand-700">
                            <Icon name={c.icon} className="text-brand-600" />{c.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 space-y-3">
              {nav.portal && <Link to={nav.portal.to} onClick={onClose} className="btn-brand w-full"><Icon name="box-arrow-in-right" />{nav.portal.label}</Link>}
              <div className="text-xs text-slate-500 space-y-1">
                {settings?.contact?.phone && <div><Icon name="telephone" className="text-brand-600 mr-2" />{settings.contact.phone}</div>}
                {settings?.contact?.email && <div><Icon name="envelope" className="text-brand-600 mr-2" />{settings.contact.email}</div>}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const { page, departments, fill } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = buildNav(page, departments, fill);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const solid = scrolled;
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1030]">
        <motion.div animate={{ height: scrolled ? 0 : 'auto', opacity: scrolled ? 0 : 1 }} transition={{ duration: 0.3 }} className="overflow-hidden">
          <TopBar />
        </motion.div>
        <div className={cx('transition-all duration-500', solid ? 'bg-white/95 backdrop-blur-lg shadow-soft' : 'bg-gradient-to-b from-ink-950/70 to-transparent')}>
          <div className={cx('container flex items-center justify-between gap-4 transition-all duration-500', solid ? 'py-2.5' : 'py-4')}>
            <Brand light={!solid} className="max-w-[75%] lg:max-w-[34%]" />
            <nav className="hidden lg:block" aria-label="Main navigation">
              <ul className="flex items-center m-0 p-0 list-none">
                {nav.items.map((item) => <DesktopItem key={item.key} item={item} solid={solid} />)}
              </ul>
            </nav>
            <div className="flex items-center gap-2">
              {nav.portal && (
                <Link to={nav.portal.to} className={cx('hidden sm:inline-flex !py-2.5 !px-5 text-sm', solid ? 'btn-brand' : 'btn-accent')}>
                  <Icon name="person-lock" />{nav.portal.label}
                </Link>
              )}
              <button onClick={() => setMenuOpen(true)} className={cx('lg:hidden grid place-items-center h-11 w-11 rounded-xl text-xl transition', solid ? 'bg-brand-50 text-brand-700' : 'bg-white/15 text-white backdrop-blur')} aria-label="Open menu">
                <Icon name="list" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={nav} />
    </>
  );
}
