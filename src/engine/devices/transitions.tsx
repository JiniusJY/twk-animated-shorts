import React, {useMemo} from "react";
import {AbsoluteFill, random} from "remotion";
import type {TransitionPresentation, TransitionPresentationComponentProps} from "@remotion/transitions";
import {BOARD_PALETTE as P} from "./palette";

/**
 * Transition devices. Two kinds:
 *  - Presentations for <TransitionSeries> (@remotion/transitions): whipPan, zoomThrough, paperTear.
 *    Use them between separate scenes.
 *  - Hit wrappers for a continuous world (no scene change): MotionSmear, GlitchHit, FlashHit.
 *    Use them on camera travel or a word-locked impact inside one scene (e.g. the case board).
 * All are CSS/SVG only (no WebGL), so they render the same on local and CI renders.
 * Rules: CONTENT_SYSTEM section 6 (every transition is chosen to connect meanings, hard cut is
 * the default) and DEVICES.md for which sentence each one fits.
 */

// ---------------------------------------------------------------------------------------------
// Directional blur via an inline SVG filter (CSS blur() is round; whips need a streak).
// ---------------------------------------------------------------------------------------------
const SmearFilter: React.FC<{id: string; dx: number; dy: number}> = ({id, dx, dy}) => (
  <svg width={0} height={0} style={{position: "absolute"}}>
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={`${Math.max(0, dx).toFixed(2)} ${Math.max(0, dy).toFixed(2)}`}/>
    </filter>
  </svg>
);

/** Speed ramp used by whips: slow out, very fast middle, slow in. */
export const rampInOut = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
const rampSpeed = (t: number) => {
  const h = 0.002;
  return (rampInOut(Math.min(1, t + h)) - rampInOut(Math.max(0, t - h))) / (2 * h);
};

// ---------------------------------------------------------------------------------------------
// whipPan: both scenes travel together like one fast camera pan, streaked at peak speed.
// Fits: same energy, new subject ("and it's not the only one" -> next example).
// ---------------------------------------------------------------------------------------------
type WhipProps = {direction?: "left" | "right" | "up" | "down"; blur?: number};
const WhipPresentation: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({children, presentationProgress, presentationDirection, passedProps}) => {
  const {direction = "left", blur = 28} = passedProps;
  const id = useMemo(() => `whip-${presentationDirection}-${Math.round(random(direction + presentationDirection) * 1e9)}`, [direction, presentationDirection]);
  const e = rampInOut(presentationProgress);
  const horiz = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  // exiting scene leaves toward `direction`, entering arrives from the opposite side
  const off = presentationDirection === "exiting" ? sign * e * 100 : sign * (e - 1) * 100;
  const speed = rampSpeed(presentationProgress) / 3.2; // peak ~1
  const b = blur * Math.min(1, speed);
  return (
    <AbsoluteFill style={{transform: horiz ? `translateX(${off}%)` : `translateY(${off}%)`, filter: b > 0.3 ? `url(#${id})` : undefined}}>
      <SmearFilter id={id} dx={horiz ? b : 0} dy={horiz ? 0 : b}/>
      {children}
    </AbsoluteFill>
  );
};
export const whipPan = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({component: WhipPresentation, props});

// ---------------------------------------------------------------------------------------------
// zoomThrough: the camera dives INTO a point of the outgoing scene (a screen, a drawer, a word),
// and the next scene grows out of that point. Fits: scale change, "inside this there is...".
// ---------------------------------------------------------------------------------------------
type ZoomThroughProps = {x?: number; y?: number; depth?: number};
const ZoomThroughPresentation: React.FC<TransitionPresentationComponentProps<ZoomThroughProps>> = ({children, presentationProgress, presentationDirection, passedProps}) => {
  const {x = 540, y = 960, depth = 14} = passedProps;
  const t = presentationProgress;
  if (presentationDirection === "exiting") {
    const s = Math.pow(depth, Math.pow(t, 1.5));
    const op = t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.25);
    const blur = 10 * Math.max(0, (t - 0.4) / 0.6);
    return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${x}px ${y}px`, opacity: op, filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined}}>{children}</AbsoluteFill>;
  }
  // the next scene opens as a growing circle from the dive point (no framed picture-in-picture)
  const p = Math.max(0, (t - 0.5) / 0.5);
  const e = 1 - Math.pow(1 - p, 3);
  const r = p * p * (3 - 2 * p) * 2300;
  const s = 1.25 - 0.25 * e;
  if (p <= 0) return null;
  return <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${x}px ${y}px)`}}>
    <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill>
  </AbsoluteFill>;
};
export const zoomThrough = (props: ZoomThroughProps = {}): TransitionPresentation<ZoomThroughProps> => ({component: ZoomThroughPresentation, props});

// ---------------------------------------------------------------------------------------------
// paperTear: the outgoing scene is torn away along a ragged paper edge. Native to the
// paper/ink look. Fits: "but here's the other side", a turn in the story.
// ---------------------------------------------------------------------------------------------
type PaperTearProps = {seed?: number; paper?: string; width?: number; height?: number};
const tornEdge = (seed: number, h: number, n = 26) =>
  Array.from({length: n + 1}, (_, i) => [((random(`${seed}-${i}`) - 0.5) * 70), (i / n) * h] as [number, number]);
const PaperTearPresentation: React.FC<TransitionPresentationComponentProps<PaperTearProps>> = ({children, presentationProgress, presentationDirection, passedProps}) => {
  const {seed = 7, paper = P.CARD, width = 1080, height = 1920} = passedProps;
  const edge = useMemo(() => tornEdge(seed, height), [seed, height]);
  // The entering scene is drawn on top, so the tear lives on it: the edge sweeps right -> left and
  // the new scene shows everything right of the edge; the old scene underneath stays untouched.
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const e = 1 - Math.pow(1 - presentationProgress, 2.4);
  const ex = width + 120 - e * (width + 260);
  const pts = edge.map(([dx, y]) => `${(ex + dx).toFixed(1)}px ${y.toFixed(1)}px`);
  const clip = `polygon(${width + 200}px 0px, ${pts.join(", ")}, ${width + 200}px ${height}px)`;
  const band = edge.map(([dx, y]) => `${(ex + dx).toFixed(1)},${y.toFixed(1)}`).join(" ");
  const band2 = edge.map(([dx, y], i) => `${(ex + dx + 18 + 10 * random(`${seed}-b${i}`)).toFixed(1)},${y.toFixed(1)}`).reverse().join(" ");
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>
      <svg width={width} height={height} style={{position: "absolute", inset: 0, overflow: "visible"}}>
        <polygon points={`${band} ${band2}`} fill={paper} style={{filter: "drop-shadow(-8px 0 12px rgba(0,0,0,0.5))"}}/>
      </svg>
    </AbsoluteFill>
  );
};
export const paperTear = (props: PaperTearProps = {}): TransitionPresentation<PaperTearProps> => ({component: PaperTearPresentation, props});

// ---------------------------------------------------------------------------------------------
// Hits for a continuous world
// ---------------------------------------------------------------------------------------------

/**
 * MotionSmear: directional blur proportional to screen velocity. Feed it the camera's on-screen
 * speed in px/frame (e.g. from two cameraAt() samples). Still camera = no filter at all.
 */
export const MotionSmear: React.FC<{vx: number; vy: number; strength?: number; max?: number; id: string; children: React.ReactNode}> =
  ({vx, vy, strength = 0.35, max = 40, id, children}) => {
    const dx = Math.min(max, Math.abs(vx) * strength), dy = Math.min(max, Math.abs(vy) * strength);
    if (dx < 0.4 && dy < 0.4) return <>{children}</>;
    return (
      <div style={{position: "absolute", inset: 0, filter: `url(#${id})`}}>
        <SmearFilter id={id} dx={dx} dy={dy}/>
        {children}
      </div>
    );
  };

/**
 * GlitchHit: a few frames of RGB split and slice displacement starting at `at`. For hacks, breaches
 * and "the system broke" words. Renders the children 3x only while active, so keep hits short (<= 8 frames).
 */
export const GlitchHit: React.FC<{f: number; at: number; dur?: number; amp?: number; seed?: number; children: React.ReactNode}> =
  ({f, at, dur = 7, amp = 26, seed = 1, children}) => {
    const t = f - at;
    if (t < 0 || t >= dur) return <>{children}</>;
    const k = 1 - t / dur;
    const split = amp * k;
    const slices = Array.from({length: 7}, (_, i) => {
      const y0 = random(`${seed}-y${i}-${t}`) * 100, hh = 2 + random(`${seed}-h${i}-${t}`) * 9;
      const dx = (random(`${seed}-x${i}-${t}`) - 0.5) * 2 * amp * 2.2 * k;
      return {y0, hh, dx};
    });
    return (
      <div style={{position: "absolute", inset: 0}}>
        <div style={{position: "absolute", inset: 0}}>{children}</div>
        <div style={{position: "absolute", inset: 0, transform: `translateX(${-split}px)`, mixBlendMode: "screen", opacity: 0.55,
          filter: "sepia(1) saturate(6) hue-rotate(-50deg)"}}>{children}</div>
        <div style={{position: "absolute", inset: 0, transform: `translateX(${split}px)`, mixBlendMode: "screen", opacity: 0.55,
          filter: "sepia(1) saturate(6) hue-rotate(140deg)"}}>{children}</div>
        {slices.map((s, i) => (
          <div key={i} style={{position: "absolute", inset: 0, clipPath: `inset(${s.y0}% 0 ${Math.max(0, 100 - s.y0 - s.hh)}% 0)`,
            transform: `translateX(${s.dx}px)`}}>{children}</div>
        ))}
      </div>
    );
  };

/** FlashHit: a 2-4 frame flash (white or accent) with a soft falloff. For a reveal or an impact word. */
export const FlashHit: React.FC<{f: number; at: number; dur?: number; color?: string; peak?: number; x?: string; y?: string}> =
  ({f, at, dur = 5, color = "#fff6e8", peak = 0.85, x = "50%", y = "42%"}) => {
    const t = f - at;
    if (t < 0 || t >= dur) return null;
    const o = peak * Math.pow(1 - t / dur, 1.6);
    return <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: o,
      background: `radial-gradient(circle at ${x} ${y}, ${color} 0%, ${color} 25%, rgba(0,0,0,0) 75%)`, mixBlendMode: "screen"}}/>;
  };
