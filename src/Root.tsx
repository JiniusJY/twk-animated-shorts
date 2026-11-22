import React from "react";
import { Composition } from "remotion";
import { StoryShort } from "./engine/StoryShort";
import { RoughTest } from "./engine/RoughTest";
import { UnfoldTest } from "./engine/UnfoldTest";
import { BoardTest } from "./engine/BoardTest";
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
      <Composition
        id="unfold-test"
        component={UnfoldTest}
        durationInFrames={415}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="board-test"
        component={BoardTest}
        durationInFrames={415}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="rough-test"
        component={RoughTest}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
