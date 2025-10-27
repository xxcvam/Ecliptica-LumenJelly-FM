import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { VisualProps } from '../registry';
import { noteBus } from '../events/bus';

type GridParams = {
  grid?: [number, number];
  keySize?: [number, number];
  keyGlow?: number;
  bounce?: number;
  accent?: boolean;
};

type KeyCell = {
  z: number; // 高度动画
  glow: number; // 发光
};

export default function KeyGrid({ params }: VisualProps) {
  const gParams = (params || {}) as GridParams;
  const [cols, rows] = (gParams.grid as [number, number]) ?? [8, 4];
  const [sx, sy] = (gParams.keySize as [number, number]) ?? [0.12, 0.12];
  const glowMax = (gParams.keyGlow as number) ?? 1.0;
  const bounce = (gParams.bounce as number) ?? 0.28;

  const group = useRef<THREE.Group>(null);
  const cells = useMemo<KeyCell[]>(() => Array.from({ length: cols * rows }, () => ({ z: 0, glow: 0 })), [cols, rows]);

  const meshes = useMemo(() => {
    const arr: THREE.Mesh[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const geo = new THREE.BoxGeometry(sx, sy, 0.06);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set((i - (cols - 1) / 2) * (sx * 1.4), (j - (rows - 1) / 2) * (sy * 1.4), -0.2);
        arr.push(m);
      }
    }
    return arr;
  }, [cols, rows, sx, sy]);

  // 订阅 note 事件，将 midi 映射到网格索引
  useMemo(
    () =>
      noteBus.on((e) => {
        const idx = ((e.midi - 36) % (cols * rows) + (cols * rows)) % (cols * rows);
        if (idx >= 0 && idx < cells.length) {
          const c = cells[idx];
          c.z = 1;
          c.glow = Math.max(c.glow, e.vel);
        }
      }),
    [cells, cols, rows]
  );

  // 可选：Accent 高亮整行/整列
  useMemo(
    () =>
      gParams.accent
        ? import('../events/bus').then(({ accentBus }) =>
            accentBus.on((e) => {
              if (!e.on) return;
              for (let idx = 0; idx < cells.length; idx++) {
                const c = cells[idx];
                c.glow = Math.max(c.glow, 0.9);
              }
            })
          )
        : undefined,
    [cells, gParams.accent]
  );

  useFrame((_, dt) => {
    const decay = Math.pow(0.001, dt);
    for (let idx = 0; idx < meshes.length; idx++) {
      const m = meshes[idx];
      const c = cells[idx];
      c.z *= decay;
      c.glow *= decay;
      m.position.z = -0.2 + c.z * bounce;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.min(glowMax, c.glow) * 0.65;
    }
    if (group.current) {
      meshes.forEach((m) => {
        if (!m.parent) group.current!.add(m);
      });
    }
  });

  return <group ref={group} />;
}


