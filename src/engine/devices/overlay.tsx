import React from "react";
import {interpolate, spring} from "remotion";
import {BOARD_PALETTE as P} from "./palette";
import {SPRINGS} from "./motion";

/**
 * Fixed-overlay devices. These live OUTSIDE the scene camera (MOTION_LANGUAGE: titles and punches
 * never sit inside a camera transform) and above the scene dim, below captions.
 */

export type Punch = {at: number; hold: number; text: string; sub?: string; stamp?: string; dy?: number};

/**
 * Number / question punch: one big word-locked statement over a dimmed scene ("90,000+", "24/7",
 * "WHO GOT IN?"). Punches must be disjoint in time; at most one shows. Use supported wording only.
 */
export const PunchOverlay: React.FC<{punches: Punch[]; f: number; defaultDy?: number; size?: number}> =
  ({punches, f, defaultDy = -140, size = 96}) => {
    const punch = punches.find((p) => f >= p.at && f < p.at + p.hold) || null;
    if (!punch) return null;
    const punchIn = spring({frame: f - punch.at, fps: 30, config: SPRINGS.snap});
    return (
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", pointerEvents: "none", transform: `translateY(${punch.dy ?? defaultDy}px)`}}>
        <div style={{transform: `scale(${0.6 + 0.4 * punchIn})`, opacity: punchIn, textAlign: "center"}}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: size, color: P.INK, letterSpacing: 4,
            textShadow: "0 6px 40px rgba(0,0,0,0.7)"}}>{punch.text}</div>
          {punch.sub && <div style={{fontFamily: "Arial,sans-serif", fontSize: 34, color: P.DIM, marginTop: 10, letterSpacing: 3}}>{punch.sub}</div>}
          {punch.stamp && (
            <div style={{display: "inline-block", marginTop: 18, transform: `rotate(-6deg) scale(${interpolate(f, [punch.at + 6, punch.at + 13], [1.7, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})})`,
              border: `6px solid ${P.RED}`, borderRadius: 8, padding: "4px 18px",
              fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 40, color: P.RED, letterSpacing: 4}}>{punch.stamp}</div>
          )}
        </div>
      </div>
    );
  };

/**
 * Dim track: a list of [fadeInStart, fullAt, fadeOutStart, clearAt, level] windows turned into one
 * piecewise-linear opacity curve. Windows must be in order and not overlap.
 */
export const dimTrack = (windows: [number, number, number, number, number][]) => {
  const xs: number[] = [], ys: number[] = [];
  for (const [a, b, c, d, lv] of windows) { xs.push(a, b, c, d); ys.push(0, lv, lv, 0); }
  return (f: number) => (xs.length ? interpolate(f, xs, ys, {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0);
};

/** Full-frame darkening layer (scene dim behind punches / emphasis). */
export const SceneDim: React.FC<{opacity: number; color?: string}> = ({opacity, color = "#050a08"}) => (
  <div style={{position: "absolute", inset: 0, background: color, opacity, pointerEvents: "none"}}/>
);
