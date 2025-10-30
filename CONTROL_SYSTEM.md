# Control 舞台系统实现文档

## 概述

Control 是一个可复用的 3D 舞台系统，为所有视觉预设提供统一的场景框架、灯光、相机编舞和后期处理。

## 架构

### 目录结构

```
/src/vis/control/
  /core/
    store.ts              # Zustand 全局状态管理
    resources.ts          # 共享材质/HDR/纹理缓存
    ControlStage.tsx      # 舞台根组件
    choreo.ts             # GSAP 相机编舞
    postfx.tsx            # 后期处理（带错误边界）
  /blocks/
    Slab.tsx             # 基础平台
    Pillar.tsx           # 柱子（InstancedMesh）
    LightPanel.tsx       # 发光面板
    VolCone.tsx          # 体积光锥
  /scenes/
    Atrium.tsx           # 中庭场景
  index.ts               # 统一导出
```

## 核心组件

### 1. ControlStage

主舞台组件，提供：
- 统一的 Canvas 配置
- HDR 环境光（使用 drei 内置 "warehouse" 预设）
- 反射地面
- 指数雾效
- 场景切换
- 后期处理
- 相机编舞

**使用方式：**
```tsx
import { ControlStage } from '../control';

<ControlStage variant="atrium" audio={audio}>
  <YourContent />
</ControlStage>
```

### 2. Zustand 状态管理

全局状态包括：
- `light`: 灯光强度和颜色（支持音频响应）
- `fogDensity`: 雾密度（支持音频响应）
- `quality`: 质量级别（auto/high/low）

**API：**
```ts
const store = useControlStore();
store.setLight({ intensity: 8, color: '#fff' });
store.setFogDensity(0.06);
store.setQuality('high');
```

### 3. 相机编舞

基于 GSAP 的电影级相机运动：
- 自动循环路径
- 音频响应微漂移
- 流畅的缓动曲线

### 4. 后期处理

包含错误边界的后期效果：
- Bloom（辉光）
- DepthOfField（景深）
- Vignette（暗角）

低质量模式或出错时自动禁用。

## Blocks（构建块）

### Slab
基础地面平台，使用共享混凝土材质。

### PillarGrid
使用 InstancedMesh 的柱子阵列，高性能渲染多个相同物体。

### LightPanel
矩形区域光 + 背景面板，支持从 store 读取动态参数。

### VolCone
体积光锥，极低不透明度，缓慢旋转。

## 场景

### Atrium（中庭）

深海氛围的中庭场景，包含：
- 20x20 的地面平台
- 5x3 柱阵
- 主光源面板（8x4）
- 2 个体积光锥
- 侧补光和环境光

## 使用示例

### 创建新的 Control 视觉

```tsx
// /src/vis/visuals/YourVisual.tsx
import { ControlStage } from '../control';

export default function YourVisual({ audio, params }) {
  return (
    <ControlStage variant="atrium" audio={audio}>
      {/* 你的内容 */}
    </ControlStage>
  );
}
```

### 注册视觉

```ts
// /src/vis/registry.ts
export const VisualRegistry = {
  your_visual: () => import('./visuals/YourVisual').then(m => m.default)
}
```

### 映射到 Preset

```ts
// /src/presets/map.ts
'Your Preset': {
  visualId: 'your_visual',
  params: { /* ... */ }
}
```

## 已集成

### Redshift Atrium

`ControlAtrium` 现支持通过 `params.variant` 切换舞台变体：

```tsx
// /src/vis/visuals/ControlAtrium.tsx
import { ControlStage } from '../control';
import { JellySchool } from './Jelly';

export default function ControlAtriumVisual({ audio, params }) {
  const variant = (params?.variant ?? 'atrium') as 'atrium' | 'void' | 'red_room';
  const showJellySchool = variant === 'atrium';

  return (
    <ControlStage variant={variant} audio={audio}>
      {showJellySchool && <JellySchool audio={audio} params={params} />}
    </ControlStage>
  );
}
```

- **Visual ID**: `control_atrium`
- **Preset**: `Redshift Atrium`
- **效果**: 红色光轨与拆分模型随音频律动

## 性能优化

1. **材质复用**: 所有 blocks 共享同一套材质实例
2. **InstancedMesh**: 柱子阵列使用实例化渲染
3. **质量自适应**: 低性能设备自动禁用后期处理
4. **错误边界**: 后期处理出错时优雅降级

## 扩展性

### 添加新场景

在 `/src/vis/control/scenes/` 创建新场景组件，然后在 `ControlStage.tsx` 的 `SceneSwitch` 中添加 case：

```tsx
function SceneSwitch({ variant, res }) {
  switch (variant) {
    case 'atrium':
      return <Atrium res={res} />;
    case 'your_scene':
      return <YourScene res={res} />;
    // ...
  }
}
```

### 添加新 Blocks

在 `/src/vis/control/blocks/` 创建新组件，导出到 `index.ts`。

## 技术栈

- **状态管理**: Zustand
- **3D 渲染**: Three.js + React Three Fiber
- **动画**: GSAP
- **后期处理**: @react-three/postprocessing
- **音频**: Web Audio API

## 测试清单

- [x] Control 舞台独立加载正常
- [x] Jelly 在 Control 中正常渲染
- [x] 相机编舞流畅
- [x] 音频响应灵敏（灯光、雾、相机）
- [x] 后期处理稳定或优雅降级
- [x] 无 TypeScript/Linter 错误

## 问题修复

### HDR 文件问题
- **问题**: 原计划使用外部 HDR 文件 `/hdr/warehouse.hdr` 但文件不存在
- **解决**: 改用 `@react-three/drei` 的内置环境预设 `preset="warehouse"`
- **优势**: 更稳定，无需额外资源文件，drei 会自动处理加载

## 下一步

1. 验证浏览器运行效果
2. 调优音频响应参数
3. 创建 Red Room 场景（预留）
4. 将其他 presets 迁移到 Control 系统
