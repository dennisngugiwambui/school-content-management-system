const STEPS = {
  50: ['w', 0.94], 100: ['w', 0.86], 200: ['w', 0.72], 300: ['w', 0.52], 400: ['w', 0.28], 500: ['w', 0.12],
  600: ['b', 0], 700: ['b', 0.18], 800: ['b', 0.34], 900: ['b', 0.48], 950: ['b', 0.66],
};

export function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Generate an 11-step tint/shade scale where step 600 is the exact chosen colour. */
export function makeScale(hex) {
  const base = hexToRgb(hex) || [22, 163, 74];
  return Object.fromEntries(
    Object.entries(STEPS).map(([step, [dir, t]]) => [step, mix(base, dir === 'w' ? [255, 255, 255] : [0, 0, 0], t)])
  );
}

export function luminance([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const RADII = { none: '0.25rem', sm: '0.5rem', md: '0.7rem', lg: '0.9rem', xl: '1.25rem' };

export const FONT_OPTIONS = [
  'Poppins', 'Inter', 'Montserrat', 'Plus Jakarta Sans', 'DM Sans', 'Outfit', 'Nunito', 'Raleway', 'Roboto',
  'Open Sans', 'Lato', 'Playfair Display', 'Merriweather', 'Lora', 'Cormorant Garamond', 'EB Garamond',
];

export const THEME_PRESETS = [
  { name: 'Classic Green', primary: '#16a34a', accent: '#f59e0b', dark: '#0b2e1a' },
  { name: 'Emerald', primary: '#059669', accent: '#eab308', dark: '#062a1f' },
  { name: 'Forest', primary: '#166534', accent: '#facc15', dark: '#052e16' },
  { name: 'Royal Blue', primary: '#1d4ed8', accent: '#f59e0b', dark: '#0b1a3d' },
  { name: 'Maroon', primary: '#9f1239', accent: '#fbbf24', dark: '#2a0712' },
  { name: 'Navy & Gold', primary: '#1e3a8a', accent: '#d4a017', dark: '#0a1330' },
  { name: 'Purple', primary: '#7e22ce', accent: '#f59e0b', dark: '#1e0a33' },
  { name: 'Teal', primary: '#0f766e', accent: '#fb923c', dark: '#042f2e' },
];

/** Push the CMS theme into CSS variables so Tailwind + Bootstrap recolour instantly. */
export function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  for (const [name, hex] of [['brand', theme.primary], ['accent', theme.accent], ['ink', theme.dark]]) {
    const scale = makeScale(hex);
    for (const [step, rgb] of Object.entries(scale)) root.setProperty(`--${name}-${step}`, rgb.join(' '));
  }
  const primary = hexToRgb(theme.primary) || [22, 163, 74];
  root.setProperty('--brand-contrast', luminance(primary) > 0.55 ? '15 23 42' : '255 255 255');
  root.setProperty('--font-heading', `'${theme.headingFont || 'Poppins'}'`);
  root.setProperty('--font-body', `'${theme.bodyFont || 'Inter'}'`);
  root.setProperty('--radius', RADII[theme.radius] || RADII.lg);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.primary || '#16a34a');
  loadFonts([theme.headingFont, theme.bodyFont]);
}

export function loadFonts(fonts) {
  const families = [...new Set(fonts.filter(Boolean))]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`)
    .join('&');
  if (!families) return;
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  let link = document.getElementById('theme-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'theme-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
}
