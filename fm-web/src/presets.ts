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
    lfoTarget: 'pitch' | 'amp' | 'fmIndex' | 'modRatio' | 'delayTime';
    delayTime: number;
    delayTimeSync: boolean;  // 是否同步到 BPM
    delayTimeNote: string;   // 音符时值: '1/4', '1/8', '1/16', '1/8T', '1/16T' 等
    delayFeedback: number;
    delayWet: number;
    predelay: number;        // predelay 时间 (ms)
  };
}

export const factoryPresets: Preset[] = [
  {
    name: 'Foggy Pancake',
    tagline: '雾蒙蒙的热扁桃音。',
    params: {
      carrierHz: 220,
      modRatio: 0.5,
      fmIndex: 60,
      attackTime: 0.30,
      decayTime: 0.40,
      sustainLevel: 0.70,
      releaseTime: 1.2,
      lfoRate: 8.0,
      lfoDepth: 0.8,
      lfoTarget: 'fmIndex',
      delayTime: 30,
      delayTimeSync: false,
      delayTimeNote: '1/16',
      delayFeedback: 0.80,
      delayWet: 1,
      predelay: 0
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
      delayTimeSync: false,
      delayTimeNote: '1/16',
      delayFeedback: 0.18,
      delayWet: 0.6,
      predelay: 0
    }
  },
  {
    name: 'Bubble Pop',
    tagline: '一连串冒泡糖的爆裂声。',
    params: {
      carrierHz: 220,
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
      delayTimeSync: false,
      delayTimeNote: '1/16',
      delayFeedback: 0.22,
      delayWet: 0.18,
      predelay: 0
    }
  },
  {
    name: 'Robot Teacup',
    tagline: '咕噜咕噜的机械下午茶。',
    params: {
      carrierHz: 440,
      modRatio: 3.0,
      fmIndex: 4.0,
      attackTime: 0.00,
      decayTime: 0.6,
      sustainLevel: 0.0,
      releaseTime: 0.60,
      lfoRate: 12.0,
      lfoDepth: 0.85,
      lfoTarget: 'modRatio',
      delayTime: 220,
      delayTimeSync: false,
      delayTimeNote: '1/8',
      delayFeedback: 0.15,
      delayWet: 1,
      predelay: 0
    }
  },
  {
    name: 'Redshift Atrium',
    tagline: '红色光轨在机库中随节奏脉动。',
    params: {
      carrierHz: 220,
      modRatio: 1.0,
      fmIndex: 0,
      attackTime: 0.03,
      decayTime: 0.20,
      sustainLevel: 0,
      releaseTime: 0,
      lfoRate: 0.1,
      lfoDepth: 0.15,
      lfoTarget: 'amp',
      delayTime: 450,
      delayTimeSync: false,
      delayTimeNote: '1/8',
      delayFeedback: 0.6,
      delayWet: 0.45,
      predelay: 0
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
  delayWet: { min: 0, max: 1 },
  predelay: { min: 0, max: 100 }
};

// Delay 时间音符时值到比例的映射
export const delayTimeNoteValues: Record<string, number> = {
  '1/1': 4.0,    // 全音符
  '1/2': 2.0,    // 二分音符
  '1/4': 1.0,    // 四分音符
  '1/8': 0.5,    // 八分音符
  '1/16': 0.25,  // 十六分音符
  '1/32': 0.125, // 三十二分音符
  '1/4T': 2/3,   // 四分音符三连音
  '1/8T': 1/3,   // 八分音符三连音
  '1/16T': 1/6,  // 十六分音符三连音
  '1/4.': 1.5,   // 附点四分音符
  '1/8.': 0.75,  // 附点八分音符
  '1/16.': 0.375 // 附点十六分音符
};
