import { NextResponse } from 'next/server';
import { VIDEO_CONFIG } from '@/lib/config';
import { claimRenderJob, getRenderJob } from '@/lib/render-jobs';
import { renderDraftJob } from '@/lib/rendering/run-render-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = VIDEO_CONFIG.rendering.maxDurationSeconds;

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  try {
    const existingJob = await getRenderJob(jobId);
    if (!existingJob) {
      return NextResponse.json({ error: 'Render job not found' }, { status: 404 });
    }

    if (existingJob.status === 'completed') {
      return NextResponse.json({ status: 'completed' });
    }

    if (
      existingJob.status === 'running' &&
      existingJob.leaseExpiresAt &&
      existingJob.leaseExpiresAt.getTime() > Date.now()
    ) {
      return NextResponse.json({ status: 'running' }, { status: 202 });
    }

    await claimRenderJob(jobId);
    await renderDraftJob(jobId);

    return NextResponse.json({ status: 'completed' });
  } catch (error) {
    console.error('Render route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Render failed' },
      { status: 500 }
    );
  }
}
