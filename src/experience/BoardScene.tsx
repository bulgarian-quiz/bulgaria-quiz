import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Html, Lightformer, RoundedBox, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { regionsData } from "@/data/questions";
import { useLanguage } from "@/contexts/LanguageContext";
import { atlasToWorld, provinceGeometry, provinceOutline, provinceShapes } from "./provinces3d";
import { boardPicker } from "./boardPicker";
import { useExperience } from "./store";

/** World units per atlas unit: the board is ~22 units wide. */
const SCALE = 0.022;
const TILE_DEPTH = 0.16;
const GREEN = new THREE.Color("#0aa37a");
const RED = new THREE.Color("#e03a48");
const BASE = new THREE.Color("#2a2b30");
const HOVER = new THREE.Color("#4a4c55");


function Province({ id, shapes, ax, ay }: { id: string; shapes: THREE.Shape[]; ax: number; ay: number }) {
  const { language } = useLanguage();
  const placed = useExperience((s) => !!s.boardPlaced[id]);
  const feedback = useExperience((s) => (s.boardFeedback?.id === id ? s.boardFeedback : null));
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const geometry = useMemo(() => provinceGeometry(shapes, SCALE, TILE_DEPTH, 0.018), [shapes]);
  const outline = useMemo(() => provinceOutline(shapes, SCALE, TILE_DEPTH + 0.021), [shapes]);
  const anchor = useMemo(() => atlasToWorld(ax, ay, SCALE), [ax, ay]);
  const born = useRef(performance.now());

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = group.current;
    const m = material.current;
    if (!g || !m) return;
    const now = performance.now();
    // Build-in: provinces rise into place west to east when the board opens.
    const intro = THREE.MathUtils.clamp((now - born.current - ax * 1.1) / 700, 0, 1);
    const introEase = 1 - Math.pow(1 - intro, 3);
    const flash = feedback ? Math.max(0, 1 - (now - feedback.at) / 650) : 0;
    const shake = feedback && !feedback.ok ? Math.sin((now - feedback.at) / 22) * 0.06 * flash : 0;
    const lift = placed ? 0.32 : hovered ? 0.1 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, lift - (1 - introEase) * 1.2, 10, dt);
    g.position.x = shake;
    const target = placed ? GREEN : hovered ? HOVER : BASE;
    m.color.lerp(target, 1 - Math.exp(-10 * dt));
    if (feedback && !feedback.ok) m.color.lerp(RED, flash);
    m.emissive.copy(placed ? GREEN : feedback?.ok === false ? RED : BASE);
    m.emissiveIntensity = placed ? 0.35 + flash * 1.6 : flash * 0.9;
    m.opacity = introEase;
  });

  const pick = () => {
    const state = useExperience.getState();
    if (state.boardPlaced[id] || !state.boardSelected) return;
    state.placeBoardRegion(id);
  };

  return (
    <group ref={group} position-y={-1.2}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        userData={{ provinceId: id }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
        onClick={(e) => { e.stopPropagation(); pick(); }}
      >
        <meshPhysicalMaterial ref={material} color={BASE} roughness={0.42} metalness={0.1} clearcoat={0.35} clearcoatRoughness={0.4} transparent />
      </mesh>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color={placed ? "#d9fff1" : "#f5f5f7"} transparent opacity={placed ? 0.9 : 0.35} />
      </lineSegments>
      {placed && (
        <Html position={[anchor.x, TILE_DEPTH + 0.08, anchor.z]} center distanceFactor={24} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div className="xp-board-label">{regionsData[id]?.name[language] ?? id}</div>
        </Html>
      )}
    </group>
  );
}

function Picker() {
  const { camera, gl, scene } = useThree();
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    boardPicker.current = (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(scene.children, true).find((h) => h.object.userData?.provinceId);
      return hit ? (hit.object.userData.provinceId as string) : null;
    };
    return () => { boardPicker.current = null; };
  }, [camera, gl, scene]);
  return null;
}

function CameraRig() {
  const { camera, pointer, size } = useThree();
  const t = useRef(0);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    t.current = Math.min(1, t.current + dt * 0.45);
    const ease = 1 - Math.pow(1 - t.current, 3);
    // Frame the whole country at any aspect ratio: pull back on narrow windows.
    const aspect = size.width / size.height;
    const fit = THREE.MathUtils.clamp(1.65 / aspect, 0.85, 1.6);
    const dist = (15.5 + (1 - ease) * 14) * fit;
    const target = new THREE.Vector3(pointer.x * 1.4 - 1.2, dist * 0.98, dist * 0.62 + pointer.y * -0.8);
    camera.position.lerp(target, 1 - Math.exp(-4 * dt));
    camera.lookAt(-1.2, 0, 0.6);
  });
  return null;
}

function Celebration() {
  const done = useExperience((s) => Object.keys(s.boardPlaced).length >= 28);
  if (!done) return null;
  return <Sparkles count={160} scale={[22, 6, 15]} position={[0, 2, 0]} size={5} speed={0.8} color="#7df0c6" />;
}

export default function BoardScene() {
  const shapes = useMemo(provinceShapes, []);
  const tier = useExperience((s) => s.tier);
  return (
    <>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 28, 70]} />
      <Stars radius={120} depth={40} count={tier === 0 ? 1500 : 4000} factor={3.5} fade speed={0.2} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-12, 22, 14]} intensity={2.6} color="#fff3e0" castShadow={tier > 0}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-16} shadow-camera-right={16}
        shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} />
      <Environment resolution={tier === 2 ? 256 : 64}>
        <Lightformer intensity={2.2} position={[0, 12, 4]} rotation-x={Math.PI / 2} scale={[24, 10, 1]} />
        <Lightformer intensity={1.2} color="#ff4d5e" position={[-16, 3, -6]} rotation-y={Math.PI / 2} scale={[14, 3, 1]} />
        <Lightformer intensity={1.2} color="#2fd3a0" position={[16, 3, -6]} rotation-y={-Math.PI / 2} scale={[14, 3, 1]} />
      </Environment>

      {/* The table the map rests on. */}
      <RoundedBox args={[27, 0.6, 19]} radius={0.3} smoothness={4} position={[0, -0.32, 0]} receiveShadow>
        <meshStandardMaterial color="#121215" roughness={0.55} metalness={0.4} />
      </RoundedBox>
      <Grid position={[0, 0.004, 0]} args={[25.6, 17.6]} cellSize={0.5} cellThickness={0.5} cellColor="#2c2d33"
        sectionSize={2.5} sectionThickness={0.9} sectionColor="#3d3f47" fadeDistance={40} fadeStrength={1.2} />
      {tier > 0 && <ContactShadows position={[0, 0.01, 0]} scale={30} blur={2.4} far={4} opacity={0.6} />}

      {shapes.map((p) => <Province key={p.id} {...p} />)}
      <Celebration />
      <Picker />
      <CameraRig />
    </>
  );
}
