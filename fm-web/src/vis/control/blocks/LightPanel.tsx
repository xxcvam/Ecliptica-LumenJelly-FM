import { useControlStore } from '../core/store';

interface LightPanelProps {
  width?: number;
  height?: number;
  intensity?: number;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function LightPanel({
  width = 6,
  height = 3,
  intensity,
  color,
  position = [0, 2, -2],
  rotation = [0, 0, 0],
}: LightPanelProps) {
  const store = useControlStore();
  const finalIntensity = intensity !== undefined ? intensity : store.light.intensity;
  const finalColor = color || store.light.color;

  return (
    <group position={position} rotation={rotation}>
      <rectAreaLight intensity={finalIntensity} width={width} height={height} color={finalColor} />
      {/* 微弱发光的深海蓝背景板 */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[width * 0.95, height * 0.95]} />
        <meshStandardMaterial 
          color="#0a1520" 
          transparent 
          opacity={0.3}
          emissive="#1a3050"
          emissiveIntensity={0.15}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
