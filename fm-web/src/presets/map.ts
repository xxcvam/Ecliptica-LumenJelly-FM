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
    bannerFilter: 'hue-rotate(200deg) saturate(0.7) brightness(1.3) contrast(0.9)' // 柔和紫蓝，水母般梦幻
  },
  'Foggy Pancake': { 
    visualId: 'nebula', 
    params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' },
    bannerFilter: 'hue-rotate(30deg) saturate(0.75) brightness(1.25) contrast(0.85)' // 温暖粉橙，雾气朦胧
  },
  'Submarine Bounce': { 
    visualId: 'caustic', 
    params: { beams: true, wobble: 0.2 },
    bannerFilter: 'hue-rotate(195deg) saturate(1.3) brightness(0.85) contrast(1.15)' // 深海青蓝，低频深沉
  },
  'Bubble Pop': { 
    visualId: 'bubbles', 
    params: { popRate: 0.6, size: [0.01, 0.04] },
    bannerFilter: 'hue-rotate(160deg) saturate(1.5) brightness(1.35) contrast(1.1)' // 明亮青绿，爆裂活泼
  },
  'Robot Teacup': { 
    visualId: 'model', 
    params: { src: '/models/default/teacup.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' },
    bannerFilter: 'hue-rotate(0deg) saturate(0.5) brightness(0.8) contrast(1.2)' // 冷灰蓝调，机械金属
  }
};

