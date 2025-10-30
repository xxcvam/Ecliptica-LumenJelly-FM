import * as THREE from 'three';

interface SlabProps {
  width?: number;
  depth?: number;
  material: THREE.Material;
  position?: [number, number, number];
}

export function Slab({ width = 10, depth = 10, material, position = [0, -1.5, 0] }: SlabProps) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

