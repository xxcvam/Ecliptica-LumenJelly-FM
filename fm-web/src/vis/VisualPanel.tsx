import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudioData } from './useAudioData';
import { VisualHost } from './VisualHost';
import type { VisualID } from './registry';
import './visual.css';

interface VisualPanelProps {
  analyser: AnalyserNode | null;
  visualId: VisualID;
  visualParams?: Record<string, unknown>;
  bpm: number;
}

type QualityLevel = 'high' | 'low';

export function VisualPanel({ analyser, visualId, visualParams, bpm }: VisualPanelProps) {
  const audioData = useAudioData(analyser);
  const bpmRef = useRef(bpm);
  const qualityRef = useRef<QualityLevel>('high');
  const [quality, setQuality] = useState<QualityLevel>('high');
  const rafRef = useRef<number | null>(null);
  const fpsRef = useRef({ frames: 0, last: performance.now() });

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    const tick = () => {
      const metrics = audioData.update();
      const [, , high] = metrics.bands;
      const glass = Math.min(0.55, Math.max(0.28, 0.38 + 0.22 * (metrics.rms * 0.7 + high * 0.3 - 0.25)));
      document.documentElement.style.setProperty('--glass-alpha', glass.toFixed(3));

      fpsRef.current.frames += 1;
      const now = performance.now();
      if (now - fpsRef.current.last >= 1000) {
        const fps = (fpsRef.current.frames * 1000) / (now - fpsRef.current.last);
        fpsRef.current.frames = 0;
        fpsRef.current.last = now;
        const newQuality: QualityLevel = fps < 45 ? 'low' : 'high';
        if (qualityRef.current !== newQuality) {
          qualityRef.current = newQuality;
          document.documentElement.style.setProperty('--glass-blur', newQuality === 'low' ? '6px' : '10px');
          setQuality(newQuality);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioData]);

  const audioBus = useMemo(
    () => ({
      rms: () => audioData.metricsRef.current.rms,
      bands: () => audioData.metricsRef.current.bands,
      fftTexture: audioData.fftTexture,
      bpm: () => bpmRef.current
    }),
    [audioData]
  );

  const mergedParams = useMemo(() => ({ ...(visualParams || {}), quality }), [visualParams, quality]);

  return (
    <div className="visual-panel">
      <VisualHost visualId={visualId} audio={audioBus} params={mergedParams} />
    </div>
  );
}
