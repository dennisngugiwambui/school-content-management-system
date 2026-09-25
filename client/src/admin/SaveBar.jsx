import { AnimatePresence, motion } from 'framer-motion';
import { Icon, Spinner } from '../components/ui';

/** Floating bar that appears when a form has unsaved changes. */
export default function SaveBar({ dirty, saving, onSave, onReset }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 lg:left-[calc(18rem+2rem)] lg:right-8 z-40 flex items-center gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-white shadow-lift">
          <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75 animate-ping" /><span className="relative inline-flex h-3 w-3 rounded-full bg-accent-400" /></span>
          <span className="text-sm font-medium flex-1">You have unsaved changes</span>
          <button type="button" onClick={onReset} className="btn btn-sm btn-dark !rounded-lg">Discard</button>
          <button type="button" onClick={onSave} disabled={saving} className="btn btn-sm btn-primary !rounded-lg !px-4 flex items-center gap-2">
            {saving ? <Spinner className="!h-4 !w-4" /> : <Icon name="check2" />}Save changes
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
