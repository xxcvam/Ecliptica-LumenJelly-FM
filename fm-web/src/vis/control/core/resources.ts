import { useMemo } from 'react';
import * as THREE from 'three';

export interface ControlResources {
  concreteMat: THREE.MeshStandardMaterial;
  groundMat: THREE.MeshPhysicalMaterial;
}

export function useControlResources(): ControlResources {

  const concreteMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1e23', // 更深的深海色调
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

  const groundMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#050a12', // 接近黑色的深海底
        roughness: 0.4,
        metalness: 0.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
      }),
    []
  );

  return { concreteMat, groundMat };
}
