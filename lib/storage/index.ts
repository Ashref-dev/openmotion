import {
  copyLocalFile,
  deleteLocalFile,
  getLocalPublicUrl,
  localFileExists,
  readLocalFile,
  saveLocalFile,
  type StorageFileCategory,
} from '@/lib/storage/local';
import {
  deleteS3File,
  getS3PublicUrl,
  readS3File,
  saveS3File,
  s3FileExists,
} from '@/lib/storage/s3';

function useS3() {
  return process.env.STORAGE_DRIVER === 's3';
}

export type { StorageFileCategory };

export async function saveFile(buffer: Buffer, filename: string, type: StorageFileCategory): Promise<string> {
  return useS3() ? saveS3File(buffer, filename, type) : saveLocalFile(buffer, filename, type);
}

export async function readFile(key: string): Promise<Buffer> {
  return useS3() ? readS3File(key) : readLocalFile(key);
}

export async function deleteFile(key: string): Promise<void> {
  return useS3() ? deleteS3File(key) : deleteLocalFile(key);
}

export async function fileExists(key: string): Promise<boolean> {
  return useS3() ? s3FileExists(key) : localFileExists(key);
}

export function getPublicUrl(key: string): string {
  return useS3() ? getS3PublicUrl(key) : getLocalPublicUrl(key);
}

export async function copyFile(sourceKey: string, destKey: string): Promise<string> {
  if (useS3()) {
    const buffer = await readS3File(sourceKey);
    return saveS3File(buffer, destKey.split('/').pop() || 'copy.bin', 'renders');
  }

  return copyLocalFile(sourceKey, destKey);
}
