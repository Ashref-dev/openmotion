import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  renderMedia,
  type RenderMediaOnProgress,
  makeCancelSignal,
} from "@remotion/renderer";
import path from "path";
import { RenderLogger } from "./logger";

export interface RenderOptions {
  videoDraftId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  outputPath: string;
  onProgress?: (progress: number) => void;
  logger?: RenderLogger;
  cancelSignal?: ReturnType<typeof makeCancelSignal>;
}

export interface RenderResult {
  outputPath: string;
  durationInSeconds: number;
  sizeInBytes: number;
}

export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
  const {
    compositionId,
    inputProps,
    outputPath,
    onProgress,
    logger,
    cancelSignal,
  } = options;

  const log = logger || new RenderLogger();
  
  log.info("Starting video render", {
    compositionId,
    outputPath,
  });

  try {
    log.info("Bundling Remotion project");
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: (config) => config,
    });
    log.info("Bundle complete", { bundleLocation });

    log.info("Fetching compositions");
    const compositions = await getCompositions(bundleLocation, {
      inputProps,
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
      throw new Error(`Composition "${compositionId}" not found`);
    }
    log.info("Composition found", {
      id: composition.id,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
    });

    log.info("Starting render");
    const onProgressHandler: RenderMediaOnProgress = ({ progress, renderedFrames, encodedFrames }) => {
      const progressPercent = Math.round(progress * 100);
      log.debug(`Render progress: ${progressPercent}%`, {
        renderedFrames,
        encodedFrames,
      });
      if (onProgress) {
        onProgress(progress);
      }
    };

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      onProgress: onProgressHandler,
      cancelSignal: cancelSignal?.cancelSignal,
    });

    log.info("Render complete", { outputPath });

    const fs = await import("fs/promises");
    const stats = await fs.stat(outputPath);
    const durationInSeconds = composition.durationInFrames / composition.fps;

    return {
      outputPath,
      durationInSeconds,
      sizeInBytes: stats.size,
    };
  } catch (error) {
    log.error("Render failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export { makeCancelSignal };
