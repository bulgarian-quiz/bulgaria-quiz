import RegionAtlas from '@/components/RegionAtlas';

interface BulgariaMapProps {
  onRegionClick: (regionId: string) => void;
  results: Record<string, { score: number; total: number }>;
  lockedRegions?: Set<string>;
}

export default function BulgariaMap({ onRegionClick, results, lockedRegions }: BulgariaMapProps) {
  return <div className="game-map w-full max-w-5xl mx-auto"><RegionAtlas variant="quiz" scores={results} locked={lockedRegions} onSelect={onRegionClick} /></div>;
}