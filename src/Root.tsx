import React from "react";
import { Composition } from "remotion";
import { StoryShort } from "./engine/StoryShort";
import { RoughTest } from "./engine/RoughTest";
import { UnfoldTest } from "./engine/UnfoldTest";
import { BoardTest } from "./engine/BoardTest";
import { BoardEpisode } from "./engine/BoardEpisode";

// Registered hand-authored compositions selectable per episode via episode.json
// "composition". Adding a new visual language for a future topic = build the
// component, register it here, opt the episode in. Unregistered episodes always
// take the StoryShort engine path.
const COMPOSITION_REGISTRY: Record<string, { component: React.FC<Record<string, unknown>> }> = {
  board: { component: BoardEpisode as unknown as React.FC<Record<string, unknown>> },
};
import { EPISODES } from "./episodes/registry";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((ep) => {
        // Per-episode composition override: a hand-authored composition registered
        // here renders under the episode's slug (so render.yml renders it with no
        // workflow change). Default path is the StoryShort engine; overrides are
        // opt-in per episode via episode.json "composition", never forced.
        const override = ep.composition ? COMPOSITION_REGISTRY[ep.composition] : undefined;
        if (ep.composition && !override) throw new Error(`unknown composition "${ep.composition}" for episode ${ep.slug}`);
        const Comp = (override?.component ?? StoryShort) as typeof StoryShort;
        const frames = override ? (ep.compositionFrames ?? ep.durationFrames) : ep.durationFrames;
        return (
        <Composition
          key={ep.slug}
          id={ep.slug}
          component={Comp}
          durationInFrames={frames}
          fps={ep.fps}
          width={1080}
          height={1920}
          defaultProps={{ spec: ep, captions: null, captionsApproximate: false }}
          calculateMetadata={({ props }) => ({
            durationInFrames: override ? frames : props.spec.durationFrames,
            fps: props.spec.fps,
          })}
        />
        );
      })}
      <Composition
        id="unfold-test"
        component={UnfoldTest}
        durationInFrames={415}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="board-ep2"
        component={BoardEpisode}
        durationInFrames={2014}
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
