import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../lib/utils';
import { useSite } from '../../context/SiteContext';
import { Icon, Reveal } from '../ui';
import Brand from './Brand';
import { buildNav, SOCIALS, socialHref } from './navItems';

/** A footer column that folds into a tap-to-open row on phones and is always open from tablets up. */
function FooterGroup({ title, className, delay, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal className={className} delay={delay}>
      <div className="border-b border-white/10 md:border-0">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
          className="flex w-full items-center justify-between py-3.5 md:py-0 md:mb-4 md:pointer-events-none text-left">
          <h5 className="m-0 !text-white text-base font-bold">{title}</h5>
          <Icon name="chevron-down" className={cx('md:hidden text-white/60 transition-transform duration-300', open && 'rotate-180')} />
        </button>
        <div className={cx('md:block pb-4 md:pb-0', open ? 'block' : 'hidden')}>{children}</div>
      </div>
    </Reveal>
  );
}

export default function Footer() {
  const { settings, departments, page, fill, schoolName } = useSite();
  const nav = buildNav(page, departments, fill);
  const c = settings?.contact ?? {};
  const socials = SOCIALS.filter(([k]) => settings?.social?.[k]);
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-ink-950 text-white/70 overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" aria-hidden />

      <div className="container relative pt-12 md:pt-20 pb-6 md:pb-8">
        <div className="row gy-0 gx-5 md:gy-5">
          <Reveal className="col-lg-4 pb-4 md:pb-0">
            <Brand light />
            <p className="mt-4 md:mt-5 text-sm leading-relaxed text-white/65">{fill(settings?.footer?.about)}</p>
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {socials.map(([k, icon]) => (
                  <a key={k} href={socialHref(k, settings.social[k])} target="_blank" rel="noreferrer" aria-label={k}
                    className="grid place-items-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-brand-600 hover:-translate-y-1 transition-all duration-300">
                    <Icon name={icon} />
                  </a>
                ))}
              </div>
            )}
          </Reveal>

          <FooterGroup title="Quick Links" className="col-md-4 col-lg-2" delay={0.1}>
            <ul className="list-none p-0 m-0 grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2.5 text-sm">
              {nav.items.flatMap((i) => (i.key === 'downloads' ? i.children.map((c) => ({ ...c, key: c.to })) : [i])).map((i) => (
                <li key={i.key}><Link to={i.to} className="group inline-flex items-center gap-2 hover:text-accent-300 transition-colors"><Icon name="chevron-right" className="text-[0.6rem] text-brand-400 transition-transform group-hover:translate-x-1" />{i.label}</Link></li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title={fill(page('departments').label) || 'Academics'} className="col-md-4 col-lg-3" delay={0.2}>
            <ul className="list-none p-0 m-0 space-y-2.5 text-sm">
              {departments.slice(0, 7).map((d) => (
                <li key={d.id}><Link to={`/departments/${d.slug}`} className="group inline-flex items-center gap-2 hover:text-accent-300 transition-colors"><Icon name="chevron-right" className="text-[0.6rem] text-brand-400 transition-transform group-hover:translate-x-1" />{d.name}</Link></li>
              ))}
              {!departments.length && <li className="text-white/40">Departments will appear here.</li>}
            </ul>
          </FooterGroup>

          <FooterGroup title="Contact Us" className="col-md-4 col-lg-3" delay={0.3}>
            <ul className="list-none p-0 m-0 space-y-3 md:space-y-4 text-sm">
              {c.address && <li className="flex gap-3"><Icon name="geo-alt-fill" className="text-accent-400 mt-0.5" /><span>{c.address}{c.location && <><br />{c.location}</>}</span></li>}
              {c.phone && <li className="flex gap-3"><Icon name="telephone-fill" className="text-accent-400 mt-0.5" /><span><a href={`tel:${c.phone}`} className="hover:text-white">{c.phone}</a>{c.phone2 && <><br /><a href={`tel:${c.phone2}`} className="hover:text-white">{c.phone2}</a></>}</span></li>}
              {c.email && <li className="flex gap-3"><Icon name="envelope-fill" className="text-accent-400 mt-0.5" /><span><a href={`mailto:${c.email}`} className="hover:text-white break-all">{c.email}</a>{c.email2 && <><br /><a href={`mailto:${c.email2}`} className="hover:text-white break-all">{c.email2}</a></>}</span></li>}
              {c.hours && <li className="flex gap-3"><Icon name="clock-fill" className="text-accent-400 mt-0.5" /><span>{c.hours}</span></li>}
            </ul>
          </FooterGroup>
        </div>

        <div className="mt-8 md:mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p className="m-0 text-center md:text-left">{fill(settings?.footer?.copyright) || `© ${year} ${schoolName}. All rights reserved.`}</p>
          <div className="flex items-center gap-4">
            {settings?.motto && <span className="italic">“{fill(settings.motto)}”</span>}
            {nav.portal && <Link to="/portal" className="hover:text-accent-300"><Icon name="lock" className="mr-1" />{nav.portal.label}</Link>}
          </div>
        </div>
      </div>
    </footer>
  );
}
