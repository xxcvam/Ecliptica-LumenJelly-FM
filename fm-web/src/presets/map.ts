import type { VisualID } from '../vis/registry';

export const PRESET_VISUAL_MAP: Record<
  string,
  {
    visualId: VisualID;
    params?: Record<string, unknown>;
    bannerFilter?: string; // CSS 滤镜效果，统一使用 3.png
  }
> = {
  'Redshift Atrium': { 
    visualId: 'control_atrium', 
    params: { variant: 'void' }, // 深空机库变体
    bannerFilter: 'hue-rotate(318deg) saturate(1.5) brightness(0.78) contrast(1.25)' // 深宵红蓝，高能机库
  },
  'Foggy Pancake': { 
    visualId: 'nebula', 
    params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' },
    bannerFilter: 'hue-rotate(250deg) saturate(1.05) brightness(0.88) contrast(1.1)' // 冷暖交织的薄雾
  },
  'Submarine Bounce': { 
    visualId: 'caustic', 
    params: { beams: true, wobble: 0.2 },
    bannerFilter: 'hue-rotate(205deg) saturate(0.95) brightness(0.8) contrast(1.05)' // 深海青蓝，低频深沉
  },
  'Bubble Pop': { 
    visualId: 'bubbles', 
    params: { popRate: 0.6, size: [0.01, 0.04] },
    bannerFilter: 'hue-rotate(140deg) saturate(1.25) brightness(1.05) contrast(1.12)' // 青柠高光，活泼跳跃
  },
  'Robot Teacup': { 
    visualId: 'model', 
    params: { src: '/models/default/teacup.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' },
    bannerFilter: 'hue-rotate(20deg) saturate(0.65) brightness(0.7) contrast(1.18)' // 暗金机械光泽
  }
};
