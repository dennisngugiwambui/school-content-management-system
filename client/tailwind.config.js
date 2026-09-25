const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const scale = (name) => ({
  ...Object.fromEntries(STEPS.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`])),
  DEFAULT: `rgb(var(--${name}-600) / <alpha-value>)`,
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Bootstrap's reboot provides the base reset and its grid provides `.container`.
  corePlugins: { preflight: false, container: false },
  // Bootstrap owns .collapse (accordions, navbars); Tailwind's visibility:collapse would hide their contents.
  blocklist: ['collapse'],
  theme: {
    extend: {
      colors: {
        brand: scale('brand'),
        accent: scale('accent'),
        ink: scale('ink'),
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Poppins', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        theme: 'var(--radius)',
        'theme-lg': 'calc(var(--radius) * 1.6)',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgb(15 23 42 / 0.15)',
        lift: '0 25px 50px -12px rgb(15 23 42 / 0.25)',
        glow: '0 10px 30px -8px rgb(var(--brand-600) / 0.45)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: '.7' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        progress: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'spin-slow': 'spin-slow 30s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
    },
  },
  plugins: [],
};
