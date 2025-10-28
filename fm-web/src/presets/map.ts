import type { VisualID } from '../vis/registry';

export const PRESET_VISUAL_MAP: Record<
  string,
  {
    visualId: VisualID;
    params?: Record<string, unknown>;
    bannerFilter?: string; // CSS 滤镜效果，统一使用 3.png
  }
> = {
  'Sleepy Jellyfish': { 
    visualId: 'jelly', 
    params: { hue: 210, tails: 6, wobble: 0.35 },
    bannerFilter: 'hue-rotate(150deg) saturate(0.8) brightness(1.2)' // 浅粉柔和
  },
  'Foggy Pancake': { 
    visualId: 'nebula', 
    params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' },
    bannerFilter: 'hue-rotate(270deg) saturate(0.9) brightness(1.1)' // 粉紫梦幻
  },
  'Submarine Bounce': { 
    visualId: 'caustic', 
    params: { beams: true, wobble: 0.2 },
    bannerFilter: 'hue-rotate(0deg) saturate(1.2) brightness(0.95)' // 深蓝原色
  },
  'Bubble Pop': { 
    visualId: 'bubbles', 
    params: { popRate: 0.6, size: [0.01, 0.04] },
    bannerFilter: 'hue-rotate(180deg) saturate(1.4) brightness(1.15)' // 鲜艳青蓝
  },
  'Robot Teacup': { 
    visualId: 'model', 
    params: { src: '/models/default/teacup.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' },
    bannerFilter: 'hue-rotate(320deg) saturate(1.1) brightness(0.9)' // 深红机械
  }
};

