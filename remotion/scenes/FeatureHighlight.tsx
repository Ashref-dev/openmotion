import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface FeatureItem {
  title: string;
  description?: string;
  icon?: string;
}

export interface FeatureHighlightProps {
  features: FeatureItem[];
  startFrame?: number;
  staggerDelay?: number;
  primaryColor?: string;
  backgroundColor?: string;
  durationInFrames: number;
}

const FeatureCard: React.FC<{
  feature: FeatureItem;
  index: number;
  startFrame: number;
  staggerDelay: number;
  primaryColor: string;
  backgroundColor: string;
}> = ({ feature, index, startFrame, staggerDelay, primaryColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delay = index * staggerDelay;
  const adjustedFrame = frame - startFrame - delay;
  
  const springProgress = spring({ frame: adjustedFrame, fps, config: { damping: 15, stiffness: 80 } });
  
  const opacity = interpolate(springProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });
  const translateX = interpolate(springProgress, [0, 1], [index % 2 === 0 ? -60 : 60, 0]);
  const scale = interpolate(springProgress, [0, 1], [0.9, 1]);
  
  return (
    <div style={{
      backgroundColor,
      borderRadius: 16,
      padding: '28px 32px',
      opacity,
      transform: `translateX(${translateX}px) scale(${scale})`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: `1px solid ${primaryColor}20`,
      minWidth: 280,
    }}>
      {feature.icon && (
        <div style={{ fontSize: 36, marginBottom: 12 }}>{feature.icon}</div>
      )}
      <h3 style={{
        color: primaryColor,
        fontSize: 22,
        fontWeight: 600,
        marginBottom: 8,
      }}>
        {feature.title}
      </h3>
      {feature.description && (
        <p style={{
          color: '#a0a0a0',
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          {feature.description}
        </p>
      )}
    </div>
  );
};

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  features,
  startFrame = 0,
  staggerDelay = 12,
  primaryColor = '#6C5CE7',
  backgroundColor = '#1a1a2e',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  
  const fadeIn = interpolate(frame, [startFrame, startFrame + 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  
  const displayFeatures = features.slice(0, 3);
  
  return (
    <AbsoluteFill style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      opacity: Math.min(fadeIn, fadeOut),
    }}>
      <div style={{
        display: 'flex',
        gap: 24,
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: 40,
      }}>
        {displayFeatures.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={index}
            startFrame={startFrame}
            staggerDelay={staggerDelay}
            primaryColor={primaryColor}
            backgroundColor={backgroundColor}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
