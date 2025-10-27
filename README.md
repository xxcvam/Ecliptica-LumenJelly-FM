# WebFM - FM 合成器 Web 应用

一个现代化的 FM 合成器，采用 React + Web Audio API + AudioWorklet 技术栈，支持实时音频合成、可视化效果和音序器。

## 🎹 特性

### 音频引擎
- **FM 合成** - 频率调制合成核心
- **ADSR 包络** - 完整的攻击/衰减/保持/释放包络
- **LFO 调制** - 低频振荡器，支持 pitch/amp/fmIndex/modRatio 目标
- **Delay 效果** - 立体声延迟效果

### 可视化
- **6 种实时可视化效果**：
  - 🪼 **Jelly** - 水母发光触手
  - 🌫️ **Nebula** - 星云雾气 Shader
  - 🫧 **Bubbles** - 气泡粒子系统
  - 🌊 **CausticSea** - 焦散海洋光效
  - 💠 **NeonGrid** - 霓虹网格
  - 🐋 **ModelStage** - 3D 模型舞台

### 音序器
- **16 步音序器** - 支持多模式（4/4、3/4、5/4）
- **Swing** - 节奏摇摆控制
- **实时编辑** - 音高、门限、概率、Ratchet 控制

### 工厂预设
1. **Sleepy Jellyfish** - 柔和的水母呼吸音
2. **Robot Teacup** - 机械下午茶音色
3. **Foggy Pancake** - 雾蒙蒙的热扁桃音
4. **Submarine Bounce** - 深海低频弹簧
5. **Bubble Pop** - 冒泡糖爆裂声
6. **Ice Cream Bell** - 甜筒车街角钟声
7. **Slow Whale** - 鲸鱼尾鳍尾波
8. **Midnight Arcade** - 午夜街机霓虹

## 🚀 快速开始

### 安装依赖
```bash
cd fm-web
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建
```bash
npm run preview
```

## 🛠️ 技术栈

- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Web Audio API** - 音频处理
- **AudioWorklet** - 低延迟音频线程
- **Three.js** - 3D 图形
- **React Three Fiber** - React 3D 渲染

## 📦 项目结构

```
WebFM/
├── fm-web/                 # 主应用
│   ├── src/
│   │   ├── audio/          # 音频引擎
│   │   │   └── graph.ts   # 音频节点图
│   │   ├── ui/             # UI 组件
│   │   │   ├── Knob.tsx
│   │   │   ├── Slider.tsx
│   │   │   └── Keyboard.tsx
│   │   ├── vis/            # 可视化系统
│   │   │   ├── visuals/   # 可视化组件
│   │   │   ├── shaders/    # GLSL 着色器
│   │   │   └── registry.ts # 可视化注册表
│   │   ├── presets.ts      # 工厂预设
│   │   └── App.tsx         # 主应用
│   ├── public/
│   │   └── fm-voice-processor.js  # AudioWorklet 处理器
│   └── package.json
└── todo.md                  # 项目待办事项
```

## 🎨 可视化映射

每个预设都有对应的视觉效果：

| 预设 | 可视化 |
|-----|--------|
| Sleepy Jellyfish | Jelly |
| Robot Teacup | Bubbles |
| Foggy Pancake | Nebula |
| Submarine Bounce | CausticSea |
| Bubble Pop | Bubbles |
| Ice Cream Bell | NeonGrid |
| Slow Whale | CausticSea |
| Midnight Arcade | NeonGrid |

## 📝 开发状态

- ✅ 音频引擎（FM + ADSR + LFO + Delay）
- ✅ UI 控件（Knob、Slider、Keyboard）
- ✅ 可视化系统（6 种效果）
- ✅ 音序器（16 步 + 多模式）
- ✅ 工厂预设（8 个音色）
- ✅ 移动端优化
- ✅ 性能自适应降级

## 📄 许可证

MIT

## 👤 作者

qiangqian
