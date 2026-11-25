import { RoundedBox } from "@react-three/drei";

const SKIN = "#d6a07e";
const NAIL = "#efc9b4";

/** Anatomical first-person hand: palm, knuckled 3-segment fingers, thumb, cuffed sleeve. side: -1 left, 1 right. */
export default function Hand({ side = 1, curl = 0.35, sleeve = "#3c4652", sleeveLen = 0.26 }: { side?: 1 | -1; curl?: number; sleeve?: string; sleeveLen?: number }) {
  const skin = <meshPhysicalMaterial color={SKIN} roughness={0.55} sheen={0.6} sheenColor="#ffb79a" clearcoat={0.05} />;
  const fingers = [
    { x: -0.027, len: 0.034, rot: 0.06 },
    { x: -0.009, len: 0.039, rot: 0.02 },
    { x: 0.009, len: 0.037, rot: -0.02 },
    { x: 0.026, len: 0.028, rot: -0.07 },
  ];
  return (
    <group scale={[side, 1, 1]}>
      {/* sleeve + cuff */}
      <mesh position={[0, 0.005, 0.07 + sleeveLen / 2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.042, 0.05, sleeveLen, 20]} />
        <meshStandardMaterial color={sleeve} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.005, 0.075]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.046, 0.009, 8, 24]} />
        <meshStandardMaterial color="#22272e" roughness={0.7} />
      </mesh>
      {/* wrist */}
      <mesh position={[0, 0.003, 0.055]} rotation-x={Math.PI / 2} scale={[1.25, 1, 0.8]}>
        <cylinderGeometry args={[0.025, 0.028, 0.05, 16]} />
        {skin}
      </mesh>
      {/* palm */}
      <RoundedBox args={[0.078, 0.026, 0.085]} radius={0.012} smoothness={4} position={[0, 0, 0]}>
        {skin}
      </RoundedBox>
      {fingers.map((f, i) => (
        <group key={i} position={[f.x, 0.002, -0.043]} rotation={[-curl * 0.6, f.rot, 0]}>
          <Segment len={f.len * 0.45} r={0.0085}>
            <group rotation-x={-curl}>
              <Segment len={f.len * 0.32} r={0.0078}>
                <group rotation-x={-curl * 0.8}>
                  <Segment len={f.len * 0.26} r={0.007} nail />
                </group>
              </Segment>
            </group>
          </Segment>
        </group>
      ))}
      {/* thumb */}
      <group position={[-0.036, -0.004, 0.012]} rotation={[-0.2, 0.75, -0.5]}>
        <Segment len={0.026} r={0.011}>
          <group rotation-x={-curl * 0.5}>
            <Segment len={0.02} r={0.0095} nail />
          </group>
        </Segment>
      </group>
    </group>
  );

  function Segment({ len, r, nail, children }: { len: number; r: number; nail?: boolean; children?: React.ReactNode }) {
    return (
      <group>
        <mesh position={[0, 0, -len / 2]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[r, len, 4, 10]} />
          {skin}
        </mesh>
        {nail && (
          <mesh position={[0, r * 0.75, -len * 0.75]} rotation-x={-0.12} scale={[1, 0.25, 1.3]}>
            <sphereGeometry args={[r * 0.8, 10, 8]} />
            <meshStandardMaterial color={NAIL} roughness={0.25} />
          </mesh>
        )}
        <group position={[0, 0, -len]}>{children}</group>
      </group>
    );
  }
}
