import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { asset, downloadUrl } from '../lib/api';
import { cx } from '../lib/utils';
import { Icon } from './ui';

/**
 * Full-screen image viewer. The photos sit side by side on a snapping strip, so visitors can
 * swipe or scroll through them like a normal feed, or use the arrows, the keyboard or the thumbnails.
 */
export default function Lightbox({ images, index, onClose, onIndex }) {
  const open = index !== null && index >= 0 && !!images[index];
  const track = useRef(null);
  const thumbs = useRef(null);
  const current = useRef(index);
  current.current = index;

  const scrollTo = useCallback((i, smooth = true) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  }, []);
  const go = useCallback((d) => scrollTo((current.current + d + images.length) % images.length), [images.length, scrollTo]);

  // Jump straight to the photo that was tapped when the viewer opens.
  useLayoutEffect(() => {
    if (open) scrollTo(current.current, false);
  }, [open, scrollTo]);

  // The strip's position decides which photo is current, whether it moved by swipe, scroll or button.
  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== current.current && images[i]) onIndex(i);
  };

  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const onResize = () => scrollTo(current.current, false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    };
  }, [open, go, onClose, scrollTo]);

  const img = open ? images[index] : null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-x-0 top-0 z-[2000] flex h-[100dvh] flex-col bg-ink-950/95 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4 text-sm text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1.5 tabular-nums">{index + 1} / {images.length}</span>
            <span className="flex gap-2">
              <a href={downloadUrl(img.url, img.caption || img.album_title)} download target="_blank" rel="noreferrer"
                className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-white no-underline transition hover:bg-brand-600" aria-label="Download this photo">
                <Icon name="download" /><span className="hidden sm:inline">Download</span>
              </a>
              <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><Icon name="x-lg" /></button>
            </span>
          </div>

          <div className="relative min-h-0 flex-1">
            <div ref={track} onScroll={onScroll} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
              {images.map((im, k) => (
                <div key={im.id ?? k} className="flex h-full w-full shrink-0 snap-center items-center justify-center px-2 md:px-20" onClick={onClose}>
                  <img
                    src={asset(im.url)} alt={im.caption || ''} draggable={false}
                    loading={Math.abs(k - index) <= 2 ? 'eager' : 'lazy'}
                    className="max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-lg text-white transition hover:bg-brand-600 md:left-6 md:h-12 md:w-12" aria-label="Previous photo"><Icon name="chevron-left" /></button>
                <button type="button" onClick={() => go(1)} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-lg text-white transition hover:bg-brand-600 md:right-6 md:h-12 md:w-12" aria-label="Next photo"><Icon name="chevron-right" /></button>
              </>
            )}
          </div>

          <div className="px-3 pb-3 pt-2 text-center text-white sm:pb-4">
            <div className="min-h-[2.25rem]">
              {img.caption && <p className="m-0 text-sm font-medium sm:text-base">{img.caption}</p>}
              {img.album_title && <p className="m-0 mt-0.5 text-xs text-white/50">{img.album_title}</p>}
            </div>
            {images.length > 1 && (
              <div ref={thumbs} className="no-scrollbar mx-auto mt-2 flex max-w-4xl gap-2 overflow-x-auto px-1 py-1">
                {images.map((im, k) => (
                  <button
                    key={im.id ?? k} type="button" onClick={() => scrollTo(k)} aria-label={`Photo ${k + 1}`}
                    className={cx('h-12 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-14 sm:w-20', k === index ? 'opacity-100 ring-accent-400' : 'opacity-50 ring-transparent hover:opacity-90')}
                  >
                    <img src={asset(im.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
