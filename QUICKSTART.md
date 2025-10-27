# 🚀 FM 合成器快速启动指南

## 项目位置

```
/Users/qiangqian/Desktop/ZoeMax/WebFM/fm-web/
```

## 启动步骤

1. **进入项目目录**
```bash
cd /Users/qiangqian/Desktop/ZoeMax/WebFM/fm-web
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **打开浏览器**
   - 访问显示的本地地址（通常是 `http://localhost:5173`）

4. **使用合成器**
   - 点击「启动音频引擎」按钮
   - 选择预设或调整参数
   - 点击键盘演奏

## 项目特性 ✨

### 核心功能
- ✅ FM 合成引擎（AudioWorklet 实现）
- ✅ ADSR 包络控制
- ✅ LFO 调制（音高/音量）
- ✅ Delay 效果器
- ✅ 8 个工厂预设
- ✅ 13 键虚拟键盘（C2-C4）
- ✅ 移动端触摸支持

### 预设列表
1. **E-Piano** - 电钢琴音色
2. **MetalBell** - 金属铃声
3. **SoftPad** - 柔和垫音
4. **BassSolid** - 扎实贝斯
5. **Pluck** - 拨弦音色
6. **Glass** - 玻璃质感
7. **Drone** - 持续音
8. **Keys** - 键盘音色

## 技术实现

### 文件结构
```
fm-web/
├── public/
│   └── fm-voice-processor.js    # AudioWorklet 音频处理器
├── src/
│   ├── audio/
│   │   └── graph.ts              # 音频图管理
│   ├── ui/
│   │   ├── Knob.tsx             # 旋钮组件
│   │   ├── Slider.tsx           # 滑块组件
│   │   └── Keyboard.tsx         # 键盘组件
│   ├── App.tsx                  # 主应用
│   ├── App.css                  # 样式
│   └── presets.ts               # 预设定义
└── index.html
```

### AudioWorklet 处理器
- **相位累加**：载波 + 调制器
- **FM 方程**：`sin(φc + index × sin(φm))`
- **ADSR 状态机**：完整的包络实现
- **LFO**：支持音高和音量调制
- **立体声输出**

### 音频路由
```
Worklet → Dry → Master → Output
       ↓
       Delay → Wet → Master
         ↑
       Feedback ←
```

### 安全限制
- 主增益限制为 -6dB (0.5)
- Delay 反馈最大 0.8（防止啸叫）
- 当 wet ≥ 0.99 且 feedback > 0.7 时自动限制

## 参数说明

### FM 合成
- **调制比率** (0.5-3)：决定谐波结构
- **FM 深度** (0-150)：控制音色丰富度

### ADSR
- **Attack** (0-2s)：起音时间
- **Decay** (0-2s)：衰减时间
- **Sustain** (0-1)：持续电平
- **Release** (0-2s)：释放时间

### LFO
- **频率** (0.1-12 Hz)：振荡速度
- **深度** (0-1)：调制强度
- **目标**：音高或音量

### Delay
- **时间** (30-600 ms)：延迟时长
- **反馈** (0-0.8)：回声次数
- **混合** (0-1)：干湿比

## 移动端使用

- ✅ 响应式设计
- ✅ 触摸操作支持
- ✅ 防止页面缩放
- ✅ iOS Safari 兼容
- ✅ Android Chrome 兼容

## 常见问题

### 无声音？
1. 确保点击了「启动音频引擎」
2. 检查设备音量
3. 尝试刷新页面

### 移动端卡顿？
- AudioWorklet 已优化性能
- 避免极端参数（如 FM 深度过高）

### 浏览器兼容性
- Chrome/Edge 66+
- Firefox 76+
- Safari 14.1+
- iOS Safari 14.5+

## 下一步

- 🎵 尝试不同的预设
- 🎛️ 调整参数创造自己的音色
- 📱 在移动设备上测试
- 🔧 查看代码实现细节

## 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任何静态托管服务。

---

Happy Synthesizing! 🎹✨

