import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';
import { fadeIn, fadeOut } from '../utils/motion';

export interface SplitShowcaseProps {
  assetUrls: string[];
  durationInFrames: number;
}

export const SplitShowcase: React.FC<SplitShowcaseProps> = ({
  assetUrls,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const fadeInProgress = fadeIn(frame, 0, 10);
  const fadeOutProgress = fadeOut(frame, durationInFrames, 10);
  const opacity = Math.min(fadeInProgress, fadeOutProgress);

  const displayCount = Math.min(assetUrls.length, 4);
  const displayAssets = assetUrls.slice(0, displayCount);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', opacity }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: displayCount === 2 ? '1fr 1fr' : '1fr 1fr',
          gridTemplateRows: displayCount > 2 ? '1fr 1fr' : '1fr',
          gap: 16,
          padding: 32,
          width: '100%',
          height: '100%',
        }}
      >
        {displayAssets.map((url, index) => {
          const delay = index * 4;
          const itemFadeIn = interpolate(frame, [delay, delay + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: itemFadeIn,
              }}
            >
              <Img
                src={url}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
