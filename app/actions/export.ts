'use server';

import { start } from 'workflow/api';
import { renderVideoWorkflow } from '@/workflows/render-video';
import { db } from '@/lib/db';
import { videoDrafts, renderJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function startExport(videoDraftId: string) {
  try {
    console.log('[DEBUG] Starting export for videoDraftId:', videoDraftId);
    console.log('[DEBUG] renderVideoWorkflow type:', typeof renderVideoWorkflow);
    console.log('[DEBUG] renderVideoWorkflow name:', renderVideoWorkflow?.name);
    console.log('[DEBUG] renderVideoWorkflow.workflowId:', (renderVideoWorkflow as any)?.workflowId);
    console.log('[DEBUG] globalThis.__private_workflows:', typeof (globalThis as any).__private_workflows);
    
    const draft = await db.query.videoDrafts.findFirst({
      where: eq(videoDrafts.id, videoDraftId),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    if (draft.status === 'rendering') {
      return { success: false, error: 'Export already in progress' };
    }

    await db
      .update(videoDrafts)
      .set({ status: 'rendering', updatedAt: new Date() })
      .where(eq(videoDrafts.id, videoDraftId));

    console.log('[DEBUG] About to call start() with workflow');
    
    const workflowId = 'workflow//workflows/render-video.ts//renderVideoWorkflow';
    const registeredWorkflow = (globalThis as any).__private_workflows?.get(workflowId);
    console.log('[DEBUG] Registered workflow found:', !!registeredWorkflow);
    
    const workflowToUse = registeredWorkflow || renderVideoWorkflow;
    
    if (!(workflowToUse as any).workflowId) {
      console.log('[DEBUG] Adding workflowId manually');
      (workflowToUse as any).workflowId = workflowId;
    }
    
    console.log('[DEBUG] workflowToUse.workflowId:', (workflowToUse as any).workflowId);
    const run = await start(workflowToUse, [{ videoDraftId }]);
    console.log('[DEBUG] Workflow started successfully, runId:', run.runId);

    const [job] = await db
      .insert(renderJobs)
      .values({
        videoDraftId,
        workflowRunId: run.runId,
        progress: 0,
        stage: 'bundling',
      })
      .returning();

    revalidatePath(`/projects/${draft.projectId}`);
    return { success: true, runId: run.runId, jobId: job.id };
  } catch (error) {
    console.error('Failed to start export:', error);
    
    await db
      .update(videoDrafts)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(videoDrafts.id, videoDraftId));

    return { success: false, error: 'Failed to start export' };
  }
}

export async function cancelExport(runId: string) {
  try {
    const job = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.workflowRunId, runId),
    });

    if (job) {
      await db
        .update(renderJobs)
        .set({
          stage: 'canceled',
          finishedAt: new Date(),
        })
        .where(eq(renderJobs.id, job.id));

      await db
        .update(videoDrafts)
        .set({ status: 'canceled', updatedAt: new Date() })
        .where(eq(videoDrafts.id, job.videoDraftId));

      const draft = await db.query.videoDrafts.findFirst({
        where: eq(videoDrafts.id, job.videoDraftId),
      });

      if (draft) {
        revalidatePath(`/projects/${draft.projectId}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel export:', error);
    return { success: false, error: 'Failed to cancel export' };
  }
}

export async function getExportStatus(runId: string) {
  try {
    const job = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.workflowRunId, runId),
    });

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
    const jobs = await db
      .select()
      .from(renderJobs)
      .where(eq(renderJobs.videoDraftId, videoDraftId));

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
      url: `/uploads/renders/${videoDraftId}.mp4`,
      filename,
    };
  } catch (error) {
    console.error('Failed to get video download URL:', error);
    return { success: false, error: 'Failed to get download URL' };
  }
}
