const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Static mode (GitHub Pages): no server. Public content is read from JSON files
 * exported at build time, and site paths are served under the Pages base URL.
 */
export const STATIC = import.meta.env.VITE_STATIC === 'true';
export const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL || '').replace(/\/$/, '');
const PUBLIC_BASE = import.meta.env.BASE_URL || '/';

/**
 * Address of the school management system (students, parents, staff).
 * Order: the address saved in the CMS, then VITE_SCHOOL_PORTAL_URL, then a guess:
 * portal.<this domain> when live (school.co.ke → portal.school.co.ke), or port 3000 locally.
 */
export function schoolPortalUrl(saved) {
  const url = (saved || import.meta.env.VITE_SCHOOL_PORTAL_URL || '').trim().replace(/\/$/, '');
  if (url) return /^https?:\/\//.test(url) ? url : `https://${url}`;
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || /^[\d.]+$/.test(hostname) || hostname.endsWith('.github.io')) {
    return hostname.endsWith('.github.io') ? '' : `${protocol}//${hostname}:3000`;
  }
  return `${protocol}//portal.${hostname.replace(/^www\./, '')}`;
}

/** File name a public API path is exported to, e.g. /public/news?category=event → news_category_event. Shared with the export script. */
export const staticName = (path) => path.replace(/^\/public\//, '').replace(/[^\w-]+/g, '_');
const TOKEN_KEY = 'school_cms_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

/** Resolve an uploaded or remote asset path to a usable URL. */
export function asset(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (STATIC) return `${PUBLIC_BASE}${url.replace(/^\//, '')}`;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** A link that downloads a site image as a file; images hosted elsewhere simply open. */
export function downloadUrl(url, name = '') {
  if (!url) return '';
  if (STATIC || !/^\/(uploads|images)\//.test(url)) return asset(url);
  return `${BASE}/api/public/download?url=${encodeURIComponent(url)}${name ? `&name=${encodeURIComponent(name)}` : ''}`;
}

/** Link that downloads a tender document under a readable name. */
export const tenderDownloadUrl = (t) => (STATIC ? asset(t.file) : `${BASE}/api/public/tenders/${t.id}/download`);

/** Link to a ZIP of several photos (an album or the fee structures). */
export const zipUrl = (path) => (STATIC ? `${PUBLIC_BASE}data/${staticName(`/public${path}`)}.zip` : `${BASE}/api/public${path}`);

async function staticRequest(method, path) {
  if (method !== 'GET' || !path.startsWith('/public/')) {
    const err = new Error('This is the read-only public website. Sign in on the main school server to make changes.');
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${PUBLIC_BASE}data/${staticName(path)}.json`).catch(() => null);
  if (!res?.ok) {
    const err = new Error('Not found.');
    err.status = 404;
    throw err;
  }
  return res.json();
}

async function request(method, path, body) {
  if (STATIC) return staticRequest(method, path);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  del: (p) => request('DELETE', p),
  /** Upload one or more image files; resolves to an array of { url, name, size }. */
  async upload(files) {
    const fd = new FormData();
    [].concat(files).forEach((f) => fd.append('files', f));
    const { files: out } = await request('POST', '/admin/upload', fd);
    return out;
  },
  /** Upload one PDF / Word / Excel document; resolves to { url, name, size }. */
  uploadDocument(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/admin/upload-document', fd);
  },
};
