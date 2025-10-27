import { Suspense, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { AudioBus, VisualID, VisualProps } from './registry';
import { VisualRegistry } from './registry';

function Loading() {
  return (
    <div className="visual-loading">
      <span>Loading visual...</span>
    </div>
  );
}

export function VisualHost({
  visualId,
  audio,
  params
}: {
  visualId: VisualID;
  audio: AudioBus;
  params?: VisualProps['params'];
}) {
  const [Component, setComponent] = useState<ComponentType<VisualProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    VisualRegistry[visualId]().then((Comp) => {
      if (mounted) setComponent(() => Comp);
    });
    return () => {
      mounted = false;
    };
  }, [visualId]);

  if (!Component) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Component audio={audio} params={params} />
    </Suspense>
  );
}
