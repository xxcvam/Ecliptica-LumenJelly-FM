import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VolConeProps {
  position?: [number, number, number];
  opacity?: number;
  color?: string;
  radius?: number;
  height?: number;
}

export function VolCone({
  position = [0, 4, 0],
  opacity = 0.02,
  color = '#3060A8',
  radius = 0.8,
  height = 4.5,
}: VolConeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[radius, height, 6, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

