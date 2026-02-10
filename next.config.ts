import { withWorkflow } from 'workflow/next';
import type { NextConfig } from 'next';

const baseConfig: NextConfig = {
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    'sharp',
    'postgres',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

const workflowConfig = {
  workflows: {
    local: {
      port: Number(process.env.PORT ?? 3000),
      dataDir: './.workflow-data',
    },
    dirs: ['app', 'workflows'],
  },
};

const withWorkflowConfig = withWorkflow(baseConfig, workflowConfig);

export default async function config(
  phase: string,
  ctx: { defaultConfig: NextConfig }
): Promise<NextConfig> {
  const resolvedConfig =
    typeof withWorkflowConfig === 'function'
      ? await withWorkflowConfig(phase, ctx)
      : withWorkflowConfig;

  if ('turbopack' in resolvedConfig) {
    const turbopackConfig = resolvedConfig.turbopack;
    const existingExperimental = resolvedConfig.experimental ?? {};
    const existingTurbo =
      typeof existingExperimental === 'object' && 'turbo' in existingExperimental
        ? existingExperimental.turbo
        : undefined;

    resolvedConfig.experimental = {
      ...(typeof existingExperimental === 'object' ? existingExperimental : {}),
      turbo: {
        ...(typeof existingTurbo === 'object' ? existingTurbo : {}),
        ...(typeof turbopackConfig === 'object' ? turbopackConfig : {}),
        rules: {
          ...(typeof existingTurbo === 'object' && existingTurbo?.rules
            ? existingTurbo.rules
            : {}),
          ...(typeof turbopackConfig === 'object' && turbopackConfig?.rules
            ? turbopackConfig.rules
            : {}),
        },
      },
    };

    delete resolvedConfig.turbopack;
  }

  return resolvedConfig;
}
