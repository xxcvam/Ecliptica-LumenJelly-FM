# TODO — FM 合成器 MVP（Web 端 / React + WebAudio + AudioWorklet）

> 目标：单音 **FM + ADSR + LFO（Pitch/Amp 目标）+ Delay**，移动端可用；后续可扩展 Rust+Wasm 与可视化。  
> 交付标准（DoD）：启动后 1 次手势解锁音频；13 键触控可演奏；8 个工厂预设；Delay 稳定无啸叫；移动端不卡顿。

---

## 0. 初始化（项目骨架）
- [ ] `pnpm create vite fm-web --template react-ts`
- [ ] `cd fm-web && pnpm i && pnpm add classnames`
- [ ] 新建 `public/fm-voice-processor.js`（AudioWorkletProcessor，JS 版）
- [ ] 新建 `src/audio/graph.ts`（装配节点图 + Delay 回路）
- [ ] 新建 `src/ui/`（`Knob.tsx`, `Slider.tsx`, `Keyboard.tsx` 简单控件）
- [ ] 在 `index.html` 引入 `/fm-voice-processor.js` 作为静态资源（由 `graph.ts` 动态加载）

---

## 1. 音频内核（AudioWorklet）
- [ ] 在 `public/fm-voice-processor.js` 实现：
  - [ ] 相位累加：`carrier` 与 `mod`（均为 sine）
  - [ ] FM 方程：`sin(phi_c + index * sin(phi_m))`
  - [ ] ADSR 状态机：`attack -> decay -> sustain -> release`
  - [ ] LFO：`rate/depth` + 目标 `amp|pitch`（±50 cents）
  - [ ] `port.onmessage`：`noteOn(freq) / noteOff()` 与 `set(key,value)`
  - [ ] 立体声输出（同信号复制到双声道）
- [ ] 参数默认值：`carrierHz=220, modRatio=2, fmIndex=60, A=20ms D=120ms S=0.6 R=200ms, lfoRate=5Hz lfoDepth=0.25 target='pitch'`

---

## 2. 节点图与路由（`src/audio/graph.ts`）
- [ ] `initAudio()`：
  - [ ] `AudioContext` 创建 + `audioWorklet.addModule('/fm-voice-processor.js')`
  - [ ] `new AudioWorkletNode('fm-voice-processor', { outputChannelCount:[2] })`
  - [ ] Delay 回路：`DelayNode(max=1.2s)` + `Gain(fb)`；`wet/dry` 双路混合；禁止 `wet=1 && fb>0.7`
  - [ ] `masterGain=-6dB` 上限
  - [ ] 暴露 API：`noteOn(freq) / noteOff() / set(key,value)`；`setDelay(timeMs, feedback, wet)`
- [ ] 导出 `initAudio()` 给 UI 调用

---

## 3. UI（React / Vite）
- [ ] `App.tsx`：
  - [ ] 「Start Audio」按钮（首次手势 → `ctx.resume()`）
  - [ ] 旋钮/推子：`carrierHz`、`modRatio`、`fmIndex`、`A/D/S/R`、`lfoRate/depth/target`、`delay time/feedback/drywet`、`master`
  - [ ] 13 键触控键盘（C2–C4）→ 频率映射
  - [ ] 本地预设：读取/保存 8 槽（`localStorage`）

---

## 4. 预设与数值边界
- [ ] 预设 8 组（示例名）：`E-Piano / MetalBell / SoftPad / BassSolid / Pluck / Glass / Drone / Keys`
- [ ] 参数边界：
  - [ ] `carrierHz: 65–1047`（C2–C6），`modRatio: {0.5,1,2,3}`，`fmIndex: 0–150`
  - [ ] `A/D/R: 0–2000ms, S: 0–1`
  - [ ] `lfoRate: 0.1–12Hz, lfoDepth: 0–1`
  - [ ] `delay time: 30–600ms, fb ≤ 0.8, wet 0–1`

---

## 5. QA 自测
- [ ] 桌面 Chrome + Safari，移动 iOS/Android 各一次
- [ ] 首次点击后可稳定发声；连续快速触发无爆音
- [ ] 极端参数（`fmIndex` 高、`fb` 高、`wet` 高）不破音/不啸叫
- [ ] 页面隐藏/切前台后恢复正常播放

---

## 6. 路线与扩展（放入 Backlog）
- [ ] 多音（Voice Manager：poly=6，简单偷懒抢占）
- [ ] QWERTY 键盘 + Web MIDI
- [ ] React-Three-Fiber 可视化（RMS/频段位移）
- [ ] Rust+Wasm 内核迁移（`wasm-pack`），在 Worklet 线程内实例化
- [ ] 预设快照分享（URL Query/短链）
- [ ] 部署：`vercel` 或 `cloudflare pages`

---
