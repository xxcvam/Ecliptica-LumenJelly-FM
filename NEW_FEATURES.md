# 新功能说明文档

## 版本更新内容

本次更新为 WebFM 项目增加了三个重要的 Delay 效果器功能，并对音高系统进行了验证。

---

## 1. Delay Time BPM 同步功能

### 功能描述
Delay 延迟时间现在可以同步到音序器的 BPM，支持多种音符时值。

### UI 控件
- **BPM 同步开关**：勾选后启用 BPM 同步模式
- **音符时值选择器**：包含以下选项
  - 1/1 (全音符)
  - 1/2 (二分音符)
  - 1/4 (四分音符)
  - 1/4. (附点四分)
  - 1/4T (四分三连音)
  - 1/8 (八分音符)
  - 1/8. (附点八分)
  - 1/8T (八分三连音)
  - 1/16 (十六分音符)
  - 1/16. (附点十六分)
  - 1/16T (十六分三连音)
  - 1/32 (三十二分音符)

### 使用方法
1. 在 **Delay 延迟** 面板中，勾选 "BPM 同步" 复选框
2. 从下拉菜单中选择期望的音符时值
3. Delay 时间将自动根据当前 BPM 和选择的音符时值计算
4. 时间控制旋钮会显示计算后的实际毫秒数（灰色禁用状态）

### 计算公式
```
实际延迟时间(ms) = (60000 / BPM) × 音符比例
```

例如：BPM=120，选择1/8音符
```
延迟时间 = (60000 / 120) × 0.5 = 250ms
```

---

## 2. LFO 调制 Delay Time

### 功能描述
LFO（低频振荡器）现在可以调制 Delay 延迟时间，创造出时空错位的动态效果。

### 新增选项
在 **LFO 调制** 面板的"目标参数"下拉菜单中，新增：
- **延迟时间（时空错位）**

### 工作原理
- 当选择 "延迟时间" 作为 LFO 目标时，系统会在主线程创建一个独立的 LFO 振荡器
- LFO 以正弦波形式调制 Delay 的左右声道延迟时间
- 调制深度最大为基础延迟时间的 ±50%
- 调制频率由 LFO 频率参数控制（0.1 - 12 Hz）

### 使用建议
- **低频率 (0.5-2 Hz)**：创造缓慢的空间变化，适合氛围音乐
- **中频率 (3-6 Hz)**：产生明显的调制效果，增加动态感
- **高频率 (7-12 Hz)**：快速颤动，创造特殊音效

### 注意事项
- LFO 调制 Delay Time 仅在 Delay Time **不是** BPM 同步模式时生效
- 如果 BPM 同步开启，LFO 仍然会调制同步后的时间值

---

## 3. PreDelay 功能

### 功能描述
PreDelay（预延迟）在信号进入主延迟效果之前添加一个固定的短延迟。

### UI 控件
在 **Delay 延迟** 面板增加了第四个旋钮：
- **PreDelay**：0-100ms 可调

### 应用场景
1. **增加空间深度**：PreDelay 可以模拟声音从声源到第一个反射面的时间
2. **人声处理**：少量 PreDelay (10-30ms) 可以让人声更加突出，不被延迟效果掩盖
3. **节奏感增强**：配合 BPM 同步的主延迟，PreDelay 可以创造复杂的节奏纹理

### 信号流程
```
输入信号 → Dry (直接输出)
         ↓
      PreDelay
         ↓
    Stereo Splitter → Delay Left ⇄ Delay Right (Ping-Pong)
                      ↓
                   Wet (延迟输出)
```

---

## 4. 音高系统验证

### 验证结果
经过详细测试，键盘和音序器的音高计算完全一致：

#### 键盘音高 (硬编码频率)
- C2 (MIDI 36): 65.41 Hz ✓
- C3 (MIDI 48): 130.81 Hz ✓
- C4 (MIDI 60): 261.63 Hz ✓

#### 音序器音高 (MIDI 转频率)
- Root=60 (C4), Pitch=0: 261.63 Hz ✓
- Root=60, Pitch=12 (C5): 523.25 Hz ✓
- Root=60, Pitch=-12 (C3): 130.81 Hz ✓

### 关于"八度差"的说明
如果您感觉键盘和音序器的声音不同，可能是由于以下原因：

1. **FM 合成音色差异**
   - FM 合成会产生丰富的泛音（边带频率）
   - 不同的 `modRatio` 和 `fmIndex` 设置会显著改变音色
   - 相同的基频可能因为泛音结构不同而听起来"音高不同"

2. **音阶量化**
   - 音序器默认启用音阶量化（Major/Minor/Pentatonic）
   - 这可能导致某些音高被自动调整到最近的音阶音

3. **测试建议**
   - 将 FM Index 设置为 0，此时只有纯载波，可以清晰听到基频
   - 将音序器音阶设置为 Chromatic（如果可用）以禁用量化
   - 对比键盘 C4 (T键) 和音序器 Root=60, Pitch=0 的声音

---

## 技术实现细节

### 修改的文件

1. **`fm-web/src/presets.ts`**
   - 更新 `Preset` 接口，新增字段：
     - `delayTimeSync: boolean`
     - `delayTimeNote: string`
     - `predelay: number`
   - 更新 `lfoTarget` 类型，新增 `'delayTime'`
   - 新增 `delayTimeNoteValues` 常量，定义音符时值映射
   - 为所有预设添加新字段的默认值

2. **`fm-web/src/audio/graph.ts`**
   - 新增 `predelayNode: DelayNode` 用于 PreDelay
   - 新增 `delayLfoOscillator` 和 `delayLfoGain` 用于 LFO 调制
   - 修改 `setDelay()` 函数，新增 `predelayMs` 参数
   - 新增 `setDelayLfo()` 函数，启用/禁用 delay time 的 LFO 调制
   - 新增 `updateDelayLfo()` 函数，更新 LFO 参数
   - 更新音频节点连接图：`Worklet → PreDelay → Splitter → Delays → Merger`

3. **`fm-web/src/App.tsx`**
   - 新增状态变量：`delayTimeSync`, `delayTimeNote`, `predelay`
   - 新增 `getActualDelayTime()` 函数，计算 BPM 同步后的实际延迟时间
   - 更新 `updateAllParameters()` 和相关 `useEffect` 钩子
   - 新增 Delay 面板的 BPM 同步 UI 控件
   - 新增 PreDelay 旋钮控件
   - 为 LFO 目标参数添加 "延迟时间" 选项

4. **`fm-web/src/ui/Knob.tsx`**
   - 新增 `disabled?: boolean` 属性
   - 添加禁用状态的视觉反馈（透明度、鼠标样式）

### 性能考虑
- Delay LFO 使用原生 `OscillatorNode`，性能开销极小
- BPM 同步计算在每次参数变化时执行，不会影响实时性能
- PreDelay 使用单个 `DelayNode`，内存占用可忽略

---

## 预设兼容性

所有现有预设已更新，新增字段的默认值如下：
- `delayTimeSync`: `false` (默认关闭 BPM 同步)
- `delayTimeNote`: `'1/8'` (默认八分音符)
- `predelay`: `0` (默认无 PreDelay)

---

## 测试建议

### 测试 BPM 同步
1. 启动音序器，设置 BPM=120
2. 开启 Delay 的 BPM 同步
3. 选择 1/4 音符：应听到 500ms 的延迟
4. 改变 BPM 到 90：延迟应变为 666ms
5. 改变音符时值到 1/8：延迟应变为 333ms

### 测试 LFO 调制 Delay Time
1. 设置 Delay Time 为 300ms
2. LFO 目标选择 "延迟时间"
3. LFO 频率设为 1 Hz，深度设为 0.5
4. 应听到延迟时间在 150ms-450ms 之间周期性变化

### 测试 PreDelay
1. 设置 Delay Wet=1 (全湿信号)
2. Delay Time=200ms, Feedback=0
3. 增加 PreDelay 从 0 到 50ms
4. 应听到第一个延迟音在 50+200=250ms 处出现

---

## 已知限制

1. **LFO 调制 Delay Time 的限制**
   - 调制深度固定为 ±50%，暂不支持更大范围
   - 仅支持正弦波形式，不支持其他波形（方波、锯齿波等）

2. **BPM 同步的限制**
   - 仅在手动改变 BPM 或音符时值时更新
   - 不支持自动跟随外部 MIDI Clock

3. **PreDelay 的限制**
   - 最大值限制为 100ms
   - 固定应用于 wet 信号路径，不影响 dry 信号

---

## 后续改进建议

1. 增加 LFO 调制深度的可调参数
2. 支持更多 LFO 波形（三角波、方波、随机）
3. 增加 Delay Time 的外部 MIDI Clock 同步
4. 为 PreDelay 增加独立的 LFO 调制
5. 添加 Delay 时间的平滑插值，避免切换时的音频伪影

---

**文档版本**: 1.0  
**更新日期**: 2025-10-28  
**作者**: AI Assistant (Claude Sonnet 4.5)

