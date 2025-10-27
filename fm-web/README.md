# 🎹 FM 合成器 - Web Audio MVP

基于 React + TypeScript + WebAudio + AudioWorklet 的 FM（频率调制）合成器。

## ✨ 特性

- 🎵 **FM 合成引擎**：使用 AudioWorklet 实现低延迟 FM 合成
- 📊 **ADSR 包络**：完整的 Attack、Decay、Sustain、Release 控制
- 🌊 **LFO 调制**：可调制音高或音量
- ⏱️ **Delay 效果**：内置延迟效果器，带反馈和混合控制
- 🎨 **8 个工厂预设**：E-Piano、MetalBell、SoftPad、BassSolid、Pluck、Glass、Drone、Keys
- 🎆 **双层音频可视化**：Shader 全屏背景 + Canvas 示波器，随音频实时驱动
- 📱 **移动端优化**：支持触摸操作，响应式设计
- 🎹 **虚拟键盘**：13 键触控键盘（C2 - C4）

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 🎛️ 使用说明

1. **启动音频**：首次访问时点击「启动音频引擎」按钮以解锁浏览器音频上下文
2. **选择预设**：点击预设按钮快速加载不同音色
3. **调整参数**：
   - **调制比率**：控制调制器与载波的频率比
   - **FM 深度**：控制频率调制的强度
   - **ADSR**：调整包络形状
   - **LFO**：控制低频振荡器的频率、深度和目标
   - **Delay**：调整延迟时间、反馈和混合比例
4. **演奏**：点击或触摸虚拟键盘演奏音符

## 📁 项目结构

```
fm-web/
├── public/
│   └── fm-voice-processor.js   # AudioWorklet 处理器
├── src/
│   ├── audio/
│   │   └── graph.ts             # 音频图和路由管理
│   ├── ui/
│   │   ├── Knob.tsx            # 旋钮控件
│   │   ├── Slider.tsx          # 滑块控件
│   │   └── Keyboard.tsx        # 虚拟键盘
│   ├── App.tsx                 # 主应用
│   ├── App.css                 # 样式
│   ├── presets.ts              # 预设定义
│   └── main.tsx                # 入口文件
└── index.html
```

## 🎵 FM 合成原理

FM 合成使用一个振荡器（调制器）来调制另一个振荡器（载波）的频率：

```
output = sin(2π * carrier_phase + fm_index * sin(2π * modulator_phase))
```

- **载波频率**：决定基础音高
- **调制比率**：调制器频率 = 载波频率 × 调制比率
- **FM 深度**：控制调制的强度（谐波丰富度）

## 🎚️ 参数范围

| 参数 | 最小值 | 最大值 | 说明 |
|------|--------|--------|------|
| 调制比率 | 0.5 | 3 | 调制器/载波频率比 |
| FM 深度 | 0 | 150 | 调制强度 |
| Attack | 0s | 2s | 起音时间 |
| Decay | 0s | 2s | 衰减时间 |
| Sustain | 0 | 1 | 持续电平 |
| Release | 0s | 2s | 释放时间 |
| LFO 频率 | 0.1Hz | 12Hz | 低频振荡器频率 |
| LFO 深度 | 0 | 1 | 调制深度 |
| Delay 时间 | 30ms | 600ms | 延迟时间 |
| Delay 反馈 | 0 | 0.8 | 反馈量（限制避免啸叫） |
| Delay 混合 | 0 | 1 | 干湿比 |

## 🔧 技术栈

- **React 18** + **TypeScript**
- **Vite** - 快速构建工具
- **Web Audio API** - 音频处理
- **AudioWorklet** - 低延迟音频处理
- **Three.js** + **React-Three-Fiber** - WebGL 可视化
- **CSS3** - 现代样式和响应式设计

## 📱 浏览器兼容性

- ✅ Chrome/Edge 66+
- ✅ Firefox 76+
- ✅ Safari 14.1+
- ✅ iOS Safari 14.5+
- ✅ Android Chrome 66+

## 🔮 未来扩展（Backlog）

- [ ] 多音复音支持（Polyphony）
- [ ] QWERTY 键盘映射
- [ ] Web MIDI 支持
- [ ] React-Three-Fiber 音频可视化
- [ ] Rust + Wasm 内核迁移
- [ ] 预设分享（URL Query）
- [ ] 录音功能
- [ ] 更多效果器（混响、滤波器）

## 📄 许可证

MIT

## 👨‍💻 开发者

Built with ❤️ using React + WebAudio
