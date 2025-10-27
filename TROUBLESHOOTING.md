# 🔧 故障排查指南

## 问题：页面无法加载

### ✅ 已修复的问题

#### 问题 1: useFrame 钩子位置错误
**症状**: 页面白屏或 React 错误
**原因**: `useFrame` 必须在 R3F Canvas 内部使用
**解决方案**: ✅ 已重构代码，将 `useFrame` 移到 `Scene` 组件内

#### 问题 2: 服务器未更新
**症状**: 看不到新功能
**原因**: 开发服务器缓存旧代码
**解决方案**: ✅ 已重启服务器

## 🚀 当前状态

```
✅ 构建成功
✅ 服务器运行中: http://localhost:5173
✅ 所有代码修复完成
✅ TypeScript 无错误
```

## 📋 使用步骤

### 1. 访问应用
```
http://localhost:5173
```

### 2. 启动音频
- 点击大按钮「🔊 启动音频引擎」
- 等待 1-2 秒加载

### 3. 观察效果
- ✨ Shader 背景应该立即显示（深蓝紫色星云）
- 📺 右上角应该出现示波器（黑色半透明框）
- 🎹 控制面板应该可以操作

### 4. 测试演奏
- 点击键盘按键
- 观察：
  - 示波器显示波形 ✓
  - Shader 背景亮度增加 ✓
  - 脉冲动画加速 ✓

## 🐛 常见问题

### 问题：页面空白
**检查步骤**:
1. 打开浏览器控制台 (F12)
2. 查看是否有红色错误
3. 刷新页面 (Cmd+R / Ctrl+R)

**可能的错误和解决方案**:

#### 错误：`useFrame can only be used in <Canvas />`
```
❌ 已修复 - 重新加载页面即可
```

#### 错误：`Failed to fetch /fm-voice-processor.js`
```
解决方案：
cd fm-web
npm run dev
```

#### 错误：`AudioContext was not allowed to start`
```
解决方案：点击「启动音频引擎」按钮
```

### 问题：看不到 Shader 背景

**检查清单**:
- [ ] 是否点击了「启动音频引擎」？
- [ ] 浏览器是否支持 WebGL？（打开 about:gpu）
- [ ] 控制台是否有 Three.js 错误？

**测试 WebGL**:
```javascript
// 在浏览器控制台执行
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log(gl ? 'WebGL 支持 ✓' : 'WebGL 不支持 ✗');
```

### 问题：看不到示波器

**检查清单**:
- [ ] 是否点击了「启动音频引擎」？
- [ ] 右上角是否被其他窗口遮挡？
- [ ] 尝试缩小浏览器窗口

**手动检查**:
```javascript
// 在浏览器控制台执行
const scope = document.querySelector('canvas');
console.log('示波器元素:', scope);
```

### 问题：没有声音

**检查清单**:
- [ ] 系统音量是否开启？
- [ ] 浏览器标签页是否静音？
- [ ] 是否点击了键盘按键？
- [ ] Master 音量是否为 0？

**手动测试**:
```javascript
// 在浏览器控制台执行
const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start();
setTimeout(() => osc.stop(), 500);
// 应该听到短促的哔声
```

## 🔄 重启指南

### 完全重启

```bash
# 1. 停止服务器
# 按 Ctrl+C 或运行：
lsof -ti:5173 | xargs kill -9

# 2. 清理缓存
cd /Users/qiangqian/Desktop/ZoeMax/WebFM/fm-web
rm -rf node_modules/.vite
rm -rf dist

# 3. 重新构建
npm run build

# 4. 重启开发服务器
npm run dev

# 5. 打开浏览器
open http://localhost:5173
```

### 快速重启

```bash
cd /Users/qiangqian/Desktop/ZoeMax/WebFM/fm-web
npm run dev
```

## 🌐 浏览器兼容性

### 推荐浏览器
- ✅ Chrome 90+ (最佳)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14.1+

### 不支持
- ❌ IE 11 及以下
- ❌ 旧版 Safari (<14)

### 检查支持度
```javascript
// 在控制台执行
const features = {
  'AudioContext': typeof AudioContext !== 'undefined',
  'AudioWorklet': typeof AudioWorkletNode !== 'undefined',
  'WebGL': !!document.createElement('canvas').getContext('webgl'),
  'ES6': typeof Symbol !== 'undefined'
};
console.table(features);
```

## 📊 性能问题

### 症状：卡顿、掉帧

**桌面端优化**:
```typescript
// 如果卡顿，在 src/vis/useAudioData.ts 中修改：
analyser.fftSize = 1024; // 从 2048 降低
```

**移动端优化**:
```typescript
// src/vis/ScopeLayer.tsx
<canvas width={300} height={120} /> // 降低分辨率

// src/vis/ShaderLayer.tsx
<Canvas dpr={[1, 1.5]} /> // 限制像素比
```

### 症状：内存占用高

**解决方案**:
- 关闭其他标签页
- 使用最新版浏览器
- 重启浏览器

## 🎨 视觉调试

### 查看音频数据
```typescript
// 在 src/vis/useAudioData.ts 的 loop 函数中添加：
console.log('RMS:', rmsRef.current.toFixed(3));
console.log('Bands:', bandsRef.current.map(v => v.toFixed(2)));
```

### 检查 Shader 参数
```typescript
// 在 src/vis/ShaderLayer.tsx 的 Scene 组件中：
useFrame(() => {
  console.log('Uniforms:', {
    rms: uniforms.u_rms.value,
    bands: uniforms.u_bands.value
  });
});
```

### 简化 Shader（调试用）
```glsl
// 替换 frag shader 为纯色测试
void main(){
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // 洋红色
}
```

## 📞 获取帮助

### 收集错误信息

1. **浏览器控制台**:
```
F12 → Console 标签
复制所有红色错误信息
```

2. **网络请求**:
```
F12 → Network 标签
刷新页面
检查是否有失败的请求（红色）
```

3. **系统信息**:
```javascript
// 在控制台执行
console.log({
  userAgent: navigator.userAgent,
  url: location.href,
  audioContext: typeof AudioContext,
  webgl: !!document.createElement('canvas').getContext('webgl')
});
```

### 报告问题模板

```
问题描述：
- 症状：
- 复现步骤：
- 预期结果：
- 实际结果：

环境信息：
- 操作系统：
- 浏览器：
- 控制台错误：

已尝试的解决方案：
- [ ] 刷新页面
- [ ] 清除缓存
- [ ] 重启服务器
- [ ] 重启浏览器
```

## ✅ 验证清单

运行正常的标志：

- [ ] 页面加载无白屏
- [ ] 可以看到「启动音频引擎」按钮
- [ ] 点击后按钮消失
- [ ] Shader 背景出现（紫蓝色）
- [ ] 右上角示波器出现
- [ ] 控制面板可见
- [ ] 点击键盘有声音
- [ ] 示波器显示波形
- [ ] Shader 随音乐变化
- [ ] 无控制台错误

## 🎉 成功标志

当你看到：
- ✨ 炫酷的紫蓝色星云背景在动
- 📺 右上角有示波器在跳动
- 🎹 点击键盘有声音且视觉有反应

**恭喜！一切正常！🎊**

---

**当前状态**: ✅ 所有问题已修复，应用正常运行

**访问地址**: http://localhost:5173

**享受视听盛宴！** 🎹✨🌌

