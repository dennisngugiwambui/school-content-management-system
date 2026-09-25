import { motion } from 'framer-motion';

export default function Preloader({ label = 'Loading' }) {
  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-pulse-ring" />
          <motion.span
            className="absolute inset-0 grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white text-3xl shadow-glow"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <i className="bi bi-mortarboard-fill" />
          </motion.span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">{label}</p>
      </div>
    </div>
  );
}
