import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { renderJobs, videoDrafts } from '@/lib/db/schema';
import { VIDEO_CONFIG } from '@/lib/config';

const ACTIVE_JOB_STATUSES = ['queued', 'running'] as const;

type RenderJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
type RenderJobStage = 'queued' | 'validating' | 'bundling' | 'rendering' | 'uploading' | 'completed' | 'failed' | 'canceled';

function nextLeaseExpiry() {
  return new Date(Date.now() + VIDEO_CONFIG.rendering.leaseSeconds * 1000);
}

export async function createRenderJob(videoDraftId: string) {
  const activeJob = await db.query.renderJobs.findFirst({
    where: and(
      eq(renderJobs.videoDraftId, videoDraftId),
      inArray(renderJobs.status, [...ACTIVE_JOB_STATUSES])
    ),
    orderBy: (jobs, { desc: orderDesc }) => [orderDesc(jobs.startedAt)],
  });

  if (activeJob) {
    return { job: activeJob, reused: true };
  }

  const [job] = await db
    .insert(renderJobs)
    .values({
      videoDraftId,
      status: 'queued',
      stage: 'queued',
      progress: 0,
      attemptCount: 0,
      logsJson: [],
    })
    .returning();

  await db
    .update(videoDrafts)
    .set({
      status: 'rendering',
      lastRenderJobId: job.id,
      updatedAt: new Date(),
    })
    .where(eq(videoDrafts.id, videoDraftId));

  return { job, reused: false };
}

export async function getRenderJob(jobId: string) {
  const job = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.id, jobId),
    with: {
      videoDraft: true,
    },
  });

  if (!job) {
    return null;
  }

  if (job.status === 'running' && job.leaseExpiresAt && job.leaseExpiresAt.getTime() < Date.now()) {
    return await markRenderJobFailed(job.id, 'Render worker lease expired before completion');
  }

  return job;
}

export async function claimRenderJob(jobId: string) {
  const existing = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.id, jobId),
  });

  if (!existing) {
    throw new Error('Render job not found');
  }

  if (existing.status === 'completed' || existing.status === 'canceled') {
    return existing;
  }

  if (
    existing.status === 'running' &&
    existing.leaseExpiresAt &&
    existing.leaseExpiresAt.getTime() > Date.now()
  ) {
    return existing;
  }

  const [job] = await db
    .update(renderJobs)
    .set({
      status: 'running',
      stage: 'validating',
      progress: 2,
      attemptCount: existing.attemptCount + 1,
      errorMessage: null,
      finishedAt: null,
      leaseExpiresAt: nextLeaseExpiry(),
      startedAt: existing.startedAt || new Date(),
    })
    .where(eq(renderJobs.id, jobId))
    .returning();

  return job;
}

export async function appendRenderJobLog(jobId: string, message: string) {
  const existing = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.id, jobId),
  });

  if (!existing) {
    return;
  }

  const currentLogs = (existing.logsJson as string[] | null) || [];
  await db
    .update(renderJobs)
    .set({
      logsJson: [...currentLogs, `[${new Date().toISOString()}] ${message}`],
      leaseExpiresAt: nextLeaseExpiry(),
    })
    .where(eq(renderJobs.id, jobId));
}

export async function updateRenderJobState(
  jobId: string,
  updates: {
    progress?: number;
    stage?: RenderJobStage;
    status?: RenderJobStatus;
    errorMessage?: string | null;
    outputKey?: string | null;
    posterKey?: string | null;
    finishedAt?: Date | null;
    log?: string;
  }
) {
  const existing = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.id, jobId),
  });

  if (!existing) {
    throw new Error(`Render job ${jobId} not found`);
  }

  const nextLogs = updates.log
    ? [
        ...(((existing.logsJson as string[] | null) || [])),
        `[${new Date().toISOString()}] ${updates.log}`,
      ]
    : existing.logsJson;

  const [job] = await db
    .update(renderJobs)
    .set({
      progress: updates.progress ?? existing.progress,
      stage: updates.stage ?? existing.stage,
      status: updates.status ?? existing.status,
      errorMessage: updates.errorMessage === undefined ? existing.errorMessage : updates.errorMessage,
      outputKey: updates.outputKey === undefined ? existing.outputKey : updates.outputKey,
      posterKey: updates.posterKey === undefined ? existing.posterKey : updates.posterKey,
      finishedAt: updates.finishedAt === undefined ? existing.finishedAt : updates.finishedAt,
      logsJson: nextLogs,
      leaseExpiresAt:
        updates.status && ['completed', 'failed', 'canceled'].includes(updates.status)
          ? null
          : nextLeaseExpiry(),
    })
    .where(eq(renderJobs.id, jobId))
    .returning();

  return job;
}

export async function markRenderJobCompleted(jobId: string, options: {
  videoDraftId: string;
  outputKey: string;
  posterKey: string;
}) {
  const finishedAt = new Date();

  const [job] = await db
    .update(renderJobs)
    .set({
      status: 'completed',
      stage: 'completed',
      progress: 100,
      outputKey: options.outputKey,
      posterKey: options.posterKey,
      finishedAt,
      leaseExpiresAt: null,
    })
    .where(eq(renderJobs.id, jobId))
    .returning();

  await db
    .update(videoDrafts)
    .set({
      status: 'completed',
      outputS3Key: options.outputKey,
      posterKey: options.posterKey,
      lastRenderJobId: jobId,
      updatedAt: finishedAt,
    })
    .where(eq(videoDrafts.id, options.videoDraftId));

  return job;
}

export async function markRenderJobFailed(jobId: string, errorMessage: string) {
  const [job] = await db
    .update(renderJobs)
    .set({
      status: 'failed',
      stage: 'failed',
      finishedAt: new Date(),
      leaseExpiresAt: null,
      errorMessage,
    })
    .where(eq(renderJobs.id, jobId))
    .returning();

  if (job) {
    await db
      .update(videoDrafts)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(videoDrafts.id, job.videoDraftId));
  }

  return job;
}

export async function cancelRenderJob(jobId: string) {
  const [job] = await db
    .update(renderJobs)
    .set({
      status: 'canceled',
      stage: 'canceled',
      finishedAt: new Date(),
      leaseExpiresAt: null,
      errorMessage: 'Canceled by user',
    })
    .where(eq(renderJobs.id, jobId))
    .returning();

  if (job) {
    await db
      .update(videoDrafts)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(videoDrafts.id, job.videoDraftId));
  }

  return job;
}

export async function getLatestRenderJobForDraft(videoDraftId: string) {
  return await db.query.renderJobs.findFirst({
    where: eq(renderJobs.videoDraftId, videoDraftId),
    orderBy: [desc(renderJobs.startedAt)],
  });
}
