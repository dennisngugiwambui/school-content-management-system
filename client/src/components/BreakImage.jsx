import { useMemo } from 'react';
import { asset } from '../lib/api';
import { cx } from '../lib/utils';
import { SmartImage } from './ui';

/**
 * An image cut into pieces that pull apart on hover and snap back on leave.
 * Styles: mosaic (grid that separates), shatter (pieces fly out and tilt),
 * slices (columns shift up and down), blinds (rows slide sideways).
 * The parent decides the size (e.g. an aspect-ratio class).
 */
const LAYOUTS = { mosaic: [4, 4], shatter: [3, 3], slices: [1, 6], blinds: [5, 1] };

function transformFor(style, r, c, rows, cols) {
  const dx = cols > 1 ? (c / (cols - 1)) * 2 - 1 : 0; // -1 … 1 from the centre
  const dy = rows > 1 ? (r / (rows - 1)) * 2 - 1 : 0;
  switch (style) {
    case 'shatter': return `translate(${dx * 14}px, ${dy * 14}px) rotate(${((r * 3 + c * 5) % 7) - 3}deg) scale(0.94)`;
    case 'slices': return `translateY(${c % 2 ? 7 : -7}%) scale(0.96)`;
    case 'blinds': return `translateX(${r % 2 ? 5 : -5}%)`;
    default: return `translate(${dx * 5}px, ${dy * 5}px) scale(0.9)`;
  }
}

export default function BreakImage({ src, alt = '', variant = 'mosaic', className, icon }) {
  const url = asset(src);
  const [rows, cols] = LAYOUTS[variant] || LAYOUTS.mosaic;
  const pieces = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.abs(r - (rows - 1) / 2) + Math.abs(c - (cols - 1) / 2);
        out.push({ r, c, t: transformFor(variant, r, c, rows, cols), d: `${Math.round(dist * 45)}ms` });
      }
    }
    return out;
  }, [rows, cols, variant]);

  if (!url) return <SmartImage src={src} alt={alt} icon={icon} className={className} />;
  return (
    <div role="img" aria-label={alt} className={cx('break-img group/break relative overflow-hidden', className)}>
      {pieces.map(({ r, c, t, d }) => (
        <span
          key={`${r}-${c}`}
          className="break-piece"
          style={{
            left: `${(c * 100) / cols}%`, top: `${(r * 100) / rows}%`,
            width: `${100 / cols + 0.1}%`, height: `${100 / rows + 0.1}%`,
            '--t': t, '--d': d,
          }}
        >
          <i style={{ backgroundImage: `url("${url}")`, width: `${cols * 100}%`, height: `${rows * 100}%`, left: `${-c * 100}%`, top: `${-r * 100}%` }} />
        </span>
      ))}
    </div>
  );
}
