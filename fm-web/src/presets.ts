// FM 合成器预设（tuned）
export interface Preset {
  name: string;
  tagline: string;
  params: {
    carrierHz: number;
    modRatio: number;
    fmIndex: number;
    attackTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
    lfoRate: number;
    lfoDepth: number;
    lfoTarget: 'pitch' | 'amp' | 'fmIndex' | 'modRatio';
    delayTime: number;
    delayFeedback: number;
    delayWet: number;
  };
}

export const factoryPresets: Preset[] = [
  {
    name: 'Sleepy Jellyfish',
    tagline: '柔和的水母在耳边呼吸。',
    params: {
      carrierHz: 220,
      modRatio: 2.0,
      fmIndex: 28,
      attackTime: 0.03,
      decayTime: 0.60,
      sustainLevel: 0.55,
      releaseTime: 0.90,
      lfoRate: 0.7,
      lfoDepth: 0.25,
      lfoTarget: 'amp',
      delayTime: 420,
      delayFeedback: 0.22,
      delayWet: 0.18
    }
  },
  {
    name: 'Robot Teacup',
    tagline: '咕噜咕噜的机械下午茶。',
    params: {
      carrierHz: 440,
      modRatio: 3.0,
      fmIndex: 120,
      attackTime: 0.002,
      decayTime: 0.35,
      sustainLevel: 0.15,
      releaseTime: 0.60,
      lfoRate: 7.5,
      lfoDepth: 0.35,
      lfoTarget: 'fmIndex',
      delayTime: 180,
      delayFeedback: 0.35,
      delayWet: 0.25
    }
  },
  {
    name: 'Foggy Pancake',
    tagline: '雾蒙蒙的热扁桃音。',
    params: {
      carrierHz: 220,
      modRatio: 1.0,
      fmIndex: 12,
      attackTime: 0.80,
      decayTime: 0.60,
      sustainLevel: 0.75,
      releaseTime: 1.20,
      lfoRate: 0.5,
      lfoDepth: 0.35,
      lfoTarget: 'amp',
      delayTime: 420,
      delayFeedback: 0.30,
      delayWet: 0.28
    }
  },
  {
    name: 'Submarine Bounce',
    tagline: '跳进深海舱内的低频弹簧。',
    params: {
      carrierHz: 110,
      modRatio: 0.5,
      fmIndex: 70,
      attackTime: 0.003,
      decayTime: 0.12,
      sustainLevel: 0.35,
      releaseTime: 0.12,
      lfoRate: 2.2,
      lfoDepth: 0.06,
      lfoTarget: 'pitch',
      delayTime: 120,
      delayFeedback: 0.18,
      delayWet: 0.08
    }
  },
  {
    name: 'Bubble Pop',
    tagline: '一连串冒泡糖的爆裂声。',
    params: {
      carrierHz: 330,
      modRatio: 3.0,
      fmIndex: 90,
      attackTime: 0.001,
      decayTime: 0.12,
      sustainLevel: 0.0,
      releaseTime: 0.10,
      lfoRate: 10.0,
      lfoDepth: 0.25,
      lfoTarget: 'fmIndex',
      delayTime: 90,
      delayFeedback: 0.22,
      delayWet: 0.18
    }
  },
  {
    name: 'Ice Cream Bell',
    tagline: '甜筒车开进了银河街角。',
    params: {
      carrierHz: 880,
      modRatio: 2.5,
      fmIndex: 140,
      attackTime: 0.003,
      decayTime: 1.20,
      sustainLevel: 0.0,
      releaseTime: 1.10,
      lfoRate: 5.0,
      lfoDepth: 0.08,
      lfoTarget: 'pitch',
      delayTime: 430,
      delayFeedback: 0.55,
      delayWet: 0.40
    }
  },
  {
    name: 'Slow Whale',
    tagline: '鲸鱼尾鳍拖着日落余波。',
    params: {
      carrierHz: 98,
      modRatio: 0.5,
      fmIndex: 18,
      attackTime: 1.20,
      decayTime: 0.80,
      sustainLevel: 0.85,
      releaseTime: 1.80,
      lfoRate: 0.35,
      lfoDepth: 0.42,
      lfoTarget: 'pitch',
      delayTime: 520,
      delayFeedback: 0.50,
      delayWet: 0.45
    }
  },
  {
    name: 'Midnight Arcade',
    tagline: '午夜街机厅的霓虹按键。',
    params: {
      carrierHz: 261.63,
      modRatio: 2.0,
      fmIndex: 55,
      attackTime: 0.005,
      decayTime: 0.22,
      sustainLevel: 0.35,
      releaseTime: 0.25,
      lfoRate: 4.5,
      lfoDepth: 0.10,
      lfoTarget: 'modRatio',
      delayTime: 300,
      delayFeedback: 0.32,
      delayWet: 0.28
    }
  }
];

export const parameterBounds = {
  carrierHz: { min: 65, max: 1047 },
  modRatio: { min: 0.5, max: 3, step: 0.5 },
  fmIndex: { min: 0, max: 150 },
  attackTime: { min: 0, max: 2 },
  decayTime: { min: 0, max: 2 },
  sustainLevel: { min: 0, max: 1 },
  releaseTime: { min: 0, max: 2 },
  lfoRate: { min: 0.1, max: 12 },
  lfoDepth: { min: 0, max: 1 },
  delayTime: { min: 30, max: 600 },
  delayFeedback: { min: 0, max: 0.8 },
  delayWet: { min: 0, max: 1 }
};
