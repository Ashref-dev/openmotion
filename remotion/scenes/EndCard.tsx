import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface EndCardProps {
  logoUrl: string;
  text?: string;
  tagline?: string;
  ctaText?: string;
  ctaColor?: string;
  backgroundColor?: string;
  durationInFrames: number;
}

export const EndCard: React.FC<EndCardProps> = ({
  logoUrl,
  text = 'Ready to get started?',
  tagline,
  ctaText,
  ctaColor = '#6C5CE7',
  backgroundColor = '#0a0a12',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const textSlide = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });

  const ctaSlide = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const pulse = Math.sin(frame * 0.1) * 0.05 + 1;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 24,
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={logoUrl}
            style={{
              maxWidth: 180,
              maxHeight: 60,
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 30px rgba(108, 92, 231, 0.3))',
            }}
          />
        </div>

        <div
          style={{
            transform: `translateY(${interpolate(textSlide, [0, 1], [20, 0])}px)`,
            opacity: textSlide,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: '700',
              color: '#fff',
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}
          >
            {text}
          </div>

          {tagline && (
            <div
              style={{
                fontSize: 20,
                fontWeight: '400',
                color: '#888',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {tagline}
            </div>
          )}
        </div>

        {ctaText && (
          <div
            style={{
              transform: `translateY(${interpolate(ctaSlide, [0, 1], [30, 0])}px) scale(${pulse})`,
              opacity: ctaSlide,
              marginTop: 16,
            }}
          >
            <div
              style={{
                padding: '16px 40px',
                backgroundColor: ctaColor,
                borderRadius: 12,
                fontSize: 18,
                fontWeight: '600',
                color: '#fff',
                boxShadow: `0 10px 40px ${ctaColor}50, 0 0 60px ${ctaColor}30`,
                cursor: 'pointer',
              }}
            >
              {ctaText}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 14,
            color: '#555',
            opacity: interpolate(frame, [30, 45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Learn more at yoursaas.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
