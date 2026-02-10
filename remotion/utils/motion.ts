import { interpolate, spring, Easing } from 'remotion';

const MAX_SCALE = 1.10;
const MAX_TRANSLATION = 40;

export function constrainedSpring(options: {
  frame: number;
  fps: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
}): number {
  return spring({
    frame: options.frame,
    fps: options.fps,
    config: {
      damping: options.config?.damping ?? 200,
      stiffness: options.config?.stiffness ?? 100,
      mass: options.config?.mass ?? 1,
    },
  });
}

export function constrainedScale(progress: number, baseScale: number = 1, intensity: number = 1): number {
  const maxAllowedScale = Math.min(baseScale * MAX_SCALE, MAX_SCALE);
  const targetScale = baseScale + (maxAllowedScale - baseScale) * intensity;
  return interpolate(progress, [0, 1], [baseScale, targetScale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function constrainedTranslate(progress: number, distance: number, intensity: number = 1): number {
  const maxDistance = MAX_TRANSLATION * intensity;
  const constrainedDistance = Math.min(Math.abs(distance), maxDistance) * Math.sign(distance);
  return interpolate(progress, [0, 1], [0, constrainedDistance], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function fadeIn(frame: number, startFrame: number = 0, duration: number = 12): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
}

export function fadeOut(frame: number, endFrame: number, duration: number = 12): number {
  return interpolate(frame, [endFrame - duration, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
}

export function slideIn(frame: number, startFrame: number = 0, duration: number = 18, direction: 'left' | 'right' | 'up' | 'down' = 'up'): number {
  const directionMultiplier = direction === 'down' || direction === 'right' ? 1 : -1;
  const distance = MAX_TRANSLATION * directionMultiplier;
  
  return interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
}

export function cinematicEasing(progress: number): number {
  return Easing.bezier(0.33, 1, 0.68, 1)(progress);
}
