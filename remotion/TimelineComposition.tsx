import './fonts.css';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import {
  audioClipSchema,
  draftSnapshotSchema,
  textClipSchema,
  visualClipSchema,
} from '@/lib/video/draft-schema';

const resolvedVisualSchema = visualClipSchema.extend({
  assetUrl: z.string().min(1),
  width: z.number(),
  height: z.number(),
});

const resolvedAudioSchema = audioClipSchema.extend({
  assetUrl: z.string().min(1),
});

export const TimelineCompositionSchema = z.object({
  snapshot: draftSnapshotSchema,
  templateName: z.string().min(1),
  visuals: z.array(resolvedVisualSchema),
  texts: z.array(textClipSchema),
  audios: z.array(resolvedAudioSchema),
});

export type TimelineCompositionProps = z.infer<typeof TimelineCompositionSchema>;

const headingFont = '"Instrument Serif", Georgia, serif';
const bodyFont = '"Inter", system-ui, sans-serif';

const baseTextPosition = {
  left: { alignItems: 'flex-start', textAlign: 'left' as const },
  center: { alignItems: 'center', textAlign: 'center' as const },
  right: { alignItems: 'flex-end', textAlign: 'right' as const },
};

const VisualLayer: React.FC<{ clip: TimelineCompositionProps['visuals'][number]; primaryColor: string }> = ({
  clip,
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const reveal = spring({
    frame,
    fps: 30,
    config: {
      damping: 200,
      stiffness: 170,
      mass: 0.6,
    },
  });

  const opacity = interpolate(
    frame,
    [0, 10, Math.max(clip.durationInFrames - 12, 12), clip.durationInFrames],
    [0, 1, 1, clip.transitionAfter === 'none' ? 1 : 0],
    { easing: Easing.bezier(0.22, 1, 0.36, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  let transform = `scale(${1 + reveal * 0.015})`;

  if (clip.motionPreset === 'drift') {
    const x = interpolate(frame, [0, clip.durationInFrames], [-26, 22]);
    const y = interpolate(frame, [0, clip.durationInFrames], [12, -12]);
    transform = `translate3d(${x}px, ${y}px, 0) scale(${1.04 - reveal * 0.02})`;
  }

  if (clip.motionPreset === 'zoom') {
    const scale = interpolate(frame, [0, clip.durationInFrames], [1.16, 1]);
    transform = `scale(${scale})`;
  }

  if (clip.motionPreset === 'pan') {
    const x = interpolate(frame, [0, clip.durationInFrames], [-70, 70]);
    transform = `translate3d(${x}px, 0, 0) scale(1.08)`;
  }

  if (clip.motionPreset === 'stack') {
    const rotate = interpolate(frame, [0, clip.durationInFrames], [-1.8, 1.8]);
    const y = interpolate(frame, [0, clip.durationInFrames], [24, -8]);
    transform = `translate3d(0, ${y}px, 0) rotate(${rotate}deg) scale(1.04)`;
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          inset: '6%',
          borderRadius: 34,
          overflow: 'hidden',
          boxShadow: `0 36px 120px rgba(6, 5, 16, 0.45), 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px ${primaryColor}22 inset`,
          transform,
        }}
      >
        <Img
          src={clip.assetUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(7,7,18,0.08) 0%, rgba(7,7,18,0.18) 45%, rgba(7,7,18,0.56) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at top right, ${primaryColor}26 0%, transparent 35%)`,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

const TextLayer: React.FC<{
  clip: TimelineCompositionProps['texts'][number];
  primaryColor: string;
}> = ({ clip, primaryColor }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 10, clip.durationInFrames - 10, clip.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, clip.durationInFrames], [18, -6], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const align = baseTextPosition[clip.align];
  const isHeadline = clip.stylePreset === 'headline';
  const isCta = clip.stylePreset === 'cta';

  return (
    <AbsoluteFill
      style={{
        justifyContent: isHeadline ? 'flex-start' : 'flex-end',
        padding: isHeadline ? '7% 8%' : isCta ? '0 8% 8%' : '0 8% 12%',
        ...align,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          maxWidth: isHeadline ? '78%' : '68%',
          color: 'white',
          fontFamily: isHeadline ? headingFont : bodyFont,
          fontSize: isHeadline ? 76 : isCta ? 24 : 28,
          lineHeight: isHeadline ? 0.96 : 1.2,
          letterSpacing: isHeadline ? '-0.05em' : '-0.02em',
          fontWeight: isHeadline ? 400 : isCta ? 700 : 500,
          padding: isCta ? '14px 22px' : 0,
          borderRadius: isCta ? 999 : 0,
          background: isCta ? `${primaryColor}` : 'transparent',
          boxShadow: isCta ? `0 18px 40px ${primaryColor}55` : 'none',
        }}
      >
        {clip.text}
      </div>
    </AbsoluteFill>
  );
};

export const TimelineComposition: React.FC<TimelineCompositionProps> = ({
  snapshot,
  templateName,
  visuals,
  texts,
  audios,
}) => {
  const { width, height } = useVideoConfig();
  const primaryColor = snapshot.theme.primaryColor;
  const background =
    snapshot.theme.backgroundStyle === 'solid'
      ? 'linear-gradient(180deg, #0a0912 0%, #14101f 100%)'
      : `linear-gradient(145deg, #080613 0%, #141022 42%, ${primaryColor}35 100%)`;

  return (
    <AbsoluteFill style={{ background }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 16% 14%, ${primaryColor}22 0%, transparent 34%), radial-gradient(circle at 84% 82%, rgba(255,255,255,0.07) 0%, transparent 24%)`,
        }}
      />

      {visuals.map((clip) => (
        <Sequence key={clip.id} from={clip.startFrame} durationInFrames={clip.durationInFrames}>
          <VisualLayer clip={clip} primaryColor={primaryColor} />
        </Sequence>
      ))}

      {texts.map((clip) => (
        <Sequence key={clip.id} from={clip.startFrame} durationInFrames={clip.durationInFrames}>
          <TextLayer clip={clip} primaryColor={primaryColor} />
        </Sequence>
      ))}

      {audios.map((clip) => (
        <Sequence key={clip.id} from={clip.startFrame} durationInFrames={clip.durationInFrames}>
          <Audio
            src={clip.assetUrl}
            volume={(frame) => {
              const fadeInEnd = Math.max(clip.fadeInFrames, 1);
              const fadeOutStart = Math.max(clip.durationInFrames - clip.fadeOutFrames, 0);
              const fadeIn = interpolate(frame, [0, fadeInEnd], [0, clip.volume], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const fadeOut = interpolate(frame, [fadeOutStart, clip.durationInFrames], [clip.volume, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return Math.min(fadeIn, fadeOut, clip.volume);
            }}
          />
        </Sequence>
      ))}

      <AbsoluteFill
        style={{
          padding: '4.5% 6%',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            alignSelf: 'flex-start',
            padding: '10px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(7, 7, 18, 0.42)',
            color: 'rgba(255,255,255,0.78)',
            fontFamily: bodyFont,
            fontSize: 18,
            backdropFilter: 'blur(20px)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: primaryColor,
              boxShadow: `0 0 24px ${primaryColor}`,
            }}
          />
          {templateName}
        </div>
        <div
          style={{
            alignSelf: 'flex-end',
            color: 'rgba(255,255,255,0.58)',
            fontFamily: bodyFont,
            fontSize: 18,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {snapshot.ratio} · {width}×{height}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
