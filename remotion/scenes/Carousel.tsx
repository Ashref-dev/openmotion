import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';
import { fadeIn, fadeOut } from '../utils/motion';

export interface CarouselProps {
  assetUrls: string[];
  transitionStyle?: 'smooth' | 'stack';
  durationInFrames: number;
}

export const Carousel: React.FC<CarouselProps> = ({
  assetUrls,
  transitionStyle = 'smooth',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const itemCount = assetUrls.length;
  const framesPerItem = Math.floor(durationInFrames / itemCount);

  const currentIndex = Math.floor(frame / framesPerItem);
  const frameInCurrentItem = frame % framesPerItem;

  const fadeInProgress = fadeIn(frame, 0, 8);
  const fadeOutProgress = fadeOut(frame, durationInFrames, 8);
  const globalOpacity = Math.min(fadeInProgress, fadeOutProgress);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {assetUrls.map((url, index) => {
        const isActive = index === currentIndex;
        const isPrevious = index === currentIndex - 1;

        if (!isActive && !isPrevious) return null;

        let itemOpacity = 0;
        let translateX = 0;

        if (transitionStyle === 'smooth') {
          if (isActive) {
            const transitionProgress = Math.min(frameInCurrentItem / 12, 1);
            itemOpacity = transitionProgress;
            translateX = interpolate(transitionProgress, [0, 1], [100, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          } else if (isPrevious) {
            const transitionProgress = Math.min(frameInCurrentItem / 12, 1);
            itemOpacity = 1 - transitionProgress;
            translateX = interpolate(transitionProgress, [0, 1], [0, -100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
        } else {
          itemOpacity = isActive ? 1 : 0;
        }

        return (
          <AbsoluteFill
            key={index}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              opacity: itemOpacity * globalOpacity,
              transform: `translateX(${translateX}%)`,
            }}
          >
            <Img
              src={url}
              style={{
                maxWidth: '85%',
                maxHeight: '85%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
