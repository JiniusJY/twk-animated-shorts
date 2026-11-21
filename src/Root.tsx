import React from "react";
import { Composition } from "remotion";
import { StoryShort } from "./engine/StoryShort";
import { EPISODES } from "./episodes/registry";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((ep) => (
        <Composition
          key={ep.slug}
          id={ep.slug}
          component={StoryShort}
          durationInFrames={ep.durationFrames}
          fps={ep.fps}
          width={1080}
          height={1920}
          defaultProps={{ spec: ep, captions: null, captionsApproximate: false }}
          calculateMetadata={({ props }) => ({
            durationInFrames: props.spec.durationFrames,
            fps: props.spec.fps,
          })}
        />
      ))}
    </>
  );
};
