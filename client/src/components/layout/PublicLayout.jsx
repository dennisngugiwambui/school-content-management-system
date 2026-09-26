import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import WhatsAppChat from '../WhatsAppChat';
import { PromoPopup } from '../Promo';
import { Icon } from '../ui';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait for the page transition before scrolling to an anchor.
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <>
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] z-[1031] origin-left bg-gradient-to-r from-brand-500 to-accent-400" style={{ scaleX: progress }} />
      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ y: -4 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-[1.25rem] sm:bottom-24 sm:right-6 z-[1020] grid place-items-center h-12 w-12 rounded-full bg-brand-600 text-white shadow-glow"
            aria-label="Back to top"
          >
            <Icon name="arrow-up" className="text-lg" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-clip">
      <ScrollManager />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BackToTop />
      <WhatsAppChat />
      <PromoPopup />
    </div>
  );
}
