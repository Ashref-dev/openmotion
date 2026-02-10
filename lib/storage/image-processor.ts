import sharp from 'sharp';
import crypto from 'crypto';

export async function processImage(buffer: Buffer): Promise<{
  processedBuffer: Buffer;
  width: number;
  height: number;
  aspectRatio: string;
  hash: string;
}> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to determine image dimensions');
  }

  const processedBuffer = await image
    .resize(Math.min(metadata.width, 3840), Math.min(metadata.height, 2160), {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const aspectRatio = calculateAspectRatio(metadata.width, metadata.height);

  return {
    processedBuffer,
    width: metadata.width,
    height: metadata.height,
    aspectRatio,
    hash,
  };
}

function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export function detectBestRatio(aspectRatio: string): '9:16' | '16:9' | '1:1' {
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;

  if (ratio > 1.5) return '16:9';
  if (ratio < 0.7) return '9:16';
  return '1:1';
}
