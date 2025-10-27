import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

interface KeyboardProps {
  onNoteOn: (freq: number) => void;
  onNoteOff: () => void;
}

export const keyboardShortcuts: Array<{ key: string; note: string }> = [
  { key: 'Z', note: 'C2' },
  { key: 'S', note: 'C#2' },
  { key: 'X', note: 'D2' },
  { key: 'D', note: 'D#2' },
  { key: 'C', note: 'E2' },
  { key: 'V', note: 'F2' },
  { key: 'G', note: 'F#2' },
  { key: 'B', note: 'G2' },
  { key: 'H', note: 'G#2' },
  { key: 'N', note: 'A2' },
  { key: 'J', note: 'A#2' },
  { key: 'M', note: 'B2' },
  { key: ',', note: 'C3' },
  { key: 'L', note: 'C#3' },
  { key: '.', note: 'D3' },
  { key: ';', note: 'D#3' },
  { key: '/', note: 'E3' },
  { key: 'Q', note: 'F3' },
  { key: '2', note: 'F#3' },
  { key: 'W', note: 'G3' },
  { key: '3', note: 'G#3' },
  { key: 'E', note: 'A3' },
  { key: '4', note: 'A#3' },
  { key: 'R', note: 'B3' },
  { key: 'T', note: 'C4' }
];

// 13 键键盘 (C2 到 C4)
const notes = [
  { name: 'C2', freq: 65.41 },
  { name: 'C#2', freq: 69.30, isBlack: true },
  { name: 'D2', freq: 73.42 },
  { name: 'D#2', freq: 77.78, isBlack: true },
  { name: 'E2', freq: 82.41 },
  { name: 'F2', freq: 87.31 },
  { name: 'F#2', freq: 92.50, isBlack: true },
  { name: 'G2', freq: 98.00 },
  { name: 'G#2', freq: 103.83, isBlack: true },
  { name: 'A2', freq: 110.00 },
  { name: 'A#2', freq: 116.54, isBlack: true },
  { name: 'B2', freq: 123.47 },
  { name: 'C3', freq: 130.81 },
  { name: 'C#3', freq: 138.59, isBlack: true },
  { name: 'D3', freq: 146.83 },
  { name: 'D#3', freq: 155.56, isBlack: true },
  { name: 'E3', freq: 164.81 },
  { name: 'F3', freq: 174.61 },
  { name: 'F#3', freq: 185.00, isBlack: true },
  { name: 'G3', freq: 196.00 },
  { name: 'G#3', freq: 207.65, isBlack: true },
  { name: 'A3', freq: 220.00 },
  { name: 'A#3', freq: 233.08, isBlack: true },
  { name: 'B3', freq: 246.94 },
  { name: 'C4', freq: 261.63 }
];

export const Keyboard: React.FC<KeyboardProps> = ({ onNoteOn, onNoteOff }) => {
  const activeNoteRef = useRef<number | null>(null);
  const [activeNoteName, setActiveNoteName] = useState<string | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const triggerNoteOn = useCallback((noteName: string, freq: number) => {
    if (activeNoteRef.current !== freq) {
      activeNoteRef.current = freq;
      setActiveNoteName(noteName);
      onNoteOn(freq);
    }
  }, [onNoteOn]);

  const triggerNoteOff = useCallback(() => {
    activeNoteRef.current = null;
    setActiveNoteName(null);
    onNoteOff();
  }, [onNoteOff]);

  const keyToNote = useMemo(() => {
    const map = new Map<string, { name: string; freq: number }>();
    keyboardShortcuts.forEach(({ key, note }) => {
      const noteData = notes.find((n) => n.name === note);
      if (noteData) {
        map.set(key.toLowerCase(), noteData);
      }
    });
    return map;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = event.key.toLowerCase();
      const note = keyToNote.get(key);
      if (!note || pressedKeysRef.current.has(key)) {
        return;
      }
      pressedKeysRef.current.add(key);
      event.preventDefault();
      triggerNoteOn(note.name, note.freq);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!pressedKeysRef.current.has(key)) {
        return;
      }
      pressedKeysRef.current.delete(key);
      triggerNoteOff();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      pressedKeysRef.current.clear();
    };
  }, [keyToNote, triggerNoteOn, triggerNoteOff]);

  return (
    <div className="keyboard">
      {notes.map((note) => (
        <div
          key={note.name}
          className={classNames('key', {
            'key-black': note.isBlack,
            'key-white': !note.isBlack,
            'key-active': note.name === activeNoteName
          })}
          onMouseDown={() => triggerNoteOn(note.name, note.freq)}
          onMouseUp={triggerNoteOff}
          onMouseLeave={triggerNoteOff}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerNoteOn(note.name, note.freq);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            triggerNoteOff();
          }}
        >
          <span className="key-label">{note.name}</span>
        </div>
      ))}
    </div>
  );
};
