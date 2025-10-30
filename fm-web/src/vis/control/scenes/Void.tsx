import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Slab } from '../blocks/Slab';
import { VolCone } from '../blocks/VolCone';
import type { ControlResources } from '../core/resources';
import type { ControlStore } from '../core/store';
import type { AudioBus } from '../../registry';

const frameHelper = new THREE.Object3D();

function FrameTunnel({
  count,
  spacing,
  twist,
  width,
  height,
  thickness
}: {
  count: number;
  spacing: number;
  twist: number;
  width: number;
  height: number;
  thickness: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    const outer = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    outer.moveTo(-hw, -hh);
    outer.lineTo(hw, -hh);
    outer.lineTo(hw, hh);
    outer.lineTo(-hw, hh);
    outer.lineTo(-hw, -hh);

    const innerPadding = 0.9;
    const inner = new THREE.Path();
    inner.moveTo(-hw + innerPadding, -hh + innerPadding);
    inner.lineTo(-hw + innerPadding, hh - innerPadding);
    inner.lineTo(hw - innerPadding, hh - innerPadding);
    inner.lineTo(hw - innerPadding, -hh + innerPadding);
    inner.lineTo(-hw + innerPadding, -hh + innerPadding);
    outer.holes.push(inner);

    const extrude = new THREE.ExtrudeGeometry(outer, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 12,
      steps: 1
    });
    extrude.center();
    return extrude;
  }, [height, thickness, width]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#141c25',
        metalness: 0.22,
        roughness: 0.68,
        emissive: '#1a3552',
        emissiveIntensity: 0.28
      }),
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      frameHelper.position.set(0, 0, -i * spacing);
      frameHelper.rotation.set(0, 0, i * twist);
      frameHelper.updateMatrix();
      meshRef.current.setMatrixAt(i, frameHelper.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, spacing, twist]);

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

function WalkwayStacks({ levels, emissiveIntensity }: { levels: number; emissiveIntensity: number }) {
  const definitions = useMemo(() => {
    return Array.from({ length: levels }, (_, i) => {
      const sign = i % 2 === 0 ? 1 : -1;
      return {
        y: -1.2 + i * 0.85,
        z: -4 - i * 3.0,
        rotation: sign * 0.16 + i * 0.035,
        width: 11.5 + i * 0.6,
        depth: 2.4
      };
    });
  }, [levels]);

  return (
    <>
      {definitions.map(({ y, z, rotation, width, depth }, index) => (
        <group key={index} position={[0, y, z]} rotation={[0, rotation, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 0.3, depth]} />
            <meshStandardMaterial color="#0e141d" roughness={0.78} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.16, depth / 2 - 0.12]} castShadow>
            <boxGeometry args={[width, 0.08, 0.14]} />
            <meshStandardMaterial
              color="#ff2f5d"
              emissive="#ff466f"
              emissiveIntensity={emissiveIntensity}
              metalness={0.35}
              roughness={0.45}
            />
          </mesh>
          <mesh position={[0, 0.16, depth / 2 - 0.12]}>
            <boxGeometry args={[width * 1.02, 0.1, 0.2]} />
            <meshBasicMaterial
              color="#ff5478"
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function FloatingColumns({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const columns = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: [
          THREE.MathUtils.randFloatSpread(16),
          THREE.MathUtils.randFloat(1.5, 6.5),
          -6 - i * 2.8 + THREE.MathUtils.randFloatSpread(1.2)
        ],
        size: [
          THREE.MathUtils.randFloat(0.8, 1.6),
          THREE.MathUtils.randFloat(2.5, 5.2),
          THREE.MathUtils.randFloat(0.8, 1.6)
        ],
        rotationY: THREE.MathUtils.randFloatSpread(Math.PI)
      })),
    [count]
  );

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.05;
  });

  return (
    <group ref={groupRef}>
      {columns.map(({ position, size, rotationY }, idx) => (
        <mesh key={idx} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
          <boxGeometry args={size as [number, number, number]} />
          <meshStandardMaterial color="#0b121c" roughness={0.85} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function StarField({ count, radius }: { count: number; radius: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const r = radius * Math.pow(Math.random(), 0.4);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [count, radius]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#d2e8ff',
        size: 0.65,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.68
      }),
    []
  );

  useFrame((_, dt) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += dt * 0.03;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function MistSheets({ layers }: { layers: number }) {
  const sheets = useMemo(() => Array.from({ length: layers }, (_, i) => -6 - i * 4), [layers]);
  return (
    <>
      {sheets.map((z, idx) => (
        <mesh key={idx} position={[0, 0.55 + idx * 0.22, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[36, 36]} />
          <meshBasicMaterial color="#09111c" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

type VoidSceneProps = {
  res: ControlResources;
  quality: ControlStore['quality'];
  audio: AudioBus;
};

type JellyPart = {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
};

function createSeededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createColorFromHigh(baseHue: number, high: number) {
  const hue = THREE.MathUtils.clamp(baseHue + high * 0.08, 0.5, 0.75);
  const color = new THREE.Color();
  color.setHSL(hue, 0.68, 0.56 + high * 0.14);
  return color;
}

const MODEL_PATH = '/models/jellyfish/Box_optimized.glb';

function JellySwarm({
  audio,
  radius,
  density
}: {
  audio: AudioBus;
  radius: number;
  density: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const gltf = useGLTF(MODEL_PATH);

  const parts = useMemo<JellyPart[]>(() => {
    const meshes: JellyPart[] = [];
    const MODEL_SCALE = 1.8;
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry.clone();
        geometry.scale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        const material = new THREE.MeshPhysicalMaterial({
          color: '#223b6d',
          metalness: 0.38,
          roughness: 0.35,
          clearcoat: 0.65,
          clearcoatRoughness: 0.25,
          transmission: 0.12,
          thickness: 0.45,
          emissive: '#3d4cff',
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.92
        });
        meshes.push({ geometry, material });
      }
    });
    return meshes;
  }, [gltf]);

  const { selectedParts, placements } = useMemo(() => {
    if (parts.length === 0) {
      return { selectedParts: [] as JellyPart[], placements: [] as Array<{
        base: THREE.Vector3;
        phase: number;
        speed: number;
        sway: number;
      }> };
    }
    const rand = createSeededRandom(1337 + parts.length);
    const indices = parts.map((_, idx) => idx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const MAX_PARTS = 48;
    const limit = Math.max(
      1,
      Math.min(parts.length, Math.floor(parts.length * density), MAX_PARTS)
    );
    const chosen = indices.slice(0, limit);
    const placements = chosen.map(() => {
      const base = new THREE.Vector3(
        (rand() - 0.5) * radius,
        rand() * 1.6 + 0.2,
        -7 + (rand() - 0.5) * radius * 0.9
      );
      return {
        base,
        phase: rand() * Math.PI * 2,
        speed: 0.45 + rand() * 0.55,
        sway: 0.35 + rand() * 0.55
      };
    });
    return {
      selectedParts: chosen.map((idx) => parts[idx]),
      placements
    };
  }, [parts, radius, density]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const [low, , high] = audio.bands();
    const rms = audio.rms();
    timeRef.current += dt;

    for (let i = 0; i < selectedParts.length; i++) {
      const mesh = groupRef.current.children[i] as THREE.Mesh | undefined;
      const part = selectedParts[i];
      const placement = placements[i];
      if (!mesh || !part || !placement) continue;

      const time = timeRef.current * placement.speed + placement.phase;
      const lowAmp = placement.sway * (0.6 + low * 1.6);
      const rise = 0.35 + low * 1.4 + rms * 0.5;

      mesh.position.set(
        placement.base.x + Math.sin(time * 0.9) * lowAmp,
        placement.base.y + Math.cos(time * 1.1) * rise,
        placement.base.z + Math.cos(time * 0.9) * lowAmp
      );

      mesh.rotation.x = Math.sin(time * 1.2) * 0.35;
      mesh.rotation.y = Math.cos(time * 0.8) * 0.25;
      mesh.rotation.z = Math.sin(time * 0.6) * 0.28;

      const targetEmissive = 0.5 + high * 2.4;
      part.material.emissiveIntensity = THREE.MathUtils.lerp(
        part.material.emissiveIntensity,
        targetEmissive,
        0.12
      );
      const color = createColorFromHigh(0.58 + placement.speed * 0.06, high);
      part.material.color.lerp(color, 0.2);
      part.material.opacity = THREE.MathUtils.clamp(0.82 + high * 0.18, 0.75, 1);
    }
  });

  useEffect(() => {
    return () => {
      selectedParts.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
    };
  }, [selectedParts]);

  return (
    <group ref={groupRef} position={[0, 0, -6]}>
      {selectedParts.map(({ geometry, material }, idx) => (
        <mesh
          key={idx}
          geometry={geometry}
          material={material}
          position={placements[idx]?.base.toArray() ?? [0, 0, 0]}
          castShadow
        />
      ))}
    </group>
  );
}

export function VoidScene({ res, quality, audio }: VoidSceneProps) {
  const isLow = quality === 'low';
  const isHigh = quality === 'high';

  const config = useMemo(() => {
    if (isLow) {
      return {
        frameCount: 5,
        frameSpacing: 4.6,
        twist: 0.07,
        starCount: 360,
        starRadius: 100,
        columnCount: 5,
        walkwayLevels: 3,
        walkwayEmissive: 1.8,
        mistLayers: 2,
        swarmDensity: 0.22,
        swarmRadius: 5.5,
        accentLight: 1.2
      };
    }
    if (isHigh) {
      return {
        frameCount: 8,
        frameSpacing: 4.1,
        twist: 0.11,
        starCount: 960,
        starRadius: 150,
        columnCount: 9,
        walkwayLevels: 6,
        walkwayEmissive: 2.3,
        mistLayers: 4,
        swarmDensity: 0.45,
        swarmRadius: 9,
        accentLight: 2.4
      };
    }
    return {
      frameCount: 7,
      frameSpacing: 4.3,
      twist: 0.09,
      starCount: 620,
      starRadius: 130,
      columnCount: 7,
      walkwayLevels: 4,
      walkwayEmissive: 2.0,
      mistLayers: 3,
      swarmDensity: 0.3,
      swarmRadius: 7,
      accentLight: 1.7
    };
  }, [isHigh, isLow]);

  return (
    <group>
      <StarField count={config.starCount} radius={config.starRadius} />
      <MistSheets layers={config.mistLayers} />
      <FrameTunnel
        count={config.frameCount}
        spacing={config.frameSpacing}
        twist={config.twist}
        width={13.5}
        height={10}
        thickness={0.55}
      />
      <WalkwayStacks levels={config.walkwayLevels} emissiveIntensity={config.walkwayEmissive} />
      <FloatingColumns count={config.columnCount} />

      <JellySwarm audio={audio} radius={config.swarmRadius} density={config.swarmDensity} />

      <pointLight
        color="#ff355a"
        intensity={config.accentLight}
        distance={14}
        decay={1.4}
        position={[0, 1.4, -6.5]}
      />
      <pointLight
        color="#ff4b6f"
        intensity={config.accentLight * 0.5}
        distance={10}
        decay={1.5}
        position={[0.8, 0.9, -5.5]}
      />

      <group position={[0, -1.8, -12]}>
        <Slab width={50} depth={50} material={res.groundMat} />
      </group>

      <group position={[0, -0.2, -9]}>
        <mesh rotation={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.4, 2.0, 2.6, 24]} />
          <meshStandardMaterial color="#0c1420" roughness={0.7} metalness={0.22} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial
            color="#ff2f5d"
            emissive="#ff6587"
            emissiveIntensity={2.6}
            metalness={0.42}
            roughness={0.36}
          />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[1.05, 32, 32]} />
          <meshBasicMaterial
            color="#ff3b70"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {isLow ? (
        <VolCone position={[0, 6, -8]} color="#ff305a" opacity={0.05} radius={1.2} height={6.2} />
      ) : (
        <>
          <VolCone position={[-3.5, 6.5, -6]} color="#2940ff" opacity={0.06} radius={1.4} height={7} />
          <VolCone position={[3.2, 7.2, -11]} color="#ff305a" opacity={0.08} radius={1.6} height={8} />
        </>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
