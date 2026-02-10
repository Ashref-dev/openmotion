import { db } from "@/lib/db";
import { renderJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateRenderJobProgress(
  videoDraftId: string,
  progress: number,
  stage: string,
  log?: string
) {
  try {
    const job = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.videoDraftId, videoDraftId),
      orderBy: (jobs, { desc }) => [desc(jobs.startedAt)],
    });

    if (!job) {
      console.warn(`No render job found for videoDraftId: ${videoDraftId}`);
      return;
    }

    const updates: Partial<typeof renderJobs.$inferInsert> = {
      progress: Math.min(100, Math.max(0, progress)),
      stage,
    };

    if (log) {
      const currentLogs = (job.logsJson as string[]) || [];
      updates.logsJson = [...currentLogs, `[${new Date().toISOString()}] ${log}`];
    }

    await db
      .update(renderJobs)
      .set(updates)
      .where(eq(renderJobs.id, job.id));

    console.log(`[RenderJob ${job.id}] Progress: ${progress}% - Stage: ${stage}`);
  } catch (error) {
    console.error('Failed to update render job progress:', error);
  }
}
