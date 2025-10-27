import type { VisualID } from '../vis/registry';

export const PRESET_VISUAL_MAP: Record<
  string,
  {
    visualId: VisualID;
    params?: Record<string, unknown>;
  }
> = {
  'Sleepy Jellyfish': { visualId: 'jelly', params: { hue: 210, tails: 6, wobble: 0.35 } },
  'Robot Teacup': { visualId: 'bubbles', params: { count: 600, popRate: 0.8, tint: '#9fb7ff', size: [0.015, 0.05] } }, // 暂时使用气泡代替模型
  'Foggy Pancake': { visualId: 'nebula', params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' } },
  'Submarine Bounce': { visualId: 'caustic', params: { beams: true, wobble: 0.2 } },
  'Bubble Pop': { visualId: 'bubbles', params: { popRate: 0.6, size: [0.01, 0.04] } },
  'Ice Cream Bell': { visualId: 'neon', params: { grid: 0.8, glow: 1.2, color: '#ffd1f0' } },
  'Slow Whale': { visualId: 'caustic', params: { beams: true, wobble: 0.15, intensity: 0.9, tint: '#7fd1ff' } }, // 暂时使用焦散海洋代替模型
  'Midnight Arcade': { visualId: 'neon', params: { grid: 1.0, glow: 1.0, scanline: 0.5, trail: 0.6, color: '#66ccff' } }
};

