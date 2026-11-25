import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, Sky, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { regionsData } from "@/data/questions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExperience } from "./store";
import { drive, odometer, stop } from "./missionDrive";
import { publicAsset } from "@/lib/utils";

/**
 * Game 1: skydive over Bulgaria, land by the road, drive to the next
 * province's town sign, stop there and answer its questions.
 *
 * The world is built from identical terrain chunks whose hills, fields,
 * villages and roadside furniture repeat exactly every CHUNK metres along the
 * road, so chunks can leapfrog forever without a seam. A distance counter that
 * is never reset moves the world past the car, so every province continues
 * down the same road instead of rewinding.
 */
const CHUNK = 240;
const CHUNKS = 4;
const WIDTH = 760;
const ROAD_HALF = 5.5;
const CITY_TRAVEL_SECONDS = 3;
const SUN = new THREE.Vector3(140, 90, -80);
const CAR_X = 1.8;
/** Where the town sign stands, relative to the stopped car. */
const SIGN_X = 10.4;
const SIGN_AHEAD = 5;
/** Lateral limits: the car keeps to its own half of the road, clear of oncoming traffic. */
const LANE_MIN = -1.4;
const LANE_MAX = 2.6;
const PULL_OVER_LATERAL = 2.3;
const ONCOMING_X = -2.75;
const BASE_FOV = 70;

const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const kz = (n: number) => (Math.PI * 2 * n) / CHUNK;
const rand = (seed: number) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** z inside one chunk, 0..CHUNK, so anything keyed on it repeats every chunk. */
const chunkZ = (z: number) => ((z + CHUNK / 2) % CHUNK + CHUNK) % CHUNK;

/** Terrain height. Periodic in z with period CHUNK, flat along the road, rising towards the valley walls. */
function heightAt(x: number, z: number) {
  const ax = Math.abs(x);
  const hills =
    7 * Math.sin(x * 0.017 + 1.3) * Math.sin(z * kz(2) + 0.4) +
    4 * Math.sin(x * 0.043 + 0.4) * Math.cos(z * kz(5) + 0.7) +
    1.8 * Math.sin(x * 0.11 + 2.1) * Math.sin(z * kz(11) + 2) +
    0.7 * Math.sin(x * 0.29 + z * kz(23));
  const walls = Math.max(0, ax - 70) * 0.16 + Math.max(0, ax - 190) * 0.35;
  return (hills + 6) * smooth(10, 46, ax) + walls - 0.05;
}

// ---------------------------------------------------------------- fields

/** 0 none, 1 wheat, 2 sunflowers, 3 lavender, 4 ploughed earth, 5 young crops. */
type Field = 0 | 1 | 2 | 3 | 4 | 5;
const FIELD_W = 34;
const FIELD_D = 40; // 6 cells per chunk, so the pattern repeats with the terrain
const FIELD_COLORS: Record<Exclude<Field, 0>, THREE.Color> = {
  1: new THREE.Color("#c9a64a"),
  2: new THREE.Color("#d8b02a"),
  3: new THREE.Color("#8d7cbc"),
  4: new THREE.Color("#7b5a3d"),
  5: new THREE.Color("#79a43c"),
};
const HEDGE = new THREE.Color("#355a2a");

/** Which crop grows at (x, z), and how far the point is from the field's edge. */
function fieldAt(x: number, z: number): { type: Field; edge: number } {
  const ax = Math.abs(x);
  if (ax < 15 || ax > 120 || heightAt(x, z) > 15) return { type: 0, edge: 0 };
  const lz = chunkZ(z);
  const cx = Math.floor((x + 400) / FIELD_W);
  const cz = Math.floor(lz / FIELD_D);
  const r = rand(cx * 13.7 + cz * 71.3);
  const type = (r < 0.32 ? 0 : 1 + Math.floor(rand(cx * 3.1 + cz * 9.7) * 5)) as Field;
  const ex = Math.min(x + 400 - cx * FIELD_W, (cx + 1) * FIELD_W - (x + 400));
  const ez = Math.min(lz - cz * FIELD_D, (cz + 1) * FIELD_D - lz);
  return { type, edge: Math.min(ex, ez) };
}

const GRASS_LOW = new THREE.Color("#3f6b34");
const GRASS = new THREE.Color("#5f8a3f");
const MEADOW = new THREE.Color("#86a052");
const ROCK = new THREE.Color("#8b8a78");
const GRAVEL = new THREE.Color("#8d877a");

function TerrainChunk({ index }: { index: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(WIDTH, CHUNK, 300, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(x, z);
      pos.setY(i, h);
      const n = Math.sin(x * 0.37 + z * 0.21) * 0.5 + 0.5;
      // Clamp: dips below zero would otherwise extrapolate the colour towards black.
      if (h < 3) c.copy(GRASS_LOW).lerp(GRASS, THREE.MathUtils.clamp(h / 3, 0, 1));
      else if (h < 14) c.copy(GRASS).lerp(MEADOW, (h - 3) / 11);
      else c.copy(MEADOW).lerp(ROCK, Math.min(1, (h - 14) / 18));
      const field = fieldAt(x, z);
      if (field.type) {
        if (field.edge < 2.2) c.copy(HEDGE);
        else {
          c.copy(FIELD_COLORS[field.type]);
          // Furrows and crop rows run across the field.
          if (field.type !== 3 || Math.sin(x * 0.9) > 0) c.offsetHSL(0, 0, Math.sin(x * 0.9 + z * 0.05) * 0.035);
        }
      }
      // A gravel verge beside the asphalt.
      const ax = Math.abs(x);
      if (ax > ROAD_HALF && ax < ROAD_HALF + 2.4) c.lerp(GRAVEL, 0.75);
      c.offsetHSL(0, 0, (n - 0.5) * 0.04);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position-z={-index * CHUNK} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ---------------------------------------------------------------- scenery

/** A gabled roof: a triangular prism with its ridge along z, apex at y = 1, base at y = -0.5. */
const roofGeometry = (() => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 3);
  g.rotateX(-Math.PI / 2);
  return g;
})();
const crownGeometry = new THREE.IcosahedronGeometry(1, 0);
const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
const unitBox = new THREE.BoxGeometry(1, 1, 1);

const WALLS = ["#efe7d6", "#e8dcc0", "#f4f1ea", "#e2cfa8", "#d9c3a0", "#ece3cf"].map((c) => new THREE.Color(c));
const ROOFS = ["#a2432f", "#b5523a", "#8f3b2b", "#9a5a3c", "#b0482f"].map((c) => new THREE.Color(c));

type Placed = { m: THREE.Matrix4; color?: THREE.Color };

/** Fills an instanced mesh from a list of matrices (and optional colours). */
function useInstances(ref: React.RefObject<THREE.InstancedMesh>, items: Placed[]) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      if (it.color) mesh.setColorAt(i, it.color);
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items]);
}

function Instances({ items, geometry, color, castShadow = true, receiveShadow = false, roughness = 0.85, flat = false }: {
  items: Placed[]; geometry: THREE.BufferGeometry; color?: string; castShadow?: boolean; receiveShadow?: boolean; roughness?: number; flat?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, items);
  if (!items.length) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false}>
      <meshStandardMaterial color={items[0].color ? "#ffffff" : color} roughness={roughness} flatShading={flat} />
    </instancedMesh>
  );
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const Y = new THREE.Vector3(0, 1, 0);
const mat = (pos: THREE.Vector3, scale: THREE.Vector3, rotY = 0) =>
  new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(Y, rotY), scale);

interface ChunkScenery {
  trunks: Placed[]; conifers: Placed[]; conifersTop: Placed[]; crowns: Placed[]; bushes: Placed[]; rocks: Placed[];
  walls: Placed[]; roofs: Placed[]; chimneys: Placed[]; windows: Placed[]; doors: Placed[]; hay: Placed[];
}

/** Everything that stands on one chunk: woods, bushes, rocks, two villages and haystacks. Deterministic, so every chunk matches. */
function buildScenery(density: number): ChunkScenery {
  const s: ChunkScenery = { trunks: [], conifers: [], conifersTop: [], crowns: [], bushes: [], rocks: [], walls: [], roofs: [], chimneys: [], windows: [], doors: [], hay: [] };
  const c = new THREE.Color();

  // Villages: a cluster on each side of the road, at two points of the chunk.
  const villages = [{ z: 62, side: 1 }, { z: 62, side: -1 }, { z: -66, side: -1 }, { z: -58, side: 1 }];
  const footprints: { x: number; z: number; r: number }[] = [];
  villages.forEach((v, vi) => {
    const count = 5 + Math.floor(rand(vi * 5.3) * 4);
    for (let i = 0; i < count; i++) {
      const seed = vi * 31 + i * 7.7;
      const x = v.side * (17 + rand(seed) * 30);
      const z = v.z + (rand(seed + 1) - 0.5) * 70;
      if (footprints.some((f) => Math.hypot(f.x - x, f.z - z) < 11)) continue;
      footprints.push({ x, z, r: 9 });
      const w = 5 + rand(seed + 2) * 2.5;   // across the road-facing front
      const d = 6.5 + rand(seed + 3) * 3.5; // along the ridge
      const h = 3.1 + rand(seed + 4) * 1.4;
      const roofH = 1.8 + rand(seed + 5) * 0.8;
      const rot = (rand(seed + 6) - 0.5) * 0.35;
      const y = heightAt(x, z) - 0.2;
      const q = new THREE.Quaternion().setFromAxisAngle(Y, rot);
      const at = (lx: number, ly: number, lz: number) => v3(lx, ly, lz).applyQuaternion(q).add(v3(x, y, z));
      s.walls.push({ m: mat(at(0, h / 2, 0), v3(w, h, d), rot), color: WALLS[Math.floor(rand(seed + 7) * WALLS.length)] });
      s.roofs.push({ m: mat(at(0, h + roofH / 3, 0), v3(((w / 2) / 0.866) * 1.1, roofH / 1.5, d * 1.08), rot), color: ROOFS[Math.floor(rand(seed + 8) * ROOFS.length)] });
      s.chimneys.push({ m: mat(at(w * 0.22, h + roofH * 0.75, d * 0.22), v3(0.55, 1.3, 0.55), rot) });
      // The face towards the road gets a door and two windows; the far face two windows.
      const front = -v.side * (w / 2 + 0.02);
      s.doors.push({ m: mat(at(front, 1.05, 0), v3(0.1, 2.1, 1.05), rot) });
      [-1, 1].forEach((k) => {
        s.windows.push({ m: mat(at(front, h * 0.58, k * d * 0.28), v3(0.1, 1.0, 1.0), rot) });
        s.windows.push({ m: mat(at(-front, h * 0.58, k * d * 0.28), v3(0.1, 1.0, 1.0), rot) });
      });
    }
  });

  // Woods and single trees, kept off the road, the power line, fields and houses.
  for (let i = 0; s.trunks.length < density && i < density * 8; i++) {
    const side = rand(i) > 0.5 ? 1 : -1;
    const x = side * (13 + Math.pow(rand(i + 7), 1.3) * 160);
    const z = -rand(i + 13) * CHUNK + CHUNK / 2;
    if (x < 0 && x > -17) continue;
    if (rand(i + 29) > 0.4 + Math.abs(x) / 240) continue;
    const field = fieldAt(x, z);
    if (field.type && field.edge > 3) continue;
    if (footprints.some((f) => Math.hypot(f.x - x, f.z - z) < f.r)) continue;
    const h = heightAt(x, z);
    const sc = 0.75 + rand(i + 41) * 0.9;
    const hue = rand(i + 53);
    const conifer = h > 9 || rand(i + 61) < 0.35;
    s.trunks.push({ m: mat(v3(x, h + 1.1 * sc, z), v3(sc, sc, sc)) });
    if (conifer) {
      c.setHSL(0.3 + hue * 0.04, 0.42, 0.16 + hue * 0.06);
      s.conifers.push({ m: mat(v3(x, h + 3.2 * sc, z), v3(sc * 1.25, sc * 1.1, sc * 1.25), hue * 6), color: c.clone() });
      s.conifersTop.push({ m: mat(v3(x, h + 5.1 * sc, z), v3(sc * 0.85, sc * 0.95, sc * 0.85), hue * 6), color: c.clone().offsetHSL(0, 0, 0.03) });
    } else {
      c.setHSL(0.22 + hue * 0.09, 0.5, 0.24 + hue * 0.09);
      s.crowns.push({ m: mat(v3(x, h + 3.5 * sc, z), v3(sc * 2.1, sc * 1.9, sc * 2.1), hue * 6), color: c.clone() });
    }
  }

  // Bushes along hedges and the verge, rocks on the high slopes, haystacks on the wheat.
  for (let i = 0; i < density * 0.9; i++) {
    const side = rand(i + 101) > 0.5 ? 1 : -1;
    const x = side * (9 + rand(i + 103) * 90);
    const z = -rand(i + 107) * CHUNK + CHUNK / 2;
    const field = fieldAt(x, z);
    if (field.type && field.edge > 2.5) continue;
    if (x < 0 && x > -15) continue;
    if (footprints.some((f) => Math.hypot(f.x - x, f.z - z) < 6)) continue;
    const sc = 0.6 + rand(i + 109) * 0.8;
    c.setHSL(0.25 + rand(i + 113) * 0.07, 0.45, 0.2 + rand(i + 117) * 0.08);
    s.bushes.push({ m: mat(v3(x, heightAt(x, z) + sc * 0.45, z), v3(sc * 1.3, sc, sc * 1.2), rand(i) * 6), color: c.clone() });
  }
  for (let i = 0; i < density * 0.35; i++) {
    const side = rand(i + 201) > 0.5 ? 1 : -1;
    const x = side * (60 + rand(i + 203) * 150);
    const z = -rand(i + 207) * CHUNK + CHUNK / 2;
    const h = heightAt(x, z);
    if (h < 12) continue;
    const sc = 0.8 + rand(i + 209) * 2.4;
    s.rocks.push({ m: mat(v3(x, h + sc * 0.3, z), v3(sc * 1.3, sc * 0.8, sc), rand(i) * 6) });
  }
  for (let i = 0; i < 60; i++) {
    const x = (rand(i + 301) > 0.5 ? 1 : -1) * (18 + rand(i + 303) * 90);
    const z = -rand(i + 307) * CHUNK + CHUNK / 2;
    const field = fieldAt(x, z);
    if (field.type !== 1 || field.edge < 5) continue;
    s.hay.push({ m: mat(v3(x, heightAt(x, z) + 0.75, z), v3(1.5, 1.5, 1.5), rand(i) * 6) });
  }
  return s;
}

const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6);
const coneGeometry = new THREE.ConeGeometry(1.4, 3.8, 8);
const hayGeometry = new THREE.CylinderGeometry(0.75, 0.75, 1.5, 12).rotateZ(Math.PI / 2);

/** One chunk's trees, villages, bushes, rocks and haystacks, as instanced meshes (one draw call per kind). */
function Scatter({ index, density }: { index: number; density: number }) {
  const s = useMemo(() => buildScenery(density), [density]);
  return (
    <group position-z={-index * CHUNK}>
      <Instances items={s.trunks} geometry={trunkGeometry} color="#5a3d27" roughness={0.9} />
      <Instances items={s.conifers} geometry={coneGeometry} flat />
      <Instances items={s.conifersTop} geometry={coneGeometry} flat />
      <Instances items={s.crowns} geometry={crownGeometry} flat />
      <Instances items={s.bushes} geometry={crownGeometry} flat castShadow={false} />
      <Instances items={s.rocks} geometry={rockGeometry} color="#8f8c82" flat roughness={1} />
      <Instances items={s.walls} geometry={unitBox} receiveShadow roughness={0.8} />
      <Instances items={s.roofs} geometry={roofGeometry} roughness={0.7} flat />
      <Instances items={s.chimneys} geometry={unitBox} color="#b9ab95" />
      <Instances items={s.windows} geometry={unitBox} color="#2c3a48" roughness={0.2} castShadow={false} />
      <Instances items={s.doors} geometry={unitBox} color="#5b3a26" castShadow={false} />
      <Instances items={s.hay} geometry={hayGeometry} color="#d2b25c" roughness={1} />
      <Church />
    </group>
  );
}

/** A small village church with a green dome and a bell tower, one per chunk. */
function Church() {
  const x = -34;
  const z = -78;
  const y = heightAt(x, z) - 0.2;
  return (
    <group position={[x, y, z]} rotation-y={0.12}>
      <mesh position-y={3.5} castShadow receiveShadow><boxGeometry args={[7, 7, 12]} /><meshStandardMaterial color="#f1ece2" roughness={0.8} /></mesh>
      <mesh position={[0, 7.6, 0]} castShadow><cylinderGeometry args={[0.1, 4.2, 2.2, 4, 1]} /><meshStandardMaterial color="#8f3b2b" roughness={0.7} flatShading /></mesh>
      <mesh position={[0, 8.8, 1.5]} castShadow><cylinderGeometry args={[1.6, 1.6, 2.2, 16]} /><meshStandardMaterial color="#f1ece2" roughness={0.8} /></mesh>
      <mesh position={[0, 10.2, 1.5]} castShadow><sphereGeometry args={[1.7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#3f8a64" roughness={0.45} metalness={0.3} /></mesh>
      <mesh position={[0, 12.4, 1.5]}><boxGeometry args={[0.12, 1.4, 0.12]} /><meshStandardMaterial color="#d8b24a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 12.5, 1.5]}><boxGeometry args={[0.7, 0.12, 0.12]} /><meshStandardMaterial color="#d8b24a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 6, -7.4]} castShadow><boxGeometry args={[3, 12, 3]} /><meshStandardMaterial color="#ece6da" roughness={0.8} /></mesh>
      <mesh position={[0, 13, -7.4]} castShadow><coneGeometry args={[2.3, 2.6, 4]} /><meshStandardMaterial color="#8f3b2b" roughness={0.7} flatShading /></mesh>
    </group>
  );
}

/** Delineator posts, a guardrail on the left and a power line, repeating with the chunk. */
function RoadFurniture({ index }: { index: number }) {
  const items = useMemo(() => {
    const posts: Placed[] = [];
    const reflectors: Placed[] = [];
    for (let i = 0; i < 10; i++) {
      const z = CHUNK / 2 - i * 24;
      [-1, 1].forEach((side) => {
        const x = side * (ROAD_HALF + 1.9);
        posts.push({ m: mat(v3(x, 0.55, z), v3(0.14, 1.1, 0.14)) });
        reflectors.push({ m: mat(v3(x, 0.92, z + 0.075), v3(0.1, 0.16, 0.02)) });
      });
    }
    const railPosts: Placed[] = [];
    const rails: Placed[] = [];
    [[100, 20], [-30, -110]].forEach(([from, to]) => {
      for (let z = from; z >= to; z -= 4) railPosts.push({ m: mat(v3(-(ROAD_HALF + 1.3), 0.4, z), v3(0.12, 0.8, 0.12)) });
      rails.push({ m: mat(v3(-(ROAD_HALF + 1.22), 0.68, (from + to) / 2), v3(0.06, 0.32, from - to)) });
    });
    const poles: Placed[] = [];
    const arms: Placed[] = [];
    const wire: number[] = [];
    const PX = -14;
    for (let i = 0; i < 6; i++) {
      const z = CHUNK / 2 - i * 40;
      const base = heightAt(PX, z);
      poles.push({ m: mat(v3(PX, base + 4.4, z), v3(0.26, 8.8, 0.26)) });
      arms.push({ m: mat(v3(PX, base + 8.4, z), v3(2.8, 0.16, 0.16)) });
      const nextBase = heightAt(PX, z - 40);
      [-1.2, 0, 1.2].forEach((dx) => {
        for (let k = 0; k < 8; k++) {
          const a = k / 8;
          const b = (k + 1) / 8;
          const y = (t: number) => base + 8.5 + (nextBase - base) * t - Math.sin(Math.PI * t) * 1.1;
          wire.push(PX + dx, y(a), z - 40 * a, PX + dx, y(b), z - 40 * b);
        }
      });
    }
    const wires = new THREE.BufferGeometry();
    wires.setAttribute("position", new THREE.Float32BufferAttribute(wire, 3));
    return { posts, reflectors, railPosts, rails, poles, arms, wires };
  }, []);
  useEffect(() => () => items.wires.dispose(), [items]);
  return (
    <group position-z={-index * CHUNK}>
      <Instances items={items.posts} geometry={unitBox} color="#f4f4f2" castShadow={false} />
      <instancedMesh args={[unitBox, undefined, items.reflectors.length]} ref={(m) => { if (m) { items.reflectors.forEach((r, i) => m.setMatrixAt(i, r.m)); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); } }} frustumCulled={false}>
        <meshBasicMaterial color={[2.4, 0.35, 0.2]} toneMapped={false} />
      </instancedMesh>
      <Instances items={items.railPosts} geometry={unitBox} color="#9ea3a8" castShadow={false} />
      <Instances items={items.rails} geometry={unitBox} color="#c4c8cc" roughness={0.35} />
      <Instances items={items.poles} geometry={unitBox} color="#7a6650" />
      <Instances items={items.arms} geometry={unitBox} color="#6d5a46" />
      <lineSegments geometry={items.wires}>
        <lineBasicMaterial color="#2b2b2b" transparent opacity={0.75} />
      </lineSegments>
    </group>
  );
}

function Road() {
  const dashes = useRef<THREE.InstancedMesh>(null);
  const count = Math.round((CHUNK * CHUNKS) / 9);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeTranslation(0, 0.015, CHUNK / 2 - i * 9);
      dashes.current?.setMatrixAt(i, m);
    }
    if (dashes.current) { dashes.current.instanceMatrix.needsUpdate = true; dashes.current.computeBoundingSphere(); }
  }, [count]);
  const length = CHUNK * (CHUNKS + 1);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -length / 2 + CHUNK]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2 + 1.2, length]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.78} metalness={0.05} />
      </mesh>
      {/* Darker wheel tracks worn into each lane. */}
      {[-3.6, -1.6, 1.6, 3.6].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.008, -length / 2 + CHUNK]} receiveShadow>
          <planeGeometry args={[0.7, length]} />
          <meshStandardMaterial color="#24272b" roughness={0.6} transparent opacity={0.7} />
        </mesh>
      ))}
      {[-ROAD_HALF, ROAD_HALF].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.012, -length / 2 + CHUNK]}>
          <planeGeometry args={[0.2, length]} />
          <meshStandardMaterial color="#f2efe6" roughness={0.6} />
        </mesh>
      ))}
      <instancedMesh ref={dashes} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[0.16, 0.01, 3.6]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

/** Everything that slides past the car: terrain, scenery, roadside furniture, road markings. */
function Landscape() {
  const tier = useExperience((s) => s.tier);
  const group = useRef<THREE.Group>(null);
  const dashes = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.position.z = odometer.current % CHUNK;
    if (dashes.current) dashes.current.position.z = odometer.current % 9;
  });
  const density = tier === 0 ? 120 : tier === 1 ? 220 : 340;
  return (
    <>
      <group ref={group}>
        {Array.from({ length: CHUNKS }, (_, i) => <TerrainChunk key={i} index={i - 1} />)}
        {Array.from({ length: CHUNKS }, (_, i) => <Scatter key={i} index={i - 1} density={density} />)}
        {Array.from({ length: CHUNKS }, (_, i) => <RoadFurniture key={i} index={i - 1} />)}
      </group>
      <group ref={dashes}><Road /></group>
    </>
  );
}

/** Two rings of distant peaks (forested foothills, then snowy mountains) so the world never visibly ends. */
function Mountains() {
  const ridges = useMemo(() => [
    ...Array.from({ length: 46 }, (_, i) => {
      const a = (i / 46) * Math.PI * 2 + rand(i) * 0.08;
      const r = 360 + rand(i + 5) * 60;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r - 120, h: 70 + rand(i + 9) * 90, w: 60 + rand(i + 11) * 50, color: "#6a7883", snow: true };
    }),
    ...Array.from({ length: 34 }, (_, i) => {
      const a = (i / 34) * Math.PI * 2 + rand(i + 400) * 0.1;
      const r = 285 + rand(i + 405) * 30;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r - 120, h: 34 + rand(i + 409) * 30, w: 55 + rand(i + 411) * 35, color: "#4f6b4a", snow: false };
    }),
  ], []);
  return (
    <group>
      {ridges.map((p, i) => (
        <group key={i} position={[p.x, -6, p.z]}>
          <mesh position-y={p.h / 2}>
            <coneGeometry args={[p.w, p.h, 7]} />
            <meshStandardMaterial color={p.color} roughness={1} flatShading />
          </mesh>
          {p.snow && p.h > 120 && (
            <mesh position-y={p.h * 0.86}>
              <coneGeometry args={[p.w * 0.29, p.h * 0.28, 7]} />
              <meshStandardMaterial color="#f1f4f6" roughness={0.9} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Slow fair-weather clouds high above the valley. */
function Clouds() {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const out: Placed[] = [];
    for (let i = 0; i < 18; i++) {
      const a = rand(i + 500) * Math.PI * 2;
      const r = 120 + rand(i + 501) * 260;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r - 100;
      const cy = 95 + rand(i + 502) * 45;
      const n = 4 + Math.floor(rand(i + 503) * 4);
      for (let k = 0; k < n; k++) {
        const s = 9 + rand(i * 9 + k) * 10;
        out.push({ m: mat(v3(cx + (k - n / 2) * 9 + rand(k + i) * 5, cy + rand(k * 3 + i) * 5, cz + (rand(k * 7 + i) - 0.5) * 12), v3(s * 1.4, s * 0.55, s)) });
      }
    }
    return out;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, puffs);
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += Math.min(dt, 0.05) * 0.004; });
  return (
    <group ref={group}>
      <instancedMesh ref={ref} args={[crownGeometry, undefined, puffs.length]} frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" roughness={1} emissive="#dfe8ef" emissiveIntensity={0.35} fog={false} flatShading />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------- vehicles

/** Places the car on the road from the shared drive state (works for the model and the fallback). */
function useCarPlacement(group: React.RefObject<THREE.Group>) {
  useFrame(() => {
    if (!group.current) return;
    group.current.position.set(CAR_X + drive.lateral, 0.05, drive.z);
    // Positive steer is a left turn: the nose (facing -z) swings towards -x.
    group.current.rotation.y = Math.PI + drive.steer * 0.12;
  });
}

function ModelCar() {
  const { scene } = useGLTF(publicAsset("models/vehicle/sedan-sports.glb"));
  const clone = useMemo(() => scene.clone(true), [scene]);
  const wheels = useRef(0);
  const group = useRef<THREE.Group>(null);
  useCarPlacement(group);
  useFrame((_, raw) => {
    // Wheels turn with the real speed (wheel radius about 0.45 m).
    wheels.current += Math.min(raw, 0.05) * drive.speed / 0.45;
    clone.traverse((object) => { if (/wheel/i.test(object.name)) object.rotation.x = wheels.current; });
  });
  useEffect(() => {
    clone.traverse((object) => { const mesh = object as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
  }, [clone]);
  return <group ref={group}><primitive object={clone} scale={1.45} /></group>;
}

/** A simple built-in car body, used for oncoming traffic and if the model cannot load. */
function SimpleCar({ color, truck = false }: { color: string; truck?: boolean }) {
  const length = truck ? 7.5 : 4.2;
  return (
    <group>
      <mesh position-y={truck ? 1.0 : 0.6} castShadow>
        <boxGeometry args={[1.9, truck ? 1.2 : 0.62, length]} />
        <meshStandardMaterial color={truck ? "#d9d9d6" : color} roughness={0.35} metalness={0.35} />
      </mesh>
      {truck ? (
        <>
          <mesh position={[0, 2.25, -0.9]} castShadow><boxGeometry args={[2.2, 2.4, 5.4]} /><meshStandardMaterial color="#e9e9e6" roughness={0.6} /></mesh>
          <mesh position={[0, 1.85, 3.1]} castShadow><boxGeometry args={[2.1, 1.7, 1.6]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.3} /></mesh>
          <mesh position={[0, 2.1, 3.92]}><boxGeometry args={[1.8, 0.8, 0.04]} /><meshStandardMaterial color="#1a2430" roughness={0.1} metalness={0.6} /></mesh>
        </>
      ) : (
        <mesh position={[0, 1.1, -0.15]} castShadow><boxGeometry args={[1.6, 0.52, 2.1]} /><meshStandardMaterial color="#1c2530" roughness={0.12} metalness={0.6} /></mesh>
      )}
      {/* Headlights at the front (+z), tail lights behind. */}
      {[-0.65, 0.65].map((x) => (
        <group key={x}>
          <mesh position={[x, truck ? 1.2 : 0.68, length / 2 + 0.01]}><boxGeometry args={[0.38, 0.14, 0.02]} /><meshBasicMaterial color={[2.2, 2.1, 1.8]} toneMapped={false} /></mesh>
          <mesh position={[x, truck ? 1.2 : 0.7, -length / 2 - 0.01]}><boxGeometry args={[0.36, 0.14, 0.02]} /><meshBasicMaterial color={[1.8, 0.1, 0.12]} toneMapped={false} /></mesh>
        </group>
      ))}
      {(truck ? [[-0.95, 2.8], [0.95, 2.8], [-0.95, -2.6], [0.95, -2.6], [-0.95, -1.5], [0.95, -1.5]] : [[-0.88, 1.35], [0.88, 1.35], [-0.88, -1.35], [0.88, -1.35]]).map(([x, z], i) => (
        <mesh key={i} position={[x, truck ? 0.5 : 0.34, z]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[truck ? 0.5 : 0.34, truck ? 0.5 : 0.34, 0.26, 16]} />
          <meshStandardMaterial color="#141416" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function FallbackCar() {
  const group = useRef<THREE.Group>(null);
  useCarPlacement(group);
  // SimpleCar faces +z; the player's car faces down the road (-z), which the placement's PI turn handles.
  return <group ref={group}><SimpleCar color="#d62839" /></group>;
}

class CarBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <FallbackCar /> : this.props.children; }
}

function Car() {
  return (
    <CarBoundary>
      <Suspense fallback={null}><ModelCar /></Suspense>
    </CarBoundary>
  );
}

/** Oncoming cars and a lorry in the other lane, so the road feels used. */
function Traffic() {
  const fleet = useMemo(() => [
    { color: "#2d6cdf", truck: false, speed: 17, gap: 0 },
    { color: "#f2f2f0", truck: false, speed: 15, gap: 150 },
    { color: "#c0392b", truck: true, speed: 12, gap: 290 },
    { color: "#3a3d42", truck: false, speed: 18, gap: 420 },
  ], []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const zs = useRef(fleet.map((f) => -60 - f.gap));
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    fleet.forEach((f, i) => {
      zs.current[i] += (f.speed + drive.speed) * dt;
      // Past the camera: send it back to the far end of the valley.
      if (zs.current[i] > 40) zs.current[i] -= 560;
      const g = refs.current[i];
      if (g) g.position.set(ONCOMING_X, 0.05, zs.current[i]);
    });
  });
  return (
    <>
      {fleet.map((f, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <SimpleCar color={f.color} truck={f.truck} />
        </group>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- the town stop

/**
 * The province's welcome sign with a few houses and a bus stop around it. It is
 * placed where the car will stop, comes towards the car while it slows down,
 * and slides away behind once the car drives on.
 */
function TownStop() {
  const { language } = useLanguage();
  const phase = useExperience((s) => s.missionPhase);
  const group = useRef<THREE.Group>(null);
  // Once the town is far behind, unmount it (its sign is HTML, which a hidden group would not hide).
  const [behind, setBehind] = useState(true);
  const behindRef = useRef(true);
  const regionId = stop.regionId;
  const name = regionsData[regionId]?.name[language] ?? regionId;
  useFrame(() => {
    const passed = odometer.current - stop.odo;
    const gone = !Number.isFinite(passed) || passed > 90;
    if (gone !== behindRef.current) { behindRef.current = gone; setBehind(gone); }
    if (group.current) group.current.position.z = drive.z - SIGN_AHEAD + passed;
  });
  const active = phase === "pullOver" || phase === "quiz" || phase === "driving";
  if (!regionId || !active || (behind && phase === "driving")) return null;
  const houses: [number, number, number, string, string][] = [
    [22, 8, 0.1, "#efe7d6", "#a2432f"], [27, -9, -0.15, "#e2cfa8", "#8f3b2b"], [20, -24, 0.05, "#f4f1ea", "#b5523a"],
    [-20, 4, -0.08, "#e8dcc0", "#9a5a3c"], [-24, -14, 0.12, "#ece3cf", "#a2432f"],
  ];
  return (
    <group ref={group}>
      <group position={[SIGN_X, 0, 0]} rotation-y={-0.28}>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} position={[x, 2.6, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 5.2, 10]} />
            <meshStandardMaterial color="#b9bdc2" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 4.6, 0]} castShadow>
          <boxGeometry args={[7, 2.4, 0.18]} />
          <meshStandardMaterial color="#f5f5f7" roughness={0.4} />
        </mesh>
        <mesh position={[0, 4.6, 0.1]}>
          <planeGeometry args={[6.7, 2.1]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.5} />
        </mesh>
        <mesh position={[-3.1, 4.6, 0.11]}>
          <planeGeometry args={[0.12, 2.1]} />
          <meshBasicMaterial color={[2, 0.2, 0.3]} toneMapped={false} />
        </mesh>
        <Html position={[0, 4.6, 0.16]} center transform distanceFactor={5.6} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div className="xp-roadsign">
            <small>{language === "bg" ? "Област" : "Province"}</small>
            <strong>{name}</strong>
          </div>
        </Html>
        {/* A small flag on its own pole beside the sign. */}
        <mesh position={[4.4, 3.6, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 7.2, 8]} /><meshStandardMaterial color="#d7d9dc" metalness={0.7} roughness={0.3} /></mesh>
        {["#f5f5f7", "#0aa37a", "#d62839"].map((color, i) => (
          <mesh key={color} position={[5.05, 6.85 - i * 0.32, 0]}><boxGeometry args={[1.3, 0.32, 0.02]} /><meshStandardMaterial color={color} roughness={0.7} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      {/* Bus stop shelter on the verge, just past the sign. */}
      <group position={[ROAD_HALF + 3.2, 0, -14]}>
        <mesh position={[0, 2.5, 0]} castShadow><boxGeometry args={[1.8, 0.12, 3.6]} /><meshStandardMaterial color="#d62839" roughness={0.5} /></mesh>
        <mesh position={[0.85, 1.25, 0]}><boxGeometry args={[0.06, 2.4, 3.4]} /><meshStandardMaterial color="#cfe3ee" roughness={0.05} metalness={0.2} transparent opacity={0.35} /></mesh>
        {[-1.7, 1.7].map((z) => <mesh key={z} position={[0.85, 1.25, z]}><boxGeometry args={[0.1, 2.5, 0.1]} /><meshStandardMaterial color="#9ea3a8" metalness={0.7} roughness={0.3} /></mesh>)}
        <mesh position={[0.45, 0.5, 0]}><boxGeometry args={[0.5, 0.08, 2.6]} /><meshStandardMaterial color="#6b4a33" roughness={0.8} /></mesh>
      </group>
      {houses.map(([x, z, r, wall, roof], i) => (
        <group key={i} position={[x, heightAt(x, z) - 0.2, z]} rotation-y={r}>
          <mesh position-y={1.9} castShadow receiveShadow><boxGeometry args={[6, 3.8, 8]} /><meshStandardMaterial color={wall} roughness={0.8} /></mesh>
          <mesh position-y={3.8 + 0.75} geometry={roofGeometry} scale={[3.8, 1.5, 8.6]} castShadow><meshStandardMaterial color={roof} roughness={0.7} flatShading /></mesh>
          {[-2, 2].map((wz) => <mesh key={wz} position={[x > 0 ? -3.02 : 3.02, 2.2, wz]}><boxGeometry args={[0.08, 1.1, 1.1]} /><meshStandardMaterial color="#2c3a48" roughness={0.2} /></mesh>)}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- control

function MissionController() {
  const { camera, gl } = useThree();
  const phase = useExperience((s) => s.missionPhase);
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const pitch = useRef(-0.9);
  const elapsed = useRef(0);
  const lateral = useRef(0);
  const driveStarted = useRef(0);
  const decel = useRef(3);
  const stoppedFor = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "")) return;
      keys.current.add(e.code);
      if (e.code !== "KeyE") return;
      const state = useExperience.getState();
      if (state.missionPhase === "roadside") state.setMissionPhase("driving");
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    const click = () => {
      const state = useExperience.getState();
      if (state.missionPhase === "freefall") state.setMissionPhase("parachute");
      else if (state.missionPhase !== "quiz") gl.domElement.requestPointerLock?.();
    };
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= e.movementX * 0.0018;
      pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0018, -1.45, 1.1);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("mousemove", move);
    gl.domElement.addEventListener("pointerdown", click);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("mousemove", move);
      gl.domElement.removeEventListener("pointerdown", click);
    };
  }, [gl]);

  // The camera is shared with the other scenes: give back the normal field of view when leaving.
  useEffect(() => () => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = BASE_FOV;
    cam.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    elapsed.current = 0;
    if (phase === "freefall") {
      pitch.current = -0.9; lateral.current = 0; drive.lateral = 0; drive.steer = 0; drive.speed = 0;
      stop.odo = Number.NEGATIVE_INFINITY; stop.regionId = "";
    }
    if (phase === "roadside") { pitch.current = -0.12; drive.speed = 0; }
    if (phase === "driving") driveStarted.current = performance.now();
    if (phase === "quiz") { drive.speed = 0; if (document.pointerLockElement) document.exitPointerLock(); }
  }, [phase]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    elapsed.current += dt;
    const state = useExperience.getState();
    const cam = camera as THREE.PerspectiveCamera;
    cam.rotation.order = "YXZ";
    let fov = BASE_FOV;
    if (phase === "freefall" || phase === "parachute") {
      // Freefall is fast and a little shaky; the canopy slows it into a gentle glide onto the road.
      const duration = phase === "freefall" ? 7 : 5;
      const p = Math.min(elapsed.current / duration, 1);
      const ease = p * p * (3 - 2 * p);
      const from = phase === "freefall" ? 180 : 62;
      const to = phase === "freefall" ? 62 : 1.75;
      const shake = phase === "freefall" ? 0.004 : 0.0012;
      cam.position.set(Math.sin(yaw.current) * 3 + Math.sin(elapsed.current * 23) * shake * 20, from + (to - from) * ease, 12 - ease * (phase === "freefall" ? 2 : 5));
      cam.rotation.set(pitch.current + Math.sin(elapsed.current * 31) * shake, yaw.current + Math.sin(elapsed.current * 17) * shake, Math.sin(elapsed.current * 0.9) * 0.02);
      if (phase === "freefall") fov = BASE_FOV + 8;
      if (p >= 1) state.setMissionPhase(phase === "freefall" ? "parachute" : "roadside");
    } else if (phase === "roadside") {
      cam.position.lerp(new THREE.Vector3(-0.4, 1.72, 7.2), 1 - Math.exp(-2.5 * dt));
      cam.lookAt(1.6, 1, -3);
    } else {
      const k = keys.current;
      let steer = 0;
      if (phase === "driving") {
        const throttle = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
        steer = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
        // Cruise at a steady pace by default; W/S speed up or brake.
        drive.speed += (throttle * 10 + (14 - drive.speed) * 0.8) * dt;
        drive.speed = THREE.MathUtils.clamp(drive.speed, 0, 26);
        lateral.current = THREE.MathUtils.clamp(lateral.current - steer * Math.max(2, drive.speed * 0.4) * dt, LANE_MIN, LANE_MAX);
        // With the wheel straight, the car drifts back to the middle of its lane.
        if (!steer) lateral.current = THREE.MathUtils.damp(lateral.current, 0, 0.6, dt);
        odometer.current += drive.speed * dt;
        const next = (performance.now() - driveStarted.current) / 1000;
        if (Math.floor(next) !== Math.floor(state.driveSeconds)) state.setDriveSeconds(next);
        if (next >= CITY_TRAVEL_SECONDS) {
          // Plan a smooth stop that ends with the car level with the town sign. Set before the
          // phase changes, so the town is already in place on the render that shows it.
          const v0 = Math.max(drive.speed, 6);
          const distance = THREE.MathUtils.clamp((v0 * v0) / (2 * 4.2), 22, 48);
          decel.current = (v0 * v0) / (2 * distance);
          drive.speed = v0;
          stop.odo = odometer.current + distance;
          stop.regionId = state.currentRegionId;
          stoppedFor.current = 0;
          state.setMissionPhase("pullOver");
        }
      } else if (phase === "pullOver") {
        // Brake evenly to stop exactly at the sign, easing over to the verge, then open the questions.
        const remaining = Math.max(0, stop.odo - odometer.current);
        drive.speed = remaining > 0.02 ? Math.min(drive.speed, Math.max(Math.sqrt(2 * decel.current * remaining), 0.8)) : 0;
        odometer.current = Math.min(stop.odo, odometer.current + drive.speed * dt);
        const before = lateral.current;
        lateral.current = THREE.MathUtils.damp(lateral.current, PULL_OVER_LATERAL, 1.6, dt);
        steer = THREE.MathUtils.clamp((before - lateral.current) / Math.max(dt, 1e-3) * 0.6, -1, 1);
        if (drive.speed === 0) {
          stoppedFor.current += dt;
          if (stoppedFor.current > 0.45) state.setMissionPhase("quiz");
        }
      } else {
        drive.speed = 0;
      }
      drive.lateral = lateral.current;
      drive.steer = THREE.MathUtils.damp(drive.steer, steer, 6, dt);
      // Chase camera: behind and above the car, leaning slightly into turns, with a faint road rumble.
      const carX = CAR_X + drive.lateral;
      const rumble = Math.sin(elapsed.current * 37) * 0.006 * Math.min(1, drive.speed / 14);
      const target = new THREE.Vector3(carX * 0.85, 2.7 + rumble, drive.z + 6.8);
      cam.position.lerp(target, 1 - Math.exp(-4 * dt));
      cam.lookAt(carX, 1.15, drive.z - 9);
      cam.rotateZ(-drive.steer * 0.025);
      // A wider view at speed sells the pace.
      fov = BASE_FOV + Math.min(drive.speed, 26) * 0.32;
    }
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fov, 3, dt);
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

/** Canopy above and harness lines, in the flag's colours. */
function Parachute() {
  const phase = useExperience((s) => s.missionPhase);
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.rotation.y = camera.rotation.y;
  });
  if (phase !== "parachute") return null;
  const bands = ["#f5f5f7", "#0aa37a", "#d62839"];
  return (
    <group ref={group}>
      {bands.map((color, i) => (
        <mesh key={color} position-y={6} rotation-x={-0.12}>
          <sphereGeometry args={[4.4, 32, 8, 0, Math.PI * 2, (i * Math.PI) / 7.5, Math.PI / 7.5]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.6, 3, -0.4]} rotation-z={s * -0.48}>
          <cylinderGeometry args={[0.01, 0.01, 6.4, 4]} />
          <meshBasicMaterial color="#e8e8ea" />
        </mesh>
      ))}
    </group>
  );
}

function SunShadow() {
  // Keep the shadow camera centred on the player so nearby shadows stay sharp.
  const light = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();
  const tier = useExperience((s) => s.tier);
  const phase = useExperience((s) => s.missionPhase);
  const airborne = phase === "freefall" || phase === "parachute";
  useFrame(() => {
    if (!light.current) return;
    // Aim at the ground under the player, not at the player: from high up the frustum would miss the terrain.
    const ground = new THREE.Vector3(camera.position.x, 0, camera.position.z - 14);
    light.current.position.copy(ground).add(SUN.clone().normalize().multiplyScalar(90));
    light.current.target.position.copy(ground);
    light.current.target.updateMatrixWorld();
  });
  return (
    <directionalLight ref={light} intensity={3.1} color="#fff1dc" castShadow={tier > 0 && !airborne}
      shadow-mapSize-width={tier === 2 ? 2048 : 1024} shadow-mapSize-height={tier === 2 ? 2048 : 1024}
      shadow-camera-left={-48} shadow-camera-right={48} shadow-camera-top={48} shadow-camera-bottom={-48} shadow-camera-far={220} shadow-bias={-0.0004} />
  );
}

export default function MissionScene() {
  const phase = useExperience((s) => s.missionPhase);
  const high = phase === "freefall" || phase === "parachute";
  return (
    <>
      <color attach="background" args={["#a9c6d8"]} />
      <fog attach="fog" args={["#b9d0dc", high ? 120 : 70, high ? 620 : 440]} />
      <Sky distance={450000} sunPosition={SUN} turbidity={6} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <hemisphereLight args={["#cfe4f5", "#4b6a36", 1.1]} />
      <SunShadow />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer intensity={1} color="#9bc7eb" position={[0, 3, -20]} scale={[40, 10, 1]} />
      </Environment>

      <Clouds />
      <Mountains />
      <Landscape />
      <Traffic />
      <Car />
      <TownStop />
      {phase === "freefall" && (
        <mesh rotation-x={-Math.PI / 2} position={[1.8, 0.03, 4]}>
          <ringGeometry args={[3, 3.6, 64]} />
          <meshBasicMaterial color={[2.2, 0.3, 0.4]} toneMapped={false} />
        </mesh>
      )}

      <MissionController />
      <Parachute />
    </>
  );
}

useGLTF.preload(publicAsset("models/vehicle/sedan-sports.glb"));
