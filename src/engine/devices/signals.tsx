import React from "react";
import {sPath, DrawOn, clamp01} from "../sketch";
import {cubicAt, type Cubic, type Link} from "./board";
import {BOARD_PALETTE as P} from "./palette";
import {Pin} from "./cards";

/**
 * Signal devices: things that travel or radiate. They turn a sentence about a mechanism into the
 * mechanism happening ("a plate is run" = a pulse leaving the photo and arriving at the database).
 * These are drawn metaphors, never simulated system UI.
 */

/** Glowing query pulse travelling a cubic string. Repeats every `period` frames, each trip lasting `dur`. Render inside an <svg>. */
export const QueryPulse: React.FC<{c: Cubic; f: number; start: number; period: number; dur: number; r?: number; color?: string}> =
  ({c, f, start, period, dur, r = 10, color = P.RED}) => {
    if (f < start) return null;
    const t = ((f - start) % period) / dur;
    if (t > 1) return null;
    const [x, y] = cubicAt(c, t);
    const env = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
    return (
      <g opacity={0.25 + 0.75 * env}>
        <circle cx={x} cy={y} r={r * 2.6} fill={color} opacity={0.18 * env}/>
        <circle cx={x} cy={y} r={r} fill={color}/>
        <circle cx={x} cy={y} r={r * 0.45} fill="#fff4ec"/>
      </g>
    );
  };

/** Alarm shockwave rings expanding from (x, y) on each frame in `times`. Render inside an <svg>. */
export const Shockwave: React.FC<{x: number; y: number; f: number; times: number[]; r0?: number; grow?: number; color?: string; life?: number}> =
  ({x, y, f, times, r0 = 160, grow = 520, color = P.RED, life = 32}) => (
    <g>
      {times.map((t) => {
        const p = (f - t) / life;
        if (p < 0 || p > 1) return null;
        const e = 1 - Math.pow(1 - p, 3);
        return <circle key={t} cx={x} cy={y} r={r0 + grow * e} fill="none" stroke={color}
          strokeWidth={10 * (1 - p) + 2} opacity={0.85 * (1 - p)}/>;
      })}
    </g>
  );

/**
 * The string network of a board: hand-drawn strings that draw on from card to card, their query
 * pulses, and pins at both ends. `glowOf(link)` returns 0..1 extra glow per string; `glow` is the
 * network-wide drop-shadow strength (0 = none).
 */
export const StringNetwork: React.FC<{links: Link[]; f: number; w: number; h: number;
  glow?: number; glowOf?: (l: Link) => number; color?: string; strokeW?: number; pulseR?: number}> =
  ({links, f, w, h, glow = 0, glowOf = () => 0, color = P.RED, strokeW = 6, pulseR = 9}) => (
    <>
      <svg width={w} height={h} style={{position: "absolute", inset: 0,
        filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px ${color})` : undefined}}>
        {links.map((l) => (
          <g key={l.id} opacity={0.85 + 0.15 * glowOf(l)}>
            <DrawOn paths={sPath(l.d, color, strokeW, l.seed)} p={clamp01((f - l.start) / l.dur)}/>
          </g>
        ))}
        {links.map((l) => l.pulse ? (
          <QueryPulse key={"p" + l.id} c={l.route} f={f} start={l.pulse.start} period={l.pulse.period} dur={l.pulse.dur} r={pulseR} color={color}/>
        ) : null)}
      </svg>
      {links.map((l) => (
        <React.Fragment key={"pin" + l.id}>
          <Pin x={l.a[0]} y={l.a[1]} t={l.start} f={f} color={color}/>
          <Pin x={l.b[0]} y={l.b[1]} t={l.start + l.dur} f={f} color={color}/>
        </React.Fragment>
      ))}
    </>
  );
