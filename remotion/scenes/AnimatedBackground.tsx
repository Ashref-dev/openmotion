import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export interface AnimatedBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  style?: 'gradient' | 'particles' | 'grid' | 'waves';
  durationInFrames: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  primaryColor = '#6C5CE7',
  secondaryColor = '#1a1a2e',
  style = 'gradient',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  
  if (style === 'gradient') {
    const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);
    
    return (
      <AbsoluteFill style={{
        background: `linear-gradient(${gradientAngle}deg, ${secondaryColor} 0%, ${primaryColor}30 50%, ${secondaryColor} 100%)`,
      }} />
    );
  }
  
  if (style === 'particles') {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      x: (i * 73) % 100,
      y: (i * 47) % 100,
      size: 2 + (i % 4),
      speed: 0.5 + (i % 3) * 0.3,
    }));
    
    return (
      <AbsoluteFill style={{ backgroundColor: secondaryColor }}>
        {particles.map((particle, i) => {
          const animFrame = frame * particle.speed;
          const loopedFrame = animFrame % 100;
          const yOffset = interpolate(loopedFrame, [0, 100], [110, -10]);
          const opacity = interpolate(frame, [0, 30], [0, 0.4], { extrapolateRight: 'clamp' });
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${particle.x}%`,
                top: `${yOffset}%`,
                width: particle.size,
                height: particle.size,
                borderRadius: '50%',
                backgroundColor: primaryColor,
                opacity,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }
  
  if (style === 'grid') {
    const gridOpacity = interpolate(frame, [0, 30], [0, 0.1], { extrapolateRight: 'clamp' });
    
    return (
      <AbsoluteFill style={{ 
        backgroundColor: secondaryColor,
        backgroundImage: `
          linear-gradient(${primaryColor}${Math.round(gridOpacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px),
          linear-gradient(90deg, ${primaryColor}${Math.round(gridOpacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
    );
  }
  
  if (style === 'waves') {
    const waveFrame = frame % 200;
    const waveOffset = interpolate(waveFrame, [0, 200], [0, -200]);
    
    return (
      <AbsoluteFill style={{ backgroundColor: secondaryColor, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: waveOffset,
          width: '200%',
          height: '40%',
          background: `linear-gradient(180deg, transparent 0%, ${primaryColor}15 100%)`,
          clipPath: 'polygon(0 50%, 5% 45%, 10% 50%, 15% 45%, 20% 50%, 25% 45%, 30% 50%, 35% 45%, 40% 50%, 45% 45%, 50% 50%, 55% 45%, 60% 50%, 65% 45%, 70% 50%, 75% 45%, 80% 50%, 85% 45%, 90% 50%, 95% 45%, 100% 50%, 100% 100%, 0 100%)',
        }} />
      </AbsoluteFill>
    );
  }
  
  return <AbsoluteFill style={{ backgroundColor: secondaryColor }} />;
};
