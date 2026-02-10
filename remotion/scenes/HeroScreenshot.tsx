import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { constrainedSpring, constrainedScale, fadeIn, fadeOut } from '../utils/motion';

export interface HeroScreenshotProps {
  assetUrl: string;
  motion?: 'drift' | 'copy' | 'static';
  intensity?: number;
  durationInFrames: number;
}

export const HeroScreenshot: React.FC<HeroScreenshotProps> = ({
  assetUrl,
  motion = 'drift',
  intensity = 0.7,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInProgress = fadeIn(frame, 0, 6);
  const fadeOutProgress = fadeOut(frame, durationInFrames, 6);
  const opacity = Math.min(fadeInProgress, fadeOutProgress);

  let transform = 'none';

  if (motion === 'drift') {
    const progress = constrainedSpring({ frame, fps, config: { damping: 200 } });
    const scale = constrainedScale(progress, 1.0, intensity * 0.06);
    transform = `scale(${scale})`;
  } else if (motion === 'copy') {
    const progress = constrainedSpring({ frame, fps, config: { damping: 150, stiffness: 80 } });
    const scale = constrainedScale(progress, 1.02, intensity * 0.08);
    transform = `scale(${scale})`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
        }}
      >
        <Img
          src={assetUrl}
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            transform,
            borderRadius: 8,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
