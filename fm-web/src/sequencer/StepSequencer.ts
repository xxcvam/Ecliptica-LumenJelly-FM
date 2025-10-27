export interface SequencerStep {
  on: boolean;
  pitch: number; // semitone offset relative to root
  velocity: number; // 0-127
  gate: number; // 0-1
  probability: number; // 0-1
  ratchet: number; // integer >=1
}

export type SequencerMode = 'forward' | 'pingpong' | 'random';

export interface SequencerAPI {
  noteOnAt: (freq: number, velocity: number, at: number, length: number) => void;
  setAt?: (key: string, value: number, at: number) => void;
}

export interface ScaleDefinition {
  label: string;
  intervals: number[];
}

export const SCALE_MAP: Record<string, ScaleDefinition> = {
  major: { label: 'Major (Cheerful)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: 'Minor (Moody)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  pentatonic: { label: 'Pentatonic (Dreamy)', intervals: [0, 2, 4, 7, 9] }
};

export function quantizePitch(root: number, pitchOffset: number, scale: number[]): number {
  const midi = root + pitchOffset;
  const octaveBase = Math.floor(midi / 12) * 12;
  const degree = midi - octaveBase;
  let best = scale[0];
  let minDiff = Number.POSITIVE_INFINITY;
  for (const note of scale) {
    const diff = Math.abs(note - degree);
    if (diff < minDiff) {
      minDiff = diff;
      best = note;
    }
  }
  return octaveBase + best;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

interface VisualCallback {
  (stepIndex: number): void;
}

export class StepSequencer {
  private ctx: AudioContext;
  private api: SequencerAPI;
  private onVisualStep?: VisualCallback;

  private steps: SequencerStep[] = [];
  private bpm = 120;
  private stepLength = 0.25; // fraction of quarter note (0.25 = 1/16)
  private swing = 0;
  private lookahead = 0.025;
  private scheduleAhead = 0.12;
  private pointer = 0;
  private stepCounter = 0;
  private direction = 1;
  private scheduleId: number | null = null;
  private visualTimeouts: number[] = [];
  private noteTimeouts: number[] = [];

  private nextNoteTime = 0;
  private playing = false;
  private loopLength = 16;
  private root = 60;
  private scale: number[] = SCALE_MAP.major.intervals;
  private mode: SequencerMode = 'forward';

  constructor(ctx: AudioContext, api: SequencerAPI, onVisualStep?: VisualCallback) {
    this.ctx = ctx;
    this.api = api;
    this.onVisualStep = onVisualStep;
  }

  setSteps(steps: SequencerStep[]) {
    this.steps = steps.map((step) => ({ ...step }));
    this.loopLength = Math.min(this.loopLength, this.steps.length);
  }

  setBpm(bpm: number) {
    this.bpm = Math.max(20, Math.min(320, bpm));
  }

  setStepLength(length: number) {
    this.stepLength = Math.max(0.0625, Math.min(1, length));
  }

  setSwing(amount: number) {
    this.swing = Math.max(0, Math.min(0.6, amount));
  }

  setLoopLength(length: number) {
    this.loopLength = Math.max(1, Math.min(length, this.steps.length));
    this.pointer = this.pointer % this.loopLength;
  }

  setMode(mode: SequencerMode) {
    this.mode = mode;
  }

  setScale(root: number, scale: number[]) {
    this.root = root;
    this.scale = scale;
  }

  start() {
    if (this.playing || !this.steps.length) return;
    this.playing = true;
    this.pointer = 0;
    this.stepCounter = 0;
    this.direction = 1;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.loop();
  }

  stop() {
    this.playing = false;
    if (this.scheduleId !== null) {
      clearTimeout(this.scheduleId);
      this.scheduleId = null;
    }
    this.clearVisualTimeouts();
  }

  isPlaying() {
    return this.playing;
  }

  private loop = () => {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    while (this.nextNoteTime < now + this.scheduleAhead) {
      const stepIndex = this.pointer % this.steps.length;
      this.scheduleStep(stepIndex, this.nextNoteTime);
      this.advance();
    }
    this.scheduleId = window.setTimeout(this.loop, this.lookahead * 1000);
  };

  private scheduleStep(index: number, time: number) {
    const step = this.steps[index];
    if (!step || !step.on) return;
    const probability = step.probability ?? 1;
    if (probability < 1 && Math.random() > probability) {
      return;
    }

    const midi = quantizePitch(this.root, step.pitch, this.scale);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const baseStepDuration = (60 / this.bpm) * this.stepLength;
    const gateDuration = Math.max(0.03, baseStepDuration * step.gate);
    const ratchet = Math.max(1, Math.min(4, Math.round(step.ratchet || 1)));
    const slice = gateDuration / ratchet;

    for (let i = 0; i < ratchet; i++) {
      const eventTime = time + i * slice;
      const length = slice * 0.95;
      this.api.noteOnAt(freq, step.velocity / 127, eventTime, length);
      // 事件总线：在精确时间点发出 note 事件（与可视同步）
      const delayMs = Math.max(0, (eventTime - this.ctx.currentTime) * 1000);
      const timeoutId = window.setTimeout(async () => {
        try {
          const bus = await import('../vis/events/bus');
          const midiVal = bus.freqToMidi(freq);
          bus.noteBus.emit({ time: performance.now(), midi: midiVal, vel: Math.min(1, step.velocity / 127), source: 'seq' });
        } catch {}
      }, delayMs);
      this.noteTimeouts.push(timeoutId);
    }

    if (this.onVisualStep) {
      const delay = Math.max(0, (time - this.ctx.currentTime) * 1000);
      const timeout = window.setTimeout(() => this.onVisualStep && this.onVisualStep(index), delay);
      this.visualTimeouts.push(timeout);
    }
    // 同步 Accent 事件（步进入时）
    const accentDelay = Math.max(0, (time - this.ctx.currentTime) * 1000);
    const accentTimeout = window.setTimeout(async () => {
      try {
        const bus = await import('../vis/events/bus');
        bus.accentBus.emit({ time: performance.now(), step: index, on: !!step.on });
      } catch {}
    }, accentDelay);
    this.visualTimeouts.push(accentTimeout);
  }

  private advance() {
    const quart = 60 / this.bpm;
    let duration = quart * this.stepLength;
    if (this.swing > 0) {
      const swingAmount = quart * this.stepLength * this.swing;
      if (this.stepCounter % 2 === 0) {
        duration = Math.max(0.01, duration - swingAmount);
      } else {
        duration += swingAmount;
      }
    }

    this.nextNoteTime += duration;
    this.stepCounter++;

    switch (this.mode) {
      case 'forward': {
        this.pointer = (this.pointer + 1) % this.loopLength;
        break;
      }
      case 'pingpong': {
        if (this.loopLength <= 1) {
          this.pointer = 0;
          break;
        }
        this.pointer += this.direction;
        if (this.pointer >= this.loopLength) {
          this.pointer = this.loopLength - 2;
          this.direction = -1;
        } else if (this.pointer < 0) {
          this.pointer = 1;
          this.direction = 1;
        }
        break;
      }
      case 'random': {
        this.pointer = Math.floor(Math.random() * this.loopLength);
        break;
      }
      default:
        this.pointer = (this.pointer + 1) % this.loopLength;
        break;
    }
  }

  private clearVisualTimeouts() {
    this.visualTimeouts.forEach((id) => clearTimeout(id));
    this.visualTimeouts = [];
    this.noteTimeouts.forEach((id) => clearTimeout(id));
    this.noteTimeouts = [];
  }
}

// 动态导入已处理，移除兼容函数
