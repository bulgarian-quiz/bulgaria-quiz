import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Stars, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import HoloBulgaria from "./HoloBulgaria";
import { useExperience } from "./store";
import { publicAsset } from "@/lib/utils";

/**
 * The orbital station: a circular observation deck above Bulgaria, a map
 * table with a holographic country at its centre, and Earth filling the view.
 * The sun is fixed at a low dawn angle so Bulgaria is always in soft daylight
 * with the night side and its city lights visible to the east.
 */
const EARTH_C = new THREE.Vector3(0, -8, -118);
const EARTH_R = 82;
const SUN_DIR = new THREE.Vector3(1, 0.32, 0.2).normalize();
const TABLE = new THREE.Vector3(0, 0, -3.4);
const DECK_R = 9;

const latLonDir = (lat: number, lon: number) => {
  const la = THREE.MathUtils.degToRad(lat);
  const th = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-Math.cos(la) * Math.cos(th), Math.sin(la), Math.cos(la) * Math.sin(th));
};

const earthVert = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

const earthFrag = /* glsl */ `
uniform sampler2D day; uniform sampler2D night; uniform sampler2D clouds; uniform vec3 sunDir; uniform float cloudShift;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
  float d=dot(N,sunDir);
  float dayMix=smoothstep(-0.12,0.22,d);
  vec3 dayCol=texture2D(day,vUv).rgb;
  // Oceans: blue-dominant and dark. They get a sun glint and slightly deeper colour.
  float water=smoothstep(0.015,0.09,dayCol.b-max(dayCol.r,dayCol.g)*0.92);
  float shade=texture2D(clouds,vUv+vec2(cloudShift-0.0015,0.001)).a;
  vec2 px=vec2(1.0/2048.0,1.0/1024.0);
  vec3 lit=dayCol*(0.06+1.25*max(d,0.))*(1.0-shade*0.35);
  vec3 R=reflect(-sunDir,N);
  float glint=pow(max(dot(R,V),0.),60.)*water*dayMix*2.4;
  // Five taps smooth the low-resolution city-light map into a soft glow instead of blocks.
  vec3 nl=texture2D(night,vUv).rgb*0.4+(texture2D(night,vUv+vec2(px.x,0.)).rgb+texture2D(night,vUv-vec2(px.x,0.)).rgb+texture2D(night,vUv+vec2(0.,px.y)).rgb+texture2D(night,vUv-vec2(0.,px.y)).rgb)*0.15;
  vec3 lights=nl*vec3(1.,.8,.55)*1.5*(1.0-dayMix);
  vec3 col=lit+vec3(1.,.92,.8)*glint+lights;
  // Atmosphere on the surface: blue on the day side, warm along the terminator.
  float rim=pow(1.-max(dot(V,N),0.),3.);
  vec3 air=mix(vec3(1.,.45,.2),vec3(.35,.62,1.),smoothstep(-0.05,0.35,d));
  col+=air*rim*smoothstep(-0.25,0.3,d)*0.9;
  gl_FragColor=vec4(col,1.);
  #include <colorspace_fragment>
}`;

const cloudFrag = /* glsl */ `
uniform sampler2D clouds; uniform vec3 sunDir;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  // The cloud map keeps the clouds in its alpha channel; its colour is near-white everywhere.
  // A small blur keeps the 1024px map from looking pixelated this close to Earth.
  vec2 px=vec2(1.5/1024.0,1.5/512.0);
  float a=texture2D(clouds,vUv).a*0.4
    +(texture2D(clouds,vUv+vec2(px.x,0.)).a+texture2D(clouds,vUv-vec2(px.x,0.)).a
     +texture2D(clouds,vUv+vec2(0.,px.y)).a+texture2D(clouds,vUv-vec2(0.,px.y)).a)*0.15;
  float d=dot(normalize(vN),sunDir);
  float light=0.04+1.1*smoothstep(-0.15,0.6,d);
  gl_FragColor=vec4(vec3(light),smoothstep(0.08,0.9,a)*0.78);
  #include <colorspace_fragment>
}`;

const atmosphereFrag = /* glsl */ `
uniform vec3 sunDir;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
  float fres=pow(1.-abs(dot(N,V)),4.5);
  float d=dot(N,sunDir);
  vec3 c=mix(vec3(1.,.42,.18),vec3(.3,.58,1.),smoothstep(-0.1,0.45,d));
  float lit=smoothstep(-0.35,0.35,d);
  gl_FragColor=vec4(c*fres*lit*2.2,fres*lit);
}`;

function Earth() {
  const { gl } = useThree();
  const [day, night, clouds] = useTexture([
    publicAsset("textures/earth-day-8k.webp"),
    publicAsset("textures/earth_lights_2048.png"),
    publicAsset("textures/earth_clouds_1024.png"),
  ]);
  const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
  [day, night].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anisotropy; });
  clouds.anisotropy = anisotropy;
  clouds.wrapS = THREE.RepeatWrapping;

  const { quat, surface, cloud, air } = useMemo(() => {
    // Turn the globe so Bulgaria faces the deck, north up.
    const toCam = new THREE.Vector3(0, 1.7, 0).sub(EARTH_C).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(latLonDir(42.7, 25.5), toCam);
    const north = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const proj = (v: THREE.Vector3) => v.clone().sub(toCam.clone().multiplyScalar(v.dot(toCam))).normalize();
    const a = proj(north), b = proj(new THREE.Vector3(0, 1, 0));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(toCam, Math.atan2(new THREE.Vector3().crossVectors(a, b).dot(toCam), a.dot(b))));
    return {
      quat: q,
      surface: { day: { value: day }, night: { value: night }, clouds: { value: clouds }, sunDir: { value: SUN_DIR }, cloudShift: { value: 0 } },
      cloud: { clouds: { value: clouds }, sunDir: { value: SUN_DIR } },
      air: { sunDir: { value: SUN_DIR } },
    };
  }, [day, night, clouds]);
  const cloudMesh = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (cloudMesh.current) cloudMesh.current.rotation.y += dt * 0.0035;
    surface.cloudShift.value = cloudMesh.current ? cloudMesh.current.rotation.y / (Math.PI * 2) : 0;
  });

  return (
    <group position={EARTH_C} quaternion={quat}>
      <mesh>
        <sphereGeometry args={[EARTH_R, 160, 160]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={surface} />
      </mesh>
      <mesh ref={cloudMesh} scale={1.006}>
        <sphereGeometry args={[EARTH_R, 128, 128]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={cloudFrag} uniforms={cloud} transparent depthWrite={false} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[EARTH_R, 96, 96]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={atmosphereFrag} uniforms={air} transparent depthWrite={false}
          blending={THREE.AdditiveBlending} side={THREE.FrontSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

const deckTexture = () => {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#191a1e";
  g.fillRect(0, 0, size, size);
  const cx = size / 2;
  g.strokeStyle = "rgba(255,255,255,.055)";
  for (let r = 40; r < cx; r += 46) { g.lineWidth = r % 92 === 40 ? 2 : 1; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke(); }
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * 60, cx + Math.sin(a) * 60); g.lineTo(cx + Math.cos(a) * cx, cx + Math.sin(a) * cx); g.stroke();
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    g.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Emissive arc in the deck. Colour components above 1 glow through the bloom pass. */
function Inlay({ radius, from, to, color, width = 0.05 }: { radius: number; from: number; to: number; color: [number, number, number]; width?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.003}>
      <ringGeometry args={[radius - width / 2, radius + width / 2, 160, 1, from, to - from]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function Deck() {
  const texture = useMemo(deckTexture, []);
  const tier = useExperience((s) => s.tier);
  return (
    <group>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[DECK_R, DECK_R - 0.4, 0.5, 96]} />
        <meshStandardMaterial color="#1a1b1f" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow>
        <circleGeometry args={[DECK_R, 96]} />
        <meshStandardMaterial map={texture} metalness={0.55} roughness={0.42} envMapIntensity={0.8} />
      </mesh>
      {/* Flag-coloured light lines: white, green and red arcs around the deck. */}
      <Inlay radius={8.35} from={0} to={Math.PI * 2} color={[1.6, 1.6, 1.7]} width={0.035} />
      <Inlay radius={7.95} from={Math.PI * 0.08} to={Math.PI * 0.92} color={[0.1, 1.5, 1.0]} />
      <Inlay radius={7.95} from={Math.PI * 1.08} to={Math.PI * 1.92} color={[2.2, 0.25, 0.35]} />

      {/* Glass railing with a polished top rail. */}
      <mesh position-y={0.62}>
        <cylinderGeometry args={[DECK_R - 0.25, DECK_R - 0.25, 1.15, 128, 1, true]} />
        <meshPhysicalMaterial color="#b8d4ff" transparent opacity={tier === 0 ? 0.06 : 0.1} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position-y={1.2} rotation-x={Math.PI / 2}>
        <torusGeometry args={[DECK_R - 0.25, 0.045, 12, 192]} />
        <meshStandardMaterial color="#d7dbe2" metalness={1} roughness={0.18} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * (DECK_R - 0.25), 0.6, Math.sin(a) * (DECK_R - 0.25)]} castShadow>
            <boxGeometry args={[0.05, 1.2, 0.05]} />
            <meshStandardMaterial color="#9aa0a8" metalness={0.95} roughness={0.25} />
          </mesh>
        );
      })}
      {/* The column beneath the deck, fading into the dark. */}
      <mesh position={[0, -14, 0]}>
        <cylinderGeometry args={[3.2, 0.9, 27, 48]} />
        <meshStandardMaterial color="#202227" metalness={0.85} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** The hologram leans up towards the viewer and turns to follow them around the table. */
function HoloStand() {
  const { camera } = useThree();
  const yawGroup = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    if (!yawGroup.current) return;
    const target = Math.atan2(camera.position.x - TABLE.x, camera.position.z - TABLE.z);
    let delta = target - yawGroup.current.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    yawGroup.current.rotation.y += delta * (1 - Math.exp(-3 * Math.min(raw, 0.05)));
  });
  return (
    <group ref={yawGroup} position-y={1.45}>
      <group rotation-x={1.05}>
        <HoloBulgaria scale={0.0032} />
      </group>
    </group>
  );
}

function MapTable() {
  return (
    <group position={TABLE}>
      <mesh position-y={0.46} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.25, 0.92, 64]} />
        <meshStandardMaterial color="#141519" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position-y={0.93} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.02, 64]} />
        <meshStandardMaterial color="#0b0c0f" metalness={0.3} roughness={0.15} />
      </mesh>
      <mesh position-y={0.935} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.96, 1.0, 96]} />
        <meshBasicMaterial color={[1.2, 1.9, 2.4]} toneMapped={false} />
      </mesh>
      <mesh position-y={0.004} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.78, 1.82, 128]} />
        <meshBasicMaterial color={[1.2, 1.8, 2.2]} toneMapped={false} />
      </mesh>
      <HoloStand />
      <pointLight position={[0, 1.3, 0]} intensity={4} distance={4} color="#8fd3ff" />
    </group>
  );
}

export default function TowerScene() {
  const { camera, gl } = useThree();
  const tier = useExperience((s) => s.tier);
  const yaw = useRef(0);
  const pitch = useRef(-0.06);
  const intro = useRef(0);
  const pos = useRef(new THREE.Vector3(0, 0, 2.2));
  const keys = useRef<Record<string, boolean>>({});
  const height = useRef(0);
  const verticalVelocity = useRef(0);
  const jumpHeld = useRef(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const isField = (e: KeyboardEvent) => /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
    const down = (e: KeyboardEvent) => {
      if (isField(e)) return;
      keys.current[e.code] = true;
      const state = useExperience.getState();
      if (e.code === "KeyE" && state.nearTable && !state.tabletOpen) state.setTablet(true);
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const look = (dx: number, dy: number) => {
      yaw.current -= dx * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0022, -1.3, 1.15);
    };
    const onMove = (e: MouseEvent) => {
      if (intro.current < 1.2) return;
      if (document.pointerLockElement === el) look(e.movementX, e.movementY);
      else if (drag.current) { look(e.clientX - drag.current.x, e.clientY - drag.current.y); drag.current = { x: e.clientX, y: e.clientY }; }
    };
    // Click locks the pointer for mouse-look; dragging also works (trackpads, or if the lock is refused).
    const onDown = (e: PointerEvent) => { if (!useExperience.getState().tabletOpen) drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => { drag.current = null; };
    const onClick = () => { if (!useExperience.getState().tabletOpen) el.requestPointerLock?.(); };
    document.addEventListener("mousemove", onMove);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mousemove", onMove);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick);
      useExperience.getState().setNearTable(false);
    };
  }, [gl]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    intro.current += dt;
    const state = useExperience.getState();
    if (state.tabletOpen && document.pointerLockElement) document.exitPointerLock();
    const k = keys.current;
    let walking = 0;
    if (!state.tabletOpen && intro.current > 1.2) {
      const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      if (f || r) {
        const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
        const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
        pos.current.add(fwd.multiplyScalar(f).add(right.multiplyScalar(r)).normalize().multiplyScalar(2.8 * dt));
        if (pos.current.length() > DECK_R - 0.9) pos.current.setLength(DECK_R - 0.9);
        // Keep the player outside the map table.
        const toTable = pos.current.clone().sub(TABLE).setY(0);
        if (toTable.length() < 1.6) pos.current.copy(TABLE).add(toTable.setLength(1.6)).setY(0);
        walking = 1;
      }
      const jumping = !!k.Space;
      if (jumping && !jumpHeld.current && height.current <= 0.001) verticalVelocity.current = 5.4;
      jumpHeld.current = jumping;
    }
    verticalVelocity.current -= 15.5 * dt;
    height.current += verticalVelocity.current * dt;
    if (height.current < 0) { height.current = 0; verticalVelocity.current = 0; }

    const near = pos.current.distanceTo(new THREE.Vector3(TABLE.x, 0, TABLE.z)) < 2.6;
    if (near !== state.nearTable) state.setNearTable(near);

    // Arrival: drift in from slightly above and behind, then settle.
    const arrive = 1 - Math.pow(1 - Math.min(intro.current / 1.6, 1), 3);
    const t = performance.now() / 1000;
    const bob = walking ? Math.sin(t * 9) * 0.028 : Math.sin(t * 1.4) * 0.007;
    camera.position.set(
      pos.current.x + Math.sin(t * 0.7) * 0.01,
      1.7 + height.current + bob + (1 - arrive) * 1.4,
      pos.current.z + (1 - arrive) * 3,
    );
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch.current + Math.sin(t * 0.5) * 0.003 - (1 - arrive) * 0.2, yaw.current + Math.sin(t * 0.33) * 0.003, 0);
  });

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <Stars radius={400} depth={80} count={tier === 0 ? 2500 : 7000} factor={5} saturation={0} fade speed={0.25} />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#9ec2ff", "#1a1208", 0.35]} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(40)} intensity={2.6} color="#ffe2c2" castShadow={tier > 0}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11} />
      <pointLight position={[0, -4, -12]} intensity={60} distance={30} color="#4f86ff" />
      <Environment resolution={tier === 2 ? 256 : 64}>
        <Lightformer intensity={1.6} position={[0, 8, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.4} color="#7fb0ff" position={[0, -2, -14]} scale={[40, 8, 1]} />
        <Lightformer intensity={2.2} color="#ffd2a6" position={[14, 4, 2]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
      <Earth />
      <Deck />
      <MapTable />
    </>
  );
}
