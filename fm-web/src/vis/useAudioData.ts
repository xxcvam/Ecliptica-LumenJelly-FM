import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  LinearFilter,
  RedFormat
} from 'three';

const FFT_TEXTURE_SIZE = 1024;

export interface AudioMetrics {
  rms: number;
  bands: [number, number, number];
}

interface AudioDataHook {
  fftTexture: DataTexture;
  metricsRef: MutableRefObject<AudioMetrics>;
  update: () => AudioMetrics;
}

const createTexture = () => {
  const data = new Float32Array(FFT_TEXTURE_SIZE);
  const texture = new DataTexture(data, FFT_TEXTURE_SIZE, 1, RedFormat, FloatType);
  texture.needsUpdate = true;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  return { texture, data };
};

export function useAudioData(analyser: AnalyserNode | null): AudioDataHook {
  const [{ texture, data }] = useState(createTexture);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDomainRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const freqDomainRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const metricsRef = useRef<AudioMetrics>({ rms: 0, bands: [0, 0, 0] });

  useEffect(() => {
    analyserRef.current = analyser;
    if (analyser) {
      timeDomainRef.current = Float32Array.from({ length: analyser.fftSize }, () => 0);
      freqDomainRef.current = Uint8Array.from({ length: analyser.frequencyBinCount }, () => 0);
    } else {
      timeDomainRef.current = null;
      freqDomainRef.current = null;
      metricsRef.current = { rms: 0, bands: [0, 0, 0] };
    }
  }, [analyser]);

  const update = useCallback((): AudioMetrics => {
    const analyserNode = analyserRef.current;
    const timeDomain = timeDomainRef.current;
    const freqDomain = freqDomainRef.current;

    if (!analyserNode || !timeDomain || !freqDomain) {
      metricsRef.current = { rms: 0, bands: [0, 0, 0] };
      return metricsRef.current;
    }

    const timeBuffer = timeDomain as unknown as Float32Array;
    const freqBuffer = freqDomain as unknown as Uint8Array;

    analyserNode.getFloatTimeDomainData(timeBuffer as any);
    analyserNode.getByteFrequencyData(freqBuffer as any);

    let sumSquares = 0;
    for (let i = 0; i < timeBuffer.length; i++) {
      const sample = timeBuffer[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / timeBuffer.length);

    const binCount = freqBuffer.length;
    const sampleRate = analyserNode.context.sampleRate;
    const binSize = sampleRate / 2 / Math.max(binCount, 1);

    let low = 0;
    let mid = 0;
    let high = 0;
    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    for (let i = 0; i < binCount; i++) {
      const normalized = freqBuffer[i] / 255;
      const freq = binSize * i;

      if (freq < 200) {
        low += normalized;
        lowCount++;
      } else if (freq < 2000) {
        mid += normalized;
        midCount++;
      } else {
        high += normalized;
        highCount++;
      }

      if (i < FFT_TEXTURE_SIZE) {
        data[i] = normalized;
      }
    }

    for (let i = binCount; i < FFT_TEXTURE_SIZE; i++) {
      data[i] = 0;
    }

    texture.needsUpdate = true;

    const bands: [number, number, number] = [
      lowCount > 0 ? low / lowCount : 0,
      midCount > 0 ? mid / midCount : 0,
      highCount > 0 ? high / highCount : 0
    ];

    metricsRef.current = { rms, bands };
    return metricsRef.current;
  }, [data, texture]);

  return {
    fftTexture: texture,
    metricsRef,
    update
  };
}
