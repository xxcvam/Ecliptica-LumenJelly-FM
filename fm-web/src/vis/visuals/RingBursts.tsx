import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { VisualProps } from '../registry';
import { noteBus } from '../events/bus';

type RingParams = {
  ringMax?: number;
  ringLife?: number;
  ringStroke?: number;
  ringHueFromIndex?: boolean;
};

type Ring = {
  active: boolean;
  t: number;
  life: number;
  radius: number;
  vel: number;
  color: THREE.Color;
};

// 预留控制器（占位，避免未使用告警）
export function useRingBurstsController() {
  return { spawn: (_midi: number, _vel: number) => {} };
}

export default function RingBursts({ audio, params }: VisualProps) {
  const ringParams = (params || {}) as RingParams;
  const maxRings = Math.max(8, Math.min(128, (ringParams.ringMax as number) ?? 64));
  const lifeBase = (ringParams.ringLife as number) ?? 1.1;
  const stroke = (ringParams.ringStroke as number) ?? 1.5;

  const group = useRef<THREE.Group>(null);
  const rings = useMemo<Ring[]>(() => Array.from({ length: maxRings }, () => ({
    active: false,
    t: 0,
    life: lifeBase,
    radius: 0.2,
    vel: 0.6,
    color: new THREE.Color('#ffffff')
  })), [maxRings, lifeBase]);

  const meshes = useMemo(() => {
    const arr: THREE.Mesh[] = [];
    for (let i = 0; i < maxRings; i++) {
      const geo = new THREE.RingGeometry(0.2, 0.2 + stroke * 0.01, 64);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      arr.push(mesh);
    }
    return arr;
  }, [maxRings, stroke]);

  // 内部触发（暂时不导出 controller，避免未用变量）
  function spawn(midi: number, vel: number) {
    const idx = rings.findIndex((r) => !r.active);
    if (idx === -1) return;
    const r = rings[idx];
    r.active = true;
    r.t = 0;
    r.life = lifeBase * (0.9 + Math.random() * 0.2);
    const k = THREE.MathUtils.clamp((midi - 36) / 48, 0, 1);
    r.radius = 0.25 + k * 1.25;
    r.vel = 0.4 + vel * 0.8;
    if (ringParams.ringHueFromIndex) {
      const hue = (k * 0.15 + 0.83) % 1.0; // 粉→蓝
      r.color.setHSL(hue, 0.9, 0.65);
    } else {
      r.color.set('#ffffff');
    }
    const m = meshes[idx];
    m.visible = true;
  }

  // 订阅 NoteEvent
  useMemo(() => noteBus.on((e) => spawn(e.midi, e.vel)), []);

  const prevRms = useRef(0);
  useFrame((_, dt) => {
    for (let i = 0; i < maxRings; i++) {
      const r = rings[i];
      const m = meshes[i];
      if (!r.active) continue;
      r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) {
        r.active = false;
        m.visible = false;
        continue;
      }
      const radius = r.radius + r.vel * r.t;
      const inner = Math.max(0.01, radius - stroke * 0.01);
      const outer = inner + stroke * 0.01;
      (m.geometry as THREE.RingGeometry).dispose();
      m.geometry = new THREE.RingGeometry(inner, outer, 96);
      const opacity = 1.0 - k;
      (m.material as THREE.MeshBasicMaterial).color.copy(r.color);
      (m.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
    if (group.current) {
      meshes.forEach((m) => {
        if (!m.parent) group.current!.add(m);
      });
    }

    // 简易触发：RMS 上升沿时生成一两个环，避免未使用函数
    // 若无事件，可以保留轻触发
    const rms = audio?.rms ? audio.rms() : 0;
    if (prevRms.current < 0.22 && rms >= 0.22) {
      const midi = 60 + Math.floor(12 * (audio?.bands ? audio.bands()[1] : 0));
      const vel = Math.min(1, rms * 1.2);
      spawn(midi, vel);
    }
    prevRms.current = rms;
  });

  return <group ref={group} />;
}


