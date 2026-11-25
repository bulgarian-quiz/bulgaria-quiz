import type { CSSProperties } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { regionsData } from '@/data/questions';
import { atlasHeight, atlasWidth, regionGeometry } from '@/data/regionGeometry';

interface RegionAtlasProps {
  variant?: 'quiz' | 'placement';
  completed?: Record<string, boolean>;
  scores?: Record<string, { score: number; total: number }>;
  locked?: Set<string>;
  onSelect?: (id: string) => void;
  onDropRegion?: (id: string, source?: string) => void;
}

// Hand-tuned label nudges where neighbouring labels collide: Sofia city sits
// inside Sofia province, right next to Pernik, so their centroids share a row.
// Sofia province's label goes on two lines in the open, central part of the
// province (measured against its outline), so it no longer spills over the
// border towards Pazardzhik and Plovdiv.
const LABEL_NUDGE: Record<string, { dx: number; dy: number }> = {
  sofiaCity: { dx: 0, dy: -8 },
  sofiaProvince: { dx: -12, dy: -26 },
};
const TWO_LINE_LABELS = new Set(['sofiaProvince']);

/**
 * A quiz result's colour: every answer right is green, two of three is yellow,
 * one or none is red. (Provinces completed without a score, such as placed
 * provinces in the map game, stay green.)
 */
function scoreTier(result: { score: number; total: number }): 'perfect' | 'partial' | 'low' {
  if (result.total > 0 && result.score >= result.total) return 'perfect';
  if (result.total > 0 && result.score / result.total >= 2 / 3) return 'partial';
  return 'low';
}
const TIER_CLASS = { perfect: ' is-complete', partial: ' is-partial', low: ' is-low' } as const;

export default function RegionAtlas({ variant = 'quiz', completed = {}, scores = {}, locked, onSelect, onDropRegion }: RegionAtlasProps) {
  const { language } = useLanguage();
  return (
    <div className={`region-atlas region-atlas--${variant}`}>
      <svg viewBox={`0 0 ${atlasWidth} ${atlasHeight}`} aria-label={language === 'bg' ? 'Карта на България' : 'Map of Bulgaria'}>
        <defs>
          <pattern id={`atlas-grid-${variant}`} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" className="region-atlas__grid" fill="none" /></pattern>
        </defs>
        <rect width={atlasWidth} height={atlasHeight} fill={`url(#atlas-grid-${variant})`} />
        {regionGeometry.map((region) => {
          const result = scores[region.id];
          const done = completed[region.id] || Boolean(result);
          const tierClass = result ? TIER_CLASS[scoreTier(result)] : done ? ' is-complete' : '';
          const name = regionsData[region.id]?.name[language] ?? region.id;
          // Delay by longitude, so the map builds itself west to east when a game opens.
          return <g key={region.id} style={{ '--d': `${Math.round(region.x * 0.55)}ms` } as CSSProperties}>
            <path d={region.path} fillRule="evenodd" role="button" tabIndex={0}
              aria-label={name} data-drop-region={region.id} aria-disabled={locked?.has(region.id)}
              className={`region-atlas__province${tierClass}${locked?.has(region.id) ? ' is-locked' : ''}`}
              onClick={() => onSelect?.(region.id)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(region.id); } }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain'); onDropRegion?.(region.id, source || undefined); }}>
              <title>{name}</title>
            </path>
            {(variant === 'quiz' || done) && (() => {
              const nudge = LABEL_NUDGE[region.id] ?? { dx: 0, dy: 0 };
              const x = region.x + nudge.dx;
              // "София (столица)" breaks before the bracket so it fits inside the city.
              const lines = variant !== 'quiz' ? ['✓'] : TWO_LINE_LABELS.has(region.id) ? name.split(' ') : name.split(/ (?=\()/);
              return <text x={x} y={region.y + nudge.dy} className="region-atlas__label" textAnchor="middle">
                {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{line}</tspan>)}
                {result && <tspan x={x} dy="15">{result.score}/{result.total}</tspan>}
              </text>;
            })()}
          </g>;
        })}
        <text x="948" y="62" className="region-atlas__compass" textAnchor="middle">N</text>
        <path d="M948 72V108M940 82L948 72L956 82" className="region-atlas__grid" fill="none" />
      </svg>
      <div className="region-atlas__caption"><span>BULGARIA / 28</span><span>42° 45′ N / 25° 30′ E · geoBoundaries</span></div>
    </div>
  );
}