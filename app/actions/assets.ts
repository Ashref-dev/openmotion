'use server';

import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { assets } from '@/lib/db/schema';
import { deleteFile, fileExists, saveFile } from '@/lib/storage';
import { processImage } from '@/lib/storage/image-processor';

function getFileExtension(filename: string, fallback: string) {
  const extension = filename.split('.').pop();
  return extension && extension.length <= 10 ? extension : fallback;
}

export async function uploadAsset(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!projectId || !file || !type) {
      return { success: false, error: 'Missing required fields' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const duplicateAsset = await db.query.assets.findFirst({
      where: eq(assets.hash, hash),
    });

    const extension = getFileExtension(file.name, type === 'audio' ? 'mp3' : 'jpg');
    const originalFilename = `${crypto.randomUUID()}.${extension}`;
    const originalKey = await saveFile(buffer, originalFilename, 'original');

    let processedKey: string | null = null;
    let width = 0;
    let height = 0;
    let aspectRatio = 'audio';

    if (type !== 'audio') {
      const processedResult = await processImage(buffer);
      const processedFilename = `${crypto.randomUUID()}.jpg`;
      processedKey = await saveFile(processedResult.processedBuffer, processedFilename, 'processed');
      width = processedResult.width;
      height = processedResult.height;
      aspectRatio = processedResult.aspectRatio;
    }

    const [asset] = await db
      .insert(assets)
      .values({
        projectId,
        type,
        originalS3Key: originalKey,
        processedS3Key: processedKey,
        width,
        height,
        aspectRatio,
        hash,
      })
      .returning();

    revalidatePath(`/projects/${projectId}`);
    return { success: true, asset, duplicate: Boolean(duplicateAsset) };
  } catch (error) {
    console.error('Failed to upload asset:', error);
    return { success: false, error: 'Failed to upload asset' };
  }
}

export async function deleteAsset(assetId: string) {
  try {
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
    });

    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    if (await fileExists(asset.originalS3Key)) {
      await deleteFile(asset.originalS3Key);
    }

    if (asset.processedS3Key && (await fileExists(asset.processedS3Key))) {
      await deleteFile(asset.processedS3Key);
    }

    await db.delete(assets).where(eq(assets.id, assetId));

    revalidatePath(`/projects/${asset.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return { success: false, error: 'Failed to delete asset' };
  }
}

export async function listAssetsByProject(projectId: string) {
  try {
    const projectAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.projectId, projectId));

    return { success: true, assets: projectAssets };
  } catch (error) {
    console.error('Failed to list assets:', error);
    return { success: false, error: 'Failed to list assets', assets: [] };
  }
}
