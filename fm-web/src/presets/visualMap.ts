// 视觉映射：把音色名 -> (visualId + params)
// 依赖：src/vis/registry.ts 已导出 VisualID
import type { VisualID } from '../vis/registry';

type VisualConfig = { visualId: VisualID; params?: Record<string, any> };

// 可复用的调色板
const PALETTE = {
  jelly:   { a: "#78d0ff", b: "#bfa8ff", body: "#9fe3ff" },
  fog:     { tint: "#a6b8ff" },
  neon:    { ice: "#ffd1f0", arcade: "#6cf" },
  sea:     { tint: "#75d0ff" },
};

// 默认回退（找不到映射时）
export const DEFAULT_VISUAL: VisualConfig = {
  visualId: "nebula",
  params: { fog: 0.7, swirl: 0.35, tint: PALETTE.fog.tint, highlight: 0.6 },
};

// 8 个工厂预设的可视化
export const visualMap: Record<string, VisualConfig> = {
  // 1) 水母：条带 Shader（发光随 RMS，摆动随中频）
  "Sleepy Jellyfish": {
    visualId: "jelly",
    params: {
      colorA: PALETTE.jelly.a,
      colorB: PALETTE.jelly.b,
      body: PALETTE.jelly.body,
      tails: 6,
      wobble: 0.3,      // 基础摆动，音频会叠加
      emissive: 0.5,    // 基础发光
    },
  },

  // 2) 机械茶杯：模型舞台（可换 glTF）
  "Robot Teacup": {
    visualId: "model",
    params: {
      src: "/models/teacup.glb", // 先放占位；替换为优化后的 glTF
      env: "studio",
      metalness: 0.9,
      roughness: 0.2,
      tint: "#9fb7ff",
      bloom: 0.4,
      scale: 1.0,
    },
  },

  // 3) 雾气星云：体积水域/星云 Shader
  "Foggy Pancake": {
    visualId: "nebula",
    params: {
      fog: 0.85,
      swirl: 0.25,
      tint: PALETTE.fog.tint,
      grain: 0.1,
      highlight: 0.4,
    },
  },

  // 4) 深海弹簧：海床 + 焦散
  "Submarine Bounce": {
    visualId: "caustic",
    params: {
      intensity: 0.9,     // 焦散强度（受中频再增益）
      wobble: 0.2,        // 波纹变形
      tint: PALETTE.sea.tint,
      beams: true,        // 可选体积光
    },
  },

  // 5) 泡泡爆裂：粒子上升/爆裂
  "Bubble Pop": {
    visualId: "bubbles",
    params: {
      count: 700,           // 桌面；移动端会自动降
      size: [0.01, 0.04],
      popRate: 0.6,         // noteOn 叠加爆裂
      rise: 1.0,            // 上升基速（受高频加速）
      tint: "#a8d8ff",
      opacity: 0.4,
    },
  },

  // 6) 冰淇淋铃：霓虹网格/扫描线
  "Ice Cream Bell": {
    visualId: "neon",
    params: {
      color: PALETTE.neon.ice,
      glow: 1.2,
      grid: 0.8,
      scanline: 0.35,
      trail: 0.5,
    },
  },

  // 7) 慢鲸：模型舞台 + 海面焦散
  "Slow Whale": {
    visualId: "model",
    params: {
      src: "/models/whale_low.glb",
      env: "sunset",
      caustics: 0.9,       // 舞台里叠加焦散覆盖
      tint: "#7fd1ff",
      bloom: 0.35,
      scale: 0.9,
    },
  },

  // 8) 午夜街机：高对比霓虹
  "Midnight Arcade": {
    visualId: "neon",
    params: {
      color: PALETTE.neon.arcade,
      glow: 1.0,
      grid: 1.0,
      scanline: 0.5,
      trail: 0.65,
      vignette: 0.75,
    },
  },
};

// 导出类型供其他模块使用
export type { VisualConfig };

