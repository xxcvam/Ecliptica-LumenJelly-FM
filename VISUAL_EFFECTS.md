# ⚡ 未来感视觉冲击特效

## 设计哲学

> **"平时低调，悬停爆发"**

灵感来自 **Tron / Cyberpunk / 音乐可视化工具**，实现三重视觉冲击：
1. **霓虹扫光**：光剑般的青-洋红光束扫过
2. **边框流光**：高科技芯片外壳般的流动边框
3. **色彩爆发**：从灰度瞬间爆发到超饱和色彩

---

## 🎯 效果演示

### **默认状态（去色）**

```
┌─────────────────────────┐
│                         │
│   [灰度 Banner 图]     │  ← 低调优雅
│   brightness: 60%       │
│                         │
└─────────────────────────┘
```

- 完全去色（grayscale: 100%）
- 降低亮度至 60%
- 降低对比度至 80%
- 呈现低调的灰度美学

---

### **鼠标悬停（爆发）**

```
    ╔═══════════════════════╗  ← 青-洋红流光边框（循环）
    ║    🌈 ⚡ 💫          ║
    ║ ═══════>             ║  ← 霓虹光束扫过（0.8秒）
    ║  [全彩 Banner 图]   ║  ← 色彩爆发 + 能量脉冲
    ║   brightness: 120%   ║
    ╚═══════════════════════╝
          ↑ 抬起 4px
```

**三重特效同时触发：**
1. **霓虹扫光**：左→右扫过（0.8秒）
2. **边框流光**：持续循环（2秒/周期）
3. **色彩爆发**：灰度→超饱和（0.6秒）+ 能量脉冲（1.5秒循环）

---

## ⚡ 特效详解

### **1. 霓虹扫光（Neon Sweep）**

```css
.preset-dropdown-container::before {
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(0, 255, 255, 0.6) 50%,    /* 青色光束 */
    rgba(255, 0, 255, 0.6) 51%,    /* 洋红光束 */
    transparent 100%
  );
  left: -100%;  /* 默认隐藏在左侧 */
  transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  mix-blend-mode: screen;  /* 屏幕混合，叠加发光 */
}

.preset-dropdown-container:hover::before {
  left: 100%;  /* 扫到右侧 */
}
```

**效果**：
- 光束从左侧飞入，瞬间扫过整个 Banner
- 使用 `screen` 混合模式，让光束有"发光"效果
- 青色和洋红渐变，Cyberpunk 配色

---

### **2. 边框流光（Border Flow）**

```css
.preset-banner-preview::before {
  background: linear-gradient(
    60deg,
    #0ff 0%,
    #f0f 25%,
    #0ff 50%,
    #f0f 75%,
    #0ff 100%
  );
  background-size: 300% 100%;  /* 背景拉伸3倍，实现流动 */
  animation: flowBorder 2s linear infinite;
}

@keyframes flowBorder {
  0% { background-position: 0% 0; }
  100% { background-position: 300% 0; }  /* 移动3倍，形成循环 */
}
```

**效果**：
- 青→洋→青→洋渐变不断流动
- 使用 `mask-composite: exclude` 创建边框（而非填充）
- 类似高科技芯片外壳的能量流动

**Mask 技术**：
```css
-webkit-mask: 
  linear-gradient(#fff 0 0) content-box,  /* 内部镂空 */
  linear-gradient(#fff 0 0);              /* 整体遮罩 */
-webkit-mask-composite: xor;  /* 异或，只保留边缘 */
```

---

### **3. 色彩爆发（Color Burst）**

```css
/* 默认：去色 */
.preset-banner-preview {
  filter: grayscale(1) brightness(0.6) contrast(0.8);
}

/* 悬停：色彩爆发 */
.preset-dropdown-container:hover .preset-banner-preview {
  filter: grayscale(0) brightness(1.2) saturate(1.4) contrast(1.1);
  transform: translateY(-4px) scale(1.05);
}
```

**效果**：
- 从完全灰度（100%）瞬间恢复全彩（0%）
- 亮度提升 20%，饱和度提升 40%
- 同时抬起 4px，放大 1.05 倍
- 0.6 秒平滑过渡

---

### **4. 能量脉冲（Energy Pulse）**

```css
@keyframes energyPulse {
  0%, 100% {
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(139, 92, 246, 0.4),  /* 紫色发光 */
      0 0 60px rgba(59, 130, 246, 0.3);  /* 蓝色远距发光 */
  }
  50% {
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(139, 92, 246, 0.6),  /* 更强 */
      0 0 80px rgba(59, 130, 246, 0.5);  /* 更远 */
  }
}
```

**效果**：
- 1.5 秒循环
- 光晕强度在 30-60px 之间脉动
- 模拟能量波动，增强未来感

---

## 🎨 色彩方案

### **Cyberpunk 配色**

| 颜色 | 用途 | RGB | 情感 |
|------|------|-----|------|
| **Cyan (#0ff)** | 霓虹扫光 / 边框起点 | `rgb(0, 255, 255)` | 科幻、冷静 |
| **Magenta (#f0f)** | 霓虹扫光 / 边框终点 | `rgb(255, 0, 255)` | 未来、炫酷 |
| **Purple (#8b5cf6)** | 外发光 | `rgba(139, 92, 246, 0.4)` | 神秘、高端 |
| **Blue (#3b82f6)** | 远距发光 | `rgba(59, 130, 246, 0.3)` | 深度、空间感 |

### **灰度美学**

- **深色主题**：`grayscale(1) brightness(0.6)` → 深沉低调
- **浅色主题**：`grayscale(1) brightness(0.8)` → 优雅克制

---

## 🔧 技术细节

### **滤镜组合**

```css
/* 默认：grayscale + 降亮度 + 降对比度 */
filter: grayscale(1) brightness(0.6) contrast(0.8);

/* 悬停：去除灰度 + 增强色彩 */
filter: grayscale(0) brightness(1.2) saturate(1.4) contrast(1.1);
```

| 参数 | 默认 | 悬停 | 说明 |
|------|------|------|------|
| `grayscale` | 100% | 0% | 从全灰到全彩 |
| `brightness` | 60% | 120% | 亮度翻倍 |
| `saturate` | 100% | 140% | 超饱和色彩 |
| `contrast` | 80% | 110% | 对比度增强 |

### **动画曲线**

```css
transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

- **cubic-bezier(0.4, 0, 0.2, 1)**：Material Design 标准曲线
- 起步快，结尾慢，自然流畅

### **混合模式**

```css
mix-blend-mode: screen;
```

- 让霓虹扫光有"叠加发光"效果
- 适合在深色背景上创造光效

---

## 🌈 主题适配

### **深色主题**

```css
/* 默认去色 */
.preset-banner-preview {
  filter: grayscale(1) brightness(0.6) contrast(0.8);
}

/* 悬停爆发 */
.preset-dropdown-container:hover .preset-banner-preview {
  filter: grayscale(0) brightness(1.2) saturate(1.4) contrast(1.1);
}
```

### **浅色主题**

```css
/* 默认去色（稍微亮一点） */
.preset-banner-preview {
  filter: grayscale(1) brightness(0.8) contrast(0.85);
}

/* 悬停爆发（稍微收敛） */
.preset-dropdown-container:hover .preset-banner-preview {
  filter: grayscale(0) brightness(1.15) saturate(1.35) contrast(1.05);
}
```

---

## 💡 使用场景

### **✅ 适合：**
- 音乐制作工具（DAW 插件）
- 音视频编辑软件
- 实验媒体项目
- 科幻风格应用
- 创意展示网站

### **❌ 不适合：**
- 传统企业网站
- 电商平台
- 政府机构
- 医疗健康（过于刺激）

---

## 🎯 性能优化

### **GPU 加速**

所有动画都使用 GPU 加速属性：
- `transform`（translateY, scale）
- `opacity`
- `filter`（部分浏览器）

### **动画性能**

- 使用 `will-change` 提示浏览器优化
- 避免高频重绘（使用 CSS 动画而非 JS）
- 所有动画在 60fps 流畅运行

---

## 🔥 视觉冲击力评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **未来感** | ⭐⭐⭐⭐⭐ | Cyberpunk / Tron 级别 |
| **科幻感** | ⭐⭐⭐⭐⭐ | 高科技芯片 / 能量流 |
| **冲击力** | ⭐⭐⭐⭐⭐ | 三重特效叠加 |
| **流畅度** | ⭐⭐⭐⭐⭐ | 60fps GPU 加速 |
| **品牌感** | ⭐⭐⭐⭐⭐ | 专业音频工具级 |

---

## 🎬 动画时间轴

```
0.0s ┌──────────────────────────────────┐
     │  默认：灰度静态                  │
     └──────────────────────────────────┘

[鼠标移入]

0.0s ┌──────────────────────────────────┐
     │ • 边框流光开始循环（2s/周期）   │
     │ • 霓虹扫光从左侧出发              │
     │ • 色彩开始恢复                    │
0.6s │ • 色彩完全恢复（全彩）           │
0.8s │ • 霓虹扫光完成扫过                │
1.5s │ • 能量脉冲第一周期完成            │
     │ • 边框流光持续...                │
     └──────────────────────────────────┘

[鼠标移出]

0.0s ┌──────────────────────────────────┐
     │ • 边框流光淡出                    │
     │ • 色彩开始去色                    │
0.6s │ • 恢复灰度                        │
     └──────────────────────────────────┘
```

---

享受你的未来感合成器！⚡🌈✨

