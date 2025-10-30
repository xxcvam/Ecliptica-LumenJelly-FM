import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useControlStore } from './store';
import type { AudioBus } from '../../registry';

interface CameraChoreoProps {
  audio: AudioBus;
  variant?: 'atrium' | 'red_room' | 'void';
}

export function CameraChoreo({ audio, variant = 'atrium' }: CameraChoreoProps) {
  const { camera } = useThree();
  const store = useControlStore();
  const timeRef = useRef(0);
  const velRef = useRef({ x: 0, y: 0, z: 0 });
  const lookVelRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (variant === 'void') {
      camera.position.set(0, 1.8, 12);
      camera.lookAt(0, 0.8, -6);
    const tl = gsap.timeline({ repeat: -1, yoyo: true, smoothChildTiming: true });
      tl.to(camera.position, { z: 6.5, duration: 12, ease: 'sine.inOut' })
        .to(camera.position, { x: 2.2, duration: 10, ease: 'sine.inOut' }, '<+=1.5')
        .to(camera.position, { x: -2.2, duration: 10, ease: 'sine.inOut' }, '<');
      return () => {
        tl.kill();
      };
    }

    camera.position.set(0, 1.2, 8);
    camera.lookAt(0, 0.2, 0);

    const tl = gsap.timeline({ repeat: -1, yoyo: true, smoothChildTiming: true });
    tl.to(camera.position, { z: 5, x: 1.5, duration: 8, ease: 'sine.inOut' }).to({}, { duration: 2 });

    return () => {
      tl.kill();
    };
  }, [camera, variant]);

  useFrame((_, dt) => {
    timeRef.current += dt;
    const [low, mid] = audio.bands();
    const rms = audio.rms();

    if (variant === 'void') {
      store.setLight({
        intensity: 2.4 + low * 5,
        color: '#ff355d'
      });
      store.setFogDensity(0.1 + mid * 0.045);

      const baseY = 1.8;
      const targetX = Math.sin(timeRef.current * 0.08) * 0.35;
      const targetY = baseY + Math.sin(timeRef.current * 0.22) * 0.24 * (1 + rms * 0.5);
      const targetZ = 12 + Math.sin(timeRef.current * 0.04) * 0.8;

      velRef.current.x += (targetX - camera.position.x) * 0.08;
      velRef.current.y += (targetY - camera.position.y) * 0.08;
      velRef.current.z += (targetZ - camera.position.z) * 0.08;

      velRef.current.x *= 0.86;
      velRef.current.y *= 0.86;
      velRef.current.z *= 0.86;

      camera.position.x += velRef.current.x * dt * 60;
      camera.position.y += velRef.current.y * dt * 60;
      camera.position.z += velRef.current.z * dt * 60;

      const lookTarget = {
        x: 0,
        y: 0.4 + Math.cos(timeRef.current * 0.16) * 0.18,
        z: -8 + Math.sin(timeRef.current * 0.12) * 0.6
      };

      lookVelRef.current.x += (lookTarget.x - lookVelRef.current.x) * 0.12;
      lookVelRef.current.y += (lookTarget.y - lookVelRef.current.y) * 0.12;
      lookVelRef.current.z += (lookTarget.z - lookVelRef.current.z) * 0.12;

      camera.lookAt(lookVelRef.current.x, lookVelRef.current.y, lookVelRef.current.z);
      return;
    }

    // 灯光呼吸 - 更柔和的深海灯光变化
    store.setLight({ intensity: 3.5 + low * 4 });

    // 雾密度 - 更浓密的深海雾效
    store.setFogDensity(0.075 + mid * 0.035);

    // 微漂移 - 模拟水下漂浮
    camera.position.y += Math.sin(timeRef.current * 0.28) * 0.006 * (1 + rms * 0.4);
    camera.lookAt(0, 0.15 + Math.sin(timeRef.current * 0.18) * 0.025, 0);
  });

  return null;
}
