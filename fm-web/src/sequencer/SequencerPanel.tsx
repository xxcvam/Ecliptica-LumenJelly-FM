import classNames from 'classnames';
import React from 'react';
import { midiToNoteName, quantizePitch, SCALE_MAP } from './StepSequencer';
import type { SequencerMode, SequencerStep } from './StepSequencer';

interface SequencerPanelProps {
  steps: SequencerStep[];
  activeStep: number | null;
  selectedStep: number | null;
  playing: boolean;
  bpm: number;
  swing: number;
  stepLength: number;
  loopLength: number;
  mode: SequencerMode;
  root: number;
  scaleKey: keyof typeof SCALE_MAP;
  canPlay: boolean;
  onToggleStep: (index: number) => void;
  onSelectStep: (index: number | null) => void;
  onChangeStep: (index: number, payload: Partial<SequencerStep>) => void;
  onPlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onSwingChange: (value: number) => void;
  onStepLengthChange: (value: number) => void;
  onLoopLengthChange: (value: number) => void;
  onModeChange: (mode: SequencerMode) => void;
  onRootChange: (value: number) => void;
  onScaleChange: (key: keyof typeof SCALE_MAP) => void;
}

const STEP_LENGTH_OPTIONS = [
  { value: 0.25, label: '1/16' },
  { value: 0.5, label: '1/8' },
  { value: 1 / 3, label: '1/8T' },
  { value: 1 / 6, label: '1/16T' }
];

const MODE_OPTIONS: { value: SequencerMode; label: string }[] = [
  { value: 'forward', label: 'Forward' },
  { value: 'pingpong', label: 'Ping-Pong' },
  { value: 'random', label: 'Random' }
];

const ROOT_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const midi = 48 + i;
  return {
    value: midi,
    label: midiToNoteName(midi)
  };
});

export function SequencerPanel({
  steps,
  activeStep,
  selectedStep,
  playing,
  bpm,
  swing,
  stepLength,
  loopLength,
  mode,
  root,
  scaleKey,
  canPlay,
  onToggleStep,
  onSelectStep,
  onChangeStep,
  onPlay,
  onStop,
  onBpmChange,
  onSwingChange,
  onStepLengthChange,
  onLoopLengthChange,
  onModeChange,
  onRootChange,
  onScaleChange
}: SequencerPanelProps) {
  const scale = SCALE_MAP[scaleKey];

  const handleStepClick = (index: number) => {
    onToggleStep(index);
    onSelectStep(index);
  };

  const handleStepContextMenu = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    onSelectStep(selectedStep === index ? null : index);
  };

  const selected = selectedStep !== null ? steps[selectedStep] : null;
  const selectedNoteName =
    selected != null
      ? midiToNoteName(quantizePitch(root, selected.pitch, scale.intervals))
      : '';

  return (
    <div className="panel sequencer-panel">
      <header className="sequencer-header">
        <div className="seq-transport">
          <button
            className={classNames('seq-play', { playing })}
            onClick={playing ? onStop : onPlay}
            disabled={!canPlay}
          >
            {playing ? '■ Stop' : '▶ Play'}
          </button>
          <label className="seq-bpm">
            <span>BPM</span>
            <input
              type="number"
              min={40}
              max={220}
              value={Math.round(bpm)}
              onChange={(event) => onBpmChange(Number(event.target.value) || bpm)}
            />
          </label>
        </div>

        <div className="seq-setting-row">
          <label>
            Step
            <select value={stepLength} onChange={(e) => onStepLengthChange(Number(e.target.value))}>
              {STEP_LENGTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Swing
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.02}
              value={swing}
              onChange={(event) => onSwingChange(Number(event.target.value))}
            />
            <span className="seq-inline-value">{Math.round(swing * 100)}%</span>
          </label>
          <label>
            Length
            <input
              type="number"
              min={1}
              max={steps.length}
              value={loopLength}
              onChange={(event) => onLoopLengthChange(Math.max(1, Math.min(steps.length, Number(event.target.value))))}
            />
          </label>
          <label>
            Mode
            <select value={mode} onChange={(event) => onModeChange(event.target.value as SequencerMode)}>
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="seq-setting-row">
          <label>
            Root
            <select value={root} onChange={(event) => onRootChange(Number(event.target.value))}>
              {ROOT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scale
            <select value={scaleKey} onChange={(event) => onScaleChange(event.target.value as keyof typeof SCALE_MAP)}>
              {Object.entries(SCALE_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="sequencer-grid">
        {steps.map((step, index) => {
          const midi = quantizePitch(root, step.pitch, scale.intervals);
          const noteLabel = midiToNoteName(midi);
          return (
            <button
              key={index}
              className={classNames('seq-step', {
                on: step.on,
                active: activeStep === index,
                selected: selectedStep === index
              })}
              onClick={() => handleStepClick(index)}
              onDoubleClick={() => onSelectStep(index)}
              onContextMenu={(event) => handleStepContextMenu(event, index)}
            >
              <span className="seq-step-index">{index + 1}</span>
              <span className="seq-step-note">{step.on ? noteLabel : '—'}</span>
              {step.on && (
                <span className="seq-step-meta">
                  {Math.round(step.probability * 100)}% · ×{step.ratchet}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && selectedStep !== null && (
        <div className="sequencer-editor">
          <header>
            <strong>Step {selectedStep + 1}</strong>
            <span>{selectedNoteName}</span>
          </header>
          <div className="sequencer-editor-grid">
            <label>
              状态
              <button
                className={classNames('seq-toggle', { enabled: selected.on })}
                onClick={() => onChangeStep(selectedStep, { on: !selected.on })}
              >
                {selected.on ? '启用' : '静音'}
              </button>
            </label>
            <label>
              音高
              <input
                type="range"
                min={-24}
                max={24}
                step={1}
                value={selected.pitch}
                onChange={(event) => onChangeStep(selectedStep, { pitch: Number(event.target.value) })}
              />
              <span className="seq-inline-value">{selectedNoteName}</span>
            </label>
            <label>
              力度
              <input
                type="range"
                min={1}
                max={127}
                value={selected.velocity}
                onChange={(event) => onChangeStep(selectedStep, { velocity: Number(event.target.value) })}
              />
              <span className="seq-inline-value">{selected.velocity}</span>
            </label>
            <label>
              Gate
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selected.gate}
                onChange={(event) => onChangeStep(selectedStep, { gate: Number(event.target.value) })}
              />
              <span className="seq-inline-value">{Math.round(selected.gate * 100)}%</span>
            </label>
            <label>
              概率
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selected.probability}
                onChange={(event) => onChangeStep(selectedStep, { probability: Number(event.target.value) })}
              />
              <span className="seq-inline-value">{Math.round(selected.probability * 100)}%</span>
            </label>
            <label>
              Ratchet
              <select
                value={selected.ratchet}
                onChange={(event) => onChangeStep(selectedStep, { ratchet: Number(event.target.value) })}
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    ×{value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
