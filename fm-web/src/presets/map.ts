import type { VisualID } from '../vis/registry';

export const PRESET_VISUAL_MAP: Record<
  string,
  {
    visualId: VisualID;
    params?: Record<string, unknown>;
    banner?: string; // Banner 图片路径
  }
> = {
  'Sleepy Jellyfish': { 
    visualId: 'jelly', 
    params: { hue: 210, tails: 6, wobble: 0.35 },
    banner: '/banners/4.png'
  },
  'Foggy Pancake': { 
    visualId: 'nebula', 
    params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' },
    banner: '/banners/2.png'
  },
  'Submarine Bounce': { 
    visualId: 'caustic', 
    params: { beams: true, wobble: 0.2 },
    banner: '/banners/3.png'
  },
  'Bubble Pop': { 
    visualId: 'bubbles', 
    params: { popRate: 0.6, size: [0.01, 0.04] },
    banner: '/banners/5.png'
  },
  'Robot Teacup': { 
    visualId: 'model', 
    params: { src: '/models/default/teacup.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' },
    banner: '/banners/1.png'
  }
};

