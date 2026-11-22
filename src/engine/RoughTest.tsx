import React from "react";
import {AbsoluteFill, staticFile, useCurrentFrame} from "remotion";
import rough from "roughjs";
import {evolvePath} from "@remotion/paths";

// PROTOTYPE (22 Nov 2026): hand-drawn self-drawing diagrams via rough.js (MIT).
// Seeded generator => identical geometry every frame (deterministic renders).
// Stroke outlines draw themselves on via stroke-dash animation; flat fills
// fade in after the outline lands. Candidate upgrade for the annotation layer.

const I = "#26352f", P = "#f1eddd", R = "#cb4a32";
const gen = rough.generator();
const RO = {roughness: 1.5, bowing: 1.8, seed: 11};

type RP = {d: string; stroke: string; w: number};

const strokePaths = (d: any, sw: number): RP[] =>
  gen.toPaths(d)
    .filter((p) => p.stroke && p.stroke !== "none" && p.d)
    .map((p) => ({d: p.d, stroke: p.stroke as string, w: p.strokeWidth || sw}));

const rRect = (x: number, y: number, w: number, h: number, stroke: string, sw: number): RP[] =>
  strokePaths(gen.rectangle(x, y, w, h, {...RO, stroke, strokeWidth: sw}), sw);

const rLine = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number): RP[] =>
  strokePaths(gen.line(x1, y1, x2, y2, {...RO, stroke, strokeWidth: sw}), sw);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const DrawOn: React.FC<{paths: RP[]; p: number; stagger?: number}> = ({paths, p, stagger = 0.4}) => {
  const n = paths.length;
  return (
    <g>
      {paths.map((s, i) => {
        const lp = clamp01((p - (i * stagger) / n) * (n / Math.max(0.35, 1 - stagger * (n - 1) / n)));
        const {strokeDasharray, strokeDashoffset} = evolvePath(clamp01(lp), s.d);
        return (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.stroke}
            strokeWidth={s.w}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </g>
  );
};

// Precompute all sketch geometry once (module level, seeded => deterministic).
const CAB = rRect(310, 470, 460, 730, I, 5);
const DRAWERS = [0, 1, 2, 3].map((i) => rRect(345, 505 + i * 170, 390, 140, I, 4));
const ARROW = [
  ...rLine(1010, 735, 800, 715, R, 6),
  ...rLine(800, 715, 828, 700, R, 6),
  ...rLine(800, 715, 826, 736, R, 6),
];
const RULE = rLine(42, 198, 42 + 300, 198, R, 4);
const LABELS = ["WANTED PERSONS", "MISSING PERSONS", "STOLEN VEHICLES", "WARRANTS"];

export const RoughTest: React.FC = () => {
  const f = useCurrentFrame();
  const u = clamp01(f / 88);
  const breathe = 1 + 0.004 * Math.sin(f / 9);
  const cabP = clamp01(u / 0.22);
  const cabFill = clamp01((cabP - 0.75) / 0.25);
  const arrowP = clamp01((u - 0.72) / 0.16);

  return (
    <AbsoluteFill style={{background: P}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{fontFamily: "Georgia,serif"}}>
        <g transform={`translate(540 960) scale(${breathe.toFixed(4)}) translate(-540 -960)`}>
          {/* kicker + headline */}
          <text x="42" y="92" fill={R} fontFamily="Arial,sans-serif" fontSize="26" letterSpacing="6" fontWeight="700">
            AMERICA'S CRIME DATABASE
          </text>
          <text x="42" y="165" fill={I} fontSize="72">Someone may be inside.</text>
          <DrawOn paths={RULE} p={clamp01(u / 0.18)} />

          {/* cabinet body: flat fill fades in, sketch outline draws on */}
          <rect x="310" y="470" width="460" height="730" rx="14" fill="#c0c5b1" opacity={cabFill} />
          <DrawOn paths={CAB} p={cabP} />

          {DRAWERS.map((paths, i) => {
            const dp = clamp01((u - 0.14 - i * 0.15) / 0.17);
            const labelOp = clamp01((dp - 0.8) / 0.2);
            const y = 505 + i * 170;
            return (
              <g key={i}>
                <rect x="345" y={y} width="390" height="140" rx="10" fill={P} opacity={clamp01((dp - 0.75) / 0.25)} />
                <DrawOn paths={paths} p={dp} />
                <text
                  x="540"
                  y={y + 82}
                  textAnchor="middle"
                  fill={I}
                  fontFamily="Arial,sans-serif"
                  fontWeight="700"
                  fontSize="30"
                  letterSpacing="2"
                  opacity={labelOp}
                >
                  {LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* hand-drawn arrow to the hot drawer */}
          <DrawOn paths={ARROW} p={arrowP} />

          <text x="540" y="1330" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">
            The FBI's own crime database, reported hacked. Nov 2026.
          </text>
        </g>
      </svg>
      <img
        src={staticFile("paper-tex.png")}
        style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", opacity: 0.5, pointerEvents: "none"}}
      />
    </AbsoluteFill>
  );
};
