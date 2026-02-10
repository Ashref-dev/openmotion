import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { constrainedSpring } from '../utils/motion';

export interface ZoomCutProps {
  assetUrl: string;
  durationInFrames: number;
}

export const ZoomCut: React.FC<ZoomCutProps> = ({ assetUrl, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomProgress = constrainedSpring({
    frame,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  const scale = interpolate(zoomProgress, [0, 1], [1.1, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, 6, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
            transform: `scale(${scale})`,
            borderRadius: 8,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
