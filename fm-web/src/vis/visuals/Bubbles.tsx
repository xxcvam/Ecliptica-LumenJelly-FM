import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D, Vector3 } from 'three';
import type { VisualProps } from '../registry';

const tempObject = new Object3D();
const tempColor = new Color();

const count = 200;

function BubblesContent({ audio, params }: VisualProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const quality = params?.quality === 'low' ? 'low' : 'high';
  const popRate = typeof params?.popRate === 'number' ? params!.popRate : 0.4;
  const sizeRange = params?.size as [number, number] | undefined;
  const positionArray = useMemo(
    () =>
      Array.from({ length: count }, () =>
        new Vector3((Math.random() - 0.5) * 4, Math.random() * 4 - 2, (Math.random() - 0.5) * 2)
      ),
    []
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const [, mid, high] = audio.bands();
    const rms = audio.rms();
    const rise = 0.35 + high * 2.2;
    const jitter = 0.4 + mid * 1.6;
    const activeCount = quality === 'low' ? Math.floor(count * 0.6) : count;

    positionArray.forEach((pos, i) => {
      if (i >= activeCount) {
        tempObject.position.set(999, 999, 999);
        tempObject.scale.setScalar(0);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        return;
      }
      pos.y += rise * delta;
      pos.x += Math.sin((pos.y + i) * 1.2) * jitter * 0.01;
      pos.z += Math.cos((pos.x + i) * 0.7) * jitter * 0.005;
      if (pos.y > 2) {
        pos.y = -2 - Math.random() * (0.5 + popRate);
        pos.x = (Math.random() - 0.5) * 4;
        pos.z = (Math.random() - 0.5) * 2;
      }
      tempObject.position.copy(pos);
      const minSize = sizeRange ? sizeRange[0] : 0.08;
      const maxSize = sizeRange ? sizeRange[1] : 0.18;
      const scale = minSize + (maxSize - minSize) * Math.random() + rms * 0.2;
      tempObject.scale.setScalar(scale);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      tempColor.setHSL(0.56, 0.6, 0.6 + high * 0.25);
      meshRef.current!.setColorAt(i, tempColor);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial transparent opacity={0.6} roughness={0.1} metalness={0.2} />
    </instancedMesh>
  );
}

const BubblesVisual = ({ audio, params }: VisualProps) => {
  const quality = params?.quality === 'low' ? 'low' : 'high';
  return (
    <Canvas camera={{ position: [0, 0, quality === 'low' ? 6 : 5], fov: 50 }} dpr={quality === 'low' ? [1, 1] : [1, 1.5]}>
      <color attach="background" args={['#031422']} />
      <ambientLight intensity={0.3 + audio.rms()} />
      <directionalLight position={[5, 5, 5]} intensity={quality === 'low' ? 0.4 : 0.65} />
      <BubblesContent audio={audio} params={params} />
    </Canvas>
  );
};

export default BubblesVisual;
