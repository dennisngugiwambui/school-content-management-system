import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Dropdown from 'react-bootstrap/Dropdown';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SessionGuard from './SessionGuard';
import { useSite } from '../context/SiteContext';
import { asset } from '../lib/api';
import { cx, initials } from '../lib/utils';
import { Icon } from '../components/ui';

export const ADMIN_NAV = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: 'speedometer2', end: true }] },
  {
    group: 'Website Content',
    items: [
      { to: '/admin/content/home', label: 'Home Page', icon: 'house-door' },
      { to: '/admin/content/about', label: 'About Page', icon: 'info-circle' },
      { to: '/admin/content/results', label: 'Exam Results', icon: 'award' },
      { to: '/admin/content/fees', label: 'Fee Structure', icon: 'cash-coin' },
      { to: '/admin/content/promo', label: 'Promotions', icon: 'megaphone' },
      { to: '/admin/content/pages', label: 'Page Banners & Menu', icon: 'menu-button-wide' },
      { to: '/admin/content/tiers', label: 'Hierarchy Levels', icon: 'diagram-3' },
    ],
  },
  {
    group: 'School Records',
    items: [
      { to: '/admin/departments', label: 'Departments', icon: 'building' },
      { to: '/admin/staff', label: 'Teachers & Staff', icon: 'person-badge' },
      { to: '/admin/prefects', label: 'Prefects', icon: 'stars' },
      { to: '/admin/gallery', label: 'Gallery', icon: 'images' },
      { to: '/admin/news', label: 'News & Events', icon: 'newspaper' },
      { to: '/admin/tenders', label: 'Tenders', icon: 'file-earmark-text' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Branding & Settings', icon: 'palette', admin: true },
      { to: '/admin/users', label: 'Users', icon: 'people', admin: true },
      { to: '/admin/account', label: 'My Account', icon: 'person-gear' },
    ],
  },
];

function SideNav({ onNavigate }) {
  const { isAdmin } = useAuth();
  const { settings, schoolName } = useSite();
  return (
    <div className="flex h-full flex-col bg-ink-950 text-white/70">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        {settings?.logo ? <img src={asset(settings.logo)} alt="" className="h-10 w-10 object-contain" /> : (
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand-600 font-heading font-bold text-white">{initials(settings?.shortName || schoolName)}</span>
        )}
        <span className="min-w-0">
          <span className="block truncate font-heading text-sm font-bold text-white">{schoolName}</span>
          <span className="block text-[0.7rem] uppercase tracking-widest text-accent-300">Content Manager</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((i) => !i.admin || isAdmin);
          if (!items.length) return null;
          return (
            <div key={g.group} className="mb-5">
              <p className="px-3 mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">{g.group}</p>
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={onNavigate}
                  className={({ isActive }) => cx('relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'text-white' : 'hover:bg-white/5 hover:text-white')}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="admin-active" className="absolute inset-0 rounded-xl bg-brand-600 shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <Icon name={i.icon} className="relative text-base" />
                      <span className="relative">{i.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-400 hover:text-ink-900 transition">
          <Icon name="box-arrow-up-right" />View website
        </a>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = ADMIN_NAV.flatMap((g) => g.items).find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));

  useEffect(() => { document.title = `${current?.label || 'Admin'} | CMS`; }, [current]);

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-72">
      <SessionGuard />
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30"><SideNav /></aside>
      <Offcanvas show={menu} onHide={() => setMenu(false)} className="!w-72 !border-0">
        <SideNav onNavigate={() => setMenu(false)} />
      </Offcanvas>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur px-4 md:px-8 py-3">
        <button onClick={() => setMenu(true)} className="lg:hidden grid place-items-center h-10 w-10 rounded-xl bg-slate-100 text-slate-700" aria-label="Open menu"><Icon name="list" className="text-xl" /></button>
        <div className="min-w-0">
          <p className="m-0 text-[0.7rem] uppercase tracking-widest text-slate-400">CMS</p>
          <h1 className="m-0 text-lg md:text-xl font-bold truncate">{current?.label || 'Admin'}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex btn btn-light !rounded-xl btn-sm items-center gap-2"><Icon name="globe" />Site</a>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 ring-1 ring-slate-200 hover:ring-brand-300 after:!hidden">
              <span className="grid place-items-center h-8 w-8 rounded-full bg-brand-600 text-xs font-bold text-white">{initials(user?.name)}</span>
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{user?.name?.split(' ')[0]}</span>
              <Icon name="chevron-down" className="text-xs text-slate-400" />
            </Dropdown.Toggle>
            <Dropdown.Menu className="!rounded-xl !shadow-lift !border-0 !p-2">
              <Dropdown.ItemText className="!text-xs !text-slate-500">{user?.email}<br /><span className="badge badge-soft mt-1 capitalize">{user?.role}</span></Dropdown.ItemText>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/admin/account" className="!rounded-lg"><Icon name="person-gear" className="mr-2" />My account</Dropdown.Item>
              <Dropdown.Item onClick={() => { logout(); navigate('/portal'); }} className="!rounded-lg !text-red-600"><Icon name="box-arrow-right" className="mr-2" />Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      <motion.main key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 md:p-8">
        <Outlet />
      </motion.main>
    </div>
  );
}
