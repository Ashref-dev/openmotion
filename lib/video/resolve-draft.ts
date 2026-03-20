import { VIDEO_CONFIG, type AspectRatio } from '@/lib/config';
import { getPublicUrl } from '@/lib/storage';
import {
  normalizeDraftSnapshot,
  parseDraftSnapshot,
  type AudioClip,
  type DraftSnapshot,
  type ProjectAssetLike,
  type TextClip,
  type VisualClip,
  validateSnapshotAssetRefs,
} from '@/lib/video/draft-schema';
import { createInitialDraftSnapshot, getTemplateDefinition } from '@/lib/video/template-catalog';

export const compositionIdByRatio: Record<AspectRatio, string> = {
  '16:9': 'Timeline16x9',
  '9:16': 'Timeline9x16',
  '1:1': 'Timeline1x1',
};

export interface ResolvedVisualClip extends VisualClip {
  assetUrl: string;
  width: number;
  height: number;
}

export interface ResolvedAudioClip extends AudioClip {
  assetUrl: string;
}

export interface ResolvedTimelineCompositionProps {
  snapshot: DraftSnapshot;
  templateName: string;
  visuals: ResolvedVisualClip[];
  texts: TextClip[];
  audios: ResolvedAudioClip[];
}

export interface ResolvedDraftResult {
  snapshot: DraftSnapshot;
  props: ResolvedTimelineCompositionProps;
  compositionId: string;
  width: number;
  height: number;
}

function resolveVisualAssetUrl(asset: ProjectAssetLike) {
  return getPublicUrl(asset.processedS3Key || asset.originalS3Key);
}

function resolveAudioAssetUrl(asset: ProjectAssetLike) {
  return getPublicUrl(asset.originalS3Key);
}

export function resolveDraftSnapshot(snapshot: DraftSnapshot, assets: ProjectAssetLike[]): ResolvedDraftResult {
  const normalized = normalizeDraftSnapshot(snapshot);
  validateSnapshotAssetRefs(normalized, assets);

  const template = getTemplateDefinition(normalized.templateId);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const dimensions = VIDEO_CONFIG.aspectRatios[normalized.ratio];

  const visuals = normalized.tracks.visual.map((clip) => {
    const asset = assetMap.get(clip.assetId);
    if (!asset) {
      throw new Error(`Missing asset ${clip.assetId}`);
    }

    return {
      ...clip,
      assetUrl: resolveVisualAssetUrl(asset),
      width: asset.width,
      height: asset.height,
    };
  });

  const audios = normalized.tracks.audio.map((clip) => {
    const asset = assetMap.get(clip.assetId);
    if (!asset) {
      throw new Error(`Missing audio asset ${clip.assetId}`);
    }

    return {
      ...clip,
      assetUrl: resolveAudioAssetUrl(asset),
    };
  });

  return {
    snapshot: normalized,
    compositionId: compositionIdByRatio[normalized.ratio],
    width: dimensions.width,
    height: dimensions.height,
    props: {
      snapshot: normalized,
      templateName: template.name,
      visuals,
      texts: normalized.tracks.text,
      audios,
    },
  };
}

export function coerceDraftSnapshot(options: {
  projectAssets: ProjectAssetLike[];
  templateId: string;
  ratio: string;
  fps: number;
  durationInFrames: number;
  propsJson: Record<string, unknown>;
}): DraftSnapshot {
  const { propsJson, projectAssets, templateId, ratio, fps, durationInFrames } = options;

  if (propsJson.version === 2) {
    return parseDraftSnapshot(propsJson);
  }

  const legacyAssetIds = Array.isArray(propsJson.assetUrls)
    ? propsJson.assetUrls.filter((value): value is string => typeof value === 'string')
    : projectAssets.filter((asset) => asset.type !== 'audio').map((asset) => asset.id);

  const selectedAssets = projectAssets.filter((asset) => legacyAssetIds.includes(asset.id));
  return createInitialDraftSnapshot({
    templateId: templateId as Parameters<typeof createInitialDraftSnapshot>[0]['templateId'],
    assets: selectedAssets.length > 0 ? selectedAssets : projectAssets,
    ratio: (ratio as AspectRatio) || '16:9',
    fps,
    durationInFrames,
  });
}
