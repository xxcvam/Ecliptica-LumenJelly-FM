import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { ShaderMaterial, Vector2, Vector3, Mesh } from 'three';
import fragmentShader from '../shaders/audioNebula.frag?raw';
import type { VisualProps } from '../registry';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function NebulaContent({ audio, params }: VisualProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_mouse: { value: new Vector2(0, 0) },
      u_resolution: { value: new Vector2(size.width, size.height) },
      u_rms: { value: audio.rms() },
      u_bands: { value: new Vector3(...audio.bands()) },
      u_fft: { value: audio.fftTexture },
      u_colorDeep: { value: new Vector3(0.035, 0.044, 0.102) },
      u_colorSurface: { value: new Vector3(0.148, 0.242, 0.448) },
      u_colorHighlight: { value: new Vector3(0.82, 0.92, 1.0) }
    }),
    [audio]
  );

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.set(viewport.width, viewport.height, 1);
  }, [viewport.width, viewport.height]);

  useEffect(() => {
    uniforms.u_resolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useEffect(() => {
    if (!materialRef.current) return;
    const tint = params?.tint as string | undefined;
    if (tint) {
      const color = new Vector3();
      color.setScalar(0);
      const temp = new Vector3();
      temp.setScalar(0);
      const hex = new Vector3();
      const parsed = parseInt(tint.replace('#', ''), 16);
      if (!Number.isNaN(parsed)) {
        hex.set(
          ((parsed >> 16) & 0xff) / 255,
          ((parsed >> 8) & 0xff) / 255,
          (parsed & 0xff) / 255
        );
        materialRef.current.uniforms.u_colorSurface.value.copy(hex);
      }
    }
  }, [params, uniforms]);

  const mouseVec = useRef(new Vector2(0, 0));
  const handlePointerMove = useCallback((event: { uv?: { x: number; y: number } }) => {
    if (event.uv) {
      mouseVec.current.set(event.uv.x, event.uv.y);
    }
  }, []);

  useFrame((state) => {
    uniforms.u_time.value = state.clock.elapsedTime;
    uniforms.u_mouse.value.lerp(mouseVec.current, 0.15);
    uniforms.u_rms.value = audio.rms();
    uniforms.u_bands.value.set(...audio.bands());
  });

  return (
    <mesh ref={meshRef} onPointerMove={handlePointerMove}>
      <planeGeometry args={[2, 2, 1]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

const NebulaVisual = ({ audio, params }: VisualProps) => {
  const quality = params?.quality === 'low' ? 'low' : 'high';
  const dpr: [number, number] = quality === 'low' ? [1, 1] : [1, 1.5];
  return (
    <Canvas orthographic gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }} dpr={dpr}>
      <color attach="background" args={['#04060c']} />
      <NebulaContent audio={audio} params={params} />
    </Canvas>
  );
};

export default NebulaVisual;
