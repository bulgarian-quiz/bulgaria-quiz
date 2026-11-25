import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAuth } from "@/contexts/AuthContext";
import { provinceGeometry, provinceOutline, provinceShapes } from "./provinces3d";

/**
 * Holographic Bulgaria for the station's map table: glowing province borders,
 * completed provinces filled in green, a scan line sweeping west to east.
 * Colours are pushed above 1 so the bloom pass makes them glow.
 */
export default function HoloBulgaria({ scale = 0.0052 }: { scale?: number }) {
  const shapes = useMemo(provinceShapes, []);
  const { isRegionCompleted } = useAuth();
  const outline = useMemo(() => {
    const merged = shapes.map((p) => provinceOutline(p.shapes, scale, 0.002));
    const positions = merged.flatMap((g) => Array.from(g.getAttribute("position").array as Float32Array));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [shapes, scale]);
  const fills = useMemo(() => shapes.map((p) => ({ id: p.id, geometry: provinceGeometry(p.shapes, scale, 0.012) })), [shapes, scale]);
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.8) * 0.02;
      group.current.rotation.y = Math.sin(t * 0.15) * 0.12;
    }
    if (scan.current) {
      const w = 1000 * scale;
      scan.current.position.x = (((t * 0.18) % 1) - 0.5) * w;
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color={[2.4, 3.2, 3.8]} toneMapped={false} />
      </lineSegments>
      {fills.map((f) => (
        <mesh key={f.id} geometry={f.geometry}>
          <meshBasicMaterial
            color={isRegionCompleted(f.id) ? [0.1, 1.6, 1.0] : [0.35, 0.6, 0.8]}
            toneMapped={false}
            transparent
            opacity={isRegionCompleted(f.id) ? 0.6 : 0.16}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* A thin vertical sheet across the country, moving west to east. */}
      <mesh ref={scan} rotation-y={Math.PI / 2} position-y={0.06}>
        <planeGeometry args={[666 * scale, 0.12]} />
        <meshBasicMaterial color={[1.2, 2, 2.4]} toneMapped={false} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
