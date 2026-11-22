import React from "react";
import {useCurrentFrame, interpolate, spring, Img, staticFile} from "remotion";
import {sPath, sRect, sLine, DrawOn, clamp01} from "./sketch";
import {Captions} from "./Captions";
import ep2Words from "./ep2-words.json";
import {EndCard} from "./EndCard";
import {CARDS, HUB, W, H, BUILT_LINKS, linkById, reverseCubic, ringBoxes, cubicAt, type Cubic} from "./boardLayout";

/**
 * BOARD EPISODE v3 - "demonstrate, don't describe" rebuild (docs/EP2_REDESIGN.md).
 * The case board is a LIVING SYSTEM: query pulses travel the strings as the VO
 * names the mechanism. Breach stays editorial (origin/path/method unknown).
 * Beat times derive from the SHIPPED voice take's words.json (run 45010023328, stats-omitted VO):
 *   HOOK     0-110    "Someone may have just broken into..." (0.22-3.52s)
 *   SYSTEM   110-423  traffic stop 6.74s, NCIC name 11.28s
 *   DRAWERS  423-678  cabinet 14.52s, 22 drawers 15.28s (record-count/checks stats omitted: unverifiable at FBI primary source)
 *   ALWAYSON 678-895  never closes 22.64s, jan 1967 24.12s, business hours 28.72s
 *   WEAKNESS 895-1100 weakness 29.84s, 90,000 31.5s, can't lock 35.56s
 *   BREACH   1100-1375 AP 36.7s, apparent breach 39.34s, don't know 42.0s
 *   SECOND   1375-1624 second time 45.88s, gang 47.5s, unpatched 52.6s
 *   STAKES   1624-1851 handcuffs 57.28s, five-alarm 60.2s
 *   OUT      1851-2014 follow 61.7s, VO ends 63.58s
 * Rules: docs/MOTION_LANGUAGE.md (safe fixed overlay; supported numbers only;
 * drawn metaphors, no simulated system states; attribution labels stay).
 */

const INK = "#e8e2d2", RED = "#e0492e", GRN = "#7dd8a0", BOARD = "#16211c", CARD = "#f1eddd", DIM = "#8a8574";
// All card positions/sizes and every string come from ./boardLayout (single source of truth).
const TRAFFIC = CARDS.photo, CABINET = CARDS.cabinet, TERMR = CARDS.terminal, APCARD = CARDS.ap, SECOND = CARDS.second;

const sway = (f: number, seed: number) => Math.sin((f + seed) / 55) * 0.35;
const bob = (f: number, seed: number) => Math.sin((f + seed) / 67) * 2.5;

// v4: word-locked camera kicks (zoom impulse) and two hard shakes, scene layers only
const KICKS: [number, number][] = [[26, 0.07], [458, 0.04], [945, 0.04], [1067, 0.05], [1191, 0.05],
  [1453, 0.06], [1578, 0.04], [1718, 0.05], [1806, 0.06]];
const kickAt = (f: number) => KICKS.reduce((s, [t, a]) =>
  f >= t ? s + a * Math.exp(-(f - t) / 6) * Math.min(1, (f - t + 1) / 2) : s, 0);
const SHAKES = [26];
const shakeAt = (f: number) => SHAKES.reduce((s, t) =>
  f >= t && f < t + 24 ? s + 14 * Math.sin((f - t) * 2.3) * Math.exp(-(f - t) / 5) : s, 0);

// v4: alarm shockwave rings (drawn, editorial) - expand from a point on given frames
const Alarm: React.FC<{x: number; y: number; f: number; times: number[]; r0?: number; grow?: number}> =
  ({x, y, f, times, r0 = 160, grow = 520}) => (
    <g>
      {times.map((t) => {
        const p = (f - t) / 32;
        if (p < 0 || p > 1) return null;
        const e = 1 - Math.pow(1 - p, 3);
        return <circle key={t} cx={x} cy={y} r={r0 + grow * e} fill="none" stroke={RED}
          strokeWidth={10 * (1 - p) + 2} opacity={0.85 * (1 - p)}/>;
      })}
    </g>
  );

// v4: categories light up on the spoken word
const DRAWER_HL: {i: number; at: number; label: string}[] = [
  {i: 0, at: 480, label: "WANTED FUGITIVES"},
  {i: 1, at: 533, label: "MISSING PERSONS"},
  {i: 2, at: 569, label: "STOLEN CARS"},
  {i: 3, at: 600, label: "STOLEN GUNS"},
  {i: 4, at: 630, label: "PROTECTION ORDERS"},
];

// ---- query pulses: glowing dots traveling a cubic string -------------------
const Pulse: React.FC<{c: Cubic; f: number; start: number; period: number; dur: number; r?: number; color?: string}> =
  ({c, f, start, period, dur, r = 10, color = RED}) => {
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

const Pin: React.FC<{x: number; y: number; t: number; f: number}> = ({x, y, t, f}) => {
  const p = spring({frame: Math.max(0, f - t), fps: 30, config: {damping: 11, stiffness: 260, mass: 0.5}});
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 11,
      background: RED, boxShadow: "0 3px 8px rgba(0,0,0,0.5)", transform: `scale(${p})`}}/>
  );
};

const PhotoCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; img: string;
  label?: string; credit?: string; w?: number; h?: number}> = ({x, y, rot, f, enter, img, label, credit, w = 480, h}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  const kb = 1 + 0.09 * clamp01((f - enter) / 360);
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box",
      transform: `rotate(${rot + sway(f, x * 0.13) * pop}deg) scale(${0.55 + 0.45 * pop}) translateY(${40 * (1 - pop) + bob(f, y * 0.11) * pop}px)`,
      opacity: pop, background: CARD, padding: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      <div style={{width: w - 32, height: 300, overflow: "hidden"}}>
        <Img src={staticFile(img)} style={{width: w - 32, height: 300, objectFit: "cover",
          transform: `scale(${kb})`, filter: "contrast(1.08) saturate(0.82) sepia(0.14)"}}/>
      </div>
      {label && <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 28, color: "#26352f", marginTop: 10}}>{label}</div>}
      {credit && <div style={{fontFamily: "Arial,sans-serif", fontSize: 17, color: DIM, marginTop: 4}}>{credit}</div>}
    </div>
  );
};

const PaperCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; w: number; h?: number;
  stamp?: string; stampColor?: string; stampAt?: number; children: React.ReactNode}> =
  ({x, y, rot, f, enter, w, h, stamp, stampColor = RED, stampAt, children}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  const slammed = stampAt != null && f >= stampAt;
  const slam = slammed ? interpolate(f, [stampAt!, stampAt! + 7], [1.6, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const shock = slammed && f < stampAt! + 14 ? Math.sin((f - stampAt!) * 1.2) * 1.1 * (1 - (f - stampAt!) / 14) : 0;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box",
      transform: `rotate(${rot + (sway(f, x * 0.13) + shock) * pop}deg) scale(${0.55 + 0.45 * pop}) translateY(${bob(f, y * 0.11) * pop}px)`,
      opacity: pop, background: CARD, padding: "22px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      {children}
      {stamp && (stampAt == null || f >= stampAt) && (
        <div style={{position: "absolute", right: 14, bottom: 14, transform: `rotate(-9deg) scale(${slam})`,
          border: `5px solid ${stampColor}`, borderRadius: 6, padding: "2px 12px",
          fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 26, color: stampColor, letterSpacing: 2}}>{stamp}</div>
      )}
    </div>
  );
};

const LOCK_BODY = sRect(110, 84, RED, 7, 31);
const LOCK_SHACKLE = sPath("M-38 -20 L-38 -52 A38 38 0 0 1 38 -52 L38 -20", RED, 7, 32);


// fixed-overlay punches, locked to the spoken words
const PUNCHES: {at: number; hold: number; text: string; sub?: string; stamp?: string; dy?: number}[] = [
  {at: 785, hold: 34, text: "24/7", sub: "never closes"},
  {at: 943, hold: 52, text: "90,000+", sub: "agencies connected", dy: -380},
  {at: 1265, hold: 19, text: "WHO GOT IN?"},
  {at: 1286, hold: 19, text: "HOW?"},
  {at: 1307, hold: 38, text: "ANYTHING TAKEN?"},
  {at: 1376, hold: 40, text: "2ND TIME", sub: "in two months"},
];


export const BoardEpisode: React.FC = () => {
  const f = useCurrentFrame();

  // ---- camera journey: moves with purpose; dwells only where the mechanism animates ----
  // v4: framing keeps the active card fully in frame; stakes whips back along the strings,
  // then pulls wide on "five alarm fire" so the whole lit network reads as the payoff.
  const lookX = interpolate(f,
    [0, 110, 203, 503, 628, 678, 729, 865, 930, 1100, 1160, 1331, 1415, 1624, 1712, 1788, 1828, 2014],
    [600, 640, 1550, 2600, 2640, 2660, 3620, 3640, 4450, 4486, 5280, 5300, 6100, 6110, 1500, 1500, 1640, 1650],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lookY = interpolate(f,
    [0, 895, 1040, 1085, 1100, 1331, 1415, 1624, 1712, 1788, 1828, 2014],
    [1000, 960, 1010, 1010, 880, 880, 900, 900, 700, 720, 960, 960],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camBase = interpolate(f,
    [0, 60, 203, 503, 628, 668, 678, 729, 865, 930, 1030, 1100, 1160, 1331, 1415, 1624, 1712, 1788, 1828, 2014],
    [1.25, 1.06, 1.065, 1.09, 1.16, 1.12, 1.10, 1.075, 1.10, 1.14, 1.32, 1.2, 1.21, 1.32, 1.12, 1.24, 1.1, 1.28, 0.95, 1.0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cam = camBase * (1 + kickAt(f));
  const shake = shakeAt(f);
  const camX = lookX - 540 / cam + shake, camY = lookY - 960 / cam + shake * 0.6;

  // ---- shared progress ----
  const dim = interpolate(f, [1000, 1040, 1070, 1100], [0, 0.55, 0.55, 0.3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const threadGlow = interpolate(f, [1000, 1040], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const stakesPulse = f >= 1806 && f < 1858 ? 1 + Math.sin((f - 1806) / 52 * Math.PI) * 0.5 : 1;
  const lockPop = spring({frame: Math.max(0, f - 1067), fps: 30, config: {damping: 12, stiffness: 200, mass: 0.8}});
  const shackleRot = interpolate(lockPop, [0.55, 1], [0, -40], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockP = clamp01((f - 1028) / 16);
  const hubSwap = clamp01((f - 1020) / 8);
  const counter90 = Math.floor(interpolate(f, [948, 988], [0, 90000], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const hl = [...DRAWER_HL].reverse().find((d) => f >= d.at && f < 679) || null;
  const typed = "STATUS: ONLINE  24/7/365";
  const typedN = Math.floor(clamp01((f - 688) / 40) * typed.length);

  // active overlay punch (at most one; sequence is disjoint)
  const punch = PUNCHES.find((p) => f >= p.at && f < p.at + p.hold) || null;
  const punchIn = punch ? spring({frame: f - punch.at, fps: 30, config: {damping: 11, stiffness: 260, mass: 0.6}}) : 0;
  const punchDim = interpolate(f,
    [785, 795, 809, 819, 943, 953, 995, 1005, 1263, 1271, 1337, 1345, 1376, 1384, 1408, 1416],
    [0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.74, 0.74, 0, 0, 0.62, 0.62, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const bgDriftX = 16 * Math.sin(f / 240);
  const bgDriftY = 9 * Math.cos(f / 310);

  const layerStyle = (k: number, blur = 0, drift = 0): React.CSSProperties => ({
    position: "absolute", left: 0, top: 0, width: W, height: H,
    transform: `scale(${1 + (cam - 1) * k}) translate(${-camX * k + bgDriftX * drift}px, ${-camY * k + bgDriftY * drift}px)`,
    transformOrigin: "0 0", filter: blur ? `blur(${blur}px)` : undefined,
  });

  const headline = f < 110 ? "Someone may have just broken in."
    : f < 423 ? "One FBI system answers."
    : f < 678 ? "A filing cabinet with 22 drawers."
    : f < 895 ? "It never closes."
    : f < 1100 ? "Every connection is a door."
    : f < 1375 ? "An apparent breach."
    : f < 1683 ? "The second time in two months."
    : f < 1851 ? "Every line can put a real person in handcuffs."
    : "";
  const beatStart = f < 110 ? 0 : f < 423 ? 113 : f < 678 ? 426 : f < 895 ? 681 : f < 1100 ? 898 : f < 1375 ? 1103 : f < 1624 ? 1418 : f < 1851 ? 1628 : 1854;
  // v4: one text track at a time - the headline sets context, then hands the frame to captions
  const headlineOp = beatStart === 0 ? 1 : clamp01((f - beatStart) / 14) * (1 - clamp01((f - beatStart - 80) / 14));

  const drawerOn = (i: number) => clamp01((f - (433 + i * 6)) / 10);
  const agencyPop = (i: number) => spring({frame: Math.max(0, f - (980 + i * 4)), fps: 30, config: {damping: 13, stiffness: 240, mass: 0.6}});

  return (
    <div style={{position: "absolute", inset: 0, background: BOARD, overflow: "hidden"}}>
      {/* deep background plane */}
      <div style={{...layerStyle(0.45, 2.5, 1), opacity: 0.6}}>
        <svg width={W} height={H}>
          {Array.from({length: 67}, (_, i) => <line key={"v" + i} x1={i * 100} y1="0" x2={i * 100} y2={H} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          {Array.from({length: 20}, (_, i) => <line key={"h" + i} x1="0" y1={i * 100} x2={W} y2={i * 100} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          <text x="3300" y="1150" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="720" fill={INK} opacity="0.04">NCIC</text>
        </svg>
      </div>

      {/* main plane */}
      <div style={layerStyle(1)}>
        {/* strings: derived from the card layout (boardLayout.ts). Pins sit on the board just outside
            each card edge; no string or pin ever touches a card (tests/boardLayout.test.ts). */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0,
          filter: threadGlow > 0 || stakesPulse > 1 ? `drop-shadow(0 0 ${14 * Math.max(threadGlow, stakesPulse - 1)}px ${RED})` : undefined}}>
          {BUILT_LINKS.map((l) => {
            const glow = Math.max(stakesPulse - 1, l.id === "term-hub" ? threadGlow : 0);
            return (
              <g key={l.id} opacity={0.85 + 0.15 * glow}>
                <DrawOn paths={sPath(l.d, RED, 6, l.seed)} p={clamp01((f - l.start) / l.dur)}/>
              </g>
            );
          })}
          {BUILT_LINKS.map((l) => l.pulse ? (
            <Pulse key={"p" + l.id} c={l.route} f={f} start={l.pulse.start} period={l.pulse.period} dur={l.pulse.dur} r={9}/>
          ) : null)}
        </svg>
        {BUILT_LINKS.map((l) => (
          <React.Fragment key={"pin" + l.id}>
            <Pin x={l.a[0]} y={l.a[1]} t={l.start} f={f}/>
            <Pin x={l.b[0]} y={l.b[1]} t={l.start + l.dur} f={f}/>
          </React.Fragment>
        ))}

        {/* v4 alarm shockwaves: hook (open already ringing, big hit on "broken"), breach, five-alarm payoff */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible"}}>
          <Alarm x={CARDS.hook.x + CARDS.hook.w / 2} y={CARDS.hook.y + CARDS.hook.h / 2} f={f} times={[0, 11, 26, 31, 49]} r0={190} grow={560}/>
          <Alarm x={APCARD.x + APCARD.w / 2} y={APCARD.y + APCARD.h / 2} f={f} times={[1191, 1201]} r0={300} grow={420}/>
          <Alarm x={TRAFFIC.x + TRAFFIC.w / 2} y={TRAFFIC.y + TRAFFIC.h / 2} f={f} times={[1806, 1816, 1826]} r0={280} grow={700}/>
        </svg>

        {/* HOOK: face-down card; the string grows OUT of it toward where we travel; card flips to NCIC */}
        {(() => {
          const flip = interpolate(f, [75, 100], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const pop = spring({frame: f + 8, fps: 30, config: {damping: 13, stiffness: 200, mass: 0.8}});
          const crackP = clamp01((f - 26) / 6);
          return (
            <div style={{position: "absolute", left: CARDS.hook.x, top: CARDS.hook.y, width: CARDS.hook.w, height: CARDS.hook.h, boxSizing: "border-box",
              transform: `scale(${0.6 + 0.4 * pop}) rotate(${-3 + flip * 3}deg) scaleX(${Math.abs(1 - flip * 2)})`,
              opacity: pop, background: flip < 0.5 ? "#232f28" : CARD,
              border: `6px solid ${flip < 0.5 ? RED : "#26352f"}`, boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              {flip < 0.5 && crackP > 0 && (
                <svg width="300" height="380" style={{position: "absolute", left: -6, top: -6, overflow: "visible"}}>
                  <DrawOn paths={sPath("M150 -10 L128 90 L176 150 L120 230 L168 300 L140 390", RED, 8, 70)} p={crackP}/>
                  <DrawOn paths={sPath("M176 150 L250 175 M120 230 L50 250", RED, 6, 71)} p={clamp01((f - 30) / 6)}/>
                </svg>
              )}
              {flip >= 0.5 && (
                <span style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 58, color: "#26352f", letterSpacing: 5}}>
                  {"NCIC".split("").map((ch, i) => {
                    const lp = clamp01((f - (81 + i * 3)) / 6);
                    return <span key={i} style={{display: "inline-block", opacity: lp, transform: `translateY(${10 * (1 - lp)}px)`}}>{ch}</span>;
                  })}
                </span>
              )}
            </div>
          );
        })()}

        {/* SYSTEM: traffic stop photo; a query pulse runs to the NCIC card as the VO says where answers come from */}
        <PhotoCard x={TRAFFIC.x} y={TRAFFIC.y} w={TRAFFIC.w} h={TRAFFIC.h} rot={-3} f={f} enter={135} img="photos/traffic-stop.jpg"/>
        <PaperCard x={CARDS.ncic.x} y={CARDS.ncic.y} rot={2} f={f} enter={338} w={CARDS.ncic.w} h={CARDS.ncic.h}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: DIM, letterSpacing: 2}}>
            {"NATIONAL CRIME INFORMATION CENTER".split("").map((ch, i) => (
              <span key={i} style={{opacity: clamp01((f - (340 + i * 1.1)) / 4)}}>{ch}</span>
            ))}
          </div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 64, color: "#26352f", marginTop: 8}}>NCIC</div>
        </PaperCard>

        {/* DRAWERS: filing cabinet + counters (numbers punch in the fixed overlay) */}
        <PaperCard x={CABINET.x} y={CABINET.y} rot={-2} f={f} enter={428} w={CABINET.w} h={CABINET.h}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: DIM, letterSpacing: 2, marginBottom: 12}}>22 DRAWERS</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 8}}>
            {Array.from({length: 22}, (_, i) => {
              const on = hl && hl.i === i;
              const seen = DRAWER_HL.some((d) => d.i === i && f >= d.at);
              const hp = on ? spring({frame: f - hl!.at, fps: 30, config: {damping: 10, stiffness: 280, mass: 0.5}}) : 0;
              return (
                <div key={i} style={{height: 52, background: on ? RED : seen ? "#e3b9a6" : i < 5 ? "#d8cba8" : "#c9c2ab",
                  border: "2px solid #26352f", opacity: drawerOn(i),
                  transform: `rotateX(${(1 - drawerOn(i)) * 70}deg) translateY(${-14 * hp}px) scale(${1 + 0.22 * hp})`,
                  boxShadow: on ? "0 10px 24px rgba(0,0,0,0.45)" : undefined, position: "relative", zIndex: on ? 2 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <div style={{width: 22, height: 6, borderRadius: 3, background: on ? CARD : "#26352f", opacity: 0.8}}/>
                </div>
              );
            })}
          </div>
        </PaperCard>
        {/* v4: the spoken category, pinned under the cabinet as it is named */}
        {hl && (() => {
          const cp = spring({frame: f - hl.at, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}});
          const out = clamp01((f - 658) / 10);
          return (
            <div key={hl.label} style={{position: "absolute", left: CARDS.drawerChip.x, top: CARDS.drawerChip.y, height: CARDS.drawerChip.h, boxSizing: "border-box", whiteSpace: "nowrap",
              background: "#0b120e", border: `3px solid ${RED}`, padding: "14px 26px", borderRadius: 6,
              fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: 3, color: CARD,
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)", opacity: cp * (1 - out),
              transform: `translateY(${24 * (1 - cp)}px) rotate(-1.5deg)`}}>
              <span style={{color: RED, marginRight: 16}}>&#9679;</span>{hl.label}
            </div>
          );
        })()}

        {/* ALWAYS ON: terminal + 1967 chip + crossed-out office hours */}
        <div style={{position: "absolute", left: TERMR.x, top: TERMR.y, width: TERMR.w, height: TERMR.h, boxSizing: "border-box",
          background: "#0b120e", border: "3px solid #33503f", borderRadius: 10, padding: "26px 30px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          opacity: clamp01((f - 684) / 12), transform: `translateY(${26 * (1 - clamp01((f - 684) / 12))}px)`}}>
          <div style={{fontFamily: "monospace", fontSize: 30, color: GRN}}>
            {typed.slice(0, typedN)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>&#9608;</span>
          </div>
          <div style={{fontFamily: "monospace", fontSize: 26, color: "#4a7a5f", marginTop: 18}}>&gt; agencies connected</div>
          <div style={{fontFamily: "monospace", fontSize: 62, fontWeight: 700, color: GRN, marginTop: 4}}>
            {counter90 >= 90000 ? "90,000+" : f >= 948 ? counter90.toLocaleString("en-US") : ""}
          </div>
        </div>
        <PaperCard x={CARDS.chip1967.x} y={CARDS.chip1967.y} rot={3} f={f} enter={730} w={CARDS.chip1967.w} h={CARDS.chip1967.h}>
          <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 32, color: "#26352f", lineHeight: 1.15}}>since<br/>January 1967</div>
        </PaperCard>
        <PaperCard x={CARDS.office.x} y={CARDS.office.y} rot={-2} f={f} enter={835} w={CARDS.office.w} h={CARDS.office.h}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 30, color: "#26352f"}}>OFFICE HOURS 9-5</div>
          <svg width="280" height="60" style={{position: "absolute", left: 10, top: 10, overflow: "visible"}}>
            <DrawOn paths={sLine(10, 30, 260, 30, RED, 9, 55)} p={clamp01((f - 862) / 8)}/>
            <DrawOn paths={sLine(10, 50, 260, 10, RED, 9, 56)} p={clamp01((f - 868) / 8)}/>
          </svg>
        </PaperCard>
        {/* status dots */}
        {Array.from({length: 24}, (_, i) => {
          const on = f > 768 + i * 2.4;
          return <div key={"d" + i} style={{position: "absolute", left: CARDS.dots.x + (i % 12) * 46, top: CARDS.dots.y + Math.floor(i / 12) * 46,
            width: 18, height: 18, borderRadius: 9, background: on ? GRN : "#2a3a30",
            boxShadow: on ? "0 0 10px rgba(125,216,160,0.7)" : undefined}}/>;
        })}

        {/* WEAKNESS: hub + agency ring + padlock hanging open beside it */}
        <div style={{position: "absolute", left: CARDS.hub.x, top: CARDS.hub.y, width: CARDS.hub.w, height: CARDS.hub.h, boxSizing: "border-box",
          borderRadius: 130, border: `7px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d2b24", boxShadow: `0 0 ${30 + 40 * threadGlow}px rgba(224,73,46,${0.25 + 0.5 * threadGlow})`,
          opacity: clamp01((f - 895) / 20),
          transform: `scale(${(0.7 + 0.3 * clamp01((f - 895) / 20)) * (1 + 0.12 * Math.sin(Math.PI * clamp01((f - 1067) / 14)))})`}}>
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 52, color: INK, letterSpacing: 6, opacity: 1 - hubSwap}}>NCIC</span>
          {/* v4: the hub itself becomes the open padlock - "a door the FBI can't lock". Drawn metaphor;
              no traffic depicted through it. Caption carries the sentence, so no duplicate on-board text. */}
          {f >= 1028 && (
            <svg width="260" height="260" style={{position: "absolute", left: 0, top: 0, overflow: "visible", opacity: lockP}}>
              <g transform="translate(130 150) scale(1.15)">
                <g transform={`rotate(${shackleRot} -38 -20)`}><DrawOn paths={LOCK_SHACKLE} p={lockP}/></g>
                <g transform="translate(-55 -20)"><DrawOn paths={LOCK_BODY} p={lockP}/></g>
              </g>
            </svg>
          )}
        </div>
        {ringBoxes().map((b, i) => {
          const p = agencyPop(i);
          if (p <= 0) return null;
          return (
            <div key={"a" + i} style={{position: "absolute", left: b.x, top: b.y, boxSizing: "border-box",
              width: b.w, height: b.h, background: CARD, border: "3px solid #26352f",
              transform: `scale(${0.4 + 0.6 * p})`, opacity: p, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width="40" height="34" viewBox="0 0 40 34">
                <path d="M4 14 L20 4 L36 14 Z M8 16 V28 M16 16 V28 M24 16 V28 M32 16 V28 M4 30 H36" fill="none" stroke="#26352f" strokeWidth="3"/>
              </svg>
            </div>
          );
        })}

        {/* BREACH: editorial only - AP card assembles; questions punch in the fixed overlay */}
        <PaperCard x={APCARD.x} y={APCARD.y} rot={-2} f={f} enter={1113} w={APCARD.w} h={APCARD.h}>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 40, color: "#26352f", lineHeight: 1.25}}>
            {["FBI investigating", "an apparent breach,", "found in recent days"].map((line, i) => {
              const lp = clamp01((f - (1130 + i * 13)) / 10);
              return (
                <div key={line} style={{opacity: lp, transform: `translateY(${14 * (1 - lp)}px)`}}>{line}</div>
              );
            })}
          </div>
        </PaperCard>

        {/* SECOND: report assembles on the spoken words (owner de-label rule: no stamp, no citation line) */}
        <PaperCard x={SECOND.x} y={SECOND.y} rot={2} f={f} enter={1417} w={SECOND.w} h={SECOND.h}>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 32, color: "#26352f", lineHeight: 1.3, whiteSpace: "nowrap"}}>
            {[["Extortion gang says", 1419], ["it breached a platform", 1477], ["behind the FBI's jobs website", 1507], ["through unpatched software", 1578]].map(([line, at]) => {
              const lp = clamp01((f - (at as number)) / 10);
              return (
                <div key={line as string} style={{opacity: lp, transform: `translateY(${14 * (1 - lp)}px)`}}>{line}</div>
              );
            })}
          </div>
        </PaperCard>

        {/* STAKES: no duplicate on-board sentence (caption carries it); the last query lands on the photo on "handcuffs" */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
          <Pulse c={reverseCubic(linkById("photo-ncic").route) as Cubic} f={f} start={1692} period={400} dur={26} r={14}/>
        </svg>
      </div>

      {/* v4: blurred foreground scraps removed - on a phone they read as render glitches, not depth */}

      {/* dim (weakness beat) + punch dim */}
      <div style={{position: "absolute", inset: 0, background: "#050a08", opacity: Math.max(dim, punchDim), pointerEvents: "none"}}/>

      {/* FIXED safe overlay: kicker + per-beat headline */}
      <div style={{position: "absolute", left: 64, top: 84, pointerEvents: "none"}}>
        <div style={{fontFamily: "Arial,sans-serif", fontSize: 24, letterSpacing: 4, color: RED, opacity: clamp01(f / 18)}}>AMERICA'S CRIME DATABASE</div>
        <div key={headline} style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 70, color: INK, marginTop: 14,
          opacity: headlineOp, maxWidth: 900}}>{headline}</div>
        <div style={{width: 340 * clamp01((f - 10) / 22) * headlineOp, height: 6, background: RED, marginTop: 16}}/>
      </div>

      {/* FIXED overlay punches, locked to spoken words; sit above scene dim, below captions */}
      {punch && (
        <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", pointerEvents: "none", transform: `translateY(${punch.dy ?? -140}px)`}}>
          <div style={{transform: `scale(${0.6 + 0.4 * punchIn})`, opacity: punchIn, textAlign: "center"}}>
            <div style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 96, color: INK, letterSpacing: 4,
              textShadow: "0 6px 40px rgba(0,0,0,0.7)"}}>{punch.text}</div>
            {punch.sub && <div style={{fontFamily: "Arial,sans-serif", fontSize: 34, color: DIM, marginTop: 10, letterSpacing: 3}}>{punch.sub}</div>}
            {punch.stamp && (
              <div style={{display: "inline-block", marginTop: 18, transform: `rotate(-6deg) scale(${interpolate(f, [punch.at + 6, punch.at + 13], [1.7, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})})`,
                border: `6px solid ${RED}`, borderRadius: 8, padding: "4px 18px",
                fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 40, color: RED, letterSpacing: 4}}>{punch.stamp}</div>
            )}
          </div>
        </div>
      )}

      {/* word captions (fixed safe layer, above all board planes) */}
      <Captions words={ep2Words as {w: string; s: number; e: number}[]} config={{theme: "editorial"}}/>

      {/* OUT: the TWK logo end card (EndCard.tsx), restored per owner */}
      {f >= 1904 && <EndCard start={1904} handle="@techwhoknows"/>}
    </div>
  );
};
