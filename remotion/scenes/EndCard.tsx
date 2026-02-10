import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';

export interface EndCardProps {
  logoUrl: string;
  text?: string;
  durationInFrames: number;
}

export const EndCard: React.FC<EndCardProps> = ({ logoUrl, text }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeIn,
          gap: 32,
          flexDirection: 'column',
        }}
      >
        <Img
          src={logoUrl}
          style={{
            maxWidth: '30%',
            maxHeight: '30%',
            objectFit: 'contain',
          }}
        />
        {text && (
          <div
            style={{
              fontSize: 32,
              fontWeight: '600',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
