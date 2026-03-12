import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface CTAButtonProps {
  text: string;
  href?: string;
  primaryColor?: string;
  style?: 'solid' | 'outline' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  position?: 'center' | 'bottom';
  startFrame?: number;
  durationInFrames?: number;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  text,
  href,
  primaryColor = '#6C5CE7',
  style = 'solid',
  size = 'md',
  position = 'center',
  startFrame = 0,
  durationInFrames = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const adjustedFrame = frame - startFrame;
  
  const entrance = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = interpolate(entrance, [0, 0.5], [0, 1]);
  
  const pulsePhase = Math.sin(frame * 0.1) * 0.05 + 1;
  const glowOpacity = Math.sin(frame * 0.08) * 0.3 + 0.5;
  
  const sizeStyles = {
    sm: { padding: '12px 24px', fontSize: 16 },
    md: { padding: '16px 32px', fontSize: 20 },
    lg: { padding: '20px 40px', fontSize: 24 },
  };
  
  const positionStyles = {
    center: { justifyContent: 'center', alignItems: 'center' },
    bottom: { justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 80 },
  };
  
  const buttonStyles = {
    solid: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      border: 'none',
      boxShadow: `0 4px 20px ${primaryColor}40`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: primaryColor,
      border: `2px solid ${primaryColor}`,
      boxShadow: 'none',
    },
    glow: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      border: 'none',
      boxShadow: `
        0 0 20px ${primaryColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')},
        0 4px 30px ${primaryColor}40
      `,
    },
  };
  
  const exitOpacity = durationInFrames 
    ? interpolate(adjustedFrame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })
    : 1;

  return (
    <AbsoluteFill style={{ ...positionStyles[position], opacity: opacity * exitOpacity }}>
      <div style={{
        transform: `scale(${scale * pulsePhase})`,
        borderRadius: 999,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ...sizeStyles[size],
        ...buttonStyles[style],
      }}>
        {text}
      </div>
      {href && (
        <div style={{
          position: 'absolute',
          bottom: -30,
          fontSize: 14,
          color: '#888',
          opacity: entrance,
        }}>
          {href}
        </div>
      )}
    </AbsoluteFill>
  );
};
