import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface TextRevealProps {
  text: string;
  startFrame?: number;
  style?: 'typewriter' | 'fadeSlide' | 'scale';
  primaryColor?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  durationInFrames: number;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  startFrame = 0,
  style = 'fadeSlide',
  primaryColor = '#ffffff',
  fontSize = 64,
  fontWeight = 700,
  textAlign = 'center',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const adjustedFrame = frame - startFrame;
  
  if (style === 'typewriter') {
    const visibleChars = interpolate(
      adjustedFrame,
      [0, Math.min(text.length * 2, durationInFrames - 30)],
      [0, text.length],
      { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );
    
    const displayText = text.slice(0, Math.floor(visibleChars));
    const cursorVisible = adjustedFrame % 10 < 5;
    
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          fontSize,
          fontWeight,
          color: primaryColor,
          fontFamily: 'monospace',
          textAlign,
        }}>
          {displayText}
          <span style={{ opacity: cursorVisible ? 1 : 0 }}>|</span>
        </div>
      </AbsoluteFill>
    );
  }
  
  if (style === 'scale') {
    const springProgress = spring({ frame: adjustedFrame, fps, config: { damping: 12, stiffness: 100 } });
    const scale = interpolate(springProgress, [0, 1], [0.5, 1]);
    const opacity = interpolate(springProgress, [0, 0.5], [0, 1]);
    
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          fontSize,
          fontWeight,
          color: primaryColor,
          textAlign,
          transform: `scale(${scale})`,
          opacity,
        }}>
          {text}
        </div>
      </AbsoluteFill>
    );
  }
  
  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const translateY = interpolate(adjustedFrame, [0, 20], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  
  const fadeOutOpacity = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontSize,
        fontWeight,
        color: primaryColor,
        textAlign,
        opacity: Math.min(opacity, fadeOutOpacity),
        transform: `translateY(${translateY}px)`,
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
