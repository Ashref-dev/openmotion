import { db } from "@/lib/db";
import { videoDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, makeCancelSignal } from "@remotion/renderer";
import path from "path";
import { FatalError } from "workflow";
import fs from "fs/promises";
import { updateRenderJobProgress } from "@/lib/render-progress";

export async function loadVideoDraft(videoDraftId: string) {
  "use step";

  const draft = await db.query.videoDrafts.findFirst({
    where: eq(videoDrafts.id, videoDraftId),
    with: {
      project: {
        with: {
          assets: true,
        },
      },
      template: true,
    },
  });

  if (!draft) {
    throw new FatalError(`Video draft ${videoDraftId} not found`);
  }

  if (!draft.template) {
    throw new FatalError(`Template not found for draft ${videoDraftId}`);
  }

  return draft;
}

export async function bundleRemotionProject(videoDraftId: string) {
  "use step";

  await updateRenderJobProgress(videoDraftId, 5, "bundling", "Starting bundling...");

  const bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => config,
  });

  await updateRenderJobProgress(videoDraftId, 20, "bundling", "Bundling complete");

  return bundleLocation;
}

export async function selectCompositionStep(
  bundleLocation: string,
  inputProps: Record<string, unknown>
) {
  "use step";

  const compositions = await getCompositions(bundleLocation, {
    inputProps,
  });

  const composition = compositions.find((c) => c.id === "DynamicVideo");
  if (!composition) {
    throw new FatalError('Composition "DynamicVideo" not found');
  }

  return composition;
}

export async function renderMediaStep(
  bundleLocation: string,
  composition: any,
  inputProps: Record<string, unknown>,
  videoDraftId: string
) {
  "use step";

  const outputPath = path.join(process.cwd(), "public", "uploads", "renders", `${videoDraftId}.mp4`);

  await updateRenderJobProgress(videoDraftId, 25, "rendering", "Starting video rendering...");

  const signal = makeCancelSignal();

  let lastUpdated = 0;

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    cancelSignal: signal.cancelSignal,
    onProgress: async ({ progress }) => {
      const now = Date.now();
      if (now - lastUpdated > 1000) {
        lastUpdated = now;
        const progressPercent = Math.round(25 + progress * 55);
        await updateRenderJobProgress(videoDraftId, progressPercent, "rendering");
      }
    },
  });

  await updateRenderJobProgress(videoDraftId, 80, "rendering", "Rendering complete");

  const stats = await fs.stat(outputPath);

  return {
    outputPath,
    sizeInBytes: stats.size,
    durationInSeconds: composition.durationInFrames / composition.fps,
  };
}

export async function saveRenderResult(
  videoDraftId: string,
  sizeInBytes: number,
  durationInSeconds: number
) {
  "use step";

  await updateRenderJobProgress(videoDraftId, 85, "uploading", "Saving render result...");

  const renderKey = `renders/${videoDraftId}.mp4`;

  await db
    .update(videoDrafts)
    .set({
      outputS3Key: renderKey,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(videoDrafts.id, videoDraftId));

  await updateRenderJobProgress(videoDraftId, 95, "uploading", "Render saved successfully");

  return {
    renderKey,
    sizeInBytes,
    durationInSeconds,
  };
}

export async function cleanupTempFiles(bundleLocation: string, videoDraftId: string) {
  "use step";

  try {
    await fs.rm(bundleLocation, { recursive: true, force: true });
    await updateRenderJobProgress(videoDraftId, 100, "completed", "Cleanup complete - Render finished!");
  } catch (error) {
    console.warn("Failed to cleanup temp files:", error);
  }
}

export async function updateDraftStatus(videoDraftId: string, status: string) {
  "use step";

  await db
    .update(videoDrafts)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(videoDrafts.id, videoDraftId));
}
