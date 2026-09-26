import { useId } from 'react';
import { cx } from '../lib/utils';

export const EDGE_SHAPES = [
  { value: 'zigzag', label: 'Zigzag (trimmed paper)' },
  { value: 'torn', label: 'Torn paper' },
  { value: 'scallop', label: 'Scalloped' },
  { value: 'wave', label: 'Wave' },
  { value: 'curve', label: 'Curve' },
  { value: 'slant', label: 'Slant' },
  { value: 'straight', label: 'Straight' },
];

// A fixed, hand-picked jagged line so the torn edge looks the same on every visit.
const TORN = 'M0 40V22L24 26L46 18L70 27L92 16L118 25L140 20L166 29L190 17L214 24L238 14L262 26L290 19L312 28L338 15L362 23L386 18L410 27L436 16L460 25L484 19L510 28L534 14L560 24L584 18L608 27L632 17L658 25L682 20L706 29L730 15L756 24L780 18L806 26L830 16L854 25L880 19L904 28L928 15L954 24L978 18L1002 27L1026 16L1052 25L1076 20L1100 28L1126 15L1150 24L1174 19L1200 27L1224 17L1248 26L1274 18L1298 25L1322 15L1348 24L1372 19L1396 27L1420 18L1440 23V40Z';

/**
 * Shaped bottom edge for a banner, drawn in the colour of the section below (currentColor).
 * Repeating shapes (zigzag, scallop) keep a fixed tooth size at every screen width instead of stretching.
 */
export default function EdgeShape({ shape = 'zigzag', className }) {
  const id = useId().replace(/:/g, '');
  if (!shape || shape === 'straight') return null;
  const base = cx('pointer-events-none absolute inset-x-0 -bottom-px z-[1] w-full', className);

  if (shape === 'zigzag' || shape === 'scallop') {
    const tooth = shape === 'zigzag' ? 'M0 12L9 3L18 12Z' : 'M0 14A11 11 0 0 1 22 14Z';
    const [w, h] = shape === 'zigzag' ? [18, 12] : [22, 14];
    return (
      <svg className={base} height={h} aria-hidden>
        <defs>
          <pattern id={`edge-${id}`} width={w} height={h} patternUnits="userSpaceOnUse"><path d={tooth} fill="currentColor" /></pattern>
        </defs>
        <rect width="100%" height={h} fill={`url(#edge-${id})`} />
      </svg>
    );
  }

  const paths = {
    torn: ['0 0 1440 40', TORN, 'h-5 sm:h-7'],
    wave: ['0 0 1440 60', 'M0 60V30Q360 0 720 30T1440 30V60Z', 'h-8 sm:h-12'],
    curve: ['0 0 1440 60', 'M0 60V0Q720 90 1440 0V60Z', 'h-8 sm:h-14'],
    slant: ['0 0 1440 60', 'M0 60L1440 0V60Z', 'h-8 sm:h-14'],
  };
  const [box, d, height] = paths[shape] ?? paths.wave;
  return (
    <svg className={cx(base, height)} viewBox={box} preserveAspectRatio="none" aria-hidden>
      <path fill="currentColor" d={d} />
    </svg>
  );
}
