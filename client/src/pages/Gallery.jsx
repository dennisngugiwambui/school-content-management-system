import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useFetch from '../hooks/useFetch';
import { asset, zipUrl } from '../lib/api';
import { cx } from '../lib/utils';
import PageHeader from '../components/layout/PageHeader';
import Lightbox from '../components/Lightbox';
import { EmptyState, ErrorState, Icon, Reveal, SmartImage } from '../components/ui';

export default function Gallery() {
  const albums = useFetch('/public/albums', []);
  const photos = useFetch('/public/gallery', []);
  const [album, setAlbum] = useState('all');
  const [idx, setIdx] = useState(null);

  const visible = useMemo(() => (album === 'all' ? photos.data : photos.data.filter((p) => p.album_id === album)), [photos.data, album]);
  const current = albums.data.find((a) => a.id === album);
  const loading = albums.loading || photos.loading;

  return (
    <>
      <PageHeader pageKey="gallery" />
      <section className="section pt-12">
        <div className="container">
          {albums.data.length > 0 && (
            <>
              <Reveal className="mb-10 -mx-3 px-3 overflow-x-auto scrollbar-thin">
                <div className="flex md:flex-wrap md:justify-center gap-2 w-max md:w-auto pb-2">
                  {[{ id: 'all', title: 'All Photos', image_count: photos.data.length }, ...albums.data].map((a) => (
                    <button key={a.id} onClick={() => setAlbum(a.id)}
                      className={cx('relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ring-1', album === a.id ? 'text-white ring-brand-600' : 'text-slate-600 ring-slate-200 hover:text-brand-700 hover:ring-brand-300 bg-white')}>
                      {album === a.id && <motion.span layoutId="album-pill" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <span className="relative">{a.title} <span className={cx('ml-1 text-xs', album === a.id ? 'text-white/75' : 'text-slate-400')}>{a.image_count}</span></span>
                    </button>
                  ))}
                </div>
              </Reveal>

              {album === 'all' && (
                <div className="row g-4 mb-14">
                  {albums.data.slice(0, 4).map((a, k) => (
                    <Reveal key={a.id} delay={k * 0.08} className="col-6 col-lg-3">
                      <button onClick={() => setAlbum(a.id)} className="group relative block w-full aspect-[4/3] overflow-hidden rounded-theme-lg text-left shadow-soft">
                        <SmartImage src={a.cover || a.first_image} alt={a.title} zoom className="absolute inset-0 h-full w-full" />
                        <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 p-4">
                          <span className="block font-heading font-bold text-white leading-tight">{a.title}</span>
                          <span className="text-xs text-accent-300"><Icon name="images" className="mr-1" />{a.image_count} photos</span>
                        </span>
                      </button>
                    </Reveal>
                  ))}
                </div>
              )}
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="-mt-4 mb-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center sm:text-left">
                  {current.description && <p className="m-0 text-slate-500 max-w-2xl">{current.description}</p>}
                  {visible.some((p) => /^\/(uploads|images)\//.test(p.url)) && (
                    <a href={zipUrl(`/albums/${current.id}/download`)} download className="btn-brand !py-2.5 shrink-0 whitespace-nowrap">
                      <Icon name="file-earmark-zip" />Download album ({visible.length})
                    </a>
                  )}
                </motion.div>
              )}
            </>
          )}

          {loading && <div className="columns-2 md:columns-3 lg:columns-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className={cx('skeleton mb-4 break-inside-avoid', i % 3 ? 'h-52' : 'h-72')} />)}</div>}
          {(albums.error || photos.error) && <ErrorState error={albums.error || photos.error} onRetry={() => { albums.reload(); photos.reload(); }} />}
          {!loading && !visible.length && !photos.error && <EmptyState icon="images" title="No photos yet" text="Photos uploaded in the CMS will appear here." />}

          <motion.div layout className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {visible.map((p, k) => (
                <motion.button
                  layout
                  key={p.id}
                  type="button"
                  onClick={() => setIdx(k)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.4, delay: Math.min(k * 0.03, 0.4) }}
                  className="group relative mb-3 md:mb-4 block w-full overflow-hidden rounded-2xl break-inside-avoid shadow-sm"
                >
                  <img src={asset(p.url)} alt={p.caption || ''} loading="lazy" className="w-full h-auto block transition-transform duration-700 group-hover:scale-110 bg-brand-50" />
                  <span className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute right-3 top-3 grid place-items-center h-10 w-10 rounded-full bg-white/90 text-brand-700 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500"><Icon name="zoom-in" /></span>
                  {p.caption && <span className="absolute inset-x-0 bottom-0 p-3 text-left text-xs md:text-sm font-medium text-white translate-y-full group-hover:translate-y-0 transition-transform duration-500">{p.caption}</span>}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
      <Lightbox images={visible} index={idx} onClose={() => setIdx(null)} onIndex={setIdx} />
    </>
  );
}
