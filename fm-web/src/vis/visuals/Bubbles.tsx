import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D, Vector3, DynamicDrawUsage } from 'three';
import type { VisualProps } from '../registry';
import { Environment, Sparkles } from '@react-three/drei';

const tempObject = new Object3D();
const tempColor = new Color();
const COUNT = 240;

function BubblesContent({ audio, params }: VisualProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const quality = params?.quality === 'low' ? 'low' : 'high';
  const popRate = typeof params?.popRate === 'number' ? params!.popRate : 0.4;
  const sizeRange = (params?.size as [number, number]) || [0.07, 0.16];

  // 预生成种子，避免每帧随机导致抖动脏感
  const seeds = useMemo(
    () => Array.from({ length: COUNT }, () => Math.random() * 1000),
    []
  );

  const posArray = useMemo(
    () =>
      Array.from({ length: COUNT }, () =>
        new Vector3((Math.random() - 0.5) * 4, Math.random() * 4 - 2, (Math.random() - 0.5) * 2)
      ),
    []
  );

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const [, mid, high] = audio.bands();
    const rms = audio.rms();
    const rise = 0.35 + high * 2.0;
    const jitter = 0.35 + mid * 1.4;
    const active = quality === 'low' ? Math.floor(COUNT * 0.6) : COUNT;

    for (let i = 0; i < COUNT; i++) {
      if (i >= active) {
        tempObject.position.set(999, 999, 999);
        tempObject.scale.setScalar(0);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
        continue;
      }

      const pos = posArray[i];
      const seed = seeds[i];

      // 上升 + 轻微"流体"扰动（随 y 变化，避免同频摆）
      pos.y += rise * dt;
      pos.x += Math.sin((pos.y + seed) * 1.1) * jitter * 0.012;
      pos.z += Math.cos((pos.y * 0.8 + seed) * 0.9) * jitter * 0.008;

      // 抵达顶部 → 重新生成，带"爆裂"概率
      if (pos.y > 2) {
        const willPop = Math.random() < (0.15 + popRate * (0.3 + high * 0.7));
        if (willPop) {
          // 简化版"爆裂"：快速缩放为 0 再重生（材质是统一透明，逐实例的透明需自定义着色器）
          tempObject.position.copy(pos);
          tempObject.scale.setScalar(0.001);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        // 重生
        pos.y = -2 - Math.random() * (0.5 + popRate);
        pos.x = (Math.random() - 0.5) * 4;
        pos.z = (Math.random() - 0.5) * 2;
      }

      // 尺寸：基础范围 + RMS 轻微膨胀
      const minS = sizeRange[0], maxS = sizeRange[1];
      const baseS = minS + (maxS - minS) * ((seed % 1));
      const scale = baseS + rms * 0.18;

      tempObject.position.copy(pos);
      tempObject.scale.setScalar(scale);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      // 色彩：高频越强越偏亮（HSL）
      tempColor.setHSL(0.56 + high * 0.05, 0.6, 0.55 + high * 0.3);
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    // 将音频特征映射到物理材质的"薄膜虹彩"
    const m = meshRef.current.material;
    if (m && 'isMeshPhysicalMaterial' in m && (m as any).isMeshPhysicalMaterial) {
      // 高频让虹彩厚度/变化更明显
      (m as any).iridescenceThicknessRange = [120 + high * 200, 480 + high * 400];
      // RMS 让整体透光更亮（感觉更"湿"）
      (m as any).transmission = 0.9 + Math.min(0.09, rms * 0.2);
      (m as any).needsUpdate = false;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, COUNT]}>
      <sphereGeometry args={[1, 24, 24]} />
      {/* 关键：物理玻璃 + 虹彩薄膜 + 顶层清漆；需要 scene.environment */}
      <meshPhysicalMaterial
        transparent
        vertexColors
        roughness={0.02}
        metalness={0.0}
        clearcoat={1}
        clearcoatRoughness={0.02}
        transmission={0.95}
        ior={1.33}
        thickness={0.02}
        attenuationColor={'#a8d8ff'}
        attenuationDistance={2.5}
        iridescence={0.9}
        iridescenceIOR={1.0}
        iridescenceThicknessRange={[180, 520]}
      />
    </instancedMesh>
  );
}

const Backdrop = () => (
  <mesh position={[0, 0, -3]}>
    <planeGeometry args={[10, 6]} />
    {/* 简易渐变背景（在片元里做径向渐变） */}
    <shaderMaterial
      transparent
      fragmentShader={`
        precision mediump float;
        varying vec2 vUv;
        void main(){
          vec2 uv = vUv - 0.5;
          float r = length(uv * vec2(1.6,1.0));
          vec3 c1 = vec3(0.01,0.07,0.13);
          vec3 c2 = vec3(0.05,0.12,0.22);
          vec3 col = mix(c2, c1, smoothstep(0.0,1.0,r));
          gl_FragColor = vec4(col,1.0);
        }
      `}
      vertexShader={`
        varying vec2 vUv; 
        void main(){ 
          vUv=uv; 
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
        } 
      `}
    />
  </mesh>
);

const BubblesVisual = ({ audio, params }: VisualProps) => {
  const lowQ = params?.quality === 'low';
  return (
    <Canvas
      camera={{ position: [0, 0, lowQ ? 6 : 5], fov: 50 }}
      dpr={lowQ ? [1, 1] : [1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      {/* 场景雾：柔化边缘 */}
      <fog attach="fog" args={['#061426', 6, 14]} />
      <ambientLight intensity={0.25 + audio.rms() * 0.5} />
      <directionalLight position={[5, 5, 5]} intensity={lowQ ? 0.35 : 0.6} />

      {/* IBL：物理玻璃必备 */}
      <Environment preset="city" />

      <Backdrop />
      <BubblesContent audio={audio} params={params} />

      {/* 可选：轻微星点，模拟爆裂后的小亮屑 */}
      {!lowQ && <Sparkles count={40} speed={1.5} size={2} scale={[6, 3, 1]} color="#a8d8ff" />}
    </Canvas>
  );
};

export default BubblesVisual;
