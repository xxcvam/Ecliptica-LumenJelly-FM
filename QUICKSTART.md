# 🚀 WebFM 快速上手指南

## 1. 准备环境
- Node.js ≥ 18（推荐使用最新 LTS，已内置 npm）
- 建议在项目根目录克隆后通过终端进入 `fm-web/`

```bash
cd /Users/qiangqian/Desktop/ZoeMax/WebFM/fm-web
npm install
```

## 2. 运行开发服务器
```bash
npm run dev
```
- 控制台会打印访问地址（默认 `http://localhost:5173`）
- 第一次进入页面后，点击界面上的「启动音频引擎」按钮以解锁浏览器音频上下文

## 3. 初次体验建议
- **工厂预设**：从 `Redshift Atrium`、`Foggy Pancake`、`Submarine Bounce`、`Bubble Pop`、`Robot Teacup` 开始试听
- **音序器**：
  - 选择音阶与根音，点击 🎲 按钮可生成音乐性序列
  - 调整 Swing、Step Length、Ratchet 体验不同律动
  - 启动播放后可在 Delay 面板打开 BPM 同步，聆听与节奏锁定的回声
- **可视化舞台**：
  - 预设会自动切换到对应视觉
  - 在模型预设中可上传自定义 GLB/GLTF 模型，失败时会自动回退至备用可视化

## 4. 更多脚本
- `npm run build`：生成生产构建到 `dist/`
- `npm run preview`：本地预览打包结果
- `npm run lint`：运行 ESLint（TypeScript + React 规则）

## 5. 关键功能速览
- **音频引擎**：AudioWorklet FM 合成、ADSR、LFO（可调制 `pitch`/`amp`/`fmIndex`/`modRatio`/`delayTime`）、立体声 Delay、PreDelay
- **可视化系统**：六套 R3F 场景（Nebula/Bubbles/CausticSea/Jelly/ModelStage/Control Atrium），响应音频能量
- **音序器**：16 步、Forward/Ping-Pong/Random 模式、概率/力度/门限/Ratchet 控制、智能随机、音阶量化

## 6. 常见问题排查
- **没有声音**：确认已点击「启动音频引擎」，并保持浏览器标签页为激活状态
- **音频破音或啸叫**：检查 Delay 反馈是否接近 0.8，必要时降低湿度
- **模型加载失败**：参阅 `MODEL_GUIDE.md`，确认文件小于 10MB 且为 glTF/GLB 格式
- **浏览器兼容性**：推荐 Chrome/Edge 120+、Safari 16.4+、Firefox 120+

## 7. 生产部署
```bash
npm run build
npm run preview   # 可选，检查 dist 输出
```
将 `dist/` 目录上传至任意静态托管服务（Vercel、Netlify、GitHub Pages 等）即可部署。

Happy Synthesizing! 🎹✨
