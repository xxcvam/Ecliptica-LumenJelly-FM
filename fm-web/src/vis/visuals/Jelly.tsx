import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
// import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { Environment } from '@react-three/drei';
import gsap from 'gsap';
import type { VisualProps } from '../registry';
import { poissonRing } from '../utils/poisson';

type JellyParams = {
  tails?: number;
  quality?: 'high' | 'low';
};

// 性能保护配置
const PERF_CONFIG = {
  TARGET_FPS: 45,           // 目标帧率
  CRITICAL_FPS: 25,         // 严重卡顿阈值
  CHECK_INTERVAL: 30,       // 每30帧检查一次
  SAMPLE_SIZE: 10,          // FPS采样数量
  UPDATE_THROTTLE: 3,       // 每N帧更新一次动画（降级时）
};

// 性能等级
const PerfLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  EMERGENCY: 'emergency'
} as const;

type PerfLevelType = typeof PerfLevel[keyof typeof PerfLevel];

// 全局性能状态
const perfState = {
  level: PerfLevel.HIGH as PerfLevelType,
  frameCount: 0,
  fpsSamples: [] as number[],
  lastCheck: 0,
};

// FPS 监测器
class FPSMonitor {
  private samples: number[] = [];
  private lastTime = performance.now();
  
  update(): number {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    const fps = 1000 / delta;
    this.samples.push(fps);
    
    if (this.samples.length > PERF_CONFIG.SAMPLE_SIZE) {
      this.samples.shift();
    }
    
    return this.getAverage();
  }
  
  getAverage(): number {
    if (this.samples.length === 0) return 60;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }
  
  reset() {
    this.samples = [];
  }
}

const fpsMonitor = new FPSMonitor();

// 根据FPS自动调整性能等级
function updatePerfLevel(): PerfLevelType {
  const avgFps = fpsMonitor.getAverage();
  
  if (avgFps < PERF_CONFIG.CRITICAL_FPS) {
    return PerfLevel.EMERGENCY;
  } else if (avgFps < PERF_CONFIG.TARGET_FPS) {
    return PerfLevel.LOW;
  } else if (avgFps < 55) {
    return PerfLevel.MEDIUM;
  }
  
  return PerfLevel.HIGH;
}

// EMA 平滑函数
const ema = (prev: number, next: number, alpha = 0.15) => prev + (next - prev) * alpha;

// 水母身体组件（拟SSS + 噪声形变 + 低频脉冲）
function JellyBody({ audio, scale = 1.0 }: VisualProps & { scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const frameCounter = useRef(0);

  // 在useMemo中创建材质，确保shader在渲染前设置好
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#88B3F8'),
      transparent: true,
      opacity: 0.68,
      roughness: 0.15,
      metalness: 0.02,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      transmission: 0.65,
      thickness: 0.85,
      ior: 1.45,
      emissive: new THREE.Color('#6699EE'),
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide
    });

    // 立即设置shader - 在材质首次使用前
    // 确保 onBeforeCompile 总是设置 uniforms，防止 Three.js 刷新时出错
    mat.onBeforeCompile = (shader) => {
      try {
        // 确保 uniforms 对象存在
        if (!shader.uniforms) {
          shader.uniforms = {};
        }
        
        // 初始化所有必需的 uniforms（即使在紧急模式下也确保存在）
        if (!shader.uniforms.uTime) {
          shader.uniforms.uTime = { value: 0 };
        }
        if (!shader.uniforms.uNoiseAmp) {
          shader.uniforms.uNoiseAmp = { value: 0.015 };
        }
        if (!shader.uniforms.uNoiseScale) {
          shader.uniforms.uNoiseScale = { value: 2.2 };
        }
        
        // 紧急模式下禁用自定义 shader，但仍需设置 uniforms 以防止 Three.js 报错
        // 注意：在紧急模式下，我们不修改 shader 代码，仅设置 uniforms 以避免访问错误
        if (perfState.level !== PerfLevel.EMERGENCY) {
          // 正常模式：应用自定义 shader
          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', `
              #include <common>
              float hash(vec3 p){ return fract(sin(dot(p, vec3(23.1407, 2.6651, 3.14159))) * 43758.5453); }
              float noise(vec3 x){
                vec3 i = floor(x); vec3 f = fract(x);
                f = f*f*(3.0-2.0*f);
                float n = mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                                  mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                              mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                                  mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
                return n;
              }
              uniform float uTime; uniform float uNoiseAmp; uniform float uNoiseScale;
            `)
            .replace('#include <begin_vertex>', `
              #include <begin_vertex>
              float n = noise(normalize(position) * uNoiseScale + uTime * 0.25);
              transformed += normal * (n - 0.5) * uNoiseAmp;
            `);
          
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `
              #include <common>
              uniform float uTime;
            `)
            .replace('#include <lights_fragment_begin>', `
              #include <lights_fragment_begin>
              float fres = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 3.0);
              reflectedLight.indirectDiffuse += vec3(0.1,0.12,0.16) * fres * 0.4;
            `);
        }
        
        // 保存 shader 引用以便后续更新
        (mat as THREE.MeshPhysicalMaterial & { __shader?: typeof shader }).__shader = shader;
      } catch (error) {
        console.error('[Jelly] Shader 编译错误:', error);
        // 出错时确保至少 uniforms 存在，避免后续访问错误
        if (!shader.uniforms) {
          shader.uniforms = {};
        }
        if (!shader.uniforms.uTime) {
          shader.uniforms.uTime = { value: 0 };
        }
        if (!shader.uniforms.uNoiseAmp) {
          shader.uniforms.uNoiseAmp = { value: 0.015 };
        }
        if (!shader.uniforms.uNoiseScale) {
          shader.uniforms.uNoiseScale = { value: 2.2 };
        }
      }
    };
    
    return mat;
  }, []);

  // 使用 ref 跟踪性能等级变化，强制材质重新编译
  const lastPerfLevelRef = useRef(perfState.level);
  
  useEffect(() => {
    // 检查性能等级是否改变
    const checkPerfLevel = () => {
      if (lastPerfLevelRef.current !== perfState.level) {
        lastPerfLevelRef.current = perfState.level;
        // 当性能等级改变时，标记材质需要更新
        if (material) {
          material.needsUpdate = true;
          // 清除已编译的 shader 缓存，强制重新编译
          type MaterialWithShader = THREE.MeshPhysicalMaterial & { __shader?: { uniforms?: Record<string, { value: unknown }> } };
          const shaderRef = (material as MaterialWithShader).__shader;
          if (shaderRef) {
            delete (material as MaterialWithShader).__shader;
          }
        }
      }
    };
    
    // 每秒检查一次（性能等级更新频率不高）
    const interval = setInterval(checkPerfLevel, 1000);
    return () => clearInterval(interval);
  }, [material]);

  useFrame((_, dt) => {
    try {
      frameCounter.current++;
      
      // 性能节流：低性能模式下跳帧
      const throttle = perfState.level === PerfLevel.LOW || perfState.level === PerfLevel.EMERGENCY 
        ? PERF_CONFIG.UPDATE_THROTTLE 
        : 1;
      
      if (frameCounter.current % throttle !== 0) return;
      
      timeRef.current += dt * throttle;
      const [low] = audio.bands();
      const rms = audio.rms();

      if (meshRef.current) {
        // 紧急模式：仅基础动画
        if (perfState.level === PerfLevel.EMERGENCY) {
          const breathe = 1.0 + Math.sin(timeRef.current * 0.3) * 0.04;
          meshRef.current.scale.setScalar(breathe * scale);
          material.emissiveIntensity = 0.25;
          // 安全更新shader时间（如果存在）
          const shader = (material as THREE.MeshPhysicalMaterial & { __shader?: { uniforms: { uTime: { value: number } } } }).__shader;
          if (shader?.uniforms?.uTime) {
            shader.uniforms.uTime.value = timeRef.current;
          }
          return;
        }
        
        const breathe = 1.0 + Math.sin(timeRef.current * 0.6) * 0.08 * (0.7 + low * 0.3);
        meshRef.current.scale.setScalar(breathe * scale);
        meshRef.current.position.y = Math.sin(timeRef.current * 0.4) * 0.08 * (0.5 + low * 0.5);

        material.emissiveIntensity = 0.22 + low * 1.4 + rms * 0.2;

        // 安全更新shader uniforms
        const shader = (material as THREE.MeshPhysicalMaterial & { __shader?: { uniforms: { uTime: { value: number } } } }).__shader;
        if (shader?.uniforms?.uTime) {
          shader.uniforms.uTime.value = timeRef.current;
        }
      }
    } catch (error) {
      console.error('[Jelly] JellyBody 动画错误:', error);
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
    </mesh>
  );
}

// 触手组件
function Tentacle({
  position,
  rotation,
  index,
  audio
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
  audio: VisualProps['audio'];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const opacityRef = useRef(0.6);
  const frameCounter = useRef(0);

  const geometry = useMemo(() => {
    // 紧急模式：更简单的几何体
    const segments = perfState.level === PerfLevel.EMERGENCY ? 8 : 16;
    const geo = new THREE.PlaneGeometry(0.12, 1.6, 1, segments);
    geo.translate(0, -0.8, 0);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const falloff = (y + 0.8) / 1.6;
      const bend = Math.pow(falloff, 2) * 0.15;
      positions.setY(i, y - bend);
    }
    return geo;
  }, []);

  useFrame((_, dt) => {
    try {
      frameCounter.current++;
      
      // 紧急模式：完全禁用触手动画
      if (perfState.level === PerfLevel.EMERGENCY) return;
      
      // 性能节流
      const throttle = perfState.level === PerfLevel.LOW ? PERF_CONFIG.UPDATE_THROTTLE : 1;
      if (frameCounter.current % throttle !== 0) return;
      
      timeRef.current += dt * throttle;
      const [, mid] = audio.bands();
      const rms = audio.rms();

      if (meshRef.current) {
        const k = 0.75 + 0.25 * Math.sin(index * 1.7);
        const wave = Math.sin(timeRef.current * 0.8 + index * 0.45) * 0.07 * (0.5 + rms * 0.6) * k;
        meshRef.current.rotation.z = wave;

        const target = 0.58 + mid * 0.35;
        opacityRef.current = ema(opacityRef.current, target, 0.12);
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = opacityRef.current;
      }
    } catch {
      // 静默处理触手动画错误
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation}>
      <meshBasicMaterial
        color="#A890FF"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// 单只水母
function Jellyfish({ audio, params, scale = 1.0 }: VisualProps & { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const jellyParams = (params || {}) as JellyParams;
  const tentacleCount = jellyParams.tails ?? 8;
  const timeRef = useRef(0);

  useFrame((_, dt) => {
    try {
      timeRef.current += dt;
      if (groupRef.current) {
        groupRef.current.rotation.y = Math.sin(timeRef.current * 0.2) * 0.1;
      }
    } catch {
      // 静默处理
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <JellyBody audio={audio} params={params} scale={1.0} />
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#D8C4FF" transparent opacity={0.4} />
      </mesh>
      {Array.from({ length: tentacleCount }).map((_, i) => {
        const angle = (i / tentacleCount) * Math.PI * 2;
        const radius = 0.24;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        return (
          <Tentacle
            key={i}
            position={[x, -0.12, z]}
            rotation={[0, angle, 0]}
            index={i}
            audio={audio}
          />
        );
      })}
    </group>
  );
}

// 水母学校（泊松分布）
function JellySchool({ audio, params }: VisualProps) {
  const [maxJellies, setMaxJellies] = useState(5);
  
  const points = useMemo(() => poissonRing({ 
    n: 5, 
    inner: 2.2, 
    outer: 5.5, 
    minDist: 1.8, 
    seed: 3 
  }), []);

  // 根据性能等级动态调整显示数量
  useEffect(() => {
    const getMaxJellies = () => {
      switch (perfState.level) {
        case PerfLevel.EMERGENCY: return 2;
        case PerfLevel.LOW: return 3;
        case PerfLevel.MEDIUM: return 4;
        default: return 5;
      }
    };
    setMaxJellies(getMaxJellies());
  }, []);

  return (
    <group>
      {points.slice(0, maxJellies).map((p, i) => {
        // 主角：最近的一只，scale=1.0
        // 副角：中距离，scale=0.6/0.45
        // 远景：最远，scale=0.25
        const dist = Math.sqrt(p.x * p.x + p.z * p.z);
        let scale = 1.0;
        if (dist < 2.8) scale = 1.0; // 主角
        else if (dist < 4.0) scale = i % 2 === 0 ? 0.6 : 0.45; // 副角
        else scale = 0.25; // 远景幽灵水母

        // 紧急模式：减少触手数量
        const tailCount = perfState.level === PerfLevel.EMERGENCY ? 4 : 6 + (i % 2);

        return (
          <group key={i} position={p.toArray()}>
            <Jellyfish 
              audio={audio} 
              params={{ tails: tailCount, quality: params?.quality || 'high' }} 
              scale={scale}
            />
          </group>
        );
      })}
    </group>
  );
}

// 焦散背景（简化版，使用内置材质）
function WaterBackground({ audio }: VisualProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, dt) => {
    try {
      timeRef.current += dt;
      const [low] = audio.bands();

      if (meshRef.current) {
        // 通过位置和缩放模拟轻微的流动
        meshRef.current.position.y = Math.sin(timeRef.current * 0.1) * 0.1;
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        // 与低频耦合的透明度
        if (mat) mat.opacity = 0.8 + low * 0.2;
      }
    } catch {
      // 静默处理
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -6]}>
      <planeGeometry args={[20, 15]} />
      <meshBasicMaterial 
        color="#030816" 
        transparent 
        opacity={0.8}
      />
    </mesh>
  );
}

// 体积光（极其柔和，几乎不可见）
function VolumetricLight({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    try {
      if (meshRef.current) {
        meshRef.current.rotation.y += dt * 0.08;
      }
    } catch {
      // 静默处理
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.6, 4.0, 6, 1, true]} />
      <meshBasicMaterial
        color="#3060A8"
        transparent
        opacity={0.015}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// WebGL Context Lost 错误处理
function WebGLErrorHandler() {
  const { gl } = useThree();
  
  useEffect(() => {
    if (!gl) return;
    
    const canvas = gl.domElement;
    
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error('[Jelly] WebGL Context Lost! 尝试恢复...');
      // 降级到最低性能模式
      perfState.level = PerfLevel.EMERGENCY;
    };
    
    const handleContextRestored = () => {
      console.log('[Jelly] WebGL Context 已恢复');
      // 重置性能状态
      perfState.level = PerfLevel.MEDIUM;
      fpsMonitor.reset();
    };
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);
  
  return null;
}

// 性能监控组件
function PerformanceMonitor() {
  useFrame(() => {
    perfState.frameCount++;
    
    try {
      fpsMonitor.update();
      
      // 定期检查性能
      if (perfState.frameCount % PERF_CONFIG.CHECK_INTERVAL === 0) {
        const newLevel = updatePerfLevel();
        if (newLevel !== perfState.level) {
          perfState.level = newLevel;
          console.log(`[Jelly] 性能等级调整: ${newLevel} (FPS: ${fpsMonitor.getAverage().toFixed(1)})`);
        }
      }
    } catch (error) {
      console.error('[Jelly] 性能监控错误:', error);
      // 发生错误时立即降级
      perfState.level = PerfLevel.EMERGENCY;
    }
  });
  
  return null;
}

// 相机编舞
function CameraChoreo() {
  const { camera } = useThree();
  const t = useRef(0);
  const frameCounter = useRef(0);

  useEffect(() => {
    camera.position.set(0, 0.8, 6.5);
    camera.lookAt(0, 0.2, 0);

    // 紧急模式：禁用复杂动画
    if (perfState.level === PerfLevel.EMERGENCY) return;

    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(camera.position, { z: 4.6, duration: 8, ease: 'sine.inOut' })
      .to(camera.position, { x: 1.1, duration: 7, ease: 'sine.inOut' }, '<')
      .to({}, { duration: 2 });
  }, [camera]);

  useFrame((_, dt) => {
    try {
      frameCounter.current++;
      
      // 低性能模式：减少相机更新频率
      if (perfState.level === PerfLevel.LOW && frameCounter.current % 2 !== 0) return;
      if (perfState.level === PerfLevel.EMERGENCY && frameCounter.current % 3 !== 0) return;
      
      t.current += dt;
      camera.position.y += Math.sin(t.current * 0.35) * 0.0025;
      camera.lookAt(0, 0.18 + Math.sin(t.current * 0.22) * 0.02, 0);
    } catch {
      // 静默处理
    }
  });

  return null;
}

// 反射地面
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshPhysicalMaterial
        color="#0a0f16"
        roughness={0.3}
        metalness={0.0}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Jelly] 渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          background: '#071018',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <div style={{ fontSize: '18px' }}>水母场景加载失败</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>
            {this.state.error?.message || '未知错误'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 主场景
const JellyVisual = ({ audio, params }: VisualProps) => {
  const jellyParams = (params || {}) as JellyParams;
  const quality = jellyParams.quality === 'low' ? 'low' : 'high';
  const [dynamicDpr, setDynamicDpr] = useState<[number, number]>([1, 1.5]);
  const [dynamicAntialias, setDynamicAntialias] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // 初始化 RectAreaLightUniforms，确保矩形面光正常工作
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('three/examples/jsm/lights/RectAreaLightUniformsLib.js');
        if (!cancelled && mod?.RectAreaLightUniformsLib?.init) {
          mod.RectAreaLightUniformsLib.init();
        }
      } catch {
        // 忽略：在某些 three 版本里可能已内建，无需初始化
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 初始化性能状态
  useEffect(() => {
    try {
      perfState.level = quality === 'low' ? PerfLevel.LOW : PerfLevel.HIGH;
      perfState.frameCount = 0;
      fpsMonitor.reset();
      
      console.log('[Jelly] 场景初始化 - 质量:', quality);
      
      // 延迟标记为就绪，确保WebGL初始化完成
      setTimeout(() => setIsReady(true), 100);
      
      return () => {
        // 清理
        perfState.level = PerfLevel.HIGH;
        perfState.frameCount = 0;
        fpsMonitor.reset();
        setIsReady(false);
      };
    } catch (error) {
      console.error('[Jelly] 初始化错误:', error);
      setIsReady(true); // 即使出错也尝试渲染
    }
  }, [quality]);

  // 根据性能等级动态调整渲染参数
  useEffect(() => {
    const interval = setInterval(() => {
      const level = perfState.level;
      
      switch (level) {
        case PerfLevel.EMERGENCY:
          setDynamicDpr([1, 1]);
          setDynamicAntialias(false);
          break;
        case PerfLevel.LOW:
          setDynamicDpr([1, 1.2]);
          setDynamicAntialias(false);
          break;
        case PerfLevel.MEDIUM:
          setDynamicDpr([1, 1.35]);
          setDynamicAntialias(true);
          break;
        default:
          setDynamicDpr([1, 1.5]);
          setDynamicAntialias(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 显示加载状态
  if (!isReady) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#071018',
        color: '#88B3F8',
        fontSize: '18px',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid #88B3F8',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div>正在加载水母场景...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Canvas
        dpr={quality === 'low' ? [1, 1] : dynamicDpr}
        gl={{
          antialias: quality === 'low' ? false : dynamicAntialias,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: 'high-performance',
        }}
        camera={{ 
          fov: 35, 
          near: 0.1, 
          far: 50, 
          position: [0, 0.8, 6.5] 
        }}
      >
      {/* 性能监控 */}
      <PerformanceMonitor />
      
      {/* WebGL 错误处理 */}
      <WebGLErrorHandler />

      {/* 深海背景 */}
      <color attach="background" args={['#071018']} />

      {/* 相机编舞 */}
      <CameraChoreo />

      {/* HDR 环境 */}
      <Environment preset="warehouse" background={false} />

      {/* 指数雾 */}
      <fogExp2 attach="fog" args={['#071018', 0.055]} />

      {/* 焦散背景 */}
      <WaterBackground audio={audio} />

      {/* 反射地面 - 紧急模式下禁用 */}
      {perfState.level !== PerfLevel.EMERGENCY && <ReflectiveFloor />}

      {/* 柔大光源（面板感） */}
      <rectAreaLight 
        intensity={6} 
        width={6} 
        height={3} 
        color="#cfe8ff" 
        position={[0, 2, -2]} 
      />

      {/* 侧补光 - 低性能模式下禁用 */}
      {perfState.level !== PerfLevel.LOW && perfState.level !== PerfLevel.EMERGENCY && (
        <spotLight 
          intensity={1.0} 
          angle={0.35} 
          penumbra={1} 
          position={[3, 3, 4]} 
          color="#8FA8D8"
        />
      )}

      {/* 环境光 */}
      <ambientLight intensity={0.15} color="#5080C0" />

      {/* 体积光（高质量）- 低性能模式下禁用 */}
      {quality !== 'low' && perfState.level === PerfLevel.HIGH && (
        <>
          <VolumetricLight position={[-1.5, 4, 0.5]} />
          <VolumetricLight position={[1.8, 4.5, -0.8]} />
        </>
      )}

      {/* 水母学校 */}
      <JellySchool audio={audio} params={params} />

      {/* 后期处理 - 暂时禁用以确保稳定性 */}
      {/* {quality !== 'low' && (
        <EffectComposer>
          <Bloom 
            intensity={0.8} 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.15} 
            mipmapBlur
          />
          <DepthOfField 
            focusDistance={0.015} 
            focalLength={0.025} 
            bokehScale={0.6} 
          />
          <Vignette 
            offset={0.35} 
            darkness={0.9} 
          />
        </EffectComposer>
      )} */}
      </Canvas>
    </ErrorBoundary>
  );
};

export default JellyVisual;
export { JellySchool };
