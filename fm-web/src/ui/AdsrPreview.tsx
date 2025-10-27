import { useMemo } from 'react';

interface AdsrPreviewProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const WIDTH = 220;
const HEIGHT = 120;
const HOLD_TIME = 0.4;

export function AdsrPreview({ attack, decay, sustain, release }: AdsrPreviewProps) {
  const pathData = useMemo(() => {
    const safeAttack = Math.max(0, attack);
    const safeDecay = Math.max(0, decay);
    const safeRelease = Math.max(0.01, release);
    const sustainLevel = Math.min(Math.max(sustain, 0), 1);

    const total = safeAttack + safeDecay + HOLD_TIME + safeRelease || 1;
    const points = [
      { x: 0, y: HEIGHT },
      {
        x: (safeAttack / total) * WIDTH,
        y: HEIGHT - HEIGHT
      },
      {
        x: ((safeAttack + safeDecay) / total) * WIDTH,
        y: HEIGHT - sustainLevel * HEIGHT
      },
      {
        x: ((safeAttack + safeDecay + HOLD_TIME) / total) * WIDTH,
        y: HEIGHT - sustainLevel * HEIGHT
      },
      {
        x: WIDTH,
        y: HEIGHT
      }
    ];

    return points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  }, [attack, decay, sustain, release]);

  return (
    <div className="adsr-preview">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="ADSR 包络预览">
        <defs>
          <linearGradient id="adsrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.65)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0.75)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="12" ry="12" className="adsr-preview-bg" />
        {Array.from({ length: 5 }).map((_, index) => (
          <line
            key={index}
            x1={0}
            x2={WIDTH}
            y1={(HEIGHT / 4) * index}
            y2={(HEIGHT / 4) * index}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={1}
          />
        ))}
        <path d={pathData} fill="url(#adsrGradient)" opacity={0.35} />
        <path d={pathData} stroke="url(#adsrGradient)" strokeWidth={3} fill="none" />
      </svg>
      <p className="adsr-preview-caption">包络预览（含 0.4s sustain hold）</p>
    </div>
  );
}

