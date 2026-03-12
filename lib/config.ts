export const VIDEO_CONFIG = {
  aspectRatios: {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  } as const,
  
  fps: {
    options: [24, 30, 60] as const,
    default: 30,
    labels: {
      24: 'Film',
      30: 'Standard',
      60: 'Smooth',
    },
  },
  
  duration: {
    minFrames: 30,
    maxFrames: 1800,
    defaultFrames: 300,
  },
  
  colors: {
    defaultPrimary: '#6C5CE7',
    defaultBackground: '#000000',
  },
  
  rendering: {
    pollingIntervalMs: 2000,
  },
} as const;

export type AspectRatio = keyof typeof VIDEO_CONFIG.aspectRatios;
export type FpsOption = typeof VIDEO_CONFIG.fps.options[number];
