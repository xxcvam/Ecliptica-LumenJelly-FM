import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initAudio,
  resumeAudio,
  noteOn,
  noteOff,
  setParameter,
  setDelay,
  setMasterGain,
  getAnalyser,
  attachExternalStream,
  detachExternalStream,
  setExternalMonitorLevel,
  noteOnAt,
  setParameterAt,
  getAudioContext
} from './audio/graph';
import { Knob } from './ui/Knob';
import { Slider } from './ui/Slider';
import { Keyboard, keyboardShortcuts } from './ui/Keyboard';
import { factoryPresets, parameterBounds } from './presets';
import type { Preset } from './presets';
import { PRESET_VISUAL_MAP } from './presets/map';
import { VisualPanel } from './vis/VisualPanel';
import { AdsrPreview } from './ui/AdsrPreview';
import { ModelUploader } from './ui/ModelUploader';
import { SequencerPanel } from './sequencer/SequencerPanel';
import { StepSequencer, SCALE_MAP } from './sequencer/StepSequencer';
import type { SequencerMode, SequencerStep } from './sequencer/StepSequencer';
import './App.css';

type LfoTarget = 'pitch' | 'amp' | 'fmIndex' | 'modRatio';

const createInitialSteps = (): SequencerStep[] =>
  Array.from({ length: 16 }, (_, index) => ({
    on: index % 4 === 0,
    pitch: [0, 0, 7, 0][index % 4] || 0,
    velocity: 100,
    gate: 0.7,
    probability: 1,
    ratchet: 1
  }));

function App() {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isSystemCaptureActive, setIsSystemCaptureActive] = useState(false);
  const [systemMonitorLevel, setSystemMonitorLevelState] = useState(0);
  const [systemCaptureMessage, setSystemCaptureMessage] = useState<string | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);

  // FM 参数
  const [modRatio, setModRatio] = useState(2);
  const [fmIndex, setFmIndex] = useState(60);

  // ADSR
  const [attackTime, setAttackTime] = useState(0.02);
  const [decayTime, setDecayTime] = useState(0.12);
  const [sustainLevel, setSustainLevel] = useState(0.6);
  const [releaseTime, setReleaseTime] = useState(0.2);

  // LFO
  const [lfoRate, setLfoRate] = useState(5);
  const [lfoDepth, setLfoDepth] = useState(0.25);
  const [lfoTarget, setLfoTarget] = useState<LfoTarget>('pitch');

  // Delay
  const [delayTime, setDelayTime] = useState(300);
  const [delayFeedback, setDelayFeedback] = useState(0.3);
  const [delayWet, setDelayWet] = useState(0.3);

  // Master
  const [masterVolume, setMasterVolume] = useState(0.5);

  // 预设
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  // Sequencer
  const [sequencerSteps, setSequencerSteps] = useState<SequencerStep[]>(() => createInitialSteps());
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [activeSequencerStep, setActiveSequencerStep] = useState<number | null>(null);
  const [sequencerPlaying, setSequencerPlaying] = useState(false);
  const [sequencerBpm, setSequencerBpm] = useState(120);
  const [sequencerSwing, setSequencerSwing] = useState(0);
  const [sequencerStepLength, setSequencerStepLength] = useState(0.25);
  const [sequencerLoopLength, setSequencerLoopLength] = useState(16);
  const [sequencerMode, setSequencerMode] = useState<SequencerMode>('forward');
  const [sequencerRoot, setSequencerRoot] = useState(60);
  const [sequencerScaleKey, setSequencerScaleKey] = useState<keyof typeof SCALE_MAP>('major');
  const sequencerRef = useRef<StepSequencer | null>(null);

  // 启动音频
  const handleStartAudio = async () => {
    try {
      await initAudio();
      resumeAudio();
      setIsAudioReady(true);
      setIsStarted(true);
      
      // 获取 Analyser 用于可视化
      const analyserNode = getAnalyser();
      setAnalyser(analyserNode);
      
      // 应用默认参数
      updateAllParameters();
    } catch (error) {
      console.error('音频启动失败:', error);
      alert('音频初始化失败，请刷新页面重试');
    }
  };

  // 更新所有参数到 AudioWorklet
  const updateAllParameters = useCallback(() => {
    if (!isAudioReady) return;

    setParameter('modRatio', modRatio);
    setParameter('fmIndex', fmIndex);
    setParameter('attackTime', attackTime);
    setParameter('decayTime', decayTime);
    setParameter('sustainLevel', sustainLevel);
    setParameter('releaseTime', releaseTime);
    setParameter('lfoRate', lfoRate);
    setParameter('lfoDepth', lfoDepth);
    setParameter('lfoTarget', lfoTarget);
    setDelay(delayTime, delayFeedback, delayWet);
    setMasterGain(masterVolume);
  }, [
    isAudioReady,
    modRatio,
    fmIndex,
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
    lfoRate,
    lfoDepth,
    lfoTarget,
    delayTime,
    delayFeedback,
    delayWet,
    masterVolume
  ]);

  const ensureSequencer = useCallback(() => {
    if (!isStarted) return null;
    if (!sequencerRef.current) {
      const ctx = getAudioContext();
      if (!ctx) return null;
      const seq = new StepSequencer(ctx, { noteOnAt, setAt: setParameterAt }, (index) => {
        setActiveSequencerStep(index);
      });
      seq.setSteps(sequencerSteps);
      seq.setBpm(sequencerBpm);
      seq.setStepLength(sequencerStepLength);
      seq.setSwing(sequencerSwing);
      seq.setLoopLength(sequencerLoopLength);
      seq.setMode(sequencerMode);
      seq.setScale(sequencerRoot, SCALE_MAP[sequencerScaleKey].intervals);
      sequencerRef.current = seq;
    }
    return sequencerRef.current;
  }, [
    isStarted,
    sequencerSteps,
    sequencerBpm,
    sequencerStepLength,
    sequencerSwing,
    sequencerLoopLength,
    sequencerMode,
    sequencerRoot,
    sequencerScaleKey
  ]);

  useEffect(() => () => {
    sequencerRef.current?.stop();
  }, []);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setSteps(sequencerSteps);
  }, [sequencerSteps]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setBpm(sequencerBpm);
  }, [sequencerBpm]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setStepLength(sequencerStepLength);
  }, [sequencerStepLength]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setSwing(sequencerSwing);
  }, [sequencerSwing]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setLoopLength(sequencerLoopLength);
  }, [sequencerLoopLength]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setMode(sequencerMode);
  }, [sequencerMode]);

  useEffect(() => {
    const seq = sequencerRef.current;
    if (!seq) return;
    seq.setScale(sequencerRoot, SCALE_MAP[sequencerScaleKey].intervals);
  }, [sequencerRoot, sequencerScaleKey]);

  useEffect(() => {
    if (!sequencerPlaying) {
      setActiveSequencerStep(null);
    }
  }, [sequencerPlaying]);

  const handleSequencerToggleStep = (index: number) => {
    setSequencerSteps((prev) =>
      prev.map((step, i) =>
        i === index
          ? {
              ...step,
              on: !step.on
            }
          : step
      )
    );
    setSelectedStepIndex(index);
  };

  const handleSequencerStepChange = (index: number, payload: Partial<SequencerStep>) => {
    setSequencerSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) return step;
        const next: SequencerStep = { ...step, ...payload };
        if (payload.pitch !== undefined) {
          next.pitch = Math.max(-48, Math.min(48, Math.round(payload.pitch)));
        }
        if (payload.velocity !== undefined) {
          next.velocity = Math.max(1, Math.min(127, Math.round(payload.velocity)));
        }
        if (payload.gate !== undefined) {
          next.gate = Math.max(0.1, Math.min(1, Number(payload.gate)));
        }
        if (payload.probability !== undefined) {
          next.probability = Math.max(0, Math.min(1, Number(payload.probability)));
        }
        if (payload.ratchet !== undefined) {
          next.ratchet = Math.max(1, Math.min(4, Math.round(payload.ratchet)));
        }
        return next;
      })
    );
  };

  const handleSequencerPlay = () => {
    const seq = ensureSequencer();
    if (!seq) {
      if (!isStarted) {
        setSystemCaptureMessage('请先启动音频引擎，再启动音序器。');
      }
      return;
    }
    seq.setSteps(sequencerSteps);
    seq.setBpm(sequencerBpm);
    seq.setStepLength(sequencerStepLength);
    seq.setSwing(sequencerSwing);
    seq.setLoopLength(sequencerLoopLength);
    seq.setMode(sequencerMode);
    seq.setScale(sequencerRoot, SCALE_MAP[sequencerScaleKey].intervals);
    seq.start();
    setSequencerPlaying(true);
  };

  const handleSequencerStop = () => {
    sequencerRef.current?.stop();
    setSequencerPlaying(false);
    setActiveSequencerStep(null);
  };

  const handleSequencerLoopLengthChange = (value: number) => {
    const clamped = Math.max(1, Math.min(sequencerSteps.length, Math.round(value)));
    setSequencerLoopLength(clamped);
  };

  // 参数变化时更新
  useEffect(() => {
    if (isAudioReady) {
      setParameter('modRatio', modRatio);
    }
  }, [modRatio, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('fmIndex', fmIndex);
    }
  }, [fmIndex, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('attackTime', attackTime);
    }
  }, [attackTime, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('decayTime', decayTime);
    }
  }, [decayTime, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('sustainLevel', sustainLevel);
    }
  }, [sustainLevel, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('releaseTime', releaseTime);
    }
  }, [releaseTime, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('lfoRate', lfoRate);
    }
  }, [lfoRate, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('lfoDepth', lfoDepth);
    }
  }, [lfoDepth, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setParameter('lfoTarget', lfoTarget);
    }
  }, [lfoTarget, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setDelay(delayTime, delayFeedback, delayWet);
    }
  }, [delayTime, delayFeedback, delayWet, isAudioReady]);

  useEffect(() => {
    if (isAudioReady) {
      setMasterGain(masterVolume);
    }
  }, [masterVolume, isAudioReady]);

  // 加载预设
  const loadPreset = useCallback((preset: Preset) => {
    const p = preset.params;
    setModRatio(p.modRatio);
    setFmIndex(p.fmIndex);
    setAttackTime(p.attackTime);
    setDecayTime(p.decayTime);
    setSustainLevel(p.sustainLevel);
    setReleaseTime(p.releaseTime);
    setLfoRate(p.lfoRate);
    setLfoDepth(p.lfoDepth);
    setLfoTarget(p.lfoTarget);
    setDelayTime(p.delayTime);
    setDelayFeedback(p.delayFeedback);
    setDelayWet(p.delayWet);
  }, []);

  const handlePresetChange = (index: number) => {
    setCurrentPresetIndex(index);
    loadPreset(factoryPresets[index]);
  };

  const handleExternalMonitorLevel = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setSystemMonitorLevelState(clamped);
    setExternalMonitorLevel(clamped);
  }, []);

  const handleStopSystemCapture = useCallback(() => {
    detachExternalStream();
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach((track) => track.stop());
      systemStreamRef.current = null;
    }
    setIsSystemCaptureActive(false);
    setSystemCaptureMessage(null);
  }, []);

  const handleSystemStreamEnded = useCallback(() => {
    detachExternalStream(false);
    setIsSystemCaptureActive(false);
    setSystemCaptureMessage('系统音频已停止。若需要继续，请重新点击“捕获系统音频”。');
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach((track) => track.stop());
      systemStreamRef.current = null;
    }
  }, []);

  const handleStartSystemCapture = useCallback(async () => {
    if (!isStarted) {
      setSystemCaptureMessage('请先启动音频引擎后，再尝试捕获系统音频。');
      return;
    }
    if (systemStreamRef.current) {
      handleStopSystemCapture();
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setSystemCaptureMessage('当前浏览器不支持系统音频捕获，请使用最新版的 Chromium 系浏览器。');
      return;
    }
    setSystemCaptureMessage('请选择“整屏”或“标签页”，并在共享弹窗中勾选“分享此音频”。首次使用可能需要在系统设置中授予屏幕录制权限。');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        },
        video: {
          frameRate: 1,
          displaySurface: 'monitor'
        }
      });
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('No audio track in shared stream');
      }
      stream.getVideoTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      const audioOnlyStream = new MediaStream(audioTracks);
      systemStreamRef.current = audioOnlyStream;
      audioTracks.forEach((track) => {
        track.addEventListener('ended', handleSystemStreamEnded, { once: true });
      });
      attachExternalStream(audioOnlyStream, systemMonitorLevel);
      setIsSystemCaptureActive(true);
      setSystemCaptureMessage('系统音频捕获已启用。若无声音，请确认共享弹窗已勾选音频。');
    } catch (error) {
      console.error('系统音频捕获失败:', error);
      setSystemCaptureMessage('未能捕获系统音频：请确认浏览器弹窗中已勾选音频分享，或在系统偏好设置中启用屏幕录制权限。');
    }
  }, [handleStopSystemCapture, handleSystemStreamEnded, isStarted, systemMonitorLevel]);

  const currentPreset = factoryPresets[currentPresetIndex];
  const visualConfig = PRESET_VISUAL_MAP[currentPreset.name] ?? { visualId: 'nebula', params: {} };

  return (
    <div className="app-page">
      <main className="app-grid">
        <section className="col-left">
          <div className="visual-card">
            <VisualPanel
              analyser={isStarted ? analyser : null}
              visualId={visualConfig.visualId}
              visualParams={visualConfig.params}
              bpm={sequencerBpm}
            />
            <div className="visual-overlay" aria-hidden={isStarted}>
              {!isStarted && <span>启动音频引擎以解锁可视化</span>}
            </div>
          </div>

          <SequencerPanel
            steps={sequencerSteps}
            activeStep={activeSequencerStep}
            selectedStep={selectedStepIndex}
            playing={sequencerPlaying}
            bpm={sequencerBpm}
            swing={sequencerSwing}
            stepLength={sequencerStepLength}
            loopLength={sequencerLoopLength}
            mode={sequencerMode}
            root={sequencerRoot}
            scaleKey={sequencerScaleKey}
            canPlay={isStarted}
            onToggleStep={handleSequencerToggleStep}
            onSelectStep={setSelectedStepIndex}
            onChangeStep={handleSequencerStepChange}
            onPlay={handleSequencerPlay}
            onStop={handleSequencerStop}
            onBpmChange={setSequencerBpm}
            onSwingChange={setSequencerSwing}
            onStepLengthChange={setSequencerStepLength}
            onLoopLengthChange={handleSequencerLoopLengthChange}
            onModeChange={setSequencerMode}
            onRootChange={setSequencerRoot}
            onScaleChange={setSequencerScaleKey}
          />

          <div className="panel keyboard-panel">
            <h3>键盘 (C2 - C4)</h3>
            <div className="piano-wrap">
              <div className="piano">
                <Keyboard onNoteOn={noteOn} onNoteOff={noteOff} />
              </div>
            </div>
            <details className="keyboard-guide">
              <summary>电脑键盘映射说明</summary>
              <div className="keyboard-guide-grid">
                {keyboardShortcuts.map(({ key, note }) => (
                  <div key={`${key}-${note}`} className="keyboard-guide-item">
                    <kbd>{key}</kbd>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
              <p className="keyboard-guide-tip">提示：Z 行是低八度，Q 行是高八度，黑键使用旁边的数字或符号触发。</p>
            </details>
          </div>
        </section>

        <aside className="col-right">
          <div className="panel status-panel">
            <div className="status-meta">
              <span className={`status-dot ${isStarted ? 'online' : 'standby'}`} />
              <div className="status-text">
                <strong>{currentPreset.name}</strong>
                <span>{isStarted ? '音频已解锁' : '等待启动音频'}</span>
              </div>
            </div>
            <div className="status-actions">
              <button
                className="start-chip"
                onClick={handleStartAudio}
                disabled={isStarted}
              >
                {isStarted ? '已启动' : '🔊 启动音频引擎'}
              </button>
              <button
                className={`capture-chip ${isSystemCaptureActive ? 'active' : ''}`}
                onClick={isSystemCaptureActive ? handleStopSystemCapture : handleStartSystemCapture}
                disabled={!isStarted}
              >
                {isSystemCaptureActive ? '停止系统音频' : '捕获系统音频'}
              </button>
            </div>
          </div>

          {systemCaptureMessage && (
            <div className="panel capture-hint">
              <p>{systemCaptureMessage}</p>
            </div>
          )}

          {isSystemCaptureActive && (
            <div className="panel monitor-panel">
              <div className="monitor-header">
                <span>系统音频监听</span>
                <span className="monitor-value">{systemMonitorLevel.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={systemMonitorLevel}
                onChange={(event) => handleExternalMonitorLevel(parseFloat(event.target.value))}
                className="slider"
              />
              <p className="monitor-hint">如需避免回输，可保持监听音量在 0 或使用耳机。</p>
      </div>
          )}

          <div className="panel">
            <h2>预设菜单</h2>
            <details className="preset-menu" open>
              <summary>
                <span className="preset-current-name">{currentPreset.name}</span>
                <span className="preset-current-tagline">{currentPreset.tagline}</span>
              </summary>
              <ul>
                {factoryPresets.map((preset, index) => (
                  <li key={preset.name}>
                    <button
                      className={`preset-menu-item ${index === currentPresetIndex ? 'active' : ''}`}
                      onClick={() => handlePresetChange(index)}
                    >
                      <span className="preset-menu-title">{preset.name}</span>
                      <span className="preset-menu-desc">{preset.tagline}</span>
        </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          <div className="panel">
            <h2>FM 合成</h2>
            <div className="controls-grid">
              <Knob
                label="调制比率"
                value={modRatio}
                min={parameterBounds.modRatio.min}
                max={parameterBounds.modRatio.max}
                step={0.5}
                onChange={setModRatio}
              />
              <Knob
                label="FM 深度"
                value={fmIndex}
                min={parameterBounds.fmIndex.min}
                max={parameterBounds.fmIndex.max}
                step={1}
                onChange={setFmIndex}
              />
            </div>
          </div>

          <div className="panel">
            <h2>ADSR 包络</h2>
            <AdsrPreview
              attack={attackTime}
              decay={decayTime}
              sustain={sustainLevel}
              release={releaseTime}
            />
            <div className="controls-grid">
              <Knob
                label="Attack"
                value={attackTime}
                min={parameterBounds.attackTime.min}
                max={parameterBounds.attackTime.max}
                step={0.01}
                onChange={setAttackTime}
                unit="s"
              />
              <Knob
                label="Decay"
                value={decayTime}
                min={parameterBounds.decayTime.min}
                max={parameterBounds.decayTime.max}
                step={0.01}
                onChange={setDecayTime}
                unit="s"
              />
              <Knob
                label="Sustain"
                value={sustainLevel}
                min={parameterBounds.sustainLevel.min}
                max={parameterBounds.sustainLevel.max}
                step={0.01}
                onChange={setSustainLevel}
              />
              <Knob
                label="Release"
                value={releaseTime}
                min={parameterBounds.releaseTime.min}
                max={parameterBounds.releaseTime.max}
                step={0.01}
                onChange={setReleaseTime}
                unit="s"
              />
            </div>
          </div>

          <div className="panel">
            <h2>LFO 调制</h2>
            <div className="controls-grid">
              <Knob
                label="频率"
                value={lfoRate}
                min={parameterBounds.lfoRate.min}
                max={parameterBounds.lfoRate.max}
                step={0.1}
                onChange={setLfoRate}
                unit="Hz"
              />
              <Knob
                label="深度"
                value={lfoDepth}
                min={parameterBounds.lfoDepth.min}
                max={parameterBounds.lfoDepth.max}
                step={0.01}
                onChange={setLfoDepth}
              />
              <div className="lfo-target-select">
                <label>目标参数</label>
                <select
                  value={lfoTarget}
                  onChange={(e) =>
                    setLfoTarget(e.target.value as LfoTarget)
                  }
                >
                  <option value="pitch">音高（太空波浪）</option>
                  <option value="amp">音量（潮汐呼吸）</option>
                  <option value="fmIndex">FM 深度（闪烁颗粒）</option>
                  <option value="modRatio">调制比率（音色倾斜）</option>
                </select>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Delay 延迟</h2>
            <div className="controls-grid">
              <Knob
                label="时间"
                value={delayTime}
                min={parameterBounds.delayTime.min}
                max={parameterBounds.delayTime.max}
                step={10}
                onChange={setDelayTime}
                unit="ms"
              />
              <Knob
                label="反馈"
                value={delayFeedback}
                min={parameterBounds.delayFeedback.min}
                max={parameterBounds.delayFeedback.max}
                step={0.01}
                onChange={setDelayFeedback}
              />
              <Knob
                label="混合"
                value={delayWet}
                min={parameterBounds.delayWet.min}
                max={parameterBounds.delayWet.max}
                step={0.01}
                onChange={setDelayWet}
              />
            </div>
          </div>

          <div className="panel">
            <h2>主音量</h2>
            <Slider
              label="Master"
              value={masterVolume}
              min={0}
              max={0.5}
              step={0.01}
              onChange={setMasterVolume}
            />
          </div>

          <div className="panel">
            <ModelUploader onModelSelect={(src) => console.log('Model selected:', src)} />
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <h1>Ocean Shimmer Audiovisual</h1>
        <p>Ecliptica Studio · Web Audio + AudioWorklet</p>
      </footer>
      </div>
  );
}

export default App;
