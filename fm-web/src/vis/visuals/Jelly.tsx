import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { VisualProps } from '../registry';

type JellyParams = {
  tails?: number;
  wobble?: number;
  colorA?: string;
  colorB?: string;
  body?: string;
  quality?: 'high' | 'low';
};

const stripVertex = /* glsl */`
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_wobble;
  void main(){
    vUv = uv;
    vec3 p = position;
    float a = (uv.y * 6.28318) + u_time * 0.8;
    float falloff = 1.0 - uv.y;
    p.x += sin(a) * 0.06 * u_wobble * falloff;
    p.z += cos(a * 0.9) * 0.04 * u_wobble * falloff;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const stripFragment = /* glsl */`
  precision mediump float;
  varying vec2 vUv;
  uniform float u_emissive;
  uniform vec3  u_colorA;
  uniform vec3  u_colorB;
  void main(){
    float edge = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    float grad = smoothstep(0.0, 1.0, vUv.y);
    vec3 col = mix(u_colorA, u_colorB, grad);
    col *= edge * (0.6 + u_emissive * 1.4);
    gl_FragColor = vec4(col, edge);
  }
`;

function JellyBody({ audio, params }: VisualProps) {
  const group = useRef<THREE.Group>(null);
  const stripMaterial = useRef<THREE.ShaderMaterial>(null);

  const jellyParams = (params || {}) as JellyParams;
  const strips = typeof jellyParams.tails === 'number' ? Math.max(3, Math.round(jellyParams.tails)) : 6;

  const stripGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.2, 1.6, 1, 48);
    g.translate(0, -0.8, 0);
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_wobble: { value: jellyParams.wobble ?? 0.3 },
      u_emissive: { value: 0 },
      u_colorA: { value: new THREE.Color((jellyParams.colorA as THREE.ColorRepresentation) || '#78d0ff') },
      u_colorB: { value: new THREE.Color((jellyParams.colorB as THREE.ColorRepresentation) || '#bfa8ff') }
    }),
    [jellyParams]
  );

  useFrame((_, dt) => {
    uniforms.u_time.value += dt;
    const [low, mid, high] = audio.bands();
    const rms = audio.rms();
    uniforms.u_wobble.value = THREE.MathUtils.lerp(uniforms.u_wobble.value, 0.2 + 0.6 * mid, 0.1);
    uniforms.u_emissive.value = 0.2 + rms * 1.2 + high * 0.4;
    if (group.current) {
      group.current.position.y = Math.sin(uniforms.u_time.value * 0.6) * 0.05 * (0.6 + low);
    }
  });

  const quality = jellyParams.quality === 'low' ? 'low' : 'high';

  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]} scale={quality === 'low' ? 0.85 : 1}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshBasicMaterial
          color={(jellyParams.body as THREE.ColorRepresentation) || '#9ee'}
          transparent
          opacity={0.55}
        />
      </mesh>
      {Array.from({ length: strips }).map((_, i) => (
        <mesh
          key={i}
          geometry={stripGeometry}
          position={[Math.sin(i) * 0.22, -0.1, Math.cos(i) * 0.22]}
          rotation={[0, (i / strips) * Math.PI * 2, 0]}
        >
          <shaderMaterial
            ref={stripMaterial}
            vertexShader={stripVertex}
            fragmentShader={stripFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

const JellyVisual = ({ audio, params }: VisualProps) => {
  const jellyParams = (params || {}) as JellyParams;
  const quality = jellyParams.quality === 'low' ? 'low' : 'high';
  return (
    <Canvas camera={{ position: [0, 0.6, 2.2], fov: 45 }} dpr={quality === 'low' ? [1, 1] : [1, 1.5]}>
      <color attach="background" args={['#031119']} />
      <ambientLight intensity={quality === 'low' ? 0.25 : 0.4} />
      <directionalLight position={[1, 2.5, 1.5]} intensity={0.8} />
      <JellyBody audio={audio} params={jellyParams} />
    </Canvas>
  );
};

export default JellyVisual;
