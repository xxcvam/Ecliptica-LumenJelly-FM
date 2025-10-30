import { create } from 'zustand';

export interface ControlStore {
  light: {
    intensity: number;
    color: string;
  };
  fogDensity: number;
  quality: 'auto' | 'high' | 'low';
  setLight: (params: Partial<ControlStore['light']>) => void;
  setFogDensity: (density: number) => void;
  setQuality: (quality: ControlStore['quality']) => void;
}

export const useControlStore = create<ControlStore>((set) => ({
  light: {
    intensity: 3.5, // 降低初始强度，更深海
    color: '#4080D0', // 冷蓝色调
  },
  fogDensity: 0.085, // 增强雾效，营造水下氛围
  quality: 'high',
  setLight: (params) =>
    set((state) => ({
      light: { ...state.light, ...params },
    })),
  setFogDensity: (density) => set({ fogDensity: density }),
  setQuality: (quality) => set({ quality }),
}));

