import * as THREE from "three";
import { SVGLoader } from "three-stdlib";
import { atlasHeight, atlasWidth, regionGeometry } from "@/data/regionGeometry";

/**
 * The 28 provinces as 3D shapes, built from the same geoBoundaries paths the
 * 2D RegionAtlas draws, so every view of the map agrees. Atlas units
 * (1000 × 666) are mapped onto the XZ plane, centred on the origin, north
 * pointing to −Z, one atlas unit = `scale` world units.
 */
export interface ProvinceShape {
  id: string;
  shapes: THREE.Shape[];
  /** Label anchor (the atlas label point), in atlas units. */
  ax: number;
  ay: number;
}

let cache: ProvinceShape[] | null = null;

export function provinceShapes(): ProvinceShape[] {
  if (cache) return cache;
  const loader = new SVGLoader();
  cache = regionGeometry.map((region) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${region.path}" /></svg>`;
    const paths = loader.parse(svg).paths;
    const shapes = paths.flatMap((p) => SVGLoader.createShapes(p));
    return { id: region.id, shapes, ax: region.x, ay: region.y };
  });
  return cache;
}

/** Atlas point → world XZ at the given scale. */
export const atlasToWorld = (x: number, y: number, scale: number) =>
  new THREE.Vector3((x - atlasWidth / 2) * scale, 0, (y - atlasHeight / 2) * scale);

/** An extruded province tile lying on the XZ plane, top face at y = depth. */
export function provinceGeometry(shapes: THREE.Shape[], scale: number, depth: number, bevel = 0): THREE.BufferGeometry {
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: depth / scale,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel / scale,
    bevelSize: (bevel * 0.6) / scale,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // Shape space is SVG space (y down). Scale, lay it flat, lift it so it sits on y = 0.
  geometry.scale(scale, scale, scale);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(-(atlasWidth / 2) * scale, depth, -(atlasHeight / 2) * scale);
  geometry.computeVertexNormals();
  return geometry;
}

/** Province outline as line segments at height y (for glowing borders). */
export function provinceOutline(shapes: THREE.Shape[], scale: number, y: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const push = (pts: THREE.Vector2[]) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      points.push(
        new THREE.Vector3((a.x - atlasWidth / 2) * scale, y, (a.y - atlasHeight / 2) * scale),
        new THREE.Vector3((b.x - atlasWidth / 2) * scale, y, (b.y - atlasHeight / 2) * scale),
      );
    }
  };
  for (const shape of shapes) {
    push(shape.getPoints(2));
    for (const hole of shape.holes) push(hole.getPoints(2));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}
