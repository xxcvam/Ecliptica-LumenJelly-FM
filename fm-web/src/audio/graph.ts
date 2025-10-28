// 音频图管理：AudioContext + AudioWorklet + Delay 效果

let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let splitterNode: ChannelSplitterNode | null = null;
let mergerNode: ChannelMergerNode | null = null;
let delayLeft: DelayNode | null = null;
let delayRight: DelayNode | null = null;
let predelayNode: DelayNode | null = null;
let feedbackLeft: GainNode | null = null;
let feedbackRight: GainNode | null = null;
let wetGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let externalStream: MediaStream | null = null;
let externalSource: MediaStreamAudioSourceNode | null = null;
let externalMonitorGain: GainNode | null = null;
let externalAnalysisGain: GainNode | null = null;

// LFO for delay time modulation
let delayLfoOscillator: OscillatorNode | null = null;
let delayLfoGain: GainNode | null = null;
let delayLfoActive = false;

// Delay 参数
let currentDelay = {
  time: 0.3,      // 300ms
  feedback: 0.3,
  wet: 0.3,
  predelay: 0     // predelay 时间 (ms)
};

export async function initAudio(): Promise<void> {
  if (audioContext) {
    console.log('音频已初始化');
    return;
  }

  // 创建 AudioContext
  audioContext = new AudioContext();
  
  try {
    // 加载 AudioWorklet 模块
    await audioContext.audioWorklet.addModule('/fm-voice-processor.js');
    
    // 创建 FM 合成器节点
    workletNode = new AudioWorkletNode(audioContext, 'fm-voice-processor', {
      outputChannelCount: [2]
    });
    
    // 创建 Delay 效果链（Ping-Pong + Predelay）
    splitterNode = audioContext.createChannelSplitter(2);
    mergerNode = audioContext.createChannelMerger(2);
    
    predelayNode = audioContext.createDelay(0.1);  // 最大 100ms predelay
    predelayNode.delayTime.value = currentDelay.predelay / 1000;
    
    delayLeft = audioContext.createDelay(1.2);
    delayRight = audioContext.createDelay(1.2);
    delayLeft.delayTime.value = currentDelay.time;
    delayRight.delayTime.value = currentDelay.time;
    
    feedbackLeft = audioContext.createGain();
    feedbackRight = audioContext.createGain();
    feedbackLeft.gain.value = currentDelay.feedback;
    feedbackRight.gain.value = currentDelay.feedback;
    
    // Wet/Dry 混合
    wetGain = audioContext.createGain();
    wetGain.gain.value = currentDelay.wet;
    
    dryGain = audioContext.createGain();
    dryGain.gain.value = 1 - currentDelay.wet;
    
    // 主增益 (-6dB)
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.5; // -6dB
    
    // 创建 Analyser 用于可视化
    analyserNode = audioContext.createAnalyser();
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
    analyserNode.fftSize = isMobile ? 1024 : 2048;
    analyserNode.smoothingTimeConstant = 0.6;
    
    // 连接节点图
    // Worklet -> Dry -> Master
    workletNode.connect(dryGain);
    dryGain.connect(masterGain);
    
    // Worklet -> Predelay -> Splitter
    workletNode.connect(predelayNode);
    predelayNode.connect(splitterNode);
    
    // 左右通道分别进入 Delay
    splitterNode.connect(delayLeft, 0);
    splitterNode.connect(delayRight, 1);
    
    // Cross 反馈形成 Ping-Pong
    delayLeft.connect(feedbackRight);
    feedbackRight.connect(delayRight);
    
    delayRight.connect(feedbackLeft);
    feedbackLeft.connect(delayLeft);
    
    // 合并回立体声并连接 Wet -> Master
    delayLeft.connect(mergerNode, 0, 0);
    delayRight.connect(mergerNode, 0, 1);
    mergerNode.connect(wetGain);
    wetGain.connect(masterGain);
    
    // Master -> 输出 & 分析
    masterGain.connect(audioContext.destination);
    masterGain.connect(analyserNode);
    
    console.log('音频初始化成功！');
  } catch (error) {
    console.error('音频初始化失败:', error);
    throw error;
  }
}

export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

export function noteOn(freq: number): void {
  if (!workletNode) {
    console.warn('音频尚未初始化');
    return;
  }
  
  workletNode.port.postMessage({
    type: 'noteOn',
    data: { freq }
  });
}

export function noteOff(): void {
  if (!workletNode) return;
  
  workletNode.port.postMessage({
    type: 'noteOff'
  });
}

export function setParameter(key: string, value: number | string): void {
  if (!workletNode) return;
  
  workletNode.port.postMessage({
    type: 'set',
    data: { key, value }
  });
}

export function noteOnAt(freq: number, velocity: number, time: number, length: number): void {
  if (!workletNode || !audioContext) return;
  workletNode.port.postMessage({
    type: 'noteAt',
    data: {
      freq,
      velocity,
      time,
      length
    }
  });
}

export function setParameterAt(key: string, value: number, time: number): void {
  if (!workletNode || !audioContext) return;
  workletNode.port.postMessage({
    type: 'paramAt',
    data: {
      key,
      value,
      time
    }
  });
}

export function setDelay(timeMs: number, feedback: number, wet: number, predelayMs = 0): void {
  if (!delayLeft || !delayRight || !feedbackLeft || !feedbackRight || !wetGain || !dryGain || !predelayNode) return;
  
  // 安全限制：禁止 wet=1 && feedback>0.7
  if (wet >= 0.99 && feedback > 0.7) {
    feedback = 0.7;
    console.warn('限制反馈以避免啸叫');
  }
  
  // 更新 Delay 参数
  const timeSeconds = Math.min(1.2, Math.max(0.03, timeMs / 1000));
  delayLeft.delayTime.setTargetAtTime(timeSeconds, audioContext!.currentTime, 0.01);
  delayRight.delayTime.setTargetAtTime(timeSeconds, audioContext!.currentTime, 0.01);
  
  // 更新 Predelay
  const predelaySeconds = Math.min(0.1, Math.max(0, predelayMs / 1000));
  predelayNode.delayTime.setTargetAtTime(predelaySeconds, audioContext!.currentTime, 0.01);
  
  const safeFeedback = Math.min(0.8, Math.max(0, feedback));
  feedbackLeft.gain.setTargetAtTime(
    safeFeedback,
    audioContext!.currentTime,
    0.01
  );
  feedbackRight.gain.setTargetAtTime(
    safeFeedback,
    audioContext!.currentTime,
    0.01
  );
  
  wetGain.gain.setTargetAtTime(wet, audioContext!.currentTime, 0.01);
  dryGain.gain.setTargetAtTime(1 - wet, audioContext!.currentTime, 0.01);
  
  currentDelay = { time: timeSeconds, feedback: safeFeedback, wet, predelay: predelayMs };
}

// 获取 delayLeft 节点用于 LFO 调制
export function getDelayLeftNode(): DelayNode | null {
  return delayLeft;
}

export function getDelayRightNode(): DelayNode | null {
  return delayRight;
}

// 启用/禁用 delay time 的 LFO 调制
export function setDelayLfo(enabled: boolean, rate: number, depth: number, baseTime: number): void {
  if (!audioContext || !delayLeft || !delayRight) return;

  // 清理旧的 LFO
  if (delayLfoOscillator) {
    delayLfoOscillator.stop();
    delayLfoOscillator.disconnect();
    delayLfoOscillator = null;
  }
  if (delayLfoGain) {
    delayLfoGain.disconnect();
    delayLfoGain = null;
  }

  delayLfoActive = enabled;

  if (!enabled) {
    // 恢复原始 delay time
    delayLeft.delayTime.cancelScheduledValues(audioContext.currentTime);
    delayRight.delayTime.cancelScheduledValues(audioContext.currentTime);
    delayLeft.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);
    delayRight.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);
    return;
  }

  // 创建新的 LFO
  delayLfoOscillator = audioContext.createOscillator();
  delayLfoGain = audioContext.createGain();

  delayLfoOscillator.type = 'sine';
  delayLfoOscillator.frequency.value = rate;

  // LFO 深度：depth 控制调制范围（相对于基础时间的百分比）
  const modulationAmount = (baseTime / 1000) * depth * 0.5; // 最大 ±50% 调制
  delayLfoGain.gain.value = modulationAmount;

  // 连接 LFO 到 delay time 参数
  delayLfoOscillator.connect(delayLfoGain);
  delayLfoGain.connect(delayLeft.delayTime);
  delayLfoGain.connect(delayRight.delayTime);

  // 设置基础 delay time
  delayLeft.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);
  delayRight.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);

  delayLfoOscillator.start();
}

// 更新 delay LFO 参数（不重新创建振荡器）
export function updateDelayLfo(rate: number, depth: number, baseTime: number): void {
  if (!delayLfoActive || !delayLfoOscillator || !delayLfoGain || !audioContext || !delayLeft || !delayRight) return;

  delayLfoOscillator.frequency.setTargetAtTime(rate, audioContext.currentTime, 0.01);
  
  const modulationAmount = (baseTime / 1000) * depth * 0.5;
  delayLfoGain.gain.setTargetAtTime(modulationAmount, audioContext.currentTime, 0.01);

  delayLeft.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);
  delayRight.delayTime.setTargetAtTime(baseTime / 1000, audioContext.currentTime, 0.01);
}

export function setMasterGain(value: number): void {
  if (!masterGain) return;
  
  // 限制最大音量为 -6dB (0.5)
  const gain = Math.min(0.5, Math.max(0, value));
  masterGain.gain.setTargetAtTime(gain, audioContext!.currentTime, 0.01);
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

export function attachExternalStream(stream: MediaStream, monitorLevel = 0): void {
  if (!audioContext || !masterGain || !analyserNode) {
    throw new Error('音频尚未初始化');
  }

  detachExternalStream(false);

  externalStream = stream;
  externalSource = audioContext.createMediaStreamSource(stream);
  externalAnalysisGain = audioContext.createGain();
  externalMonitorGain = audioContext.createGain();

  externalAnalysisGain.gain.value = 1;
  externalMonitorGain.gain.value = Math.min(1, Math.max(0, monitorLevel));

  externalSource.connect(externalAnalysisGain);
  externalAnalysisGain.connect(analyserNode);

  externalSource.connect(externalMonitorGain);
  externalMonitorGain.connect(masterGain);
}

export function detachExternalStream(stopTracks = true): void {
  if (externalSource) {
    externalSource.disconnect();
    externalSource = null;
  }

  if (externalAnalysisGain) {
    externalAnalysisGain.disconnect();
    externalAnalysisGain = null;
  }

  if (externalMonitorGain) {
    externalMonitorGain.disconnect();
    externalMonitorGain = null;
  }

  if (stopTracks && externalStream) {
    externalStream.getTracks().forEach((track) => track.stop());
  }

  externalStream = null;
}

export function setExternalMonitorLevel(level: number): void {
  if (!externalMonitorGain) return;
  const value = Math.min(1, Math.max(0, level));
  externalMonitorGain.gain.setTargetAtTime(value, audioContext!.currentTime, 0.05);
}

export function isExternalStreamActive(): boolean {
  return !!externalStream;
}
