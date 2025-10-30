import { useState, Component, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { useControlStore } from './store';

// 简单的 ErrorBoundary 组件
class ErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export function PostFX() {
  const [hasError, setHasError] = useState(false);
  const store = useControlStore();
  const { gl } = useThree();

  // WebGL 上下文保护：上下文丢失或未就绪时禁用后期
  let contextOk = false;
  try {
    // getContext 可能返回 null（上下文丢失）
    const ctx = gl?.getContext?.();
    if (ctx && typeof ctx.getContextAttributes === 'function') {
      contextOk = !!ctx.getContextAttributes();
    } else {
      contextOk = false;
    }
  } catch {
    contextOk = false;
  }

  // 低质量或出错时禁用后期处理
  if (hasError || store.quality === 'low' || !contextOk) return null;

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.3} mipmapBlur />
        <DepthOfField focusDistance={0.02} focalLength={0.03} bokehScale={3} />
        <Vignette offset={0.4} darkness={0.85} />
      </EffectComposer>
    </ErrorBoundary>
  );
}
