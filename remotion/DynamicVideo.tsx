import { AbsoluteFill, Sequence } from 'remotion';
import { z } from 'zod';
import {
  HeroScreenshot,
  Carousel,
  SplitShowcase,
  ZoomCut,
  LogoIntro,
  EndCard,
} from './scenes';

export const DynamicVideoSchema = z.object({
  scenes: z.array(
    z.object({
      type: z.enum([
        'heroScreenshot',
        'carousel',
        'splitShowcase',
        'zoomCut',
        'logoIntro',
        'endCard',
      ]),
      enabled: z.boolean(),
      durationInFrames: z.number(),
      assetIndex: z.number().optional(),
      assetIndices: z.array(z.number()).optional(),
      logoAssetIndex: z.number().optional(),
      motion: z.enum(['drift', 'copy', 'static']).optional(),
      intensity: z.number().optional(),
      transitionStyle: z.enum(['smooth', 'stack']).optional(),
      text: z.string().optional(),
    })
  ),
  assets: z.array(
    z.object({
      url: z.string(),
      type: z.enum(['screenshot', 'logo']),
    })
  ),
  bgStyle: z.string().optional(),
  primaryColor: z.string().optional(),
});

export type DynamicVideoProps = z.infer<typeof DynamicVideoSchema>;

export const DynamicVideo: React.FC<DynamicVideoProps> = ({ scenes, assets }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {scenes
        .filter((scene) => scene.enabled)
        .map((scene, index) => {
          const startFrame = currentFrame;
          currentFrame += scene.durationInFrames;

          const key = `${scene.type}-${index}`;

          let sceneComponent: React.ReactNode = null;

          switch (scene.type) {
            case 'heroScreenshot':
              if (scene.assetIndex !== undefined && assets[scene.assetIndex]) {
                sceneComponent = (
                  <HeroScreenshot
                    assetUrl={assets[scene.assetIndex].url}
                    motion={scene.motion}
                    intensity={scene.intensity}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'carousel':
              if (scene.assetIndices) {
                const carouselAssets = scene.assetIndices
                  .map((idx) => assets[idx]?.url)
                  .filter(Boolean);
                sceneComponent = (
                  <Carousel
                    assetUrls={carouselAssets}
                    transitionStyle={scene.transitionStyle}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'splitShowcase':
              if (scene.assetIndices) {
                const showcaseAssets = scene.assetIndices
                  .map((idx) => assets[idx]?.url)
                  .filter(Boolean);
                sceneComponent = (
                  <SplitShowcase
                    assetUrls={showcaseAssets}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'zoomCut':
              if (scene.assetIndex !== undefined && assets[scene.assetIndex]) {
                sceneComponent = (
                  <ZoomCut
                    assetUrl={assets[scene.assetIndex].url}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'logoIntro':
              if (scene.logoAssetIndex !== undefined && assets[scene.logoAssetIndex]) {
                sceneComponent = (
                  <LogoIntro
                    logoUrl={assets[scene.logoAssetIndex].url}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'endCard':
              if (scene.logoAssetIndex !== undefined && assets[scene.logoAssetIndex]) {
                sceneComponent = (
                  <EndCard
                    logoUrl={assets[scene.logoAssetIndex].url}
                    text={scene.text}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;
          }

          if (!sceneComponent) return null;

          return (
            <Sequence key={key} from={startFrame} durationInFrames={scene.durationInFrames}>
              {sceneComponent}
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};
