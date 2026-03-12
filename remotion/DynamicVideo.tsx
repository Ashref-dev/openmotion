import { AbsoluteFill, Sequence } from 'remotion';
import { z } from 'zod';
import {
  HeroScreenshot,
  Carousel,
  SplitShowcase,
  ZoomCut,
  LogoIntro,
  EndCard,
  TextReveal,
  FeatureHighlight,
  GlowingCard,
  AnimatedBackground,
  ProductDemo,
  CTAButton,
  DeviceFrame,
  KineticText,
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
        'textReveal',
        'featureHighlight',
        'glowingCard',
        'animatedBackground',
        'productDemo',
        'ctaButton',
        'deviceFrame',
        'kineticText',
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
      textStyle: z.enum(['typewriter', 'fadeSlide', 'scale']).optional(),
      headline: z.string().optional(),
      tagline: z.string().optional(),
      bgStyle: z.enum(['gradient', 'particles', 'grid', 'waves']).optional(),
      features: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })).optional(),
      staggerDelay: z.number().optional(),
      showCursor: z.boolean().optional(),
      ctaText: z.string().optional(),
      ctaStyle: z.enum(['solid', 'outline', 'glow']).optional(),
      ctaColor: z.string().optional(),
      deviceType: z.enum(['browser', 'phone', 'tablet', 'laptop']).optional(),
      animationType: z.enum(['fadeUp', 'wave', 'bounce', 'rotate', 'scale']).optional(),
      highlightWords: z.array(z.string()).optional(),
      highlightColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      delayPerChar: z.number().optional(),
      staggerStart: z.number().optional(),
      startFrame: z.number().optional(),
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

export const DynamicVideo: React.FC<DynamicVideoProps> = (props) => {
  const { scenes, assets, primaryColor } = props;
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
                    tagline={scene.tagline}
                    ctaText={scene.ctaText}
                    ctaColor={scene.ctaColor}
                    backgroundColor={scene.backgroundColor}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'textReveal':
              sceneComponent = (
                <TextReveal
                  text={scene.text || ''}
                  style={scene.textStyle}
                  primaryColor={primaryColor}
                  durationInFrames={scene.durationInFrames}
                />
              );
              break;

            case 'featureHighlight':
              sceneComponent = (
                <FeatureHighlight
                  features={scene.features || []}
                  staggerDelay={scene.staggerDelay}
                  primaryColor={primaryColor}
                  durationInFrames={scene.durationInFrames}
                />
              );
              break;

            case 'glowingCard':
              if (scene.assetIndex !== undefined && assets[scene.assetIndex]) {
                sceneComponent = (
                  <GlowingCard
                    assetUrl={assets[scene.assetIndex].url}
                    title={scene.text}
                    primaryColor={primaryColor}
                    glowIntensity={scene.intensity}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'animatedBackground':
              sceneComponent = (
                <AnimatedBackground
                  primaryColor={primaryColor}
                  style={scene.bgStyle}
                  durationInFrames={scene.durationInFrames}
                />
              );
              break;

            case 'productDemo':
              if (scene.assetIndices) {
                const demoAssets = scene.assetIndices
                  .map((idx) => assets[idx]?.url)
                  .filter(Boolean);
                sceneComponent = (
                  <ProductDemo
                    assetUrls={demoAssets}
                    headline={scene.headline}
                    tagline={scene.tagline}
                    primaryColor={primaryColor}
                    showCursor={scene.showCursor}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'ctaButton':
              sceneComponent = (
                <CTAButton
                  text={scene.ctaText || 'Get Started'}
                  style={scene.ctaStyle}
                  primaryColor={scene.ctaColor || primaryColor}
                  durationInFrames={scene.durationInFrames}
                />
              );
              break;

            case 'deviceFrame':
              if (scene.assetIndex !== undefined && assets[scene.assetIndex]) {
                sceneComponent = (
                  <DeviceFrame
                    assetUrl={assets[scene.assetIndex].url}
                    deviceType={scene.deviceType || 'browser'}
                    primaryColor={scene.ctaColor || primaryColor}
                    durationInFrames={scene.durationInFrames}
                  />
                );
              }
              break;

            case 'kineticText':
              sceneComponent = (
                <KineticText
                  text={scene.text || ''}
                  animationType={scene.animationType}
                  highlightWords={scene.highlightWords}
                  highlightColor={scene.highlightColor || primaryColor}
                  delayPerChar={scene.delayPerChar}
                  staggerStart={scene.staggerStart || 0}
                />
              );
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
