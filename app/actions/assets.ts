'use server';

import { db } from '@/lib/db';
import { assets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { saveFile, deleteFile, fileExists } from '@/lib/storage/local';
import { processImage } from '@/lib/storage/image-processor';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

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

    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.hash, hash),
    });

    let originalKey: string;
    let processedKey: string | null = null;
    let processedResult: { width: number; height: number; aspectRatio: string; processedBuffer: Buffer };

    if (existingAsset) {
      originalKey = existingAsset.originalS3Key;
      processedKey = existingAsset.processedS3Key ?? existingAsset.originalS3Key;
      processedResult = {
        width: existingAsset.width,
        height: existingAsset.height,
        aspectRatio: existingAsset.aspectRatio,
        processedBuffer: Buffer.from([]),
      };
    } else {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const originalFilename = `${crypto.randomUUID()}.${fileExtension}`;
      
      originalKey = await saveFile(buffer, originalFilename, 'original');

      processedResult = await processImage(buffer);
      const processedFilename = `${crypto.randomUUID()}.jpg`;
      processedKey = await saveFile(processedResult.processedBuffer, processedFilename, 'processed');
    }
    
    // Always create a new asset record for this project
    const [asset] = await db
      .insert(assets)
      .values({
        projectId,
        type,
        originalS3Key: originalKey,
        processedS3Key: processedKey,
        width: processedResult.width,
        height: processedResult.height,
        aspectRatio: processedResult.aspectRatio,
        hash,
      })
      .returning();

    revalidatePath(`/projects/${projectId}`);
    return { success: true, asset, duplicate: !!existingAsset };
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
