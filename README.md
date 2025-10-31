# Ecliptica LumenJelly FM

现代化的 FM 合成器 Web 应用，将 Web Audio、AudioWorklet 与实时 3D 可视化融合在同一界面中。

## 🎹 核心特性

### 音频引擎
- **FM 合成核心**：AudioWorklet 驱动的低延迟载波/调制器实现
- **包络与调制**：全参数 ADSR、LFO 目标支持 `pitch`/`amp`/`fmIndex`/`modRatio`/`delayTime`
- **立体声 Delay**：Ping-Pong 延迟、BPM 同步、音符时值选择、可选 PreDelay
- **参数保护**：延迟反馈与输出增益均有安全上限，避免啸叫或削波

### LumenJelly 可视化系统
- **6 种实时视觉**：Nebula、Bubbles、CausticSea、Jelly、ModelStage、Control Atrium
- **3D 模型舞台**：加载自定义 glTF/GLB，线框/PBR 两种渲染风格与 Fallback 机制
- **音频驱动**：RMS/频段 FFT 驱动光照、粒子、体积雾等视觉反馈
- **性能自适应**：质量参数自动降级，适配移动端与低性能设备

### 音序器与智能随机
- **16 步音序器**：Forward / Ping-Pong / Random 播放模式与 swing 控制
- **音阶量化**：24 个根音 × 多音阶（五声、民族、爵士等）自动量化
- **富参数步进**：每步音高、力度、门限、概率、Ratchet（多触发）可独立编辑
- **智能随机**：内置 🎲 算法根据音阶特性生成音乐性序列，支持再次迭代

### 工厂预设与视觉映射
- Redshift Atrium ↔ Control Atrium (Void)
- Foggy Pancake ↔ Nebula
- Submarine Bounce ↔ CausticSea
- Bubble Pop ↔ Bubbles
- Robot Teacup ↔ Model Stage (线框杯具)

## 🚀 快速上手

### 环境需求
- Node.js ≥ 18（建议使用最新的 LTS 版本）
- npm 10+（随 Node 一起提供）

### 安装与开发
```bash
cd fm-web
npm install
npm run dev
```
开发服务器默认运行在 `http://localhost:5173`。

### 其他脚本
- `npm run build`：生成生产构建（输出在 `dist/`）
- `npm run preview`：本地预览构建产物
- `npm run lint`：运行 ESLint 代码检查

## 🗂️ 项目结构

```
Ecliptica-LumenJelly-FM/
├── fm-web/                        # 主应用
│   ├── public/
│   │   └── fm-voice-processor.js  # AudioWorklet 处理器
│   ├── src/
│   │   ├── audio/                 # 音频图、延迟、LFO 等逻辑
│   │   ├── sequencer/             # 16 步音序器与随机生成
│   │   ├── presets/               # 预设与视觉映射
│   │   ├── ui/                    # UI 控件（Knob、Slider、Keyboard ...）
│   │   ├── vis/                   # R3F 可视化系统
│   │   ├── App.tsx                # 应用入口
│   │   └── main.tsx               # React 入口
│   ├── package.json
│   └── vite.config.ts
├── README.md                      # 项目概览（本文件）
├── QUICKSTART.md                  # 操作说明
├── RANDOMIZER_GUIDE.md            # 音序器随机指南
├── CONTROL_SYSTEM.md              # 控制系统概述
└── TROUBLESHOOTING.md             # 常见问题
```

## 📚 更多文档
- `RANDOMIZER_GUIDE.md`：音序器智能随机策略
- `TROUBLESHOOTING.md`：环境、权限、音频相关问题排查

## 🛠️ 技术栈
- React 19 + TypeScript 5
- Vite 7 + ESLint 9
- Web Audio API + AudioWorklet
- Three.js 0.180 + React Three Fiber + @react-three/drei
- Zustand 状态管理

## 📄 许可证

MIT
