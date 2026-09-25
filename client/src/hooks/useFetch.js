import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

/** Fetch JSON from the API with loading/error state. Pass null to skip. */
export default function useFetch(path, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api.get(path));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { data, setData, loading, error, reload: load };
}
