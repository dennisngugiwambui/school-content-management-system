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
