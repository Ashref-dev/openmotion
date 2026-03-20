import { Composition } from 'remotion';
import { VIDEO_CONFIG } from '@/lib/config';
import { TimelineComposition, TimelineCompositionSchema, type TimelineCompositionProps } from '@/remotion/TimelineComposition';

const placeholderImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b0814" />
        <stop offset="100%" stop-color="#9064E8" stop-opacity="0.55" />
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect x="120" y="110" width="1040" height="500" rx="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
  </svg>`
)}`;

const defaultProps: TimelineCompositionProps = {
  snapshot: {
    version: 2,
    ratio: '16:9',
    fps: 30,
    durationInFrames: 180,
    templateId: 't1-hero-drift',
    theme: {
      primaryColor: '#9064E8',
      backgroundStyle: 'gradient',
      fontHeading: 'Instrument Serif',
      fontBody: 'Inter',
    },
    tracks: {
      visual: [
        {
          id: 'visual-placeholder',
          assetId: '00000000-0000-0000-0000-000000000000',
          startFrame: 0,
          durationInFrames: 180,
          motionPreset: 'drift',
          transitionAfter: 'none',
        },
      ],
      text: [
        {
          id: 'text-placeholder',
          startFrame: 0,
          durationInFrames: 120,
          text: 'OpenMotion MVP',
          stylePreset: 'headline',
          align: 'left',
        },
      ],
      audio: [],
    },
  },
  templateName: 'OpenMotion MVP',
  visuals: [
    {
      id: 'visual-placeholder',
      assetId: '00000000-0000-0000-0000-000000000000',
      startFrame: 0,
      durationInFrames: 180,
      motionPreset: 'drift',
      transitionAfter: 'none',
      assetUrl: placeholderImage,
      width: 1280,
      height: 720,
    },
  ],
  texts: [
    {
      id: 'text-placeholder',
      startFrame: 0,
      durationInFrames: 120,
      text: 'OpenMotion MVP',
      stylePreset: 'headline',
      align: 'left',
    },
  ],
  audios: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.entries(VIDEO_CONFIG.aspectRatios).map(([ratio, dimensions]) => (
        <Composition
          key={ratio}
          id={
            ratio === '16:9' ? 'Timeline16x9' : ratio === '9:16' ? 'Timeline9x16' : 'Timeline1x1'
          }
          component={TimelineComposition}
          schema={TimelineCompositionSchema}
          defaultProps={{
            ...defaultProps,
            snapshot: {
              ...defaultProps.snapshot,
              ratio: ratio as TimelineCompositionProps['snapshot']['ratio'],
            },
          }}
          width={dimensions.width}
          height={dimensions.height}
          fps={30}
          durationInFrames={180}
          calculateMetadata={({ props }) => {
            return {
              durationInFrames: props.snapshot.durationInFrames,
              fps: props.snapshot.fps,
              props,
            };
          }}
        />
      ))}
    </>
  );
};
