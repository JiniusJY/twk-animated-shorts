import React from "react";
import rough from "roughjs";
import {evolvePath} from "@remotion/paths";

/**
 * Hand-drawn self-drawing diagram toolkit (owner ask 22 Nov 2026: diagrams
 * that draw themselves as if a hand sketched them). rough.js (MIT) generates
 * sketchy SVG path data; a FIXED SEED per shape keeps geometry identical on
 * every frame, which is what makes renders deterministic. Draw-on is a
 * stroke-dash animation via @remotion/paths evolvePath.
 *
 * Convention: generate geometry at the ORIGIN and place it with a wrapping
 * <g transform="translate(x y)">, so one geometry serves every position and
 * caching stays trivial. Pass a distinct `seed` per distinct element or the
 * same wobble pattern repeats visibly (e.g. 21 identical drawers).
 */

const gen = rough.generator();
const RO = {roughness: 1.5, bowing: 1.8};

export type RP = {d: string; stroke: string; w: number};

const toRP = (d: unknown, sw: number): RP[] =>
  gen
    .toPaths(d as never)
    .filter((p) => p.stroke && p.stroke !== "none" && p.d)
    .map((p) => ({d: p.d, stroke: p.stroke as string, w: p.strokeWidth || sw}));

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Sketchy rect at origin (0,0)-(w,h). No rounded corners: hand-drawn reads better sharp. */
export const sRect = (w: number, h: number, stroke: string, sw: number, seed = 0): RP[] =>
  toRP(gen.rectangle(0, 0, w, h, {...RO, stroke, strokeWidth: sw, seed: 11 + seed}), sw);

export const sLine = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number, seed = 0): RP[] =>
  toRP(gen.line(x1, y1, x2, y2, {...RO, stroke, strokeWidth: sw, seed: 11 + seed}), sw);

export const sPath = (d: string, stroke: string, sw: number, seed = 0): RP[] =>
  toRP(gen.path(d, {...RO, stroke, strokeWidth: sw, seed: 11 + seed}), sw);

export const sEllipse = (cx: number, cy: number, w: number, h: number, stroke: string, sw: number, seed = 0): RP[] =>
  toRP(gen.ellipse(cx, cy, w, h, {...RO, stroke, strokeWidth: sw, seed: 11 + seed}), sw);

export const sCircle = (r: number, stroke: string, sw: number, seed = 0): RP[] =>
  sEllipse(0, 0, 2 * r, 2 * r, stroke, sw, seed);

/**
 * Renders sketch paths with a draw-on animation. p=0 nothing drawn, p=1 fully
 * drawn; sub-paths (rough emits ~2 strokes per shape) stagger slightly so the
 * double-stroke reads as a hand going over the line twice.
 */
export const DrawOn: React.FC<{paths: RP[]; p: number; stagger?: number}> = ({paths, p, stagger = 0.4}) => {
  const n = paths.length;
  return (
    <g>
      {paths.map((s, i) => {
        const lp = clamp01((p - (i * stagger) / Math.max(1, n)) * (n / Math.max(0.35, 1 - (stagger * (n - 1)) / Math.max(1, n))));
        const e = evolvePath(lp, s.d);
        return (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.stroke}
            strokeWidth={s.w}
            strokeLinecap="round"
            strokeDasharray={e.strokeDasharray}
            strokeDashoffset={e.strokeDashoffset}
          />
        );
      })}
    </g>
  );
};
