'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { renderJobs, videoDrafts } from '@/lib/db/schema';
import { cancelRenderJob, createRenderJob, getRenderJob } from '@/lib/render-jobs';
import { getPublicUrl } from '@/lib/storage';

export async function startExport(videoDraftId: string) {
  try {
    const draft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, videoDraftId),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    const { job, reused } = await createRenderJob(videoDraftId);
    revalidatePath(`/projects/${draft.projectId}`);
    revalidatePath(`/projects/${draft.projectId}/render/${job.id}`);

    return {
      success: true,
      jobId: job.id,
      reused,
    };
  } catch (error) {
    console.error('Failed to start export:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start export',
    };
  }
}

export async function cancelExport(jobId: string) {
  try {
    const job = await getRenderJob(jobId);

    if (!job) {
      return { success: false, error: 'Render job not found' };
    }

    if (job.status === 'running') {
      return { success: false, error: 'Running renders cannot be canceled in this MVP yet' };
    }

    await cancelRenderJob(jobId);
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel export:', error);
    return { success: false, error: 'Failed to cancel export' };
  }
}

export async function getExportStatus(jobId: string) {
  try {
    const job = await getRenderJob(jobId);

    return {
      success: true,
      job,
    };
  } catch (error) {
    console.error('Failed to get export status:', error);
    return { success: false, error: 'Failed to get export status' };
  }
}

export async function getRenderJobsByDraft(videoDraftId: string) {
  try {
    const jobs = await db.query.renderJobs.findMany({
      where: eq(renderJobs.videoDraftId, videoDraftId),
      orderBy: (table, { desc }) => [desc(table.startedAt)],
    });

    return { success: true, jobs };
  } catch (error) {
    console.error('Failed to get render jobs:', error);
    return { success: false, error: 'Failed to get render jobs', jobs: [] };
  }
}

export async function getVideoDownloadUrl(videoDraftId: string) {
  try {
    const draft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, videoDraftId),
    });

    if (!draft) {
      return { success: false, error: 'Video draft not found' };
    }

    if (!draft.outputS3Key) {
      return { success: false, error: 'Video not yet rendered' };
    }

    const filename = `video-${videoDraftId.slice(0, 8)}.mp4`;

    return {
      success: true,
      url: getPublicUrl(draft.outputS3Key),
      filename,
    };
  } catch (error) {
    console.error('Failed to get video download URL:', error);
    return { success: false, error: 'Failed to get download URL' };
  }
}
