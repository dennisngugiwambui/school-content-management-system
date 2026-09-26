import { waNumber } from '../WhatsAppChat';
import { STATIC } from '../../lib/api';
/** Build the public navigation from CMS page settings and the live department list. */
export function buildNav(page, departments = [], fill = (s) => s) {
  const label = (key, fallback) => fill(page(key).label || fallback);
  const shown = (key) => page(key).showInNav !== false;

  const items = [
    { key: 'home', to: '/', label: label('home', 'Home'), end: true },
    shown('about') && {
      key: 'about',
      to: '/about',
      label: label('about', 'About'),
      children: [
        { to: '/about', label: 'Our Story', icon: 'book' },
        { to: '/about#identity', label: 'Mission & Vision', icon: 'bullseye' },
        { to: '/about#values', label: 'Core Values', icon: 'gem' },
        { to: '/about#history', label: 'Our History', icon: 'clock-history' },
        { to: '/about#heritage', label: 'Prayer & Anthem', icon: 'music-note-list' },
        { to: '/about#contact', label: 'Contact Us', icon: 'geo-alt' },
      ],
    },
    shown('departments') && {
      key: 'departments',
      to: '/departments',
      label: label('departments', 'Departments'),
      mega: true,
      children: [
        ...departments.map((d) => ({ to: `/departments/${d.slug}`, label: d.name, icon: d.icon || 'journal-bookmark' })),
        { to: '/departments', label: 'All Departments', icon: 'grid', divider: true },
      ].filter(Boolean),
    },
    // Staff, prefects and the structure chart share one menu to keep the bar on one line.
    (shown('staff') || shown('prefects')) && {
      key: 'people',
      to: shown('staff') ? '/staff' : '/prefects',
      label: 'Our People',
      match: ['/staff', '/prefects', '/structure'],
      children: [
        shown('staff') && { to: '/staff', label: label('staff', 'Our Staff'), icon: 'person-badge' },
        shown('prefects') && { to: '/prefects', label: label('prefects', 'Prefects'), icon: 'stars' },
        shown('structure') && { to: '/structure', label: label('structure', 'School Structure'), icon: 'diagram-3' },
      ].filter(Boolean),
    },
    shown('gallery') && { key: 'gallery', to: '/gallery', label: label('gallery', 'Gallery') },
    shown('results') && { key: 'results', to: '/results', label: label('results', 'Results') },
    shown('news') && { key: 'news', to: '/news', label: label('news', 'News & Events') },
    // Fees and tenders share a "Downloads" menu so the bar stays on one line; alone, each is a plain link.
    shown('fees') && shown('tenders')
      ? {
        key: 'downloads',
        to: '/fees',
        label: 'Downloads',
        match: ['/fees', '/tenders'],
        children: [
          { to: '/fees', label: label('fees', 'Fee Structure'), icon: 'cash-coin' },
          { to: '/tenders', label: label('tenders', 'Tenders'), icon: 'file-earmark-text' },
        ],
      }
      : shown('fees') ? { key: 'fees', to: '/fees', label: label('fees', 'Fees') }
        : shown('tenders') && { key: 'tenders', to: '/tenders', label: label('tenders', 'Tenders') },
  ].filter(Boolean);

  return { items, portal: !STATIC && shown('portal') ? { to: '/portal', label: label('portal', 'Portal') } : null };
}

export const SOCIALS = [
  ['facebook', 'facebook'], ['twitter', 'twitter-x'], ['instagram', 'instagram'], ['youtube', 'youtube'],
  ['linkedin', 'linkedin'], ['tiktok', 'tiktok'], ['whatsapp', 'whatsapp'],
];

export const socialHref = (key, value) =>
  key === 'whatsapp' && !/^https?:/.test(value) ? `https://wa.me/${waNumber(value)}` : value;
