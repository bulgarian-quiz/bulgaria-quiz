import type { CSSProperties } from 'react';
import { atlasHeight, atlasWidth, regionGeometry } from '@/data/regionGeometry';

// West-to-east order, so the scroll-driven drawing sweeps across the country.
const ORDERED = [...regionGeometry].sort((a, b) => a.x - b.x);

/**
 * Decorative line drawing of Bulgaria's 28 provinces. Where the browser
 * supports scroll-driven animation it draws itself as the page scrolls
 * (see .map-lineart in index.css); otherwise it is simply drawn.
 */
export default function MapLineArt() {
  return (
    <svg className="map-lineart" viewBox={`0 0 ${atlasWidth} ${atlasHeight}`} aria-hidden="true" focusable="false">
      {ORDERED.map((region, index) => (
        <path key={region.id} d={region.path} pathLength={1} style={{ '--k': index } as CSSProperties} />
      ))}
    </svg>
  );
}
