export type NoteEvent = {
  time: number;
  midi: number;
  vel: number; // 0..1
  source: 'seq' | 'midi' | 'kbd';
};

export type AccentEvent = {
  time: number;
  step: number;
  on: boolean;
};

type Unsub = () => void;

function createBus<T>() {
  const subs = new Set<(e: T) => void>();
  return {
    on(cb: (e: T) => void): Unsub {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    emit(e: T) {
      subs.forEach((cb) => cb(e));
    }
  };
}

export const noteBus = createBus<NoteEvent>();
export const accentBus = createBus<AccentEvent>();

// helpers
export function freqToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(69 + 12 * Math.log2(freq / 440));
}


