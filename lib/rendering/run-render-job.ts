import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { getCompositions, makeCancelSignal, renderMedia, renderStill } from '@remotion/renderer';
import { eq } from 'drizzle-orm';
import { VIDEO_CONFIG } from '@/lib/config';
import { db } from '@/lib/db';
import { videoDrafts } from '@/lib/db/schema';
import {
  appendRenderJobLog,
  markRenderJobCompleted,
  markRenderJobFailed,
  updateRenderJobState,
} from '@/lib/render-jobs';
import { saveFile } from '@/lib/storage';
import { RenderLogger } from '@/lib/rendering/logger';
import { coerceDraftSnapshot, resolveDraftSnapshot } from '@/lib/video/resolve-draft';

export async function runRenderJob(jobId: string) {
  const draft = await db.query.videoDrafts.findFirst({
    where: eq(videoDrafts.id, jobId),
  });

  void draft;
}

export async function renderDraftJob(jobId: string) {
  let bundleLocation: string | null = null;
  const tempDir = path.join(os.tmpdir(), 'openmotion-renders');
  const outputPath = path.join(tempDir, `${jobId}.mp4`);
  const posterPath = path.join(tempDir, `${jobId}.png`);

  await fs.mkdir(tempDir, { recursive: true });

  const logger = new RenderLogger((entry) => {
    void appendRenderJobLog(jobId, `${entry.level.toUpperCase()}: ${entry.message}`);
  });

  try {
    const job = await db.query.renderJobs.findFirst({
      where: (jobs, { eq: whereEq }) => whereEq(jobs.id, jobId),
      with: {
        videoDraft: {
          with: {
            project: {
              with: {
                assets: true,
              },
            },
            template: true,
          },
        },
      },
    });

    if (!job?.videoDraft) {
      throw new Error('Render job draft not found');
    }

    const snapshot = coerceDraftSnapshot({
      projectAssets: job.videoDraft.project?.assets || [],
      templateId: job.videoDraft.templateId,
      ratio: job.videoDraft.ratio,
      fps: job.videoDraft.fps,
      durationInFrames: job.videoDraft.durationInFrames,
      propsJson: (job.videoDraft.propsJson || {}) as Record<string, unknown>,
    });
    const resolved = resolveDraftSnapshot(snapshot, job.videoDraft.project?.assets || []);

    if (resolved.snapshot.durationInFrames > VIDEO_CONFIG.duration.maxFrames) {
      throw new Error('Draft is too long for the hosted MVP limit');
    }

    await updateRenderJobState(jobId, {
      status: 'running',
      stage: 'validating',
      progress: 5,
      log: `Validated ${resolved.props.visuals.length} visual clip(s) and ${resolved.props.texts.length} text clip(s)`,
    });

    logger.info('Bundling Remotion project');
    await updateRenderJobState(jobId, {
      stage: 'bundling',
      progress: 15,
      log: 'Bundling Remotion project',
    });

    bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
      webpackOverride: (config) => config,
    });

    const compositions = await getCompositions(bundleLocation, {
      inputProps: resolved.props,
    });
    const composition = compositions.find((item) => item.id === resolved.compositionId);

    if (!composition) {
      throw new Error(`Composition ${resolved.compositionId} not found`);
    }

    await updateRenderJobState(jobId, {
      stage: 'rendering',
      progress: 25,
      log: `Rendering ${composition.width}x${composition.height} at ${composition.fps}fps`,
    });

    const cancelSignal = makeCancelSignal();
    let lastProgressUpdate = 0;

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: resolved.props,
      cancelSignal: cancelSignal.cancelSignal,
      onProgress: async ({ progress }) => {
        const now = Date.now();
        if (now - lastProgressUpdate < 750) {
          return;
        }
        lastProgressUpdate = now;
        await updateRenderJobState(jobId, {
          stage: 'rendering',
          progress: Math.min(85, Math.max(25, Math.round(25 + progress * 60))),
        });
      },
    });

    await updateRenderJobState(jobId, {
      stage: 'uploading',
      progress: 90,
      log: 'Saving render artifacts',
    });

    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: posterPath,
      frame: 0,
      imageFormat: 'png',
      inputProps: resolved.props,
    });

    const [videoBuffer, posterBuffer] = await Promise.all([
      fs.readFile(outputPath),
      fs.readFile(posterPath),
    ]);

    const [outputKey, posterKey] = await Promise.all([
      saveFile(videoBuffer, `${job.videoDraft.id}.mp4`, 'renders'),
      saveFile(posterBuffer, `${job.videoDraft.id}.png`, 'posters'),
    ]);

    await markRenderJobCompleted(jobId, {
      videoDraftId: job.videoDraft.id,
      outputKey,
      posterKey,
    });
    await appendRenderJobLog(jobId, 'Render finished successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown render error';
    logger.error('Render failed', { message });
    await markRenderJobFailed(jobId, message);
    throw error;
  } finally {
    await Promise.allSettled([
      fs.rm(outputPath, { force: true }),
      fs.rm(posterPath, { force: true }),
      bundleLocation ? fs.rm(bundleLocation, { recursive: true, force: true }) : Promise.resolve(),
    ]);
  }
}
