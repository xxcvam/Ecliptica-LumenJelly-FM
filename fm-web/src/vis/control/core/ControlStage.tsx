import { type ReactNode, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useControlStore, type ControlStore } from './store';
import { useControlResources } from './resources';
import { CameraChoreo } from './choreo';
import { PostFX } from './postfx';
import { Atrium } from '../scenes/Atrium';
import { VoidScene } from '../scenes/Void';
import type { AudioBus } from '../../registry';

interface ControlStageProps {
  variant?: 'atrium' | 'red_room' | 'void';
  audio: AudioBus;
  children?: ReactNode;
}

type VariantConfig = {
  background: string;
  fogColor: string;
  environment: EnvironmentPreset;
  environmentFiles?: string;
  toneMappingExposure: number;
  dpr: [number, number];
  initialFogDensity: number;
  initialLight: { intensity: number; color: string };
  cameraPosition: [number, number, number];
  initialQuality: ControlStore['quality'];
  accentLight: number;
};

type EnvironmentPreset =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse';

const VARIANT_CONFIG: Record<string, VariantConfig> = {
  atrium: {
    background: '#020508',
    fogColor: '#0a1520',
    environment: 'warehouse',
    environmentFiles: undefined,
    toneMappingExposure: 0.7,
    dpr: [1, 2],
    initialFogDensity: 0.085,
    initialLight: { intensity: 3.5, color: '#4080D0' },
    cameraPosition: [0, 1.2, 8],
    initialQuality: 'high',
    accentLight: 0
  },
  void: {
    background: '#03060f',
    fogColor: '#071326',
    environment: 'night',
    environmentFiles: '/models/jellyfish/hangar_interior_1k.hdr',
    toneMappingExposure: 0.72,
    dpr: [1, 1.8],
    initialFogDensity: 0.11,
    initialLight: { intensity: 2.4, color: '#2940FF' },
    cameraPosition: [0, 1.8, 12],
    initialQuality: 'low',
    accentLight: 1.6
  }
};

function SceneSwitch({
  variant,
  res,
  quality,
  audio
}: {
  variant: string;
  res: ReturnType<typeof useControlResources>;
  quality: ControlStore['quality'];
  audio: AudioBus;
}) {
  switch (variant) {
    case 'atrium':
      return <Atrium res={res} quality={quality} audio={audio} />;
    case 'void':
      return <VoidScene res={res} quality={quality} audio={audio} />;
    // 未来可扩展其他场景
    case 'red_room':
      return null; // TODO
    default:
      return <Atrium res={res} quality={quality} audio={audio} />;
  }
}

function GroundMirror({ material }: { material: THREE.Material }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.51, 0]}>
      <planeGeometry args={[40, 40]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export function ControlStage({ variant = 'atrium', audio, children }: ControlStageProps) {
  const res = useControlResources();
  const store = useControlStore();
  const setLight = useControlStore((state) => state.setLight);
  const setFogDensity = useControlStore((state) => state.setFogDensity);
  const setQuality = useControlStore((state) => state.setQuality);
  const quality = useControlStore((state) => state.quality);

  const config = useMemo(() => VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.atrium, [variant]);

  useEffect(() => {
    setFogDensity(config.initialFogDensity);
    setLight(config.initialLight);
    if (quality !== config.initialQuality) {
      setQuality(config.initialQuality);
    }
  }, [config, quality, setFogDensity, setLight, setQuality]);

  return (
    <Canvas
      dpr={config.dpr}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: config.toneMappingExposure // 不同场景下设置基础曝光
      }}
      camera={{ fov: 35, near: 0.1, far: 80, position: config.cameraPosition }}
    >
      {/* 背景色 - 深邃的深海蓝黑 */}
      <color attach="background" args={[config.background]} />

      {/* 指数雾 - 深蓝色调，营造水下氛围 */}
      <fogExp2 attach="fog" args={[config.fogColor, store.fogDensity]} />

      {/* HDR 环境 - 使用 drei 内置预设 */}
      {config.environmentFiles ? (
        <Environment files={config.environmentFiles} background={false} />
      ) : (
        <Environment preset={config.environment ?? 'warehouse'} background={false} />
      )}

      {/* 反射地面 */}
      <GroundMirror material={res.groundMat} />

      {/* 场景切换器 */}
      <SceneSwitch variant={variant} res={res} quality={quality} audio={audio} />

      {/* 子元素（如 JellySchool）*/}
      {children}

      {/* 后期处理 */}
      <PostFX />

      {/* 相机编舞 */}
      <CameraChoreo audio={audio} variant={variant} />
    </Canvas>
  );
}
