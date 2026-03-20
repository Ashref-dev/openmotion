import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export type StorageFileCategory = 'original' | 'processed' | 'renders' | 'posters';

const STORAGE_BASE = path.join(process.cwd(), 'public/uploads');

function toDiskPath(key: string) {
  return path.join(STORAGE_BASE, key.replace(/^\/uploads\//, ''));
}

export async function saveLocalFile(
  buffer: Buffer,
  filename: string,
  type: StorageFileCategory
): Promise<string> {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  const ext = path.extname(filename) || (type === 'posters' ? '.png' : '.bin');
  const key = `/uploads/${type}/${hash}${ext}`;
  const fullPath = toDiskPath(key);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return key;
}

export async function readLocalFile(key: string): Promise<Buffer> {
  return await fs.readFile(toDiskPath(key));
}

export async function deleteLocalFile(key: string): Promise<void> {
  try {
    await fs.unlink(toDiskPath(key));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function localFileExists(key: string): Promise<boolean> {
  try {
    await fs.access(toDiskPath(key));
    return true;
  } catch {
    return false;
  }
}

export function getLocalPublicUrl(key: string): string {
  return key;
}

export async function copyLocalFile(sourceKey: string, destKey: string): Promise<string> {
  const sourcePath = toDiskPath(sourceKey);
  const targetPath = toDiskPath(destKey);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);

  return destKey;
}
