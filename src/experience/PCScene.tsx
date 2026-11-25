import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Terminal from "./Terminal";
import Hand from "./Hand";

const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

function Keyboard() {
  const U = 0.0285;
  const keys = useMemo(() => {
    const out: { x: number; z: number; w: number }[] = [];
    ROWS.forEach((row, r) => {
      let x = -7.5;
      row.forEach((w) => { out.push({ x: (x + w / 2) * U, z: (r - 2) * U, w: w * U - 0.004 }); x += w; });
    });
    return out;
  }, []);
  return (
    <group position={[0, 0.772, -0.22]} rotation-x={0.06}>
      <RoundedBox args={[0.455, 0.018, 0.16]} radius={0.006} castShadow receiveShadow>
        <meshStandardMaterial color="#2a2c30" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      {keys.map((k, i) => (
        <RoundedBox key={i} args={[k.w, 0.012, U - 0.004]} radius={0.003} smoothness={2} position={[k.x, 0.012, k.z]} castShadow>
          <meshStandardMaterial color="#141518" roughness={0.6} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.0095, 0]}>
        <boxGeometry args={[0.44, 0.001, 0.148]} />
        <meshBasicMaterial color="#1f8f6a" toneMapped={false} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
import { useExperience } from "./store";

const woodTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4a3222";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    g.strokeStyle = `rgba(${30 + Math.random() * 40},${18 + Math.random() * 20},10,${0.25 + Math.random() * 0.3})`;
    g.lineWidth = 1 + Math.random() * 3;
    g.beginPath();
    const y = Math.random() * 512;
    g.moveTo(0, y);
    g.bezierCurveTo(170, y + Math.random() * 20 - 10, 340, y + Math.random() * 20 - 10, 512, y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const windowTexture = () => {
  const c = document.createElement("canvas");
  c.width = 768; c.height = 538;
  const g = c.getContext("2d")!;
  g.fillStyle = "#010207";
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.8})`;
    const r = Math.random() * 1.3;
    g.beginPath(); g.arc(Math.random() * c.width, Math.random() * c.height * 0.7, r, 0, 7); g.fill();
  }
  // Earth's limb: a huge disc below the frame, with an atmosphere glow along its edge.
  const cx = c.width * 0.58, cy = c.height * 1.9, R = c.height * 1.35;
  const glow = g.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.08);
  glow.addColorStop(0, "rgba(90,160,255,0.9)");
  glow.addColorStop(0.45, "rgba(60,120,255,0.35)");
  glow.addColorStop(1, "rgba(20,40,120,0)");
  g.fillStyle = glow;
  g.beginPath(); g.arc(cx, cy, R * 1.08, 0, Math.PI * 2); g.fill();
  const body = g.createLinearGradient(0, cy - R, 0, c.height);
  body.addColorStop(0, "#1d4d8f"); body.addColorStop(0.25, "#0c2347"); body.addColorStop(1, "#040a18");
  g.fillStyle = body;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export default function PCScene({ language }: { language: "bg" | "en" }) {
  const stage = useExperience((s) => s.stage);
  const setStage = useExperience((s) => s.setStage);
  const { camera, pointer } = useThree();
  const wood = useMemo(woodTexture, []);
  const windowView = useMemo(windowTexture, []);
  const t = useRef(0);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (stage === "divein") {
      t.current += dt;
      const k = 1 - Math.exp(-2.5 * t.current);
      camera.position.lerpVectors(new THREE.Vector3(0, 1.22, 0.4), new THREE.Vector3(0, 1.21, -0.38), k);
      camera.lookAt(0, 1.22, -0.6);
      if (t.current > 1.6) setStage("tower");
      return;
    }
    const time = performance.now() / 1000;
    camera.position.set(Math.sin(time * 0.4) * 0.006, 1.22 + Math.sin(time * 0.9) * 0.005, 0.4);
    camera.lookAt(pointer.x * 0.25, 1.14 + pointer.y * 0.15, -0.6);
  });

  return (
    <>
      <color attach="background" args={["#050608"]} />
      <fog attach="fog" args={["#050608", 2.5, 9]} />
      <ambientLight intensity={0.06} />
      {/* The monitor's glow is the key light; a warm desk lamp and a cold window fill the room. */}
      <pointLight position={[0, 1.25, -0.35]} intensity={1.6} distance={2.2} color="#a8f0cc" />
      <spotLight position={[-0.75, 1.45, -0.35]} angle={0.75} penumbra={0.9} intensity={10} distance={3.5} color="#ffcf9a" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0005} target-position={[-0.4, 0.74, -0.3]} />
      <directionalLight position={[2.5, 2.2, -2.5]} intensity={0.35} color="#7fa2ff" />
      <Environment resolution={64}>
        <Lightformer intensity={0.8} color="#a8f0cc" position={[0, 1.2, -1]} scale={[1, 0.6, 1]} />
        <Lightformer intensity={0.6} color="#7fa2ff" position={[2, 2, -2]} scale={[2, 2, 1]} />
      </Environment>

      {/* room */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#121214" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2, -1.25]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1b1d21" roughness={0.92} />
      </mesh>
      {/* Window onto orbit: stars and Earth's glowing limb, painted into the glass so it stays inside the frame. */}
      <group position={[1.35, 1.55, -1.24]}>
        <mesh>
          <planeGeometry args={[1.5, 1.05]} />
          <meshBasicMaterial map={windowView} toneMapped={false} />
        </mesh>
        {[[0, 0.545, 1.58, 0.04], [0, -0.545, 1.58, 0.04], [0.77, 0, 0.04, 1.13], [-0.77, 0, 0.04, 1.13], [0, 0, 0.025, 1.05]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <boxGeometry args={[w, h, 0.03]} />
            <meshStandardMaterial color="#26282d" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* desk */}
      <mesh position={[0, 0.74, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.05, 0.9]} />
        <meshStandardMaterial map={wood} roughness={0.5} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.37, -0.45]} castShadow>
          <boxGeometry args={[0.05, 0.74, 0.85]} />
          <meshStandardMaterial color="#26272b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* monitor */}
      <group position={[0, 1.2, -0.62]}>
        <RoundedBox args={[0.92, 0.56, 0.04]} radius={0.012} castShadow>
          <meshStandardMaterial color="#0f1011" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0205]}>
          <planeGeometry args={[0.89, 0.53]} />
          <meshBasicMaterial color={[0.05, 0.09, 0.07]} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.36, -0.03]}>
          <boxGeometry args={[0.05, 0.22, 0.03]} />
          <meshStandardMaterial color="#1c1d1f" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.455, 0]}>
          <boxGeometry args={[0.3, 0.015, 0.2]} />
          <meshStandardMaterial color="#1c1d1f" metalness={0.7} roughness={0.3} />
        </mesh>
        <Html transform position={[0, 0, 0.022]} distanceFactor={0.5} occlude={false} zIndexRange={[5, 0]}
          style={{ width: 860, height: 510, pointerEvents: "none" }}>
          <Terminal language={language} active={stage === "pc"} onDivein={() => setStage("divein")} />
        </Html>
      </group>

      {/* desk lamp */}
      <group position={[-0.72, 0.765, -0.55]}>
        <mesh castShadow><cylinderGeometry args={[0.08, 0.09, 0.02, 32]} /><meshStandardMaterial color="#d8d8da" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[0.05, 0.25, 0.05]} rotation-z={-0.35} castShadow><cylinderGeometry args={[0.008, 0.008, 0.5, 8]} /><meshStandardMaterial color="#d8d8da" metalness={0.8} roughness={0.25} /></mesh>
        <mesh position={[0.17, 0.47, 0.14]} rotation={[0.6, 0, -1.1]} castShadow><coneGeometry args={[0.07, 0.11, 32, 1, true]} /><meshStandardMaterial color="#d8d8da" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.2, 0.44, 0.17]}><sphereGeometry args={[0.025, 16, 16]} /><meshBasicMaterial color={[3, 2.4, 1.6]} toneMapped={false} /></mesh>
      </group>

      {/* keyboard + hands */}
      <Keyboard />
      <group position={[-0.1, 0.81, -0.13]} rotation={[0.1, 0.15, 0]} scale={1.05}><Hand side={-1} curl={0.55} sleeve="#2b2d33" /></group>
      <group position={[0.1, 0.81, -0.13]} rotation={[0.1, -0.15, 0]} scale={1.05}><Hand side={1} curl={0.55} sleeve="#2b2d33" /></group>

      {/* mug */}
      <group position={[0.58, 0.815, -0.32]}>
        <mesh castShadow><cylinderGeometry args={[0.038, 0.034, 0.095, 32]} /><meshStandardMaterial color="#f2f2f4" roughness={0.25} /></mesh>
        <mesh position={[0.042, 0, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[0.022, 0.006, 10, 24]} /><meshStandardMaterial color="#f2f2f4" roughness={0.25} /></mesh>
        <mesh position-y={0.043}><circleGeometry args={[0.033, 24]} /><meshStandardMaterial color="#2b1a10" roughness={0.2} /></mesh>
      </group>
    </>
  );
}
