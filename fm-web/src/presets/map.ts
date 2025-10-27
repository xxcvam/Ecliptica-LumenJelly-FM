import type { VisualID } from '../vis/registry';

export const PRESET_VISUAL_MAP: Record<
  string,
  {
    visualId: VisualID;
    params?: Record<string, unknown>;
  }
> = {
  'Sleepy Jellyfish': { visualId: 'jelly', params: { hue: 210, tails: 6, wobble: 0.35 } },
  'Robot Teacup': { visualId: 'model', params: { src: '/models/default/teacup.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' } },
  'Foggy Pancake': { visualId: 'nebula', params: { fog: 0.8, swirl: 0.4, tint: '#a28bff' } },
  'Submarine Bounce': { visualId: 'caustic', params: { beams: true, wobble: 0.2 } },
  'Bubble Pop': { visualId: 'bubbles', params: { popRate: 0.6, size: [0.01, 0.04] } },
  'Ice Cream Bell': { visualId: 'nebulaTrails', params: { colorA: '#ffd1f0', colorB: '#ff3aa9', speed: 0.9, swirl: 1.2, glow: 1.0 } },
  'Slow Whale': { visualId: 'model', params: { src: '/models/default/whale.glb', fallback: true, style: 'wire', lineColor: '#e6e6e6', fillColor: '#111111' } },
  'Midnight Arcade': { visualId: 'nebulaTrails', params: { colorA: '#6ce6ff', colorB: '#ff3aa9', speed: 0.9, swirl: 1.3, spread: 0.25, glow: 1.0, quality: 'high' } }
};

