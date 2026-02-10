import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const STORAGE_BASE = path.join(process.cwd(), 'public/uploads');

export async function saveFile(
  buffer: Buffer,
  filename: string,
  type: 'original' | 'processed' | 'renders'
): Promise<string> {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  const ext = path.extname(filename);
  const key = `${type}/${hash}${ext}`;
  const fullPath = path.join(STORAGE_BASE, key);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return `/uploads/${key}`;
}

export async function readFile(key: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_BASE, key.replace('/uploads/', ''));
  return await fs.readFile(fullPath);
}

export async function deleteFile(key: string): Promise<void> {
  const fullPath = path.join(STORAGE_BASE, key.replace('/uploads/', ''));
  await fs.unlink(fullPath).catch(() => {});
}

export async function fileExists(key: string): Promise<boolean> {
  const fullPath = path.join(STORAGE_BASE, key.replace('/uploads/', ''));
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(key: string): string {
  return key;
}

export async function copyFile(sourceKey: string, destKey: string): Promise<string> {
  const sourcePath = path.join(STORAGE_BASE, sourceKey.replace('/uploads/', ''));
  const destPath = path.join(STORAGE_BASE, destKey.replace('/uploads/', ''));

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.copyFile(sourcePath, destPath);

  return `/uploads/${destKey}`;
}
