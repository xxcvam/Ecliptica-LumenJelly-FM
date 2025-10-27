import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VisualProps } from '../registry';

type ModelStageParams = {
  src?: string;
  quality?: 'high' | 'low';
  fallback?: boolean;
};

// Fallback 组件：当模型加载失败时显示
function ModelFallback({ audio }: VisualProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const [low, mid] = audio.bands();
    const rms = audio.rms();
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * (0.4 + mid * 0.8);
      meshRef.current.position.y = Math.sin(performance.now() * 0.001) * 0.05 * (0.6 + low);
      const scale = 0.95 + rms * 0.12;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        color="#78d0ff"
        emissive="#bfa8ff"
        emissiveIntensity={0.3 + audio.rms() * 0.5}
        metalness={0.7}
        roughness={0.2}
      />
    </mesh>
  );
}

// 加载状态指示器
function LoadingIndicator({ audio }: VisualProps) {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial
        color="#66ccff"
        emissive="#ffd1f0"
        emissiveIntensity={0.5 + audio.rms() * 0.3}
      />
    </mesh>
  );
}

// 主模型加载组件
function ModelInner({ audio, params }: VisualProps) {
  const stageParams = params as ModelStageParams;
  const groupRef = useRef<THREE.Group>(null);
  const [error, setError] = useState(false);
  const [gltf, setGltf] = useState<THREE.Group | null>(null);

  const modelSrc = stageParams?.src || '/models/default/whale.glb';

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      modelSrc,
      (result) => {
        setGltf(result.scene);
      },
      undefined,
      (e) => {
        console.error('Model loading error:', e);
        setError(true);
      }
    );
  }, [modelSrc]);

  const model = useMemo(() => {
    if (!gltf || error) return null;

    const clone = gltf.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    clone.position.sub(center);
    const scale = 1.4 / maxAxis;
    clone.scale.setScalar(scale);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.Material & { envMapIntensity?: number };
        if (mat && 'envMapIntensity' in mat) {
          mat.envMapIntensity = 0.9;
        }
      }
    });
    return clone;
  }, [gltf, error]);

  useFrame((_, dt) => {
    const [low, mid] = audio.bands();
    const rms = audio.rms();
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * (0.4 + mid * 0.8);
      groupRef.current.position.y = Math.sin(performance.now() * 0.001) * 0.05 * (0.6 + low);
      const scale = 0.95 + rms * 0.12;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  // 如果出错且有 fallback，显示 fallback
  if (error && stageParams?.fallback) {
    return <ModelFallback audio={audio} params={params} />;
  }

  // 如果正在加载
  if (!model) {
    return <LoadingIndicator audio={audio} params={params} />;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

const ModelStageVisual = ({ audio, params }: VisualProps) => {
  const quality = (params as ModelStageParams)?.quality === 'low' ? 'low' : 'high';
  const cameraZ = quality === 'low' ? 3.2 : 2.5;
  const shadowMap = quality === 'low' ? 512 : 1024;

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.9, cameraZ], fov: 45 }}
      dpr={quality === 'low' ? [1, 1] : [1, 1.5]}
      gl={{ antialias: quality !== 'low' }}
    >
      <color attach="background" args={['#02060b']} />
      <ambientLight intensity={0.25 + audio.rms() * 0.4} />
      <directionalLight
        position={[2.5, 3.5, 1.5]}
        intensity={0.9 + audio.rms() * 0.7}
        castShadow
        shadow-mapSize-width={shadowMap}
        shadow-mapSize-height={shadowMap}
      />
      <Suspense fallback={<LoadingIndicator audio={audio} params={params} />}>
        <ModelInner audio={audio} params={params} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="#0a141d" roughness={0.95} metalness={0.05} />
        </mesh>
      </Suspense>
      <spotLight position={[-2, 3, -1]} intensity={0.5} angle={0.6} penumbra={0.4} />
    </Canvas>
  );
};

export default ModelStageVisual;
