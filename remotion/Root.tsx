import { Composition } from 'remotion';
import { DynamicVideo, DynamicVideoSchema } from './DynamicVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicVideo"
        component={DynamicVideo}
        schema={DynamicVideoSchema}
        defaultProps={{
          scenes: [],
          assets: [],
        }}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={300}
        calculateMetadata={({ props }) => {
          const enabledScenes = props.scenes.filter((s) => s.enabled);
          const totalDuration = enabledScenes.reduce(
            (sum, scene) => sum + scene.durationInFrames,
            0
          );
          return {
            durationInFrames: totalDuration || 30,
            props,
          };
        }}
      />
    </>
  );
};
