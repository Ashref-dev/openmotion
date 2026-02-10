# Workflow DevKit Best Practices for OpenMotion

## Core Concepts

### Workflow Functions (`"use workflow"`)
- **Orchestrators** that organize steps
- Run in sandboxed environment (no full Node.js)
- Must be **deterministic** (replayed multiple times)
- Use for: control flow, conditionals, loops, Promise.all
- Results are persisted to event log

### Step Functions (`"use step"`)
- **Workers** that perform actual work
- Full Node.js runtime access
- Automatic retry (3 attempts default)
- Use for: database calls, API requests, external services

## Setup for Next.js

```typescript
// next.config.ts
import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@remotion/renderer', 'sharp', 'postgres'],
};

export default withWorkflow(nextConfig);
```

```json
// tsconfig.json - Add plugin for IntelliSense
{
  "compilerOptions": {
    "plugins": [{ "name": "workflow" }]
  }
}
```

## Pattern: Video Rendering Workflow

```typescript
import { sleep } from "workflow";

export async function renderVideoWorkflow(config: RenderConfig) {
  "use workflow";

  // Step 1: Load and validate
  const draft = await loadDraft(config.videoDraftId);
  
  // Step 2: Bundle project (heavy operation)
  const bundleLocation = await bundleRemotionProject();
  
  // Step 3: Select composition
  const composition = await selectComposition(bundleLocation, draft.propsJson);
  
  // Step 4: Render media
  const tempFile = await renderMediaFile(composition, bundleLocation);
  
  // Step 5: Upload to storage
  const s3Key = await uploadToS3(tempFile, draft.id);
  
  // Step 6: Cleanup
  await cleanupTempFiles(tempFile);
  
  // Step 7: Finalize database
  await finalizeDraft(draft.id, s3Key);
  
  return { s3Key, status: 'completed' };
}

// Steps with full Node.js access
async function bundleRemotionProject() {
  "use step";
  const { bundle } = await import("@remotion/bundler");
  return await bundle({ entryPoint: "./remotion/index.ts" });
}

async function renderMediaFile(composition: any, bundleLocation: string) {
  "use step";
  const { renderMedia } = await import("@remotion/renderer");
  const outputPath = `/tmp/render-${Date.now()}.mp4`;
  await renderMedia({ composition, serveUrl: bundleLocation, outputLocation: outputPath });
  return outputPath;
}
```

## Error Handling

```typescript
import { FatalError } from "workflow";

async function processAsset(assetId: string) {
  "use step";
  
  const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
  
  if (!asset) {
    // Don't retry - asset truly doesn't exist
    throw new FatalError(`Asset ${assetId} not found`);
  }
  
  // Retryable error (network, rate limit, etc.)
  const result = await externalAPI.process(asset);
  return result;
}
```

## Suspension Patterns

```typescript
import { sleep, createWebhook } from "workflow";

export async function approvalWorkflow(userId: string) {
  "use workflow";
  
  // 1. Sleep (no resources consumed)
  await sleep("5s");
  await sleep("1 hour");
  await sleep("7 days");
  
  // 2. Webhook (wait for external event)
  const webhook = createWebhook();
  await sendEmail(`Approve: ${webhook.url}`);
  const approval = await webhook; // Suspends until webhook called
}
```

## Starting Workflows

```typescript
// From Server Action
'use server';
import { start } from "workflow/api";
import { renderVideoWorkflow } from "@/workflows/render-video";

export async function startExport(draftId: string) {
  const run = await start(renderVideoWorkflow, [{ videoDraftId: draftId }]);
  return { runId: run.runId };
}

// From API Route
import { start } from "workflow/api";

export async function POST(request: Request) {
  const { draftId } = await request.json();
  await start(renderVideoWorkflow, [{ videoDraftId: draftId }]);
  return Response.json({ message: "Started" });
}
```

## Observability

```bash
# Web UI
npx workflow web

# CLI
npx workflow inspect runs
```

## Key Rules

1. **Workflow functions**: No side effects, must be deterministic
2. **Step functions**: Full Node.js access, retryable by default
3. **Parameters**: Passed by value (not reference) - always return modified data
4. **Serialization**: All data must be JSON-serializable
5. **Idempotency**: Use `getStepMetadata()` for unique IDs per step execution

## For OpenMotion Use Case

- **Workflow**: Orchestrate 7-step render pipeline
- **Steps**: Bundle, render, upload, cleanup, DB updates
- **Suspension**: Sleep between heavy operations if needed
- **Retry**: Automatic for transient failures (network, rate limits)
- **Fatal**: Throw FatalError for invalid props, missing assets

This ensures reliable, durable video rendering without manual queue management.
