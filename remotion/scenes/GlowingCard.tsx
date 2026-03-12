import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface GlowingCardProps {
  assetUrl: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  glowIntensity?: number;
  durationInFrames: number;
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  assetUrl,
  title,
  subtitle,
  primaryColor = '#6C5CE7',
  glowIntensity = 0.6,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const springProgress = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  
  const scale = interpolate(springProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(springProgress, [0, 0.3], [0, 1]);
  
  const glowPulse = Math.sin(frame * 0.08) * 0.2 + 0.8;
  const glowOpacity = glowIntensity * glowPulse;
  
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        position: 'relative',
        opacity: Math.min(opacity, fadeOut),
        transform: `scale(${scale})`,
      }}>
        <div style={{
          position: 'absolute',
          inset: -20,
          background: `radial-gradient(circle, ${primaryColor}${Math.round(glowOpacity * 60).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          borderRadius: 24,
        }} />
        
        <div style={{
          backgroundColor: '#0d0d14',
          borderRadius: 20,
          padding: 20,
          boxShadow: `
            0 0 40px ${primaryColor}${Math.round(glowOpacity * 40).toString(16).padStart(2, '0')},
            0 20px 60px rgba(0, 0, 0, 0.5)
          `,
          border: `1px solid ${primaryColor}30`,
        }}>
          <Img
            src={assetUrl}
            style={{
              maxWidth: 500,
              maxHeight: 400,
              objectFit: 'contain',
              borderRadius: 12,
            }}
          />
          
          {title && (
            <div style={{
              marginTop: 20,
              textAlign: 'center',
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{
                  color: '#888',
                  fontSize: 16,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
