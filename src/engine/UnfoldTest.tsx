import React from "react";
import {useCurrentFrame, interpolate, spring} from "remotion";
import {getPointAtLength, getLength} from "@remotion/paths";
import {sCircle, sRect, sLine, sEllipse, DrawOn, clamp01} from "./sketch";

/**
 * UNFOLD TEST - representative motion-design probe for the ep2 upgrade.
 * One continuous 415-frame sequence over the real VO slice
 * ("And it never closes ... a door the FBI can't lock.", 24.68-38.52s of the
 * ep2 take = 13.84s). Demonstrates: continuous camera, parallax depth,
 * object transformation (dimension ring -> clock -> 18-door network),
 * physics entrances, pencil-on-tip drawing, beat-synced SFX markers.
 *
 * Camera/VO phase map (fps 30, f=0 at VO 24.68s):
 *   A   0-70   core cylinder self-draws, camera 1.45 -> 1.2
 *   B  70-190  ring draws (pencil rides the tip), 12 ticks pop, hands sweep,
 *              "24/7" springs at f~112 (VO "24-7" at +3.7s)
 *   C 190-225  "That's the weakness." beat: ring pulse, riser
 *   D 205-380  expansion r 280->380, ticks -> doors, spokes snap in
 *   E 380-415  3 hot doors slam, dim + push toward the hot door
 */

const I = "#26352f", P = "#f1eddd", R = "#cb4a32", G = "#467765";

const RING = sCircle(280, I, 6, 40);
const CORE = [
  ...sEllipse(0, -72, 150, 44, I, 5, 60),
  ...sLine(-75, -72, -75, 72, I, 5, 61),
  ...sLine(75, -72, 75, 72, I, 5, 62),
  ...sEllipse(0, 72, 150, 44, I, 5, 63),
];
const DOOR = sRect(46, 72, I, 4, 7);
const DOOR_HOT = sRect(46, 72, R, 4.5, 8);

const Pencil: React.FC<{x: number; y: number; rot: number; o: number}> = ({x, y, rot, o}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
    <rect x="-7" y="-100" width="14" height="78" fill="#d8a24a" stroke={I} strokeWidth="2.5"/>
    <rect x="-7" y="-100" width="14" height="10" fill={R} stroke={I} strokeWidth="2.5"/>
    <path d="M-7 -22L0 0L7 -22Z" fill="#e8d9b8" stroke={I} strokeWidth="2.5"/>
    <path d="M-2.6 -7L0 0L2.6 -7Z" fill={I}/>
  </g>
);

export const UnfoldTest: React.FC = () => {
  const f = useCurrentFrame();

  // ---- camera rig ----
  const cam = interpolate(f, [0, 70, 190, 380, 415], [1.45, 1.2, 1.0, 1.1, 1.34], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camX = interpolate(f, [380, 415], [0, 150], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camY = interpolate(f, [380, 415], [0, 240], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const bgCam = 1 + (cam - 1) * 0.55; // parallax: background moves less

  // ---- phase progress ----
  const coreP = clamp01(f / 55);
  const ringP = clamp01((f - 70) / 85);
  const ticksLive = Math.min(12, Math.floor((f - 95) / 7) + 1);
  const sweep = f * 14; // time-lapse hands
  const pop247 = spring({frame: Math.max(0, f - 112), fps: 30, config: {damping: 10, stiffness: 200, mass: 0.7}});
  const pulse = f >= 185 && f < 215 ? 1 + Math.sin((f - 185) / 30 * Math.PI) * 0.06 : 1;
  const expandP = clamp01((f - 205) / 90);
  const easeExp = 1 - Math.pow(1 - expandP, 3);
  const ringR = 280 + 100 * easeExp;
  const doorsLive = Math.min(18, Math.floor((f - 215) / 8) + 1);
  const dim = interpolate(f, [385, 410], [0, 0.55], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // pencil tip on the ring path while it draws
  const ringLen = RING.length ? getLength(RING[0].d) : 0;
  const tip = ringLen && ringP > 0 && ringP < 1 ? getPointAtLength(RING[0].d, ringP * ringLen) : null;

  const doorPos = (i: number, r: number) => {
    const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
    return {x: Math.cos(a) * r, y: Math.sin(a) * r * 1.04, deg: (a * 180) / Math.PI + 90};
  };
  const hot = [2, 7, 12];
  const hotOpen = (i: number) => {
    const k = hot.indexOf(i);
    if (k < 0) return 0;
    return spring({frame: Math.max(0, f - (380 + k * 10)), fps: 30, config: {damping: 11, stiffness: 260, mass: 0.6}});
  };

  return (
    <div style={{position: "absolute", inset: 0, background: P, overflow: "hidden"}}>
      {/* parallax blueprint grid */}
      <div style={{position: "absolute", inset: -200, transform: `scale(${bgCam}) translate(${-camX * 0.55}px, ${-camY * 0.55}px)`, opacity: 0.5}}>
        <svg width="1480" height="2320">
          {Array.from({length: 15}, (_, i) => <line key={"v" + i} x1={i * 100} y1="0" x2={i * 100} y2="2320" stroke={I} strokeWidth="1" opacity="0.07"/>)}
          {Array.from({length: 24}, (_, i) => <line key={"h" + i} x1="0" y1={i * 100} x2="1480" y2={i * 100} stroke={I} strokeWidth="1" opacity="0.07"/>)}
        </svg>
      </div>

      <div style={{position: "absolute", inset: 0, transform: `scale(${cam * pulse}) translate(${-camX}px, ${-camY}px)`, transformOrigin: "540px 810px"}}>
        <svg width="1080" height="1920" style={{position: "absolute", inset: 0}}>
          {/* kicker + headline */}
          <text x="64" y="120" fill={R} fontFamily="Arial,sans-serif" fontSize="24" letterSpacing="4" opacity={clamp01(f / 20)}>AMERICA'S CRIME DATABASE</text>
          {f < 200 ? (
            <text x="64" y="205" fill={I} fontFamily="Georgia,serif" fontSize="72" fontWeight="700" opacity={clamp01((f - 10) / 20)}>It never closes.</text>
          ) : (
            <text x="64" y="205" fill={I} fontFamily="Georgia,serif" fontSize="64" fontWeight="700" opacity={clamp01((f - 232) / 15)}>Ninety thousand doors.</text>
          )}
          <rect x="64" y="228" width={340 * clamp01((f - 16) / 25)} height="6" fill={R}/>

          <g transform="translate(540 810)">
            {/* core cylinder */}
            <DrawOn paths={CORE} p={coreP}/>
            {coreP > 0.9 && <text x="0" y="12" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="34" opacity={clamp01((f - 60) / 15)}>NCIC</text>}

            {/* clock ticks that become doors */}
            {Array.from({length: 18}, (_, i) => {
              if (i >= 12 && f < 205) return null; // doors 12-17 appear in phase D
              const isDoorEra = f >= 205;
              const live = i < 12 ? i < ticksLive : i < doorsLive;
              if (!live) return null;
              const d = doorPos(i, isDoorEra ? ringR : 280);
              const doorIn = i < 12
                ? (isDoorEra ? spring({frame: Math.max(0, f - (215 + i * 4)), fps: 30, config: {damping: 12, stiffness: 240, mass: 0.55}}) : 0)
                : spring({frame: Math.max(0, f - (215 + i * 8)), fps: 30, config: {damping: 12, stiffness: 240, mass: 0.55}});
              const isHot = hot.includes(i);
              const o = hotOpen(i);
              if (!isDoorEra) {
                // clock tick
                return <line key={i} x1={d.x * 0.93} y1={d.y * 0.93} x2={d.x} y2={d.y} stroke={I} strokeWidth="6" opacity={clamp01((f - (95 + i * 7)) / 5)}/>;
              }
              const spokeP = clamp01((f - (220 + i * 7)) / 14);
              return (
                <g key={i}>
                  <line x1="0" y1="0" x2={d.x * spokeP} y2={d.y * spokeP} stroke={o > 0.3 ? R : I} strokeWidth={o > 0.3 ? 5 : 2.5} opacity={o > 0.3 ? 0.95 : 0.45}/>
                  <g transform={`translate(${d.x} ${d.y}) scale(${0.3 + 0.7 * doorIn})`} opacity={doorIn}>
                    <g transform={`translate(-23 -36)`}>
                      <DrawOn paths={isHot || o > 0 ? DOOR_HOT : DOOR} p={1}/>
                      <circle cx="8" cy="0" r="3.5" fill={o > 0.3 ? R : I}/>
                      {/* door slams open: panel swings */}
                      <rect x="4" y="4" width={38 * (1 - o * 0.85)} height="64" fill={o > 0.3 ? R : "#d4d2bf"} opacity={o > 0.05 ? 0.9 : 0.55}/>
                    </g>
                  </g>
                </g>
              );
            })}

            {/* ring: draws as clock face, then expands into the network ring */}
            <g opacity={f < 205 ? 1 : 0.25}>
              <g transform={`scale(${f < 205 ? 1 : ringR / 280})`}>
                <DrawOn paths={RING} p={ringP}/>
              </g>
            </g>

            {/* clock hands (phase B only) */}
            {ringP > 0.6 && f < 235 && (
              <g opacity={clamp01((235 - f) / 20)}>
                <g transform={`rotate(${sweep})`}><path d="M0 -100V-185" stroke={I} strokeWidth="13" strokeLinecap="round"/></g>
                <g transform={`rotate(${sweep / 12})`}><path d="M88.7 46.3L133 69.4" stroke={R} strokeWidth="16" strokeLinecap="round"/></g>
              </g>
            )}

            {/* pencil riding the draw tip */}
            {tip && <Pencil x={tip.x} y={tip.y} rot={(ringP * 360 + 90) % 360} o={clamp01((f - 72) / 8) * clamp01((153 - f) / 8)}/>}
          </g>

          {/* 24/7 spring */}
          {f >= 108 && f < 235 && (
            <text x="540" y="1210" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="130" opacity={clamp01((235 - f) / 15)} transform={`translate(0 ${30 * (1 - pop247)}) scale(${0.6 + 0.4 * pop247})`} style={{transformOrigin: "540px 1210px"}}>24/7</text>
          )}

          {/* phase D captions-as-graphics */}
          {f >= 300 && (
            <text x="540" y="1450" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="40" opacity={clamp01((f - 300) / 15)}>connected to 90,000+ criminal-justice agencies</text>
          )}
          {f >= 330 && (
            <text x="540" y="1525" textAnchor="middle" fill={R} fontFamily="Georgia,serif" fontStyle="italic" fontSize="48" opacity={clamp01((f - 330) / 15)}>every connection is a way in</text>
          )}
        </svg>
      </div>

      {/* dim + red glow for the hot-door push */}
      <div style={{position: "absolute", inset: 0, background: "#0c1512", opacity: dim, pointerEvents: "none"}}/>
      <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at 68% 40%, ${R}55, transparent 55%)`, opacity: dim * 1.4, pointerEvents: "none"}}/>
    </div>
  );
};
