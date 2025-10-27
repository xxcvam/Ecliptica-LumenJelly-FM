# 🎨 预设 → 可视化自动映射系统

**更新时间**: 2025-10-27  
**状态**: ✅ 已实现

---

## 🎯 功能概述

为 8 个音色预设自动配置匹配的视觉效果，实现**音色切换 = 视觉切换**的无缝体验。

---

## 📋 映射表

| 预设名称 | 音色特点 | 视觉效果 | 视觉特点 |
|---------|---------|---------|---------|
| **Sleepy Jellyfish** | 柔和电钢 | 🪼 Jelly | 水母摆动，发光随音量 |
| **Robot Teacup** | 金属铃声 | 🫖 Model (茶杯) | 金属质感，机械旋转 |
| **Foggy Pancake** | 梦幻垫音 | ☁️ Nebula | 体积星云，雾气流动 |
| **Submarine Bounce** | 深海弹性 | 🌊 CausticSea | 水下焦散，波光粼粼 |
| **Bubble Pop** | 爆裂拨弦 | 🫧 Bubbles | 气泡上升爆破 |
| **Ice Cream Bell** | 清脆铃音 | 🌈 NeonGrid (冰粉) | 霓虹网格，赛博风 |
| **Slow Whale** | 低沉持续 | 🐋 Model (鲸鱼) | 鲸鱼游动 + 海面 |
| **Midnight Arcade** | 高对比键盘 | 🎮 NeonGrid (街机) | 扫描线，高对比 |

---

## 🎨 视觉效果详解

### 1. Jelly (水母) - Sleepy Jellyfish
```typescript
{
  colorA: "#78d0ff",      // 天蓝渐变
  colorB: "#bfa8ff",      // 淡紫渐变
  body: "#9fe3ff",        // 青色身体
  tails: 6,               // 6 条触手
  wobble: 0.3,            // 柔和摆动
  emissive: 0.5           // 中等发光
}
```
**音频响应**:
- RMS → 发光强度
- 中频 → 摆动幅度
- 低频 → 身体脉动

---

### 2. Model (3D 茶杯) - Robot Teacup
```typescript
{
  src: "/models/teacup.glb",  // 茶杯模型
  env: "studio",               // 工作室光照
  metalness: 0.9,              // 高金属度
  roughness: 0.2,              // 低粗糙度（光滑）
  tint: "#9fb7ff",             // 蓝色金属
  bloom: 0.4,                  // 辉光效果
  scale: 1.0
}
```
**音频响应**:
- RMS → 辉光强度
- 中频 → 旋转速度
- 低频 → 轻微振动

---

### 3. Nebula (星云) - Foggy Pancake
```typescript
{
  fog: 0.85,           // 高雾气密度
  swirl: 0.25,         // 缓慢旋涡
  tint: "#a6b8ff",     // 雾紫色
  grain: 0.1,          // 微颗粒感
  highlight: 0.4       // 柔和高光
}
```
**音频响应**:
- RMS → 整体亮度
- 中频 → 旋涡速度
- LFO → 颜色变化

---

### 4. CausticSea (焦散) - Submarine Bounce
```typescript
{
  intensity: 0.9,      // 高焦散强度
  wobble: 0.2,         // 波纹变形
  tint: "#75d0ff",     // 海蓝色
  beams: true          // 启用体积光束
}
```
**音频响应**:
- 中频 → 焦散强度增益
- 低频 → 波纹振幅
- 高频 → 光束闪烁

---

### 5. Bubbles (气泡) - Bubble Pop
```typescript
{
  count: 700,              // 桌面 700 个气泡
  size: [0.01, 0.04],      // 大小范围
  popRate: 0.6,            // 爆裂频率
  rise: 1.0,               // 上升速度
  tint: "#a8d8ff",         // 浅蓝色
  opacity: 0.4             // 半透明
}
```
**音频响应**:
- noteOn → 爆裂触发
- 高频 → 上升加速
- RMS → 生成频率

---

### 6. NeonGrid (冰粉) - Ice Cream Bell
```typescript
{
  color: "#ffd1f0",    // 冰淇淋粉色
  glow: 1.2,           // 高辉光
  grid: 0.8,           // 中等网格密度
  scanline: 0.35,      // 扫描线
  trail: 0.5           // 拖尾效果
}
```
**音频响应**:
- 高频 → 网格闪烁
- 中频 → 扫描线速度
- RMS → 辉光强度

---

### 7. Model (鲸鱼) - Slow Whale
```typescript
{
  src: "/models/whale_low.glb",  // 鲸鱼模型
  env: "sunset",                  // 日落环境
  caustics: 0.9,                  // 海面焦散覆盖
  tint: "#7fd1ff",                // 深海蓝
  bloom: 0.35,                    // 柔和辉光
  scale: 0.9
}
```
**音频响应**:
- 低频 → 游动节奏
- RMS → 焦散波动
- LFO → 上下起伏

---

### 8. NeonGrid (街机) - Midnight Arcade
```typescript
{
  color: "#6cf",       // 街机蓝
  glow: 1.0,           // 标准辉光
  grid: 1.0,           // 密集网格
  scanline: 0.5,       // 明显扫描线
  trail: 0.65,         // 长拖尾
  vignette: 0.75       // 暗角
}
```
**音频响应**:
- 全频段 → 网格脉冲
- 节奏 → 扫描线同步
- RMS → 整体对比度

---

## 💻 技术实现

### 文件结构
```
src/presets/
├── visualMap.ts       # 映射定义 ⭐ 新增
├── map.ts             # 预设映射（现有）
└── README.md          # 使用文档 ⭐ 新增
```

### 核心代码
```typescript
// visualMap.ts
import type { VisualID } from '../vis/registry';

export const visualMap: Record<string, VisualConfig> = {
  "Sleepy Jellyfish": {
    visualId: "jelly",
    params: { /* ... */ }
  },
  // ... 7 个其他映射
};

export const DEFAULT_VISUAL: VisualConfig = {
  visualId: "nebula",
  params: { /* 回退配置 */ }
};
```

### 集成方式
```typescript
// 在 VisualPanel 或 App.tsx 中
import { visualMap, DEFAULT_VISUAL } from './presets/visualMap';

const preset = factoryPresets[currentPresetIndex];
const visual = visualMap[preset.name] ?? DEFAULT_VISUAL;

<VisualHost 
  visualId={visual.visualId}
  audio={audioBus}
  params={visual.params}
/>
```

---

## 🎨 调色板设计

### 配色原则
```typescript
const PALETTE = {
  jelly: {
    a: "#78d0ff",      // 清新天蓝
    b: "#bfa8ff",      // 柔和淡紫
    body: "#9fe3ff"    // 明亮青色
  },
  fog: {
    tint: "#a6b8ff"    // 神秘雾紫
  },
  neon: {
    ice: "#ffd1f0",    // 甜美冰粉
    arcade: "#6cf"     // 复古街机蓝
  },
  sea: {
    tint: "#75d0ff"    // 深邃海蓝
  }
};
```

### 色彩哲学
- **柔和音色** → 冷色调 + 高亮度 (蓝、紫、青)
- **硬朗音色** → 高饱和 + 对比色 (霓虹色)
- **深沉音色** → 低亮度 + 冷色 (深蓝、海蓝)
- **明亮音色** → 暖色点缀 (粉、橙)

---

## 🚀 性能优化

### 模型预加载
```typescript
// 在应用启动时
import { useGLTF } from '@react-three/drei';

useGLTF.preload("/models/teacup.glb");
useGLTF.preload("/models/whale_low.glb");
```

### 移动端自适应
```typescript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const config = {
  ...visualMap[preset.name],
  params: {
    ...visualMap[preset.name].params,
    // 移动端降级
    count: isMobile ? 300 : 700,
    bloom: isMobile ? 0.2 : 0.4,
  }
};
```

---

## 📊 映射统计

| 视觉效果 | 使用次数 | 预设列表 |
|---------|---------|---------|
| **Jelly** | 1 | Sleepy Jellyfish |
| **Model** | 2 | Robot Teacup, Slow Whale |
| **Nebula** | 1 | Foggy Pancake |
| **CausticSea** | 1 | Submarine Bounce |
| **Bubbles** | 1 | Bubble Pop |
| **NeonGrid** | 2 | Ice Cream Bell, Midnight Arcade |

**效果利用率**: 100% (6/6 效果均被使用)

---

## 🎯 设计原则

### 1. 音色与视觉匹配
- **柔和** → 有机形态（水母、星云）
- **尖锐** → 几何结构（网格、模型）
- **爆发** → 粒子系统（气泡）

### 2. 参数音频驱动
所有视觉参数都响应实时音频数据：
- **RMS** → 整体强度/亮度
- **低频** → 大幅度运动
- **中频** → 速度/频率
- **高频** → 细节/闪烁

### 3. 性能平衡
- 复杂效果（3D 模型）与简单效果（网格）交替
- 粒子数量根据设备能力自适应
- 后处理效果可选启用

---

## 🔧 扩展指南

### 添加新预设的视觉映射

```typescript
// 1. 在 presets.ts 中添加预设
export const factoryPresets: Preset[] = [
  // ... 现有预设
  {
    name: "New Preset Name",
    tagline: "描述",
    params: { /* ... */ }
  }
];

// 2. 在 visualMap.ts 中添加映射
export const visualMap: Record<string, VisualConfig> = {
  // ... 现有映射
  "New Preset Name": {
    visualId: "nebula",  // 选择效果
    params: {
      fog: 0.7,
      swirl: 0.4,
      tint: "#custom",
    }
  }
};
```

### 创建自定义视觉效果

```typescript
// 1. 创建效果组件
// src/vis/visuals/MyEffect.tsx
export default function MyEffect({ audio, params }: VisualProps) {
  // 实现效果
}

// 2. 注册到 registry
// src/vis/registry.ts
export const VisualRegistry = {
  // ... 现有注册
  myEffect: () => import('./visuals/MyEffect').then(m => m.default)
};

// 3. 添加到映射
// src/presets/visualMap.ts
"Some Preset": {
  visualId: "myEffect",
  params: { /* custom params */ }
}
```

---

## 📝 维护清单

### 新增预设时
- [ ] 在 `presets.ts` 添加音色预设
- [ ] 在 `visualMap.ts` 添加视觉映射
- [ ] 选择匹配的视觉效果
- [ ] 调整参数以匹配音色特性
- [ ] 测试音频响应效果

### 优化现有映射
- [ ] 根据用户反馈调整参数
- [ ] 优化性能参数
- [ ] 完善音频响应映射
- [ ] 更新文档

### 质量检查
- [ ] 所有预设都有映射
- [ ] 参数值在合理范围
- [ ] 性能在可接受范围
- [ ] 视觉效果符合音色特性

---

## ✅ 实现状态

- [x] 映射系统实现
- [x] 8 个预设配置完成
- [x] 调色板定义
- [x] 默认回退配置
- [x] TypeScript 类型支持
- [x] 使用文档
- [x] 集成示例

---

## 📊 影响评估

### 用户体验
- ✅ **自动化**: 预设切换自动更换视觉
- ✅ **一致性**: 每个音色都有匹配的视觉
- ✅ **专业性**: 精心设计的映射关系

### 开发体验
- ✅ **易扩展**: 添加新预设只需两步
- ✅ **类型安全**: 完整的 TypeScript 支持
- ✅ **文档完善**: 详细的使用说明

### 性能影响
- ✅ **无额外开销**: 映射表是静态数据
- ✅ **按需加载**: 视觉效果懒加载
- ✅ **优化建议**: 提供性能调优指南

---

## 🎉 总结

**预设 → 可视化映射系统**为 FM 合成器增添了灵魂！

- 🎨 **8 个音色** 配备专属视觉
- 🎯 **自动切换** 无缝体验
- 🚀 **易扩展** 插件式架构
- 📚 **文档完善** 使用简单

---

**状态**: ✅ 已实现并测试  
**构建**: ✅ 成功  
**文档**: ✅ 完整  
**可用性**: 🟢 立即可用

---

查看详细文档: [src/presets/README.md](fm-web/src/presets/README.md)

