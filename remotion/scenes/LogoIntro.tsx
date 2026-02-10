import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';

export interface LogoIntroProps {
  logoUrl: string;
  durationInFrames: number;
}

export const LogoIntro: React.FC<LogoIntroProps> = ({ logoUrl, durationInFrames }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const scale = interpolate(frame, [0, 20], [0.8, 1], {
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
          src={logoUrl}
          style={{
            maxWidth: '40%',
            maxHeight: '40%',
            objectFit: 'contain',
            transform: `scale(${scale})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
