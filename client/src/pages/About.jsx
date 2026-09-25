import { motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import { cx } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import Timeline from '../components/Timeline';
import { Icon, Reveal, RichText, SectionHeading, SmartImage } from '../components/ui';

function Intro({ data }) {
  const { fill } = useSite();
  return (
    <section className="section overflow-hidden">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <Reveal x={-40} y={0} className="relative pr-8 pb-16 sm:pr-16">
              <SmartImage src={data.image} alt="" className="aspect-[4/5] rounded-[1.75rem] shadow-lift" />
              {data.image2 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7 }}
                  className="absolute bottom-0 right-0 w-1/2 rounded-3xl bg-white p-2 shadow-lift"
                >
                  <SmartImage src={data.image2} alt="" className="aspect-[4/3] rounded-2xl" />
                </motion.div>
              )}
              {data.badgeValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute left-4 top-6 rounded-2xl bg-brand-600 px-5 py-4 text-white  shadow-glow"
                >
                  <div className="font-heading text-3xl font-extrabold leading-none">{fill(data.badgeValue)}</div>
                  <div className="text-xs uppercase tracking-wider text-white/80 mt-1">{fill(data.badgeLabel)}</div>
                </motion.div>
              )}
            </Reveal>
          </div>
          <div className="col-lg-6">
            <SectionHeading eyebrow={data.eyebrow} title={data.title} align="left" className="!mb-6" />
            <Reveal delay={0.2}><RichText text={data.body} className="text-[1.05rem]" /></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Identity({ about }) {
  const { fill, settings } = useSite();
  const cards = [about.mission, about.vision, { ...about.motto, text: about.motto?.text || settings?.motto }].filter((c) => c?.text);
  return (
    <section id="identity" className="section bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 overflow-hidden scroll-mt-24">
      <div className="container relative">
        <div className="row g-4">
          {cards.map((c, k) => (
            <Reveal key={k} delay={k * 0.12} className="col-md-4">
              <div className="group h-full rounded-theme-lg bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur transition-all duration-500 hover:bg-white hover:-translate-y-2">
                <span className="grid place-items-center h-16 w-16 rounded-2xl bg-accent-400 text-ink-900 text-3xl transition-transform duration-500 group-hover:rotate-12"><Icon name={c.icon} /></span>
                <h3 className="mt-6 text-2xl font-bold !text-white group-hover:!text-slate-900 transition-colors">{fill(c.title)}</h3>
                <p className="m-0 text-white/75 leading-relaxed group-hover:text-slate-600 transition-colors">{fill(c.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Values({ data }) {
  const { fill } = useSite();
  if (!data?.enabled || !data.items?.length) return null;
  return (
    <section id="values" className="section scroll-mt-24">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="row g-4">
          {data.items.map((v, k) => (
            <Reveal key={k} delay={(k % 3) * 0.1} className="col-sm-6 col-lg-4">
              <div className="group flex h-full gap-5 rounded-theme-lg bg-white p-6 ring-1 ring-slate-100 shadow-sm hover:shadow-soft hover:ring-brand-200 transition-all duration-500">
                <span className="icon-tile shrink-0"><Icon name={v.icon} /></span>
                <div>
                  <h3 className="text-lg font-bold mb-1">{fill(v.title)}</h3>
                  <p className="m-0 text-sm text-slate-500 leading-relaxed">{fill(v.text)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function History({ data }) {
  if (!data?.enabled || !data.items?.length) return null;
  return (
    <section id="history" className="section bg-slate-50 scroll-mt-24">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <Timeline items={data.items} />
      </div>
    </section>
  );
}

function Facilities({ data }) {
  const { fill } = useSite();
  if (!data?.enabled || !data.items?.length) return null;
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="row g-4">
          {data.items.map((f, k) => (
            <Reveal key={k} delay={(k % 4) * 0.1} className="col-sm-6 col-lg-3">
              <div className="group h-full overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 card-lift">
                <SmartImage src={f.image} alt={fill(f.title)} icon={f.icon} zoom className="aspect-[4/3]" />
                <div className="p-5">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Icon name={f.icon} className="text-brand-600" />{fill(f.title)}</h3>
                  <p className="m-0 text-sm text-slate-500">{fill(f.text)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Heritage({ prayer, anthem }) {
  const { fill } = useSite();
  const items = [prayer?.enabled && { ...prayer, icon: 'book-half' }, anthem?.enabled && { ...anthem, icon: 'music-note-beamed' }].filter((x) => x && x.text);
  if (!items.length) return null;
  return (
    <section id="heritage" className="section bg-gradient-to-b from-brand-50/70 to-white scroll-mt-24">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {items.map((it, k) => (
            <Reveal key={k} delay={k * 0.15} className="col-lg-6">
              <div className="relative h-full overflow-hidden rounded-theme-lg bg-white p-8 md:p-10 shadow-soft ring-1 ring-brand-100 text-center">
                <Icon name={it.icon} className="absolute -right-4 -bottom-6 text-[9rem] text-brand-50" />
                <span className="relative inline-grid place-items-center h-16 w-16 rounded-full bg-brand-600 text-white text-2xl shadow-glow"><Icon name={it.icon} /></span>
                <h3 className="relative mt-5 text-2xl font-bold">{fill(it.title)}</h3>
                <p className="relative m-0 font-heading text-lg italic leading-loose text-slate-600 whitespace-pre-line">{fill(it.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ data }) {
  const { settings, fill } = useSite();
  const c = settings?.contact ?? {};
  if (!data?.enabled) return null;
  const rows = [
    ['geo-alt-fill', 'Address', [c.address, c.location].filter(Boolean).join(', ')],
    ['telephone-fill', 'Phone', [c.phone, c.phone2].filter(Boolean).join(' / '), c.phone && `tel:${c.phone}`],
    ['envelope-fill', 'Email', c.email, c.email && `mailto:${c.email}`],
    ['clock-fill', 'Office Hours', c.hours],
  ].filter((r) => r[2]);
  const mapSrc = (c.mapEmbed || '').match(/src="([^"]+)"/)?.[1] || (c.mapEmbed?.startsWith('http') ? c.mapEmbed : '');
  return (
    <section id="contact" className="section scroll-mt-24">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={fill(data.title)} />
        <div className="row g-4">
          <div className={mapSrc ? 'col-lg-5' : 'col-12'}>
            <div className={cx('grid gap-4', !mapSrc && 'sm:grid-cols-2 lg:grid-cols-4')}>
              {rows.map(([icon, label, value, href], k) => (
                <Reveal key={label} delay={k * 0.08}>
                  <div className="group flex items-center gap-4 h-full rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm hover:shadow-soft transition">
                    <span className="grid place-items-center h-14 w-14 shrink-0 rounded-2xl bg-brand-50 text-brand-700 text-xl transition group-hover:bg-brand-600 group-hover:text-white"><Icon name={icon} /></span>
                    <div className="min-w-0">
                      <p className="m-0 text-xs uppercase tracking-wider text-slate-400">{label}</p>
                      {href ? <a href={href} className="font-semibold text-slate-800 hover:text-brand-700 break-words">{value}</a> : <p className="m-0 font-semibold text-slate-800">{value}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          {mapSrc && (
            <Reveal className="col-lg-7" delay={0.2}>
              <iframe title="School location map" src={mapSrc} className="h-full min-h-[360px] w-full rounded-theme-lg shadow-soft ring-1 ring-slate-100" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const { content } = useSite();
  const about = content.about ?? {};
  return (
    <>
      <PageHeader pageKey="about" />
      <Intro data={about.intro ?? {}} />
      <Identity about={about} />
      <Values data={about.values} />
      <History data={about.history} />
      <Facilities data={about.facilities} />
      <Heritage prayer={about.prayer} anthem={about.anthem} />
      <Contact data={about.contact} />
    </>
  );
}
