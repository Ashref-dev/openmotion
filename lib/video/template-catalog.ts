import { VIDEO_CONFIG, type AspectRatio } from '@/lib/config';
import {
  normalizeDraftSnapshot,
  type DraftSnapshot,
  type MotionPreset,
  type ProjectAssetLike,
  type TemplateId,
  type TextAlign,
  type TextStylePreset,
  type TransitionPreset,
  SUPPORTED_TEMPLATE_IDS,
} from '@/lib/video/draft-schema';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  minScreens: number;
  maxScreens: number;
  supportedRatios: AspectRatio[];
  defaultMotion: MotionPreset;
  defaultTransition: TransitionPreset;
  headlineAlign: TextAlign;
  defaultCopy: {
    headline: string;
    caption: string;
    cta: string;
  };
}

export const templateCatalog: Record<TemplateId, TemplateDefinition> = {
  't1-hero-drift': {
    id: 't1-hero-drift',
    name: 'Hero Drift',
    category: 'Minimal Hero',
    description: 'Large headline, a drifting screenshot stack, and a clean closing CTA.',
    minScreens: 1,
    maxScreens: 3,
    supportedRatios: ['16:9', '9:16', '1:1'],
    defaultMotion: 'drift',
    defaultTransition: 'fade',
    headlineAlign: 'left',
    defaultCopy: {
      headline: 'Show the product before you explain it.',
      caption: 'Lead with one sharp message and let the visuals carry the rest.',
      cta: 'Start your free trial',
    },
  },
  't2-hero-copy': {
    id: 't2-hero-copy',
    name: 'Hero Copy',
    category: 'Minimal Hero',
    description: 'A statement-driven opener with tighter text pacing and calmer image motion.',
    minScreens: 1,
    maxScreens: 2,
    supportedRatios: ['16:9', '9:16', '1:1'],
    defaultMotion: 'zoom',
    defaultTransition: 'fade',
    headlineAlign: 'center',
    defaultCopy: {
      headline: 'One product. One promise. No clutter.',
      caption: 'Use a clean narrative when the screenshots already do most of the selling.',
      cta: 'See it in action',
    },
  },
  't4-smooth-carousel': {
    id: 't4-smooth-carousel',
    name: 'Smooth Carousel',
    category: 'Showcase',
    description: 'A polished image-led sequence for short product walkthroughs.',
    minScreens: 3,
    maxScreens: 5,
    supportedRatios: ['16:9', '9:16', '1:1'],
    defaultMotion: 'pan',
    defaultTransition: 'wipe',
    headlineAlign: 'left',
    defaultCopy: {
      headline: 'Walk through the product in seconds.',
      caption: 'Keep the camera moving and use text only where it adds clarity.',
      cta: 'Book a live demo',
    },
  },
  't9-clean-endcard': {
    id: 't9-clean-endcard',
    name: 'Clean End Card',
    category: 'Closing',
    description: 'A balanced opener with stronger CTA framing for launch and conversion videos.',
    minScreens: 2,
    maxScreens: 4,
    supportedRatios: ['16:9', '9:16', '1:1'],
    defaultMotion: 'stack',
    defaultTransition: 'fade',
    headlineAlign: 'center',
    defaultCopy: {
      headline: 'Make the final frame do the selling.',
      caption: 'Close with a tighter summary and a single, unmistakable next step.',
      cta: 'Launch your next video',
    },
  },
};

export const supportedTemplateIds = [...SUPPORTED_TEMPLATE_IDS];

export function listSupportedTemplates(): TemplateDefinition[] {
  return supportedTemplateIds.map((templateId) => templateCatalog[templateId]);
}

export function getTemplateDefinition(templateId: string): TemplateDefinition {
  const template = templateCatalog[templateId as TemplateId];
  if (!template) {
    throw new Error(`Unsupported template: ${templateId}`);
  }

  return template;
}

export function detectPreferredRatio(assets: ProjectAssetLike[]): AspectRatio {
  const screenshots = assets.filter((asset) => asset.type !== 'audio');
  if (screenshots.length === 0) {
    return '16:9';
  }

  const tall = screenshots.filter((asset) => asset.height > asset.width).length;
  const square = screenshots.filter((asset) => Math.abs(asset.height - asset.width) <= 120).length;

  if (tall >= Math.max(2, screenshots.length / 2)) {
    return '9:16';
  }

  if (square >= Math.max(1, screenshots.length / 2)) {
    return '1:1';
  }

  return '16:9';
}

function createClipId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function distributeFrames(totalFrames: number, count: number) {
  const minClipFrames = 45;
  if (count === 1) {
    return [Math.max(totalFrames, minClipFrames)];
  }

  const base = Math.max(minClipFrames, Math.floor(totalFrames / count / 15) * 15);
  const frames = Array.from({ length: count }, () => base);
  const used = base * count;
  const remainder = Math.max(0, totalFrames - used);
  frames[frames.length - 1] += remainder;
  return frames;
}

export function createInitialDraftSnapshot(options: {
  templateId: TemplateId;
  assets: ProjectAssetLike[];
  ratio?: AspectRatio;
  fps?: number;
  durationInFrames?: number;
}): DraftSnapshot {
  const template = getTemplateDefinition(options.templateId);
  const ratio = options.ratio ?? detectPreferredRatio(options.assets);
  const fps = options.fps ?? VIDEO_CONFIG.fps.default;
  const screenshotAssets = options.assets.filter((asset) => asset.type !== 'audio');
  const selectedAssets = screenshotAssets.slice(0, template.maxScreens);

  if (selectedAssets.length < template.minScreens) {
    throw new Error(`${template.name} needs at least ${template.minScreens} uploaded images`);
  }

  const requestedDuration = options.durationInFrames ?? Math.min(
    VIDEO_CONFIG.duration.defaultFrames,
    VIDEO_CONFIG.duration.maxFrames,
  );
  const clipDurations = distributeFrames(requestedDuration, selectedAssets.length);

  let currentStart = 0;
  const visual = selectedAssets.map((asset, index) => {
    const durationInFrames = clipDurations[index];
    const clip = {
      id: createClipId('visual'),
      assetId: asset.id,
      startFrame: currentStart,
      durationInFrames,
      motionPreset: template.defaultMotion,
      transitionAfter: index === selectedAssets.length - 1 ? 'none' : template.defaultTransition,
    } as const;
    currentStart += durationInFrames;
    return clip;
  });

  const totalFrames = Math.max(requestedDuration, currentStart);
  const text = [
    {
      id: createClipId('text'),
      startFrame: 0,
      durationInFrames: Math.min(120, totalFrames),
      text: template.defaultCopy.headline,
      stylePreset: 'headline' as TextStylePreset,
      align: template.headlineAlign,
    },
    {
      id: createClipId('text'),
      startFrame: Math.max(30, totalFrames - 135),
      durationInFrames: Math.min(105, totalFrames),
      text: template.defaultCopy.caption,
      stylePreset: 'caption' as TextStylePreset,
      align: template.headlineAlign,
    },
    {
      id: createClipId('text'),
      startFrame: Math.max(60, totalFrames - 75),
      durationInFrames: Math.min(60, totalFrames),
      text: template.defaultCopy.cta,
      stylePreset: 'cta' as TextStylePreset,
      align: template.headlineAlign,
    },
  ];

  return normalizeDraftSnapshot({
    version: 2,
    ratio,
    fps,
    durationInFrames: totalFrames,
    templateId: template.id,
    theme: {
      primaryColor: VIDEO_CONFIG.colors.defaultPrimary,
      backgroundStyle: 'gradient',
      fontHeading: 'Instrument Serif',
      fontBody: 'Inter',
    },
    tracks: {
      visual,
      text,
      audio: [],
    },
  });
}
