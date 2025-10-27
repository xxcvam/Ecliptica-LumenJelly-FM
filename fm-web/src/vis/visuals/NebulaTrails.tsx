import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Points } from 'three';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import type { VisualProps } from '../registry';

/* ---------- GLSL ---------- */
const VERT = /* glsl */`
attribute vec3 a_base;
attribute float a_seed;
uniform float u_time;
uniform float u_speed;
uniform float u_swirl;
uniform float u_spread;
uniform float u_rms;
uniform vec3  u_bands;
uniform float u_size;

varying float v_bright;
varying float v_arm;
varying float v_spark;

float hash(float n){ return fract(sin(n)*43758.5453123); }

void main(){
  float t = u_time*u_speed + a_seed*10.0;

  // 极坐标旋臂：a_base.xy 是初始半径与角度编码
  float r = length(a_base.xy);
  float theta = atan(a_base.y, a_base.x);

  // 让旋臂随半径扭转（u_swirl + 音频叠加）
  theta += r * (u_swirl + u_bands.y*0.8);

  // 涡流扰动（和 mid/low 绑定）
  float wob = sin(t*0.7 + r*2.1) * (0.05 + u_bands.y*0.15)
            + cos(t*0.9 + theta*3.3) * (0.05 + u_bands.x*0.12);

  r += wob + u_spread*(0.2+u_bands.x*0.3);

  vec3 p = vec3(r*cos(theta), r*sin(theta), 0.0);

  // 轻微 3D 漂移
  p.z += sin(t*1.3 + r*1.7)*0.35;

  // 亮度/闪烁：high 提升亮度，seed 做随机相位
  float blink = smoothstep(0.0, 1.0, sin(t*3.0 + a_seed*12.0)*0.5 + 0.5);
  v_bright = 0.4 + u_bands.z*0.9 + blink*0.4;
  v_arm = r;
  v_spark = step(0.92, hash(a_seed + t*0.2 + u_bands.z*0.3));

  // 点尺寸：随 high & rms 稍微变大
  gl_PointSize = u_size * (1.0 + u_bands.z*0.7 + u_rms*0.8);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const FRAG = /* glsl */`
precision mediump float;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_glow;
uniform float u_bgFade;

varying float v_bright;
varying float v_arm;
varying float v_spark;

void main(){
  // 软圆点
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.18, 0.0, d);

  // 颜色沿"旋臂半径"渐变
  float mixK = clamp(v_arm*0.25, 0.0, 1.0);
  vec3 col = mix(u_colorB, u_colorA, mixK);

  // 亮度与"火花"
  float glow = v_bright * (0.5 + u_glow*0.6) * core + soft*0.3;
  if(v_spark > 0.5) glow *= 1.6;

  // 背景淡化（让四周更融）
  float fade = mix(1.0, soft, u_bgFade);

  gl_FragColor = vec4(col*glow*fade, soft);
}
`;

/* ---------- 粒子系统 ---------- */
function GalaxyPoints({ audio, params }: VisualProps) {
  const pointsRef = useRef<Points>(null);

  const quality = params?.quality === 'low' ? 'low' : 'high';
  const COUNT = quality === 'low' ? 3500 : 9000;

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    // 两条旋臂分布
    for (let i = 0; i < COUNT; i++) {
      // 半径 0~1.6，角度 0~2PI，带两臂偏移
      const arm = i % 2 === 0 ? 0.0 : Math.PI;
      const r = Math.random() * 1.6 * (0.6 + Math.random() * 0.6);
      const th = Math.random() * Math.PI * 2.0 + arm + r * 0.9;
      pos[i * 3 + 0] = r * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(th);
      pos[i * 3 + 2] = 0.0;
      seed[i] = Math.random();
    }
    return { positions: pos, seeds: seed };
  }, [COUNT]);

  const uniforms = useMemo(() => {
    const cA = new Color((params?.colorA as string) ?? '#6ff');
    const cB = new Color((params?.colorB as string) ?? '#ff3aa9');
    return {
      u_time: { value: 0 },
      u_speed: { value: (params?.speed as number) ?? 0.8 },
      u_swirl: { value: (params?.swirl as number) ?? 1.2 },
      u_spread: { value: (params?.spread as number) ?? 0.2 },
      u_size: { value: quality === 'low' ? 2.0 : 3.0 },
      u_rms: { value: 0 },
      u_bands: { value: [0, 0, 0] as unknown as any },
      u_colorA: { value: cA },
      u_colorB: { value: cB },
      u_glow: { value: (params?.glow as number) ?? 1.0 },
      u_bgFade: { value: 0.2 }
    };
  }, [params, quality]);

  useFrame((state) => {
    const [low, mid, high] = audio.bands();
    uniforms.u_time.value = state.clock.elapsedTime;
    uniforms.u_rms.value = audio.rms();
    uniforms.u_speed.value = ((params?.speed as number) ?? 0.8) * (0.6 + mid * 0.9);
    uniforms.u_spread.value = ((params?.spread as number) ?? 0.2) * (0.8 + low * 0.6);
    (uniforms.u_bands.value as any).set(low, mid, high);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-a_base" args={[positions, 3]} />
        <bufferAttribute attach="attributes-a_seed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        depthWrite={false}
        transparent
        blending={3}
      />
    </points>
  );
}

/* ---------- 背景渐变 ---------- */
function GradientBg() {
  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[4, 2.4]} />
      <shaderMaterial
        fragmentShader={`
          precision mediump float;
          varying vec2 vUv;
          void main(){
            vec2 uv = vUv;
            vec3 top = vec3(0.03,0.02,0.08);
            vec3 bottom = vec3(0.20,0.02,0.08);
            vec3 col = mix(bottom, top, smoothstep(0.0,1.0,uv.y));
            gl_FragColor = vec4(col,1.0);
          }
        `}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/* ---------- 入口可视 ---------- */
export default function NebulaTrailsVisual({ audio, params }: VisualProps) {
  const lowQ = params?.quality === 'low';
  return (
    <Canvas orthographic dpr={lowQ ? [1, 1] : [1, 1.5]} camera={{ zoom: 200 }}>
      <color attach="background" args={['#07060a']} />
      <GradientBg />
      <GalaxyPoints audio={audio} params={params} />
      {!lowQ && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.6} luminanceThreshold={0.1} luminanceSmoothing={0.3} />
          <Vignette eskil={false} offset={0.2} darkness={0.9} />
          <Noise opacity={0.03} premultiply />
        </EffectComposer>
      )}
    </Canvas>
  );
}

