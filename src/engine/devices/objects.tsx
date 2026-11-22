import React from "react";
import {spring} from "remotion";
import {sPath, sRect, sLine, DrawOn, clamp01} from "../sketch";
import {BOARD_PALETTE as P} from "./palette";
import type {Rect} from "./board";

/**
 * Story-object devices from ep2. Each one demonstrates a sentence instead of labelling it:
 * a drawer lights as its category is named, a terminal types its status, a lock hangs open.
 */

export type DrawerHighlight = {i: number; at: number; label: string};

/**
 * Drawer grid (filing cabinet). Drawers flip open in a stagger from `openAt`. Each highlight
 * lights one drawer on its spoken word and holds until the next one (or `until`).
 * Put it inside a PaperCard; pair it with <CategoryChip> to name the lit drawer.
 */
export const DrawerGrid: React.FC<{f: number; count: number; cols: number; openAt: number; stagger?: number;
  highlights: DrawerHighlight[]; until: number; accentCount?: number; title?: string}> =
  ({f, count, cols, openAt, stagger = 6, highlights, until, accentCount = 5, title}) => {
    const hl = activeHighlight(highlights, f, until);
    const drawerOn = (i: number) => clamp01((f - (openAt + i * stagger)) / 10);
    return (
      <>
        {title && <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: P.DIM, letterSpacing: 2, marginBottom: 12}}>{title}</div>}
        <div style={{display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8}}>
          {Array.from({length: count}, (_, i) => {
            const on = hl && hl.i === i;
            const seen = highlights.some((d) => d.i === i && f >= d.at);
            const hp = on ? spring({frame: f - hl!.at, fps: 30, config: {damping: 10, stiffness: 280, mass: 0.5}}) : 0;
            return (
              <div key={i} style={{height: 52, background: on ? P.RED : seen ? "#e3b9a6" : i < accentCount ? "#d8cba8" : "#c9c2ab",
                border: `2px solid ${P.PAPER_INK}`, opacity: drawerOn(i),
                transform: `rotateX(${(1 - drawerOn(i)) * 70}deg) translateY(${-14 * hp}px) scale(${1 + 0.22 * hp})`,
                boxShadow: on ? "0 10px 24px rgba(0,0,0,0.45)" : undefined, position: "relative", zIndex: on ? 2 : 1,
                display: "flex", alignItems: "center", justifyContent: "center"}}>
                <div style={{width: 22, height: 6, borderRadius: 3, background: on ? P.CARD : P.PAPER_INK, opacity: 0.8}}/>
              </div>
            );
          })}
        </div>
      </>
    );
  };

/** The highlight active at frame f (latest one started, before `until`), or null. */
export const activeHighlight = (highlights: DrawerHighlight[], f: number, until: number) =>
  [...highlights].reverse().find((d) => f >= d.at && f < until) || null;

/** Dark chip naming the thing just spoken ("STOLEN CARS"). Swaps with each highlight, fades out at `outAt`. */
export const CategoryChip: React.FC<{rect: Rect; f: number; highlights: DrawerHighlight[]; until: number; outAt: number}> =
  ({rect, f, highlights, until, outAt}) => {
    const hl = activeHighlight(highlights, f, until);
    if (!hl) return null;
    const cp = spring({frame: f - hl.at, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}});
    const out = clamp01((f - outAt) / 10);
    return (
      <div key={hl.label} style={{position: "absolute", left: rect.x, top: rect.y, height: rect.h, boxSizing: "border-box", whiteSpace: "nowrap",
        background: P.NIGHT, border: `3px solid ${P.RED}`, padding: "14px 26px", borderRadius: 6,
        fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: 3, color: P.CARD,
        boxShadow: "0 16px 40px rgba(0,0,0,0.55)", opacity: cp * (1 - out),
        transform: `translateY(${24 * (1 - cp)}px) rotate(-1.5deg)`}}>
        <span style={{color: P.RED, marginRight: 16}}>&#9679;</span>{hl.label}
      </div>
    );
  };

/**
 * Terminal that types a status line from `typeAt`, with a blinking cursor, a dim sub-line and an
 * optional counter that rolls to supported wording (e.g. 0 -> "90,000+"). Drawn as a metaphor:
 * never a fake system readout of the event itself (MOTION_LANGUAGE honesty rules).
 */
export const Terminal: React.FC<{rect: Rect; f: number; enter: number; typed: string; typeAt: number; typeDur?: number;
  subline?: string; counter?: {from: number; to: number; at: number; dur: number; final: string}}> =
  ({rect, f, enter, typed, typeAt, typeDur = 40, subline, counter}) => {
    const typedN = Math.floor(clamp01((f - typeAt) / typeDur) * typed.length);
    const enterP = clamp01((f - enter) / 12);
    let count = "";
    if (counter) {
      const v = Math.floor(counter.from + (counter.to - counter.from) * clamp01((f - counter.at) / counter.dur));
      count = v >= counter.to ? counter.final : f >= counter.at ? v.toLocaleString("en-US") : "";
    }
    return (
      <div style={{position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxSizing: "border-box",
        background: P.NIGHT, border: "3px solid #33503f", borderRadius: 10, padding: "26px 30px",
        boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
        opacity: enterP, transform: `translateY(${26 * (1 - enterP)}px)`}}>
        <div style={{fontFamily: "monospace", fontSize: 30, color: P.GRN}}>
          {typed.slice(0, typedN)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>&#9608;</span>
        </div>
        {subline && <div style={{fontFamily: "monospace", fontSize: 26, color: "#4a7a5f", marginTop: 18}}>&gt; {subline}</div>}
        {counter && <div style={{fontFamily: "monospace", fontSize: 62, fontWeight: 700, color: P.GRN, marginTop: 4}}>{count}</div>}
      </div>
    );
  };

/** Grid of status lights that switch on one after another from `enter`. */
export const StatusDots: React.FC<{rect: Rect; f: number; enter: number; count: number; cols: number; step?: number; pitch?: number; color?: string}> =
  ({rect, f, enter, count, cols, step = 2.4, pitch = 46, color = P.GRN}) => (
    <>
      {Array.from({length: count}, (_, i) => {
        const on = f > enter + i * step;
        return <div key={"d" + i} style={{position: "absolute", left: rect.x + (i % cols) * pitch, top: rect.y + Math.floor(i / cols) * pitch,
          width: 18, height: 18, borderRadius: 9, background: on ? color : "#2a3a30",
          boxShadow: on ? "0 0 10px rgba(125,216,160,0.7)" : undefined}}/>;
      })}
    </>
  );

/** Hand-drawn strike-through: two red strokes drawn on from `at` across a w x h label. Render inside a positioned card. */
export const Strike: React.FC<{f: number; at: number; w?: number; color?: string}> = ({f, at, w = 280, color = P.RED}) => (
  <svg width={w} height="60" style={{position: "absolute", left: 10, top: 10, overflow: "visible"}}>
    <DrawOn paths={sLine(10, 30, w - 20, 30, color, 9, 55)} p={clamp01((f - at) / 8)}/>
    <DrawOn paths={sLine(10, 50, w - 20, 10, color, 9, 56)} p={clamp01((f - (at + 6)) / 8)}/>
  </svg>
);

const LOCK_BODY = sRect(110, 84, P.RED, 7, 31);
const LOCK_SHACKLE = sPath("M-38 -20 L-38 -52 A38 38 0 0 1 38 -52 L38 -20", P.RED, 7, 32);

/**
 * Drawn padlock that draws on from `drawAt`, then its shackle swings open on `openAt`
 * ("a door that can't be locked"). Drawn metaphor only: never show traffic passing through it.
 * Render inside a positioned box; (cx, cy) is the lock centre within it.
 */
export const Padlock: React.FC<{f: number; drawAt: number; openAt: number; size?: number; cx?: number; cy?: number; scale?: number}> =
  ({f, drawAt, openAt, size = 260, cx = 130, cy = 150, scale = 1.15}) => {
    if (f < drawAt) return null;
    const lockP = clamp01((f - drawAt) / 16);
    const pop = spring({frame: Math.max(0, f - openAt), fps: 30, config: {damping: 12, stiffness: 200, mass: 0.8}});
    const shackleRot = Math.max(-40, Math.min(0, ((pop - 0.55) / 0.45) * -40));
    return (
      <svg width={size} height={size} style={{position: "absolute", left: 0, top: 0, overflow: "visible", opacity: lockP}}>
        <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
          <g transform={`rotate(${shackleRot} -38 -20)`}><DrawOn paths={LOCK_SHACKLE} p={lockP}/></g>
          <g transform="translate(-55 -20)"><DrawOn paths={LOCK_BODY} p={lockP}/></g>
        </g>
      </svg>
    );
  };

/** Small paper node with a drawn building icon (an agency, an office, a branch). Pops in with `p` (0..1). */
export const NodeBox: React.FC<{rect: Rect; p: number}> = ({rect, p}) => {
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: rect.x, top: rect.y, boxSizing: "border-box",
      width: rect.w, height: rect.h, background: P.CARD, border: `3px solid ${P.PAPER_INK}`,
      transform: `scale(${0.4 + 0.6 * p})`, opacity: p, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center"}}>
      <svg width="40" height="34" viewBox="0 0 40 34">
        <path d="M4 14 L20 4 L36 14 Z M8 16 V28 M16 16 V28 M24 16 V28 M32 16 V28 M4 30 H36" fill="none" stroke={P.PAPER_INK} strokeWidth="3"/>
      </svg>
    </div>
  );
};

/**
 * Face-down card that cracks on `crackAt`, then flips over (`flipAt`..`flipAt+flipDur`) to reveal a
 * word letter by letter. The hook device: the story's subject is hidden, broken into, then named.
 */
export const FlipRevealCard: React.FC<{rect: Rect; f: number; word: string; crackAt: number; flipAt: number; flipDur?: number;
  letterAt: number; letterStep?: number; enterLead?: number; fontSize?: number}> =
  ({rect, f, word, crackAt, flipAt, flipDur = 25, letterAt, letterStep = 3, enterLead = 8, fontSize = 58}) => {
    const flip = clamp01((f - flipAt) / flipDur);
    const pop = spring({frame: f + enterLead, fps: 30, config: {damping: 13, stiffness: 200, mass: 0.8}});
    const crackP = clamp01((f - crackAt) / 6);
    return (
      <div style={{position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxSizing: "border-box",
        transform: `scale(${0.6 + 0.4 * pop}) rotate(${-3 + flip * 3}deg) scaleX(${Math.abs(1 - flip * 2)})`,
        opacity: pop, background: flip < 0.5 ? "#232f28" : P.CARD,
        border: `6px solid ${flip < 0.5 ? P.RED : P.PAPER_INK}`, boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center"}}>
        {flip < 0.5 && crackP > 0 && (
          <svg width={rect.w} height={rect.h + 80} style={{position: "absolute", left: -6, top: -6, overflow: "visible"}}>
            <g transform={`scale(${rect.w / 300} ${rect.h / 380})`}>
              <DrawOn paths={sPath("M150 -10 L128 90 L176 150 L120 230 L168 300 L140 390", P.RED, 8, 70)} p={crackP}/>
              <DrawOn paths={sPath("M176 150 L250 175 M120 230 L50 250", P.RED, 6, 71)} p={clamp01((f - (crackAt + 4)) / 6)}/>
            </g>
          </svg>
        )}
        {flip >= 0.5 && (
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize, color: P.PAPER_INK, letterSpacing: 5}}>
            {word.split("").map((ch, i) => {
              const lp = clamp01((f - (letterAt + i * letterStep)) / 6);
              return <span key={i} style={{display: "inline-block", opacity: lp, transform: `translateY(${10 * (1 - lp)}px)`}}>{ch}</span>;
            })}
          </span>
        )}
      </div>
    );
  };
