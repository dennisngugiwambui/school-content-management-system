import { useEffect } from 'react';

/** Warn before closing the tab while there are unsaved edits. */
export default function useUnsaved(dirty) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
