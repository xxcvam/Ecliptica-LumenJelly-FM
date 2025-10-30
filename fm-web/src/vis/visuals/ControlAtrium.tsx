import { ControlStage } from '../control';
import { JellySchool } from './Jelly';
import type { AudioBus } from '../registry';

interface VisualProps {
  audio: AudioBus;
  params?: Record<string, unknown>;
}

export default function ControlAtriumVisual({ audio, params }: VisualProps) {
  const variant = (params?.variant as 'atrium' | 'void' | 'red_room') ?? 'atrium';
  const showJellySchool = variant === 'atrium';

  return (
    <ControlStage variant={variant} audio={audio}>
      {showJellySchool && <JellySchool audio={audio} params={params} />}
    </ControlStage>
  );
}
