import { z } from 'zod';
import { VIDEO_CONFIG } from '@/lib/config';

export const SUPPORTED_TEMPLATE_IDS = [
  't1-hero-drift',
  't2-hero-copy',
  't4-smooth-carousel',
  't9-clean-endcard',
] as const;

export type TemplateId = (typeof SUPPORTED_TEMPLATE_IDS)[number];

export const ratioSchema = z.enum(['16:9', '9:16', '1:1']);
export const fpsSchema = z.enum(['24', '30', '60']).transform((value) => Number(value));
export const backgroundStyleSchema = z.enum(['gradient', 'solid']);
export const motionPresetSchema = z.enum(['drift', 'zoom', 'pan', 'stack']);
export const transitionSchema = z.enum(['fade', 'wipe', 'none']);
export const textStylePresetSchema = z.enum(['headline', 'caption', 'cta']);
export const textAlignSchema = z.enum(['left', 'center', 'right']);

const clipTimingSchema = z.object({
  startFrame: z.number().int().min(0),
  durationInFrames: z.number().int().min(15),
});

export const visualClipSchema = clipTimingSchema.extend({
  id: z.string().min(1),
  assetId: z.string().uuid('Visual clip asset must be a valid asset id'),
  motionPreset: motionPresetSchema,
  transitionAfter: transitionSchema,
});

export const textClipSchema = clipTimingSchema.extend({
  id: z.string().min(1),
  text: z.string().trim().min(1, 'Text clips cannot be empty').max(140),
  stylePreset: textStylePresetSchema,
  align: textAlignSchema,
});

export const audioClipSchema = clipTimingSchema.extend({
  id: z.string().min(1),
  assetId: z.string().uuid('Audio clip asset must be a valid asset id'),
  volume: z.number().min(0).max(1),
  fadeInFrames: z.number().int().min(0).max(90),
  fadeOutFrames: z.number().int().min(0).max(90),
});

export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundStyle: backgroundStyleSchema,
  fontHeading: z.literal('Instrument Serif'),
  fontBody: z.literal('Inter'),
});

export const draftSnapshotSchema = z
  .object({
    version: z.literal(2),
    ratio: ratioSchema,
    fps: z.number().int().min(24).max(60),
    durationInFrames: z.number().int().min(VIDEO_CONFIG.duration.minFrames).max(VIDEO_CONFIG.duration.maxFrames),
    templateId: z.enum(SUPPORTED_TEMPLATE_IDS),
    theme: themeSchema,
    tracks: z.object({
      visual: z.array(visualClipSchema).min(1, 'At least one visual clip is required'),
      text: z.array(textClipSchema),
      audio: z.array(audioClipSchema).max(1, 'Only one background audio clip is supported in MVP'),
    }),
  })
  .superRefine((snapshot, ctx) => {
    const validateLane = <T extends { startFrame: number; durationInFrames: number }>(
      lane: T[],
      laneName: 'visual' | 'text' | 'audio'
    ) => {
      const sorted = [...lane].sort((a, b) => a.startFrame - b.startFrame || a.durationInFrames - b.durationInFrames);
      for (let index = 0; index < sorted.length; index += 1) {
        const clip = sorted[index];
        const endFrame = clip.startFrame + clip.durationInFrames;
        if (endFrame > snapshot.durationInFrames) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tracks', laneName, index],
            message: `${laneName} clips must end inside the draft duration`,
          });
        }

        const nextClip = sorted[index + 1];
        if (nextClip && nextClip.startFrame < endFrame) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tracks', laneName, index],
            message: `Clips in the ${laneName} lane cannot overlap`,
          });
        }
      }
    };

    validateLane(snapshot.tracks.visual, 'visual');
    validateLane(snapshot.tracks.text, 'text');
    validateLane(snapshot.tracks.audio, 'audio');
  });

export type VisualClip = z.infer<typeof visualClipSchema>;
export type TextClip = z.infer<typeof textClipSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type DraftTheme = z.infer<typeof themeSchema>;
export type DraftSnapshot = z.infer<typeof draftSnapshotSchema>;
export type DraftRatio = z.infer<typeof ratioSchema>;
export type MotionPreset = z.infer<typeof motionPresetSchema>;
export type TransitionPreset = z.infer<typeof transitionSchema>;
export type TextStylePreset = z.infer<typeof textStylePresetSchema>;
export type TextAlign = z.infer<typeof textAlignSchema>;

export interface ProjectAssetLike {
  id: string;
  type: string;
  originalS3Key: string;
  processedS3Key: string | null;
  width: number;
  height: number;
  aspectRatio: string;
}

export function sortLaneClips<T extends { startFrame: number; durationInFrames: number }>(lane: T[]): T[] {
  return [...lane].sort((a, b) => a.startFrame - b.startFrame || a.durationInFrames - b.durationInFrames);
}

export function getLaneEndFrame<T extends { startFrame: number; durationInFrames: number }>(lane: T[]): number {
  return lane.reduce((max, clip) => Math.max(max, clip.startFrame + clip.durationInFrames), 0);
}

export function normalizeDraftSnapshot(snapshot: DraftSnapshot): DraftSnapshot {
  const nextDuration = Math.max(
    snapshot.durationInFrames,
    getLaneEndFrame(snapshot.tracks.visual),
    getLaneEndFrame(snapshot.tracks.text),
    getLaneEndFrame(snapshot.tracks.audio),
  );

  return draftSnapshotSchema.parse({
    ...snapshot,
    durationInFrames: nextDuration,
    tracks: {
      visual: sortLaneClips(snapshot.tracks.visual),
      text: sortLaneClips(snapshot.tracks.text),
      audio: sortLaneClips(snapshot.tracks.audio),
    },
  });
}

export function validateSnapshotAssetRefs(snapshot: DraftSnapshot, assets: ProjectAssetLike[]) {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  for (const clip of snapshot.tracks.visual) {
    const asset = assetMap.get(clip.assetId);
    if (!asset) {
      throw new Error(`Visual clip ${clip.id} references a missing asset`);
    }
    if (asset.type === 'audio') {
      throw new Error(`Visual clip ${clip.id} must reference an image asset`);
    }
  }

  for (const clip of snapshot.tracks.audio) {
    const asset = assetMap.get(clip.assetId);
    if (!asset) {
      throw new Error(`Audio clip ${clip.id} references a missing asset`);
    }
    if (asset.type !== 'audio') {
      throw new Error(`Audio clip ${clip.id} must reference an audio asset`);
    }
  }
}

export function parseDraftSnapshot(input: unknown): DraftSnapshot {
  return normalizeDraftSnapshot(draftSnapshotSchema.parse(input));
}
