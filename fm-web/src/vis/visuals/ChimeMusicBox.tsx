import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import NebulaTrails from './NebulaTrails';
import RingBursts from './RingBursts';
import KeyGrid from './KeyGrid';
import type { VisualProps } from '../registry';

export default function ChimeMusicBox({ audio, params }: VisualProps) {
  const quality = params?.quality === 'low' ? 'low' : 'high';
  const mergedNebulaParams = useMemo(() => ({
    colorA: params?.colorA ?? '#6ce6ff',
    colorB: params?.colorB ?? '#ff3aa9',
    speed: params?.speed ?? 0.9,
    swirl: params?.swirl ?? 1.2,
    spread: params?.spread ?? 0.22,
    glow: params?.glow ?? 1.0,
    quality
  }), [params, quality]);

  return (
    <Canvas orthographic dpr={quality === 'low' ? [1, 1] : [1, 1.5]} camera={{ zoom: 200 }} gl={{ antialias: quality !== 'low' }}>
      <Suspense fallback={null}>
        <NebulaTrails audio={audio} params={mergedNebulaParams} />
        <RingBursts audio={audio} params={params} />
        <KeyGrid audio={audio} params={params} />
      </Suspense>
    </Canvas>
  );
}
