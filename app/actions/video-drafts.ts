'use server';

import { db } from '@/lib/db';
import { videoDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createVideoDraft(data: {
  projectId: string;
  templateId: string;
  ratio: string;
  fps?: number;
  durationInFrames: number;
  propsJson: Record<string, unknown>;
}) {
  try {
    const [draft] = await db
      .insert(videoDrafts)
      .values({
        projectId: data.projectId,
        templateId: data.templateId,
        ratio: data.ratio,
        fps: data.fps || 30,
        durationInFrames: data.durationInFrames,
        propsJson: data.propsJson,
        status: 'draft',
      })
      .returning();

    revalidatePath(`/projects/${data.projectId}`);
    return { success: true, draft };
  } catch (error) {
    console.error('Failed to create video draft:', error);
    return { success: false, error: 'Failed to create video draft' };
  }
}

export async function updateVideoDraft(draftId: string, propsJson: Record<string, unknown>) {
  try {
    const [draft] = await db
      .update(videoDrafts)
      .set({
        propsJson,
        updatedAt: new Date(),
      })
      .where(eq(videoDrafts.id, draftId))
      .returning();

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    revalidatePath(`/projects/${draft.projectId}`);
    return { success: true, draft };
  } catch (error) {
    console.error('Failed to update video draft:', error);
    return { success: false, error: 'Failed to update video draft' };
  }
}

export async function getVideoDraft(draftId: string) {
  try {
    const draft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, draftId),
      with: {
        template: true,
        project: {
          with: {
            assets: true,
          },
        },
      },
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    return { success: true, draft };
  } catch (error) {
    console.error('Failed to get video draft:', error);
    return { success: false, error: 'Failed to get video draft' };
  }
}

export async function deleteVideoDraft(draftId: string) {
  try {
    const draft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, draftId),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    await db.delete(videoDrafts).where(eq(videoDrafts.id, draftId));

    revalidatePath(`/projects/${draft.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete video draft:', error);
    return { success: false, error: 'Failed to delete video draft' };
  }
}
