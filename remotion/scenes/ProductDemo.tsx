import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface ProductDemoProps {
  assetUrls: string[];
  headline?: string;
  tagline?: string;
  primaryColor?: string;
  showCursor?: boolean;
  durationInFrames: number;
}

const CursorAnimation: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();
  
  const positions = [
    { x: 50, y: 50 },
    { x: 70, y: 60 },
    { x: 60, y: 75 },
  ];
  
  const currentIndex = Math.floor(frame / 45) % positions.length;
  const progress = (frame % 45) / 45;
  
  const prevPos = positions[currentIndex];
  const nextPos = positions[(currentIndex + 1) % positions.length];
  
  const x = interpolate(progress, [0, 1], [prevPos.x, nextPos.x]);
  const y = interpolate(progress, [0, 1], [prevPos.y, nextPos.y]);
  
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4L10.5 20L13 13L20 10.5L4 4Z"
          fill={primaryColor}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

export const ProductDemo: React.FC<ProductDemoProps> = ({
  assetUrls,
  headline,
  tagline,
  primaryColor = '#6C5CE7',
  showCursor = true,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
  
  const springProgress = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const scale = interpolate(springProgress, [0, 1], [0.95, 1]);
  
  const mainAsset = assetUrls[0];
  const secondaryAssets = assetUrls.slice(1, 4);
  
  return (
    <AbsoluteFill style={{ 
      backgroundColor: '#0a0a12',
      opacity: Math.min(fadeIn, fadeOut),
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        transform: `scale(${scale})`,
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
        }}>
          {headline && (
            <h1 style={{
              color: '#ffffff',
              fontSize: 56,
              fontWeight: 700,
              marginBottom: 16,
              textAlign: 'center',
              opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [10, 30], [20, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
              {headline}
            </h1>
          )}
          
          {tagline && (
            <p style={{
              color: '#888',
              fontSize: 24,
              textAlign: 'center',
              maxWidth: 500,
              opacity: interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              {tagline}
            </p>
          )}
          
          {secondaryAssets.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 16,
              marginTop: 40,
            }}>
              {secondaryAssets.map((url, index) => (
                <div
                  key={url}
                  style={{
                    width: 80,
                    height: 60,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `2px solid ${primaryColor}30`,
                    opacity: interpolate(frame, [40 + index * 10, 55 + index * 10], [0, 1], { extrapolateRight: 'clamp' }),
                  }}
                >
                  <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          flex: 1.2,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}>
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `
              0 0 60px ${primaryColor}30,
              0 25px 80px rgba(0, 0, 0, 0.4)
            `,
            border: `1px solid ${primaryColor}20`,
          }}>
            <Img
              src={mainAsset}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
            {showCursor && <CursorAnimation primaryColor={primaryColor} />}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
