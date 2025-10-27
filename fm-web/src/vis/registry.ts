import type { ComponentType } from 'react';
import type { DataTexture } from 'three';

export type AudioBus = {
  rms: () => number;
  bands: () => [number, number, number];
  fftTexture: DataTexture;
  bpm: () => number;
};

export type VisualProps = {
  audio: AudioBus;
  params?: Record<string, unknown>;
};

type VisualFactory = () => Promise<ComponentType<VisualProps>>;

export const VisualRegistry: Record<string, VisualFactory> = {
  nebula: () => import('./visuals/Nebula').then((m) => m.default),
  bubbles: () => import('./visuals/Bubbles').then((m) => m.default),
  neon: () => import('./visuals/NeonGrid').then((m) => m.default),
  caustic: () => import('./visuals/CausticSea').then((m) => m.default),
  jelly: () => import('./visuals/Jelly').then((m) => m.default),
  model: () => import('./visuals/ModelStage').then((m) => m.default)
};

export type VisualID = keyof typeof VisualRegistry;
