import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color, Vector2, Vector3 } from 'three';
import type { VisualProps } from '../registry';

const fragmentShader = /* glsl */ `
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rms;
uniform vec3 u_bands;
uniform vec3 u_color;
uniform float u_grid;
uniform float u_glow;
uniform float u_scanline;
uniform float u_trail;
uniform float u_vignette;

float line(vec2 uv, float offset) {
  float f = abs(fract(uv.x + offset) - 0.5);
  return smoothstep(0.0, 0.02 + u_grid * 0.05, f);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv -= 0.5;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);
  float time = u_time * (0.5 + u_bands.x * 1.5);

  vec2 grid = uv * (6.0 + u_grid * 6.0);
  float horizontal = line(grid, 0.0);
  float vertical = line(grid.yx, 0.0);

  float scan = sin((uv.y + time * 0.2) * 40.0) * 0.5 + 0.5;
  float pulse = sin(time * 3.0 + uv.x * 4.0) * 0.5 + 0.5;
  float glow = pow(horizontal * vertical, 0.8);

  vec3 base = u_color * (0.4 + u_rms * 1.2);
  vec3 color = base;
  color += vec3(0.1, 0.2, 0.4) * scan * u_glow * u_scanline;
  color += vec3(0.05, 0.1, 0.2) * pulse * u_glow * u_trail;
  color += glow * vec3(0.5, 0.7, 1.0);

  float vignette = smoothstep(0.9, 0.2, length(uv) + u_rms * 0.1) * u_vignette;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function NeonPlane({ audio, params }: VisualProps) {
  const uniforms = useMemo(() => {
    const colorHex = (params?.color as string | undefined)?.replace('#', '') ?? '00bfff';
    const color = new Color(`#${colorHex}`);
    return {
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(1, 1) },
      u_rms: { value: audio.rms() },
      u_bands: { value: new Vector3(...audio.bands()) },
      u_color: { value: new Vector3(color.r, color.g, color.b) },
      u_grid: { value: typeof params?.grid === 'number' ? params!.grid : 0.8 },
      u_glow: { value: typeof params?.glow === 'number' ? params!.glow : 1.0 },
      u_scanline: { value: typeof params?.scanline === 'number' ? params!.scanline : 0.5 },
      u_trail: { value: typeof params?.trail === 'number' ? params!.trail : 0.5 },
      u_vignette: { value: typeof params?.vignette === 'number' ? params!.vignette : 1.0 }
    };
  }, [audio, params]);

  useFrame((state) => {
    uniforms.u_time.value = state.clock.elapsedTime;
    uniforms.u_rms.value = audio.rms();
    uniforms.u_bands.value.set(...audio.bands());
  });

  const shaderMaterial = useMemo(
    () => (
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    ),
    [uniforms]
  );

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {shaderMaterial}
    </mesh>
  );
}

const NeonGridVisual = ({ audio, params }: VisualProps) => {
  const quality = params?.quality === 'low' ? 'low' : 'high';
  return (
    <Canvas orthographic dpr={quality === 'low' ? [1, 1] : [1, 1.5]} gl={{ antialias: quality !== 'low' }}>
      <color attach="background" args={['#020407']} />
      <NeonPlane audio={audio} params={params} />
    </Canvas>
  );
};

export default NeonGridVisual;
