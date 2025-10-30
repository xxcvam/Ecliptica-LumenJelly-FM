import { Slab } from '../blocks/Slab';
import { LightPanel } from '../blocks/LightPanel';
import { VolCone } from '../blocks/VolCone';
import type { ControlResources } from '../core/resources';
import type { ControlStore } from '../core/store';
import type { AudioBus } from '../../registry';

interface AtriumProps {
  res: ControlResources;
  quality: ControlStore['quality'];
  audio: AudioBus;
}

export function Atrium({ res, quality }: AtriumProps) {
  const lowQuality = quality === 'low';
  const mediumQuality = quality === 'auto';

  return (
    <group>
      {/* 地面平台 */}
      <Slab width={25} depth={25} material={res.concreteMat} />

      {/* 悬浮光带 - 取代旧柱阵，成本更低 */}
      {!lowQuality && (
        <group position={[0, 0.4, -3.2]}>
          <mesh>
            <torusGeometry args={[5.2, 0.05, 10, 64]} />
            <meshStandardMaterial
              color="#1c2840"
              metalness={0.4}
              roughness={0.65}
              emissive="#325dd4"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      )}

      {/* 主光源面板 - 更冷的蓝色调 */}
      <LightPanel width={10} height={5} position={[0, 2.5, -4]} color="#4080D0" intensity={3.5} />

      {/* 体积光 - 低质量模式减少数量 */}
      {!lowQuality && (
        <>
          <VolCone position={[-2.5, 5.5, 1]} opacity={0.08} color="#3060B8" radius={1.2} height={5.5} />
          <VolCone position={[2.8, 6, -1]} opacity={0.06} color="#4070C0" radius={1.0} height={6} />
        </>
      )}
      {lowQuality && (
        <VolCone position={[0, 4.8, -1]} opacity={0.04} color="#2a4c90" radius={1.0} height={5.0} />
      )}

      {/* 侧补光 - 柔和的蓝紫色 */}
      {!lowQuality && (
        <>
          <spotLight intensity={0.6} angle={0.4} penumbra={1} color="#6080D0" position={[4, 2, 3]} castShadow={false} />
          <spotLight intensity={0.4} angle={0.35} penumbra={1} color="#5070C8" position={[-3, 2.5, 2]} castShadow={false} />
        </>
      )}
      {lowQuality && (
        <spotLight intensity={0.35} angle={0.42} penumbra={1} color="#4a6cb5" position={[3, 2.2, 2]} castShadow={false} />
      )}

      {/* 环境光 - 更暗、更蓝 */}
      <ambientLight intensity={mediumQuality ? 0.1 : 0.08} color="#2050A0" />
    </group>
  );
}
