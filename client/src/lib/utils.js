export const cx = (...c) => c.filter(Boolean).join(' ');

export function initials(name = '') {
  const parts = String(name).replace(/^(dr|mr|mrs|ms|prof|rev|fr|sr)\.?\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function formatDate(value, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '';
  const d = new Date(String(value).includes('T') || String(value).length > 10 ? String(value).replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, opts);
}

export const paragraphs = (text = '') => String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export function groupByTier(items, tiers) {
  const groups = tiers.map((t) => ({ ...t, items: items.filter((i) => i.tier === t.key) }));
  const known = new Set(tiers.map((t) => t.key));
  const other = items.filter((i) => !known.has(i.tier));
  if (other.length) groups.push({ key: '_other', label: 'Others', items: other });
  return groups.filter((g) => g.items.length);
}

export const isExternal = (href = '') => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');

/** Human file size, e.g. 1.4 MB. */
export function fileSize(bytes) {
  const n = Number(bytes) || 0;
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

/** The place shown on the map: the admin's map location, else the physical location, else the address. */
export const mapPlace = (c = {}) => String(c.mapLocation || c.location || c.address || '').trim();

/**
 * Google Maps embed URL for the contact settings. A pasted embed code (or its URL) wins;
 * otherwise the map is built from a place name, address or "lat, lng" coordinates.
 */
export function mapEmbedSrc(c = {}) {
  const pasted = String(c.mapEmbed || '').trim();
  const src = pasted.match(/src="([^"]+)"/)?.[1] || (/^https:\/\/(www\.)?google\.[a-z.]+\/maps/.test(pasted) ? pasted : '');
  if (src) return src;
  const place = mapPlace(c);
  return place ? `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=15&output=embed` : '';
}

export const directionsUrl = (c = {}) => (mapPlace(c) ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapPlace(c))}` : '');
