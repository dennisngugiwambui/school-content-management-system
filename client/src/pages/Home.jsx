import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite, usePageTitle } from '../context/SiteContext';
import useFetch from '../hooks/useFetch';
import { asset } from '../lib/api';
import { cx, formatDate } from '../lib/utils';
import { Avatar, Icon, Reveal, RichText, SectionHeading, SmartImage, SmartLink } from '../components/ui';
import Counter from '../components/Counter';
import Lightbox from '../components/Lightbox';
import Timeline from '../components/Timeline';
import BreakImage from '../components/BreakImage';
import Hero from './home/Hero';
import { PromoBanner } from '../components/Promo';
import { ResultsHighlight } from './Results';

/** Counters on a white strip that overlaps the bottom of the hero. */
function Stats({ data }) {
  const { fill } = useSite();
  if (!data?.enabled || !data.items?.length) return <div id="after-hero" />;
  return (
    <div id="after-hero" className="relative z-10 -mt-20 md:-mt-24">
      <div className="container">
        <Reveal y={40} className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-theme-lg bg-white shadow-lift ring-1 ring-slate-100">
          {data.items.slice(0, 4).map((s, k) => (
            <div key={k} className={cx('group flex items-center gap-4 p-5 md:p-7 border-slate-100', k % 2 === 1 && 'border-l', k > 1 && 'border-t lg:border-t-0', k === 2 && 'lg:border-l')}>
              <span className="hidden sm:grid place-items-center h-14 w-14 shrink-0 rounded-2xl bg-brand-50 text-2xl text-brand-700 transition-all duration-500 group-hover:bg-brand-600 group-hover:text-white group-hover:rotate-6">
                <Icon name={s.icon} />
              </span>
              <div>
                <div className="font-heading text-3xl md:text-4xl font-extrabold text-slate-900 leading-none"><Counter value={s.value} suffix={s.suffix} /></div>
                <p className="m-0 mt-1.5 text-xs md:text-sm uppercase tracking-wider text-slate-500">{fill(s.label)}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  );
}

/** "Why choose us": a photo collage beside four numbered reasons. */
function WhyUs({ data }) {
  const { fill, settings } = useSite();
  if (!data?.enabled || !data.items?.length) return null;
  return (
    <section className="section overflow-hidden">
      <div className="container relative">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5">
            <Reveal x={-40} y={0} className="relative mx-auto max-w-md lg:max-w-none pr-10 pb-12 sm:pr-20 sm:pb-16">
              <BreakImage src={data.image} alt="" variant="shatter" className="aspect-[4/3] sm:aspect-[4/5] rounded-[1.75rem] shadow-lift" />
              {data.image2 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7 }}
                  className="absolute bottom-0 right-0 w-3/5 rounded-3xl bg-white p-2 shadow-lift"
                >
                  <BreakImage src={data.image2} alt="" variant="mosaic" className="aspect-[4/3] rounded-2xl" />
                </motion.div>
              )}
              {settings?.established && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute -left-2 top-5 sm:-left-3 sm:top-8 rounded-2xl bg-accent-400 px-3.5 py-2.5 sm:px-5 sm:py-4 text-ink-900 shadow-lg"
                >
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em]">Since</div>
                  <div className="font-heading text-2xl sm:text-3xl font-extrabold leading-none">{settings.established}</div>
                </motion.div>
              )}
            </Reveal>
          </div>
          <div className="col-lg-7 lg:pl-10">
            <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align="left" className="!mb-8" />
            <div className="row g-3 g-md-4">
              {data.items.slice(0, 4).map((f, k) => (
                <Reveal key={k} delay={k * 0.1} className="col-6">
                  <div className="group relative h-full overflow-hidden rounded-theme-lg bg-white p-4 sm:p-6 ring-1 ring-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200">
                    <span className="absolute right-3 top-1 sm:right-4 sm:top-2 font-heading text-3xl sm:text-5xl font-extrabold text-brand-50 transition-colors duration-500 group-hover:text-brand-100">0{k + 1}</span>
                    <span className="icon-tile relative !h-11 !w-11 !text-xl sm:!h-14 sm:!w-14 sm:!text-2xl"><Icon name={f.icon} /></span>
                    <h3 className="relative mt-3 sm:mt-4 text-[0.95rem] sm:text-lg font-bold leading-snug">{fill(f.title)}</h3>
                    <p className="relative m-0 text-xs sm:text-sm text-slate-500 leading-relaxed">{fill(f.text)}</p>
                    <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-600 to-accent-400 transition-transform duration-500 group-hover:scale-x-100" />
                  </div>
                </Reveal>
              ))}
            </div>
            {data.buttonText && (
              <Reveal delay={0.3} className="mt-8"><SmartLink to={data.buttonLink} className="btn-brand">{fill(data.buttonText)}<Icon name="arrow-right" /></SmartLink></Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The principal's message on a deep green band. */
function Welcome({ data }) {
  const { fill } = useSite();
  if (!data?.enabled) return null;
  return (
    <section className="section overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950">
      <div className="container relative">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5 order-lg-2">
            <Reveal x={40} y={0} className="relative mx-auto max-w-[250px] sm:max-w-sm">
              <BreakImage src={data.image} alt={fill(data.name)} icon="person" variant="slices" className="relative aspect-[4/5] rounded-[1.75rem] shadow-lift" />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: 'spring' }}
                className="absolute -left-6 md:-left-10 bottom-5 sm:bottom-8 rounded-2xl bg-white p-3 pr-4 sm:p-4 sm:pr-6 shadow-lift"
              >
                <p className="m-0 font-heading font-bold text-slate-900 leading-tight">{fill(data.name)}</p>
                <p className="m-0 text-xs text-brand-700">{fill(data.role)}</p>
              </motion.div>
            </Reveal>
          </div>
          <div className="col-lg-7 order-lg-1 lg:pr-10">
            <SectionHeading eyebrow={data.eyebrow} title={data.title} align="left" light className="!mb-6" />
            <Reveal delay={0.2} className="relative">
              <Icon name="quote" className="absolute -left-2 -top-10 text-7xl leading-none text-white/10" />
              <RichText text={data.body} className="relative text-[0.95rem] sm:text-[1.05rem] text-white/80 [&_p]:!text-white/80" />
            </Reveal>
            {data.buttonText && (
              <Reveal delay={0.3} className="mt-6"><SmartLink to={data.buttonLink} className="btn-accent">{fill(data.buttonText)}<Icon name="arrow-right" /></SmartLink></Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A learner's path through the school, in the same style as the history timeline. */
function Journey({ data }) {
  const { fill } = useSite();
  if (!data?.enabled || !data.items?.length) return null;
  return (
    <section className="section bg-slate-50">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <Timeline items={data.items} />
        {data.buttonText && (
          <Reveal className="text-center mt-12"><SmartLink to={data.buttonLink} className="btn-outline-brand">{fill(data.buttonText)}<Icon name="arrow-right" /></SmartLink></Reveal>
        )}
      </div>
    </section>
  );
}

/** The top prefect tier (head boy and head girl) as photo cards with their quotes. */
function Leaders({ data, people }) {
  if (!data?.enabled || !people?.length) return null;
  return (
    <section className="section overflow-hidden">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <div className="row g-4 justify-content-center">
          {people.slice(0, 4).map((p, k) => (
            <Reveal key={p.id} delay={k * 0.12} className={people.length > 2 ? 'col-6 col-lg-3' : 'col-6 col-lg-4'}>
              <div className="group relative h-full overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 card-lift">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {p.photo ? <BreakImage src={p.photo} alt={p.name} variant={k % 2 ? 'blinds' : 'mosaic'} className="h-full w-full" /> : <Avatar src={p.photo} name={p.name} className="h-full w-full" textClassName="text-6xl" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 sm:left-4 sm:top-4 inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-accent-400 px-2 sm:px-3 py-1 text-[0.58rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-ink-900 shadow"><Icon name="star-fill" />{p.position}</span>
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                    <h3 className="m-0 text-base sm:text-xl font-bold !text-white leading-tight">{p.name}</h3>
                    {p.class_name && <p className="m-0 text-xs sm:text-sm text-white/70">{p.class_name}</p>}
                  </div>
                </div>
                {p.quote && <p className="m-0 p-3 sm:p-5 text-xs sm:text-sm italic text-slate-600 line-clamp-3 sm:line-clamp-none">“{p.quote}”</p>}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-10"><Link to="/prefects" className="btn-outline-brand">Meet the full prefects body <Icon name="arrow-right" /></Link></Reveal>
      </div>
    </section>
  );
}

function NewsEvents({ newsCfg, eventsCfg, news, events }) {
  const showEvents = eventsCfg?.enabled && events?.length;
  const showNews = newsCfg?.enabled && news?.length;
  if (!showEvents && !showNews) return null;
  return (
    <section className="section">
      <div className="container">
        <div className="row g-5">
          {showNews && (
            <div className={showEvents ? 'col-lg-8' : 'col-12'}>
              <SectionHeading eyebrow={newsCfg.eyebrow} title={newsCfg.title} subtitle={newsCfg.subtitle} align="left" />
              <div className="row g-4">
                {news.map((n, k) => (
                  <Reveal key={n.id} delay={k * 0.1} className={showEvents ? 'col-md-6' : 'col-md-4'}>
                    <NewsCard item={n} breakStyle={['slices', 'mosaic', 'blinds'][k % 3]} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
          {showEvents && (
            <div className={showNews ? 'col-lg-4' : 'col-12'}>
              <SectionHeading eyebrow={eventsCfg.eyebrow} title={eventsCfg.title} align="left" />
              <div className="space-y-4">
                {events.map((e, k) => {
                  const d = new Date(`${e.event_date}T00:00:00`);
                  return (
                    <Reveal key={e.id} delay={k * 0.1} x={30} y={0}>
                      <Link to={`/news/${e.slug}`} className="group flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm hover:shadow-soft hover:ring-brand-200 transition-all">
                        <div className="grid place-items-center shrink-0 h-20 w-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center transition-transform group-hover:scale-105">
                          <div>
                            <div className="font-heading text-2xl font-extrabold leading-none">{d.getDate()}</div>
                            <div className="text-[0.7rem] uppercase tracking-wider mt-1 text-accent-300">{d.toLocaleString(undefined, { month: 'short' })} {d.getFullYear()}</div>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{e.title}</h4>
                          {e.location && <p className="m-0 text-xs text-slate-500"><Icon name="geo-alt" className="text-brand-600 mr-1" />{e.location}</p>}
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
                <Link to="/news" className="inline-flex items-center gap-2 font-semibold text-brand-700 link-underline">All events <Icon name="arrow-right" /></Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

/** News / event card: photo with a date badge, meta line, headline and a full-width "View details" button. */
export function NewsCard({ item, breakStyle }) {
  const isEvent = item.category === 'event';
  const when = isEvent && item.event_date ? item.event_date : item.created_at;
  const upcoming = isEvent && item.event_date && item.event_date >= today();
  return (
    <Link to={`/news/${item.slug}`} className="group flex h-full flex-col overflow-hidden rounded-theme-lg bg-white shadow-soft ring-1 ring-slate-100 card-lift">
      <div className="relative">
        {breakStyle && item.image
          ? <BreakImage src={item.image} alt={item.title} variant={breakStyle} className="aspect-[16/10]" />
          : <SmartImage src={item.image} alt={item.title} icon="newspaper" zoom className="aspect-[16/10]" />}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950/35 to-transparent" />
        <span className={cx('absolute left-3 top-3 sm:left-4 sm:top-4 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider shadow', isEvent ? 'bg-accent-400 text-ink-900' : 'bg-white/95 text-brand-800')}>
          {isEvent ? (upcoming ? 'Upcoming event' : 'Event') : 'News'}
        </span>
        {when && (
          <span className="absolute right-3 top-3 sm:right-4 sm:top-4 min-w-[3.6rem] rounded-xl bg-brand-600 px-2.5 py-1.5 text-center text-white shadow-lg ring-2 ring-white/70 transition-transform duration-500 group-hover:-translate-y-0.5">
            <span className="block font-heading text-2xl font-extrabold leading-none">{formatDate(when, { day: '2-digit' })}</span>
            <span className="mt-0.5 block text-[0.62rem] font-bold uppercase tracking-[0.15em] text-white/85">{formatDate(when, { month: 'short' })}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="m-0 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8rem] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Icon name="calendar-event" className="text-brand-600" />{formatDate(when, { month: 'long', day: '2-digit', year: 'numeric' })}</span>
          {isEvent && item.location && <span className="inline-flex min-w-0 items-center gap-1.5"><Icon name="geo-alt" className="text-brand-600" /><span className="truncate">{item.location}</span></span>}
        </p>
        <h3 className="m-0 text-[1.02rem] sm:text-[1.08rem] font-extrabold uppercase leading-snug tracking-[0.01em] text-slate-900 transition-colors group-hover:text-brand-700 line-clamp-2">{item.title}</h3>
        {item.excerpt && <p className="m-0 mt-2.5 text-sm leading-relaxed text-slate-500 line-clamp-2">{item.excerpt}</p>}
        <span className="mt-auto pt-5">
          <span className="flex w-full items-center justify-center gap-2 rounded-theme bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:bg-brand-700 group-hover:shadow-glow">
            View details <Icon name="arrow-right" className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </span>
      </div>
    </Link>
  );
}

function GalleryPreview({ data, images }) {
  const [idx, setIdx] = useState(null);
  if (!data?.enabled || !images?.length) return null;
  // Eight tiles that exactly fill three rows of four columns.
  const shapes = ['md:col-span-2 md:row-span-2', '', '', 'md:row-span-2', '', '', '', ''];
  return (
    <section className="section bg-slate-50">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense auto-rows-[160px] md:auto-rows-[200px] gap-3 md:gap-4">
          {images.slice(0, 8).map((img, k) => (
            <Reveal key={img.id} delay={k * 0.06} scale={0.9} y={0} className={cx('group relative overflow-hidden rounded-2xl cursor-pointer', shapes[k])}>
              <button type="button" onClick={() => setIdx(k)} className="absolute inset-0 w-full" aria-label={img.caption || 'Open photo'}>
                <BreakImage src={img.url} alt={img.caption} variant={['mosaic', 'slices', 'shatter', 'blinds'][k % 4]} className="h-full w-full" />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute inset-0 grid place-items-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
                  <span className="grid place-items-center h-14 w-14 rounded-full bg-white/95 text-brand-700 text-xl"><Icon name="arrows-fullscreen" /></span>
                </span>
                {img.album_title && <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-semibold text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">{img.album_title}</span>}
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-10"><Link to="/gallery" className="btn-brand"><Icon name="images" />Explore the gallery</Link></Reveal>
      </div>
      <Lightbox images={images} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />
    </section>
  );
}

function Testimonials({ data }) {
  const { fill } = useSite();
  const [i, setI] = useState(0);
  if (!data?.enabled || !data.items?.length) return null;
  const t = data.items[i % data.items.length];
  return (
    <section className="section overflow-hidden">
      <div className="container">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="relative mx-auto max-w-4xl">
          <Icon name="quote" className="absolute -top-10 left-0 text-[9rem] leading-none text-brand-100" />
          <div className="relative rounded-[2rem] bg-white p-8 md:p-14 shadow-lift ring-1 ring-slate-100 text-center min-h-[18rem]">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
                <p className="font-heading text-lg md:text-2xl leading-relaxed text-slate-700 italic">“{fill(t.quote)}”</p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Avatar src={t.photo} name={t.name} className="h-14 w-14 rounded-full ring-4 ring-brand-50" textClassName="text-base" />
                  <div className="text-left">
                    <p className="m-0 font-bold text-slate-900">{fill(t.name)}</p>
                    <p className="m-0 text-sm text-brand-700">{fill(t.role)}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {data.items.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={() => setI((v) => (v - 1 + data.items.length) % data.items.length)} className="grid place-items-center h-11 w-11 rounded-full ring-1 ring-slate-200 text-slate-600 hover:bg-brand-600 hover:text-white hover:ring-brand-600 transition" aria-label="Previous"><Icon name="arrow-left" /></button>
              {data.items.map((_, k) => (
                <button key={k} onClick={() => setI(k)} className={cx('h-2.5 rounded-full transition-all duration-300', k === i ? 'w-8 bg-brand-600' : 'w-2.5 bg-slate-300')} aria-label={`Testimonial ${k + 1}`} />
              ))}
              <button onClick={() => setI((v) => (v + 1) % data.items.length)} className="grid place-items-center h-11 w-11 rounded-full ring-1 ring-slate-200 text-slate-600 hover:bg-brand-600 hover:text-white hover:ring-brand-600 transition" aria-label="Next"><Icon name="arrow-right" /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CTA({ data }) {
  const { fill } = useSite();
  if (!data?.enabled) return null;
  return (
    <section className="pb-16 md:pb-24">
      <div className="container">
        <Reveal scale={0.95} className="relative overflow-hidden rounded-[2rem] bg-brand-700 px-6 py-14 md:px-16 md:py-20 text-center">
          {data.image && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url("${asset(data.image)}")` }} />}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700/85 via-brand-800/80 to-ink-900/90" />
          <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-accent-400/25 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="!text-white text-3xl md:text-5xl font-extrabold leading-tight">{fill(data.title)}</h2>
            <p className="mt-5 text-white/80 text-base md:text-lg">{fill(data.text)}</p>
            {data.buttonText && <SmartLink to={data.buttonLink} className="btn-accent mt-8">{fill(data.buttonText)}<Icon name="arrow-right" /></SmartLink>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const { content } = useSite();
  const { data } = useFetch('/public/home');
  const home = content.home ?? {};
  usePageTitle('');

  return (
    <>
      <Hero hero={home.hero} />
      <Stats data={home.stats} />
      <PromoBanner />
      <WhyUs data={home.features} />
      <Welcome data={home.welcome} />
      <Journey data={home.journey} />
      <ResultsHighlight />
      <Leaders data={home.prefects} people={data?.prefects} />
      <GalleryPreview data={home.gallery} images={data?.gallery} />
      <Testimonials data={home.testimonials} />
      <NewsEvents newsCfg={home.news} eventsCfg={home.events} news={data?.news} events={data?.events} />
      <CTA data={home.cta} />
    </>
  );
}
