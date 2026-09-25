import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { asset, downloadUrl } from '../lib/api';
import { Icon } from './ui';

/** Full-screen image viewer with keyboard, button and swipe navigation. */
export default function Lightbox({ images, index, onClose, onIndex }) {
  const open = index !== null && index >= 0 && images[index];
  const go = useCallback((d) => onIndex((index + d + images.length) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, go, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[2000] bg-ink-950/95 backdrop-blur-md flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true">
          <div className="flex items-center justify-between p-4 text-white/80 text-sm">
            <span>{index + 1} / {images.length}</span>
            <span className="flex gap-2">
            <a href={downloadUrl(images[index].url, images[index].caption || images[index].album_title)} download target="_blank" rel="noreferrer"
              className="flex items-center gap-2 h-11 rounded-full bg-white/10 hover:bg-brand-600 px-4 text-white no-underline transition" aria-label="Download this photo">
              <Icon name="download" /><span className="hidden sm:inline">Download</span>
            </a>
            <button onClick={onClose} className="grid place-items-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Close"><Icon name="x-lg" /></button>
            </span>
          </div>
          <div className="relative flex-1 flex items-center justify-center px-2 md:px-20 min-h-0" onClick={onClose}>
            <AnimatePresence mode="wait">
              <motion.img
                key={images[index].id ?? index}
                src={asset(images[index].url)}
                alt={images[index].caption || ''}
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl select-none"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3 }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4}
                onDragEnd={(e, info) => { if (info.offset.x < -80) go(1); else if (info.offset.x > 80) go(-1); }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 md:left-6 grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-brand-600 text-white text-xl transition" aria-label="Previous"><Icon name="chevron-left" /></button>
                <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 md:right-6 grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-brand-600 text-white text-xl transition" aria-label="Next"><Icon name="chevron-right" /></button>
              </>
            )}
          </div>
          <div className="p-4 text-center text-white">
            {images[index].caption && <p className="m-0 font-medium">{images[index].caption}</p>}
            {images[index].album_title && <p className="m-0 text-xs text-white/50 mt-1">{images[index].album_title}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
