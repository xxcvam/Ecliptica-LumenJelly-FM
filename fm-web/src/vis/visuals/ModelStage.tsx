import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, ContactShadows } from '@react-three/drei';
import type { VisualProps } from '../registry';

type ModelStageParams = {
  src?: string;
  quality?: 'high' | 'low';
  fallback?: boolean;
  style?: 'wire' | 'matcap' | 'pbr';
  lineColor?: string;
  fillColor?: string;
  env?: 'studio' | 'sunset';
  scale?: number;
};

function MinimalBackdrop() {
  return (
    <group position={[0, 0, -2]} renderOrder={-10}>
      {/* 渐变背景面 */}
      <mesh renderOrder={-10}>
        <planeGeometry args={[12, 7]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={`
            precision mediump float;
            varying vec2 vUv;
            void main(){
              vec2 uv = vUv - 0.5;
              float r = length(uv * vec2(1.6, 1.0));
              vec3 c1 = vec3(0.06);
              vec3 c2 = vec3(0.15);
              vec3 col = mix(c2, c1, smoothstep(0.0, 1.0, r));
              gl_FragColor = vec4(col, 1.0);
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

      {/* 竖线：手动渲染而不是 JSX */}
      <group></group>

      {/* 日落圆盘 */}
      <SunDisc radius={1.3} ringColor="#e6e6e6" fill="#1a1a1a" />
    </group>
  );
}

function SunDisc({ radius, ringColor, fill }: { radius: number; ringColor: string; fill: string }) {
  return (
    <group position={[2.0, -0.2, 0]} renderOrder={-8}>
      <mesh>
        <circleGeometry args={[radius, 64]} />
        <meshBasicMaterial color={fill} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 1.01, radius * 1.07, 128]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>
    </group>
  );
}

function ModelInner({ audio, params }: VisualProps) {
  const stageParams = params as ModelStageParams;
  const groupRef = useRef<THREE.Group>(null);
  const [error, setError] = useState(false);
  const [gltf, setGltf] = useState<THREE.Group | null>(null);

  const modelSrc = stageParams?.src || '/models/default/whale.glb';
  const style = stageParams?.style ?? 'wire';
  const lineColor = new THREE.Color(stageParams?.lineColor ?? '#e6e6e6');
  const fillColor = new THREE.Color(stageParams?.fillColor ?? '#111111');

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

  useEffect(() => {
    if (!gltf || error) return;

    gltf.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      if (style === 'wire') {
        mesh.material = new THREE.MeshBasicMaterial({
          color: fillColor,
          transparent: true,
          opacity: 0.95
        });

        const edges = new THREE.EdgesGeometry(mesh.geometry, 35);
        const lines = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: 0.9,
            linewidth: 1
          })
        );
        mesh.add(lines);
      } else if (style === 'matcap') {
        mesh.material = new THREE.MeshMatcapMaterial({
          color: '#dcdcdc'
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#cccccc',
          roughness: 0.35,
          metalness: 0.0
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [gltf, error, style, lineColor, fillColor]);

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
        const m = obj as THREE.Mesh;
        m.castShadow = style === 'pbr';
        m.receiveShadow = style === 'pbr';
        const mat = m.material as THREE.Material & { envMapIntensity?: number };
        if (mat && 'envMapIntensity' in mat) {
          mat.envMapIntensity = 0.9;
        }
      }
    });
    return clone;
  }, [gltf, error, style]);

  useFrame((_, dt) => {
    const [low, mid] = audio.bands();
    const rms = audio.rms();
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.25 * (0.6 + mid);
      groupRef.current.position.y = Math.sin(performance.now() * 0.001) * 0.03 * (0.5 + low);
      const scale = (stageParams?.scale ?? 1.0) * (0.98 + rms * 0.06);
      groupRef.current.scale.setScalar(scale);
    }
  });

  if (error && stageParams?.fallback) {
    return <mesh></mesh>;
  }

  if (!model) {
    return <mesh></mesh>;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

const ModelStageVisual = ({ audio, params }: VisualProps) => {
  const stageParams = params as ModelStageParams;
  const quality = stageParams?.quality === 'low' ? 'low' : 'high';
  const cameraZ = quality === 'low' ? 3.2 : 2.5;
  const shadowMap = quality === 'low' ? 512 : 1024;
  const style = stageParams?.style ?? 'wire';

  return (
    <Canvas camera={{ position: [0, 0.9, cameraZ], fov: 45 }} dpr={quality === 'low' ? [1, 1] : [1, 1.5]} gl={{ antialias: quality !== 'low' }}>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={style === 'pbr' ? 0.25 + audio.rms() * 0.4 : 0} />
      <directionalLight position={[2.5, 3.5, 1.5]} intensity={style === 'pbr' ? 0.9 + audio.rms() * 0.7 : 0} castShadow={style === 'pbr'} shadow-mapSize-width={shadowMap} shadow-mapSize-height={shadowMap} />

      <Suspense fallback={null}>
        <MinimalBackdrop />
        <ModelInner audio={audio} params={params} />
        {style === 'pbr' && (
          <>
            <Environment preset={stageParams?.env || 'studio'} />
            <ContactShadows position={[0, -1.05, 0]} blur={2} opacity={0.35} scale={5} receiveShadow />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
              <planeGeometry args={[6, 6]} />
              <meshStandardMaterial color="#0a141d" roughness={0.95} metalness={0.05} />
            </mesh>
          </>
        )}
      </Suspense>

      {style === 'pbr' && <spotLight position={[-2, 3, -1]} intensity={0.5} angle={0.6} penumbra={0.4} />}
    </Canvas>
  );
};

export default ModelStageVisual;
