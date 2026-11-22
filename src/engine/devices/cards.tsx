import React from "react";
import {interpolate, spring, Img, staticFile} from "remotion";
import {clamp01} from "../sketch";
import {BOARD_PALETTE as P} from "./palette";
import {bob, sway, SPRINGS} from "./motion";

/**
 * Pinned-card devices: the physical paper objects of the case board.
 * Each card lands with a spring at `enter`, then idles with a slow sway/bob seeded by position.
 * Render cards from a layout rect (x, y, w, h) so strings and layout tests see the real size.
 */

/** Red map pin that pops in at frame t. */
export const Pin: React.FC<{x: number; y: number; t: number; f: number; color?: string}> = ({x, y, t, f, color = P.RED}) => {
  const p = spring({frame: Math.max(0, f - t), fps: 30, config: SPRINGS.pin});
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 11,
      background: color, boxShadow: "0 3px 8px rgba(0,0,0,0.5)", transform: `scale(${p})`}}/>
  );
};

/** Licensed photo pinned to the board, with a slow Ken Burns push. Credits belong in CREDITS.md, not on the card. */
export const PhotoCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; img: string;
  label?: string; credit?: string; w?: number; h?: number; imgH?: number}> =
  ({x, y, rot, f, enter, img, label, credit, w = 480, h, imgH = 300}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: SPRINGS.card});
  if (pop <= 0) return null;
  const kb = 1 + 0.09 * clamp01((f - enter) / 360);
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box",
      transform: `rotate(${rot + sway(f, x * 0.13) * pop}deg) scale(${0.55 + 0.45 * pop}) translateY(${40 * (1 - pop) + bob(f, y * 0.11) * pop}px)`,
      opacity: pop, background: P.CARD, padding: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      <div style={{width: w - 32, height: imgH, overflow: "hidden"}}>
        <Img src={staticFile(img)} style={{width: w - 32, height: imgH, objectFit: "cover",
          transform: `scale(${kb})`, filter: "contrast(1.08) saturate(0.82) sepia(0.14)"}}/>
      </div>
      {label && <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 28, color: P.PAPER_INK, marginTop: 10}}>{label}</div>}
      {credit && <div style={{fontFamily: "Arial,sans-serif", fontSize: 17, color: P.DIM, marginTop: 4}}>{credit}</div>}
    </div>
  );
};

/**
 * Paper card. Children are the content. Optional stamp slams in at `stampAt` with a shock wobble.
 * (Stamps carrying uncertainty labels are off by default under CONTENT_SYSTEM section 4.)
 */
export const PaperCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; w: number; h?: number;
  stamp?: string; stampColor?: string; stampAt?: number; children: React.ReactNode}> =
  ({x, y, rot, f, enter, w, h, stamp, stampColor = P.RED, stampAt, children}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: SPRINGS.card});
  if (pop <= 0) return null;
  const slammed = stampAt != null && f >= stampAt;
  const slam = slammed ? interpolate(f, [stampAt!, stampAt! + 7], [1.6, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const shock = slammed && f < stampAt! + 14 ? Math.sin((f - stampAt!) * 1.2) * 1.1 * (1 - (f - stampAt!) / 14) : 0;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box",
      transform: `rotate(${rot + (sway(f, x * 0.13) + shock) * pop}deg) scale(${0.55 + 0.45 * pop}) translateY(${bob(f, y * 0.11) * pop}px)`,
      opacity: pop, background: P.CARD, padding: "22px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      {children}
      {stamp && (stampAt == null || f >= stampAt) && (
        <div style={{position: "absolute", right: 14, bottom: 14, transform: `rotate(-9deg) scale(${slam})`,
          border: `5px solid ${stampColor}`, borderRadius: 6, padding: "2px 12px",
          fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 26, color: stampColor, letterSpacing: 2}}>{stamp}</div>
      )}
    </div>
  );
};

/** Lines of text that assemble one by one, each on its spoken word (`at` frame). */
export const LineAssemble: React.FC<{lines: [string, number][]; f: number; style?: React.CSSProperties; fade?: number; rise?: number}> =
  ({lines, f, style, fade = 10, rise = 14}) => (
    <div style={style}>
      {lines.map(([line, at]) => {
        const lp = clamp01((f - at) / fade);
        return <div key={line} style={{opacity: lp, transform: `translateY(${rise * (1 - lp)}px)`}}>{line}</div>;
      })}
    </div>
  );

/** Characters fade in one after another from frame `start`, `step` frames apart (a name being spelled out as it's said). */
export const LetterReveal: React.FC<{text: string; f: number; start: number; step: number; fade?: number}> =
  ({text, f, start, step, fade = 4}) => (
    <>
      {text.split("").map((ch, i) => (
        <span key={i} style={{opacity: clamp01((f - (start + i * step)) / fade)}}>{ch}</span>
      ))}
    </>
  );
