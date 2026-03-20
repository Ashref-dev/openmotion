export const VIDEO_CONFIG = {
  aspectRatios: {
    '9:16': { width: 720, height: 1280 },
    '16:9': { width: 1280, height: 720 },
    '1:1': { width: 720, height: 720 },
  } as const,

  fps: {
    options: [24, 30, 60] as const,
    default: 30,
    labels: {
      24: 'Cinematic',
      30: 'Standard',
      60: 'Smooth',
    },
  },

  duration: {
    minFrames: 90,
    maxFrames: 450,
    defaultFrames: 240,
    frameStep: 15,
  },

  colors: {
    defaultPrimary: '#9064E8',
    defaultBackground: '#0B0814',
  },

  rendering: {
    pollingIntervalMs: 2000,
    maxDurationSeconds: 300,
    leaseSeconds: 330,
  },
} as const;

export type AspectRatio = keyof typeof VIDEO_CONFIG.aspectRatios;
export type FpsOption = (typeof VIDEO_CONFIG.fps.options)[number];
