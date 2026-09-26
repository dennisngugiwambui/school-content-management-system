import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { motion } from 'framer-motion';
import { Avatar, Icon, RichText } from './ui';
import { cx } from '../lib/utils';

/** Portrait card for a staff member; opens a detailed profile modal. */
export function StaffCard({ person, onOpen, size = 'md', badge }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen?.(person)}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative w-full text-left rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 overflow-hidden hover:shadow-lift transition-shadow duration-500"
    >
      <div className={cx('relative overflow-hidden', size === 'lg' ? 'aspect-[4/4.6]' : 'aspect-[4/4.4]')}>
        <Avatar src={person.photo} name={person.name} className="h-full w-full transition-transform duration-700 group-hover:scale-110" textClassName={size === 'lg' ? 'text-6xl' : 'text-5xl'} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
        {badge && <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 rounded-full bg-accent-400 px-2 sm:px-3 py-1 text-[0.6rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-ink-900 shadow">{badge}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">View profile <Icon name="arrow-right" /></span>
        </div>
      </div>
      <div className="relative p-3 pt-4 sm:p-5 text-center">
        <span className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand-600 text-white shadow-glow ring-4 ring-white transition-transform duration-500 group-hover:rotate-[360deg]">
          <Icon name="person-badge" />
        </span>
        <h3 className="mt-3 sm:mt-4 text-[0.95rem] sm:text-lg font-bold leading-snug">{person.name}</h3>
        <p className="m-0 text-xs sm:text-sm font-medium text-brand-700">{person.position}</p>
        {person.department_name && <p className="m-0 mt-1 text-xs text-slate-400">{person.department_name}</p>}
      </div>
    </motion.button>
  );
}

export function StaffModal({ person, onHide }) {
  return (
    <Modal show={Boolean(person)} onHide={onHide} centered size="lg">
      {person && (
        <div className="relative">
          <button onClick={onHide} className="absolute right-4 top-4 z-10 grid place-items-center h-10 w-10 rounded-full bg-white/90 text-slate-700 shadow hover:bg-brand-600 hover:text-white transition" aria-label="Close"><Icon name="x-lg" /></button>
          <div className="row g-0">
            <div className="col-md-5">
              <Avatar src={person.photo} name={person.name} className="h-56 sm:h-72 md:h-full w-full md:min-h-[18rem]" textClassName="text-7xl" />
            </div>
            <div className="col-md-7 p-6 md:p-8">
              <span className="eyebrow">{person.position}</span>
              <h3 className="mt-2 text-2xl md:text-3xl font-extrabold">{person.name}</h3>
              {person.department_name && (
                <Link to={`/departments/${person.department_slug}`} onClick={onHide} className="inline-flex items-center gap-2 mt-1 text-sm font-semibold text-brand-700 hover:underline">
                  <Icon name="building" />{person.department_name}
                </Link>
              )}
              {person.reports_to && (
                <p className="mt-3 mb-0 flex items-center gap-2 text-sm text-slate-600"><Icon name="diagram-3" className="text-brand-600" />Reports to <strong className="text-slate-800">{person.reports_to}</strong></p>
              )}
              {person.qualifications && (
                <p className="mt-4 mb-0 flex items-start gap-2 text-sm text-slate-600"><Icon name="mortarboard-fill" className="text-accent-500 mt-0.5" />{person.qualifications}</p>
              )}
              {person.bio && <RichText text={person.bio} className="mt-4 text-[0.95rem]" />}
              <div className="flex flex-wrap gap-2 mt-4">
                {person.email && <a href={`mailto:${person.email}`} className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-600 hover:text-white transition"><Icon name="envelope" />{person.email}</a>}
                {person.phone && <a href={`tel:${person.phone}`} className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-600 hover:text-white transition"><Icon name="telephone" />{person.phone}</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Compact horizontal row for long lists (e.g. teaching staff). */
export function StaffRow({ person, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen?.(person)} className="group flex w-full items-center gap-4 rounded-2xl bg-white p-3 pr-5 text-left ring-1 ring-slate-100 shadow-sm hover:shadow-soft hover:ring-brand-200 hover:-translate-y-0.5 transition-all duration-300">
      <Avatar src={person.photo} name={person.name} className="h-16 w-16 shrink-0 rounded-xl" textClassName="text-lg" />
      <div className="min-w-0 flex-1">
        <h4 className="m-0 text-base font-bold truncate">{person.name}</h4>
        <p className="m-0 text-sm text-brand-700 truncate">{person.position}</p>
        {person.department_name && <p className="m-0 text-xs text-slate-400 truncate">{person.department_name}</p>}
      </div>
      <Icon name="chevron-right" className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
    </button>
  );
}

export function useProfileModal() {
  const [person, setPerson] = useState(null);
  return { open: setPerson, modal: <StaffModal person={person} onHide={() => setPerson(null)} /> };
}
