import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, asset } from '../lib/api';
import { applyTheme } from '../lib/color';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ loading: true, error: null, installed: true, settings: null, content: {}, departments: [] });

  const reload = useCallback(async () => {
    try {
      const data = await api.get('/public/site');
      setState({ loading: false, error: null, errorStatus: null, ...data });
      return data;
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message, errorStatus: e.status }));
      return null;
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const settings = state.settings;
  const schoolName = settings?.schoolName || 'Our School';

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
    const icon = document.getElementById('favicon');
    if (icon) icon.href = asset(settings.favicon || settings.logo) || '/favicon.svg';
  }, [settings]);

  /**
   * Replace the {school} and {exam} tokens so texts follow the school name and the exam name (KCSE, KJSEA…),
   * and {year} / {nextYear} so yearly notices (admissions) stay current.
   */
  const examName = state.content?.results?.intro?.examName || 'KCSE';
  const fill = useCallback(
    (text) => {
      if (typeof text !== 'string') return text ?? '';
      const year = new Date().getFullYear();
      return text.replaceAll('{school}', schoolName).replaceAll('{exam}', examName)
        .replaceAll('{nextYear}', String(year + 1)).replaceAll('{year}', String(year));
    },
    [schoolName, examName]
  );

  const value = useMemo(
    () => ({
      ...state,
      reload,
      fill,
      schoolName,
      page: (key) => state.content?.pages?.[key] ?? {},
      tiers: state.content?.tiers ?? { staff: [], prefects: [] },
      setTitle: (title) => { document.title = title ? `${title} | ${schoolName}` : schoolName; },
    }),
    [state, reload, fill, schoolName]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function usePageTitle(title) {
  const { setTitle, fill } = useSite();
  useEffect(() => { setTitle(fill(title)); }, [title, setTitle, fill]);
}
