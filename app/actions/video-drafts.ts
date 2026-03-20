'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { projects, videoDrafts } from '@/lib/db/schema';
import { getPublicUrl } from '@/lib/storage';
import { parseDraftSnapshot, validateSnapshotAssetRefs } from '@/lib/video/draft-schema';
import { coerceDraftSnapshot } from '@/lib/video/resolve-draft';
import { createInitialDraftSnapshot, getTemplateDefinition } from '@/lib/video/template-catalog';

async function getProjectAssets(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      assets: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return project.assets;
}

export async function createVideoDraft(data: {
  projectId: string;
  templateId: string;
  ratio?: string;
  fps?: number;
  durationInFrames?: number;
}) {
  try {
    const template = getTemplateDefinition(data.templateId);
    const projectAssets = await getProjectAssets(data.projectId);
    const snapshot = createInitialDraftSnapshot({
      templateId: template.id,
      assets: projectAssets,
      ratio: data.ratio as Parameters<typeof createInitialDraftSnapshot>[0]['ratio'],
      fps: data.fps,
      durationInFrames: data.durationInFrames,
    });

    const [draft] = await db
      .insert(videoDrafts)
      .values({
        projectId: data.projectId,
        templateId: snapshot.templateId,
        ratio: snapshot.ratio,
        fps: snapshot.fps,
        durationInFrames: snapshot.durationInFrames,
        schemaVersion: '2',
        propsJson: snapshot,
        status: 'draft',
      })
      .returning();

    revalidatePath(`/projects/${data.projectId}`);
    return { success: true, draft, template };
  } catch (error) {
    console.error('Failed to create video draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create video draft',
    };
  }
}

export async function updateVideoDraft(draftId: string, snapshotInput: Record<string, unknown>) {
  try {
    const existingDraft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, draftId),
      with: {
        project: {
          with: {
            assets: true,
          },
        },
      },
    });

    if (!existingDraft) {
      return { success: false, error: 'Draft not found' };
    }

    const snapshot = parseDraftSnapshot(snapshotInput);
    validateSnapshotAssetRefs(snapshot, existingDraft.project?.assets || []);

    const [draft] = await db
      .update(videoDrafts)
      .set({
        templateId: snapshot.templateId,
        ratio: snapshot.ratio,
        fps: snapshot.fps,
        durationInFrames: snapshot.durationInFrames,
        schemaVersion: '2',
        propsJson: snapshot,
        status: existingDraft.status === 'completed' ? 'draft' : existingDraft.status,
        updatedAt: new Date(),
      })
      .where(eq(videoDrafts.id, draftId))
      .returning();

    revalidatePath(`/projects/${draft.projectId}`);
    revalidatePath(`/projects/${draft.projectId}/editor/${draft.id}`);
    return { success: true, draft };
  } catch (error) {
    console.error('Failed to update video draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update video draft',
    };
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
        renderJobs: {
          orderBy: (jobs, { desc }) => [desc(jobs.startedAt)],
        },
      },
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    const snapshot = coerceDraftSnapshot({
      projectAssets: draft.project?.assets || [],
      templateId: draft.templateId,
      ratio: draft.ratio,
      fps: draft.fps,
      durationInFrames: draft.durationInFrames,
      propsJson: (draft.propsJson || {}) as Record<string, unknown>,
    });

    return {
      success: true,
      draft: {
        ...draft,
        schemaVersion: draft.schemaVersion || '2',
        propsJson: snapshot,
        project: draft.project
          ? {
              ...draft.project,
              assets: draft.project.assets.map((asset) => ({
                ...asset,
                previewUrl: getPublicUrl(asset.processedS3Key || asset.originalS3Key),
                sourceUrl: getPublicUrl(asset.originalS3Key),
              })),
            }
          : draft.project,
      },
    };
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
