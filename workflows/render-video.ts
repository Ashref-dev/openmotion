import {
  loadVideoDraft,
  bundleRemotionProject,
  selectCompositionStep,
  renderMediaStep,
  saveRenderResult,
  cleanupTempFiles,
  updateDraftStatus,
} from "./render-steps";
import { updateRenderJobProgress } from "@/lib/render-progress";

export interface RenderWorkflowConfig {
  videoDraftId: string;
}

export interface RenderWorkflowResult {
  videoDraftId: string;
  renderKey: string;
  status: "completed" | "failed";
  sizeInBytes?: number;
  durationInSeconds?: number;
  error?: string;
}

export async function renderVideoWorkflow(
  config: RenderWorkflowConfig
): Promise<RenderWorkflowResult> {
  "use workflow";

  const { videoDraftId } = config;

  try {
    const draft = await loadVideoDraft(videoDraftId);

    const bundleLocation = await bundleRemotionProject(videoDraftId);

    const composition = await selectCompositionStep(bundleLocation, draft.propsJson as Record<string, unknown>);

    const renderResult = await renderMediaStep(
      bundleLocation,
      composition,
      draft.propsJson as Record<string, unknown>,
      videoDraftId
    );

    const result = await saveRenderResult(
      videoDraftId,
      renderResult.sizeInBytes,
      renderResult.durationInSeconds
    );

    await cleanupTempFiles(bundleLocation, videoDraftId);

    return {
      videoDraftId,
      renderKey: result.renderKey,
      status: "completed",
      sizeInBytes: result.sizeInBytes,
      durationInSeconds: result.durationInSeconds,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await updateRenderJobProgress(videoDraftId, 0, "failed", `Render failed: ${errorMessage}`);
    await updateDraftStatus(videoDraftId, "failed");

    return {
      videoDraftId,
      renderKey: "",
      status: "failed",
      error: errorMessage,
    };
  }
}
