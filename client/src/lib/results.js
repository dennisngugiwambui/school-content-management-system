export const DEFAULT_GRADE_SCALE = 'A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E';

/** "A, A-, B+ …" → ['A', 'A-', 'B+', …] */
export const gradeScale = (text) =>
  String(text || DEFAULT_GRADE_SCALE).split(',').map((g) => g.trim()).filter(Boolean);

export const ordinal = (v) => {
  const n = Number(v);
  if (!n) return v;
  const s = ['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10];
  return `${n}${s}`;
};

/** The grade counts of a year in scale order, with totals; null when no grades were entered. */
export function gradeBreakdown(year, scale) {
  const counts = year?.grades ?? {};
  const rows = scale.map((g) => ({ grade: g, count: Number(counts[g]) || 0 }));
  const total = rows.reduce((n, r) => n + r.count, 0);
  if (!total) return null;
  const max = Math.max(...rows.map((r) => r.count));
  return { rows: rows.map((r) => ({ ...r, pct: (r.count / total) * 100, bar: (r.count / max) * 100 })), total };
}

/** Colour band for a grade by its place in the scale: top grades brand, middle accent, lowest slate. */
export function gradeTone(index, length) {
  const t = index / Math.max(1, length - 1);
  if (t < 0.34) return 'brand';
  if (t < 0.67) return 'accent';
  return 'slate';
}
