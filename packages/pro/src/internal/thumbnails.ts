import type { ThumbnailFrame, ThumbnailsConfig } from '../types/thumbnails';

export function getThumbnailForTime(
  config: ThumbnailsConfig | undefined,
  time: number
): ThumbnailFrame | null {
  if (!config || !Array.isArray(config.frames) || config.frames.length === 0) {
    return null;
  }

  let closestFrame: ThumbnailFrame | null = null;

  for (const frame of config.frames) {
    if (frame.time > time) {
      continue;
    }

    if (!closestFrame || frame.time > closestFrame.time) {
      closestFrame = frame;
    }
  }

  return closestFrame;
}