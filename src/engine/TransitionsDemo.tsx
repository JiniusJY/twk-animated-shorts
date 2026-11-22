import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {TransitionSeries, linearTiming, springTiming} from "@remotion/transitions";
import {wipe} from "@remotion/transitions/wipe";
import {clockWipe} from "@remotion/transitions/clock-wipe";
import {
  BOARD_PALETTE as P, makeBoard, parallaxLayer, PaperCard, StringNetwork, StatusDots, Shockwave,
  MotionSmear, GlitchHit, FlashHit, whipPan, zoomThrough, paperTear, kickEnvelope,
} from "./devices";

/**
 * Internal reel of the transition devices (not an episode; the on-screen labels are for review only).
 *  0-209   toy case board: whip-eased camera + MotionSmear, GlitchHit on frame 120, FlashHit on 168
 *  210-end TransitionSeries: whipPan, zoomThrough, paperTear, wipe, clockWipe
 */

const DW = 3600, DH = 1920;
const toy = makeBoard<"a" | "b" | "c" | "d">({
  cards: {a: {x: 300, y: 820, w: 520, h: 220}, b: {x: 1400, y: 600, w: 520, h: 220}, c: {x: 2500, y: 900, w: 520, h: 220}, d: {x: 1500, y: 1300, w: 420, h: 160}},
  enter: {a: 0, b: 20, c: 60, d: 140},
  links: [
    {id: "a-b", from: ["a", "right"], to: ["b", "left"], dur: 24, seed: 3, pulse: {delay: 2, period: 40, dur: 22}},
    {id: "b-c", from: ["b", "right"], to: ["c", "left"], dur: 24, seed: 4, pulse: {delay: 2, period: 40, dur: 22}},
    {id: "c-d", from: ["c", "bottom"], to: ["d", "right"], dur: 24, seed: 5},
  ],
  shots: [
    {id: "a", at: 0, cards: ["a"]},
    {id: "b", at: 45, cards: ["b"]},
    {id: "c", at: 95, cards: ["c"]},
    {id: "all", at: 150, cards: ["a", "b", "c", "d"]},
  ],
  safe: {x: 70, y: 360, w: 940, h: 1020},
  ease: "whip", trans: 16,
});
const kick = kickEnvelope([[120, 0.08], [168, 0.06]]);

const Label: React.FC<{text: string; sub?: string}> = ({text, sub}) => (
  <div style={{position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", pointerEvents: "none"}}>
    <div style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 64, color: P.INK, letterSpacing: 3}}>{text}</div>
    {sub && <div style={{fontFamily: "Arial,sans-serif", fontSize: 30, color: P.DIM, marginTop: 8}}>{sub}</div>}
  </div>
);

const BoardPart: React.FC = () => {
  const f = useCurrentFrame();
  const fr = toy.cameraAt(f);
  const zoom = fr.zoom * (1 + kick(f));
  const cam = {zoom, x: fr.cx - toy.FOCUS.x / zoom, y: fr.cy - toy.FOCUS.y / zoom};
  const {vx, vy} = toy.cameraVelocity(f);
  const card = (id: "a" | "b" | "c" | "d", text: string, rot: number) => {
    const r = toy.spec.cards[id];
    return (
      <PaperCard x={r.x} y={r.y} w={r.w} h={r.h} rot={rot} f={f} enter={toy.spec.enter[id]}>
        <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 54, color: P.PAPER_INK}}>{text}</div>
      </PaperCard>
    );
  };
  return (
    <AbsoluteFill style={{background: P.BOARD}}>
      <GlitchHit f={f} at={120} seed={2}>
        <MotionSmear vx={vx} vy={vy} id="demo-smear">
          <div style={parallaxLayer(DW, DH, cam, 1)}>
            <StringNetwork links={toy.links} f={f} w={DW} h={DH}/>
            {card("a", "Source", -2)}
            {card("b", "Relay", 2)}
            {card("c", "Database", -1)}
            {card("d", "You", 3)}
            <svg width={DW} height={DH} style={{position: "absolute", inset: 0, overflow: "visible"}}>
              <Shockwave x={2760} y={1010} f={f} times={[120, 128]} r0={260} grow={520}/>
            </svg>
            <StatusDots rect={{x: 2520, y: 1160, w: 500, h: 40}} f={f} enter={70} count={10} cols={10}/>
          </div>
        </MotionSmear>
      </GlitchHit>
      <FlashHit f={f} at={168}/>
      <Label text={f < 115 ? "WHIP CAMERA + SMEAR" : f < 160 ? "GLITCH HIT" : "FLASH HIT + PULL WIDE"} sub="continuous board, no scene cut"/>
    </AbsoluteFill>
  );
};

const Scene: React.FC<{bg: string; title: string; sub: string; big: string; ink?: string}> = ({bg, title, sub, big, ink = P.PAPER_INK}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: bg}}>
      <div style={{position: "absolute", left: 140, right: 140, top: 640, height: 520}}>
        <PaperCard x={0} y={0} w={800} h={520} rot={-1.5} f={f} enter={-30}>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 150, color: ink, lineHeight: 1}}>{big}</div>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 34, color: P.DIM, marginTop: 30, letterSpacing: 2}}>{sub}</div>
          <svg width={200} height={200} style={{position: "absolute", right: 40, bottom: 40}}>
            <circle cx={100} cy={100} r={70} fill="none" stroke={P.RED} strokeWidth={10}/>
            <circle cx={100} cy={100} r={18} fill={P.RED}/>
          </svg>
        </PaperCard>
      </div>
      <Label text={title}/>
    </AbsoluteFill>
  );
};

const T = 16;
export const TRANSITIONS_DEMO_FRAMES = 210 + 6 * 48 - 4 * T - 22;

export const TransitionsDemo: React.FC = () => (
  <AbsoluteFill style={{background: P.BOARD}}>
    <Sequence durationInFrames={210}><BoardPart/></Sequence>
    <Sequence from={210}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg={P.BOARD} title="WHIP PAN" sub="same energy, new subject" big="01"/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan({direction: "left"})} timing={linearTiming({durationInFrames: T})}/>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg="#1d1a16" title="ZOOM THROUGH" sub="dive into a detail" big="02"/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomThrough({x: 790, y: 1060})} timing={linearTiming({durationInFrames: 22})}/>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg="#22170f" title="PAPER TEAR" sub="a turn in the story" big="03"/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={paperTear({seed: 11})} timing={linearTiming({durationInFrames: T})}/>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg="#15191f" title="WIPE" sub="library: @remotion/transitions" big="04"/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: "from-left"})} timing={springTiming({config: {damping: 200}, durationInFrames: T})}/>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg="#1a1f15" title="CLOCK WIPE" sub="time passing" big="05"/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({width: 1080, height: 1920})} timing={linearTiming({durationInFrames: T})}/>
        <TransitionSeries.Sequence durationInFrames={48}><Scene bg={P.BOARD} title="END" sub="hard cut stays the default" big="06"/></TransitionSeries.Sequence>
      </TransitionSeries>
    </Sequence>
  </AbsoluteFill>
);
