import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Mouse } from 'lucide-react';
import * as THREE from 'three';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAsset } from '@/lib/utils';
import { prefersLightMedia, stableViewportHeight } from '@/lib/viewport';

// Phones and tablets get a 4K Earth (an 8K texture is ~128 MB of GPU memory to decode and hold).
const EARTH_DAY = publicAsset(prefersLightMedia() ? 'textures/earth-day-4k.webp' : 'textures/earth-day-8k.webp');

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const reveal = (value: number, start: number, hold: number, end: number) => (
  Math.min(range(value, start, hold), 1 - range(value, hold, end))
);
const heldReveal = (value: number, start: number, revealEnd: number, holdEnd: number, end: number) => (
  Math.min(range(value, start, revealEnd), 1 - range(value, holdEnd, end))
);

const latLonDirection = (lat: number, lon: number) => {
  const latitude = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -Math.cos(latitude) * Math.cos(theta),
    Math.sin(latitude),
    Math.cos(latitude) * Math.sin(theta),
  );
};

interface EarthProps {
  progress: number;
}

const Earth = ({ progress }: EarthProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const [day, clouds] = useTexture([EARTH_DAY, publicAsset('textures/earth_clouds_1024.png')]);

  day.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
  clouds.anisotropy = day.anisotropy;

  const orientation = useMemo(() => {
    const bulgaria = latLonDirection(42.73, 25.49);
    const towardCamera = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(bulgaria, towardCamera);
    const north = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    const angle = Math.atan2(north.x, north.y);
    quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(towardCamera, angle));
    return quaternion;
  }, []);

  const appearance = range(progress, 0.06, 0.34);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.015;
    if (!groupRef.current) return;
    const targetScale = THREE.MathUtils.lerp(0.06, 4.15, appearance);
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-7 * delta));
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 0, 7, delta);
  });

  return (
    <group ref={groupRef} quaternion={orientation} scale={0.08}>
      <mesh>
        <sphereGeometry args={[1.8, 128, 128]} />
        <meshStandardMaterial map={day} roughness={0.72} metalness={0.02} />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.824, 96, 96]} />
        <meshStandardMaterial map={clouds} transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh scale={1.055}>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshBasicMaterial color="#6aa8d8" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

const SpaceScene = ({ progress }: EarthProps) => (
  <Canvas
    dpr={[1, 1.5]}
    camera={{ position: [0, 0, 7.2], fov: 46, near: 0.1, far: 500 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  >
    <ambientLight intensity={0.28} color="#6a7690" />
    <directionalLight position={[5, 3, 6]} intensity={3.2} color="#fff8ec" />
    <pointLight position={[-4, -2, 3]} intensity={0.45} color="#35648d" />
    <Stars radius={120} depth={70} count={4200} factor={3.4} saturation={0.12} fade speed={0.15} />
    <Suspense fallback={null}>
      <Earth progress={progress} />
    </Suspense>
  </Canvas>
);

interface SpaceGamesJourneyProps {
  onProgress?: (progress: number) => void;
}

const SpaceGamesJourney = ({ onProgress }: SpaceGamesJourneyProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number>();
  const [progress, setProgress] = useState(0);
  // The 3D scene exists only near the screen: while the history film above is
  // playing it would otherwise draw every frame unseen and slow scrolling down.
  const [nearView, setNearView] = useState(false);
  const { language } = useLanguage();

  const closingWords = useMemo(() => (
    language === 'bg'
      ? 'Краткото пътуване свърши. Историята продължава с теб — време е да се забавляваме.'
      : 'The short journey is complete. The story continues with you — now let’s have some fun.'
  ).split(' '), [language]);

  useEffect(() => {
    const update = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (section) {
          const viewport = stableViewportHeight();
          const rect = section.getBoundingClientRect();
          const travel = Math.max(1, section.offsetHeight - viewport);
          const next = clamp(-rect.top / travel);
          setProgress(next);
          setNearView(rect.top < viewport * 2 && rect.bottom > -viewport);
          onProgress?.(next);
        }
        frameRef.current = undefined;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [onProgress]);

  const closingVisibility = range(progress, 0.37, 0.4);
  const closingWordProgress = range(progress, 0.38, 0.98);
  const earthSceneOpacity = 1 - range(progress, 0.35, 0.41);

  return (
    <section ref={sectionRef} className={`space-games${progress > 0.89 ? ' is-complete' : ''}`} aria-label={language === 'bg' ? 'Път към игрите' : 'Journey to the games'}>
      <div className="space-games__stage">
        <div className="space-games__canvas" style={{ opacity: earthSceneOpacity }} aria-hidden="true">
          {nearView && progress < 0.43 && <SpaceScene progress={progress} />}
        </div>
        <div className="cinematic-intro__grain" aria-hidden="true" />
        <div className="space-games__shade" aria-hidden="true" />

        <div
          className="space-games__closing"
          style={{ opacity: closingVisibility, transform: `translate3d(-50%, calc(-50% + ${(1 - closingVisibility) * 28}px), 0)` }}
        >
          <span>{language === 'bg' ? 'Вече си тук' : 'You are here'}</span>
          <h2 aria-label={closingWords.join(' ')}>
            {closingWords.map((word, index) => {
              const wordStart = index / closingWords.length;
              const wordOpacity = range(closingWordProgress, wordStart, Math.min(1, wordStart + 0.16));
              return <span key={`${word}-${index}`} aria-hidden="true" style={{ opacity: wordOpacity }}>{word}{' '}</span>;
            })}
          </h2>
        </div>

        <div className="space-games__scroll" style={{ opacity: 1 - range(progress, 0.08, 0.16) }} aria-hidden="true">
          <Mouse />
          <span>{language === 'bg' ? 'към земята' : 'toward Earth'}</span>
        </div>
      </div>
    </section>
  );
};

export default SpaceGamesJourney;