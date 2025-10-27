# 预设系统 - 使用指南

## 📁 文件结构

```
presets/
├── visualMap.ts          # 预设 → 可视化映射
├── map.ts                # 预设映射（现有）
└── README.md             # 本文档
```

---

## 🎨 视觉映射系统

### 概述

`visualMap.ts` 提供了**音色预设到视觉效果的自动映射**，让每个音色都有匹配的视觉呈现。

### 映射表

| 预设名称 | 视觉效果 | 特点 |
|---------|---------|------|
| **Sleepy Jellyfish** | Jelly (水母) | 柔和摆动，发光随 RMS |
| **Robot Teacup** | Model (3D 模型) | 金属质感茶杯 |
| **Foggy Pancake** | Nebula (星云) | 体积雾气，梦幻氛围 |
| **Submarine Bounce** | CausticSea (焦散) | 水下光影效果 |
| **Bubble Pop** | Bubbles (气泡) | 上升爆裂粒子 |
| **Ice Cream Bell** | NeonGrid (霓虹) | 赛博朋克网格 |
| **Slow Whale** | Model (3D 模型) | 鲸鱼 + 海面焦散 |
| **Midnight Arcade** | NeonGrid (霓虹) | 高对比街机风格 |

---

## 💻 使用方法

### 基础用法

```tsx
import { visualMap, DEFAULT_VISUAL } from '@/presets/visualMap';
import { factoryPresets } from '@/presets';

// 1. 获取当前预设
const currentPreset = factoryPresets[0]; // Sleepy Jellyfish

// 2. 查找对应的视觉配置
const visualConfig = visualMap[currentPreset.name] ?? DEFAULT_VISUAL;

// 3. 应用到 VisualHost
<VisualHost 
  visualId={visualConfig.visualId}
  audio={audioBus}
  params={visualConfig.params}
/>
```

### 在 VisualPanel 中集成

```tsx
// src/vis/VisualPanel.tsx
import { visualMap, DEFAULT_VISUAL } from '../presets/visualMap';
import { factoryPresets } from '../presets';

function VisualPanel({ currentPresetIndex }) {
  const preset = factoryPresets[currentPresetIndex];
  const visualConfig = visualMap[preset.name] ?? DEFAULT_VISUAL;
  
  return (
    <VisualHost 
      visualId={visualConfig.visualId}
      audio={audioBus}
      params={visualConfig.params}
    />
  );
}
```

### 在 App.tsx 中集成

```tsx
// src/App.tsx
import { visualMap, DEFAULT_VISUAL } from './presets/visualMap';

function App() {
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
  const currentPreset = factoryPresets[currentPresetIndex];
  const visualConfig = visualMap[currentPreset.name] ?? DEFAULT_VISUAL;
  
  return (
    <div>
      {/* 可视化层 */}
      <VisualHost 
        visualId={visualConfig.visualId}
        audio={audioBus}
        params={visualConfig.params}
      />
      
      {/* 控制面板 */}
      <PresetSelector onChange={setCurrentPresetIndex} />
    </div>
  );
}
```

---

## 🎛️ 参数说明

### Jelly (水母)

```typescript
{
  colorA: string;      // 颜色 A (渐变起点)
  colorB: string;      // 颜色 B (渐变终点)
  body: string;        // 身体主色
  tails: number;       // 触手数量 (4-8)
  wobble: number;      // 摆动强度 (0-1)
  emissive: number;    // 自发光强度 (0-1)
}
```

### Model (3D 模型)

```typescript
{
  src: string;         // glTF 模型路径
  env: string;         // 环境光照 (studio/sunset/night)
  metalness: number;   // 金属度 (0-1)
  roughness: number;   // 粗糙度 (0-1)
  tint: string;        // 着色
  bloom: number;       // 辉光强度 (0-1)
  scale: number;       // 缩放比例
  caustics?: number;   // 焦散强度 (可选)
}
```

### Nebula (星云)

```typescript
{
  fog: number;         // 雾气密度 (0-1)
  swirl: number;       // 旋涡强度 (0-1)
  tint: string;        // 主色调
  grain: number;       // 颗粒感 (0-1)
  highlight: number;   // 高光强度 (0-1)
}
```

### CausticSea (焦散海洋)

```typescript
{
  intensity: number;   // 焦散强度 (0-1)
  wobble: number;      // 波纹变形 (0-1)
  tint: string;        // 水色
  beams: boolean;      // 是否显示体积光束
}
```

### Bubbles (气泡)

```typescript
{
  count: number;       // 气泡数量 (桌面: 500-1000, 移动: 200-400)
  size: [number, number]; // 大小范围 [min, max]
  popRate: number;     // 爆裂频率 (0-1)
  rise: number;        // 上升速度基数
  tint: string;        // 气泡色调
  opacity: number;     // 不透明度 (0-1)
}
```

### NeonGrid (霓虹网格)

```typescript
{
  color: string;       // 主色
  glow: number;        // 辉光强度 (0-2)
  grid: number;        // 网格密度 (0-1)
  scanline: number;    // 扫描线强度 (0-1)
  trail: number;       // 拖尾效果 (0-1)
  vignette?: number;   // 暗角强度 (可选)
}
```

---

## 🎨 调色板

预定义的配色方案：

```typescript
const PALETTE = {
  jelly: {
    a: "#78d0ff",      // 天蓝
    b: "#bfa8ff",      // 淡紫
    body: "#9fe3ff"    // 青色
  },
  fog: {
    tint: "#a6b8ff"    // 雾紫
  },
  neon: {
    ice: "#ffd1f0",    // 冰粉
    arcade: "#6cf"     // 街机蓝
  },
  sea: {
    tint: "#75d0ff"    // 海蓝
  }
};
```

---

## 🔧 扩展指南

### 添加新的视觉映射

```typescript
// visualMap.ts
export const visualMap: Record<string, VisualConfig> = {
  // ... 现有映射
  
  // 新增预设
  "New Preset Name": {
    visualId: "nebula",  // 选择效果
    params: {
      // 自定义参数
      fog: 0.6,
      swirl: 0.4,
      tint: "#ff6b9d",
    },
  },
};
```

### 创建自定义调色板

```typescript
const MY_PALETTE = {
  sunset: { a: "#ff6b9d", b: "#ffa06b" },
  ocean: { a: "#4d9de0", b: "#7768ae" },
};

// 在映射中使用
"My Preset": {
  visualId: "jelly",
  params: {
    colorA: MY_PALETTE.sunset.a,
    colorB: MY_PALETTE.sunset.b,
  },
}
```

### 模型预加载（优化性能）

```typescript
// 在应用启动时预加载
import { useGLTF } from '@react-three/drei';

// App.tsx 或 main.tsx
useGLTF.preload("/models/teacup.glb");
useGLTF.preload("/models/whale_low.glb");
```

---

## 📊 性能建议

### 桌面端
- 气泡数量：500-1000
- 模型多边形：< 50k
- 纹理分辨率：2048×2048

### 移动端
- 气泡数量：200-400
- 模型多边形：< 20k
- 纹理分辨率：1024×1024
- 考虑禁用某些后处理（bloom, caustics）

### 自适应策略

```typescript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const visualConfig = {
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

## 🎯 最佳实践

### 1. 保持一致性
每个音色类别应该有视觉上的连贯性：
- **柔和音色** → 流动/有机形态 (Jelly, Nebula)
- **硬朗音色** → 几何/结构化 (NeonGrid, Model)
- **动态音色** → 粒子/爆发 (Bubbles)

### 2. 音频响应
确保视觉参数与音频特性匹配：
- **低频主导** → 大幅度运动 (wobble, intensity)
- **中频丰富** → 色彩变化 (tint, glow)
- **高频活跃** → 细节动画 (particles, scanlines)

### 3. 性能优化
- 使用 `React.memo` 包装重渲染的组件
- 懒加载大型 3D 模型
- 根据设备能力调整参数

---

## 🚀 快速测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器
# http://localhost:5173

# 3. 切换预设观察视觉变化
# 每个预设应该自动切换到对应的视觉效果
```

---

## 📝 维护清单

- [ ] 定期审查映射关系
- [ ] 优化性能参数
- [ ] 添加新预设时同步更新
- [ ] 测试所有映射组合
- [ ] 更新文档

---

**映射系统已就绪！** 🎨✨

每个预设现在都有专属的视觉灵魂！

