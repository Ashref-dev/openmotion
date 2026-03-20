import crypto from 'crypto';
import path from 'path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { StorageFileCategory } from '@/lib/storage/local';

function getClient() {
  const region = process.env.S3_REGION || 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT;

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3_BUCKET must be configured when STORAGE_DRIVER=s3');
  }
  return bucket;
}

function toObjectKey(key: string) {
  return key.replace(/^\//, '');
}

function toLogicalKey(type: StorageFileCategory, filename: string, buffer: Buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  const ext = path.extname(filename) || (type === 'posters' ? '.png' : '.bin');
  return `/uploads/${type}/${hash}${ext}`;
}

async function streamToBuffer(stream: NodeJS.ReadableStream | undefined) {
  if (!stream) {
    return Buffer.from([]);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function saveS3File(buffer: Buffer, filename: string, type: StorageFileCategory): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  const logicalKey = toLogicalKey(type, filename, buffer);
  const objectKey = toObjectKey(logicalKey);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: type === 'posters' ? 'image/png' : undefined,
    })
  );

  return logicalKey;
}

export async function readS3File(key: string): Promise<Buffer> {
  const client = getClient();
  const bucket = getBucket();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: toObjectKey(key),
    })
  );

  return await streamToBuffer(result.Body as NodeJS.ReadableStream | undefined);
}

export async function deleteS3File(key: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: toObjectKey(key),
    })
  );
}

export async function s3FileExists(key: string): Promise<boolean> {
  const client = getClient();
  const bucket = getBucket();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: toObjectKey(key),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function getS3PublicUrl(key: string): string {
  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  if (!publicBase) {
    throw new Error('S3_PUBLIC_BASE_URL must be configured when STORAGE_DRIVER=s3');
  }

  return new URL(key.replace(/^\//, ''), publicBase.endsWith('/') ? publicBase : `${publicBase}/`).toString();
}
