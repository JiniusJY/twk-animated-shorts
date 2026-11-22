import React from "react";
import {useCurrentFrame, interpolate, spring, Img, staticFile} from "remotion";
import {sPath, sRect, sLine, DrawOn, clamp01} from "./sketch";
import {Captions} from "./Captions";
import ep2Words from "./ep2-words.json";

/**
 * BOARD EPISODE v3 - "demonstrate, don't describe" rebuild (docs/EP2_REDESIGN.md).
 * The case board is a LIVING SYSTEM: query pulses travel the strings as the VO
 * names the mechanism. Breach stays editorial (origin/path/method unknown).
 * Beat times derive from the SHIPPED voice take's words.json (run 44997857035):
 *   HOOK     0-105    "Someone may have just broken into..." (0.16-3.38s)
 *   SYSTEM   105-390  traffic stop 6.3s, NCIC name 10.34s
 *   DRAWERS  390-730  cabinet 13.08s, 21 drawers 13.96s, 12M 20.18s, 10M 22.36s
 *   ALWAYSON 730-900  never closes 24.38s, jan 1967 25.66s, business hours 29.58s
 *   WEAKNESS 900-1125 weakness 30.0s, 90,000 32.16s, can't lock 36.24s
 *   BREACH   1125-1410 AP 37.52s, apparent breach 40.48s, don't know 43.14s
 *   SECOND   1410-1695 second time 47.04s, gang 48.88s, unpatched 53.08s
 *   STAKES   1695-1851 handcuffs 56.8s, five alarm 60.26s
 *   OUT      1851-2046 follow 61.7s, VO ends 63.48s
 * Rules: docs/MOTION_LANGUAGE.md (safe fixed overlay; supported numbers only;
 * drawn metaphors, no simulated system states; attribution labels stay).
 */

const INK = "#e8e2d2", RED = "#e0492e", GRN = "#7dd8a0", BOARD = "#16211c", CARD = "#f1eddd", DIM = "#8a8574";
const W = 6600, H = 1920;

const HUB = {x: 4200, y: 960};
const TRAFFIC = {x: 1260, y: 420};
const CABINET = {x: 2260, y: 400};
const TERM = {x: 3300, y: 520};
const APCARD = {x: 4760, y: 400};
const SECOND = {x: 5640, y: 700};

const sway = (f: number, seed: number) => Math.sin((f + seed) / 55) * 0.35;
const bob = (f: number, seed: number) => Math.sin((f + seed) / 67) * 2.5;

// v4: word-locked camera kicks (zoom impulse) and two hard shakes, scene layers only
const KICKS: [number, number][] = [[23, 0.07], [419, 0.04], [965, 0.04], [1087, 0.05], [1225, 0.05],
  [1489, 0.06], [1592, 0.04], [1726, 0.05], [1808, 0.06]];
const kickAt = (f: number) => KICKS.reduce((s, [t, a]) =>
  f >= t ? s + a * Math.exp(-(f - t) / 6) * Math.min(1, (f - t + 1) / 2) : s, 0);
const SHAKES = [23, 1489];
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
  {i: 0, at: 441, label: "WANTED FUGITIVES"},
  {i: 1, at: 488, label: "MISSING PERSONS"},
  {i: 2, at: 519, label: "STOLEN CARS"},
  {i: 3, at: 547, label: "STOLEN GUNS"},
  {i: 4, at: 562, label: "PROTECTION ORDERS"},
];

// ---- query pulses: glowing dots traveling a cubic string -------------------
type Cubic = [number, number, number, number, number, number, number, number];
const cubicAt = (c: Cubic, t: number): [number, number] => {
  const u = 1 - t;
  const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
  const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
  return [x, y];
};
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
  label: string; credit: string; w?: number}> = ({x, y, rot, f, enter, img, label, credit, w = 480}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  const kb = 1 + 0.09 * clamp01((f - enter) / 360);
  return (
    <div style={{position: "absolute", left: x, top: y, width: w,
      transform: `rotate(${rot + sway(f, x * 0.13) * pop}deg) scale(${0.55 + 0.45 * pop}) translateY(${40 * (1 - pop) + bob(f, y * 0.11) * pop}px)`,
      opacity: pop, background: CARD, padding: "16px 16px 12px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      <div style={{width: w - 32, height: 300, overflow: "hidden"}}>
        <Img src={staticFile(img)} style={{width: w - 32, height: 300, objectFit: "cover",
          transform: `scale(${kb})`, filter: "contrast(1.08) saturate(0.82) sepia(0.14)"}}/>
      </div>
      <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 28, color: "#26352f", marginTop: 10}}>{label}</div>
      <div style={{fontFamily: "Arial,sans-serif", fontSize: 17, color: DIM, marginTop: 4}}>{credit}</div>
      <div style={{position: "absolute", top: -16, left: w / 2 - 16, width: 22, height: 22, borderRadius: 11,
        background: RED, boxShadow: "0 3px 8px rgba(0,0,0,0.5)"}}/>
    </div>
  );
};

const PaperCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; w: number;
  stamp?: string; stampColor?: string; stampAt?: number; children: React.ReactNode}> =
  ({x, y, rot, f, enter, w, stamp, stampColor = RED, stampAt, children}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  const slammed = stampAt != null && f >= stampAt;
  const slam = slammed ? interpolate(f, [stampAt!, stampAt! + 7], [1.6, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const shock = slammed && f < stampAt! + 14 ? Math.sin((f - stampAt!) * 1.2) * 1.1 * (1 - (f - stampAt!) / 14) : 0;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w,
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

// threads from earlier cards into the hub (drawn during WEAKNESS) + their pulse routes
const THREADS: {d: string; start: number; seed: number; route: Cubic}[] = [
  {d: `M${HUB.x} ${HUB.y} C 3400 900, 2400 700, 1500 570`, start: 960, seed: 41, route: [1500, 570, 2400, 700, 3400, 900, HUB.x, HUB.y]},   // traffic -> hub
  {d: `M${HUB.x} ${HUB.y} C 3600 1000, 3100 700, 2500 560`, start: 975, seed: 42, route: [2500, 560, 3100, 700, 3600, 1000, HUB.x, HUB.y]},  // cabinet -> hub
  {d: `M${HUB.x} ${HUB.y} C 3800 960, 3600 720, 3320 620`, start: 990, seed: 43, route: [3320, 620, 3600, 720, 3800, 960, HUB.x, HUB.y]},    // terminal -> hub
];

// beat-to-beat strings + pulse routes (verified normal operation only)
const NET: {d: string; seed: number; start: number; dur: number; route: Cubic; pulse?: {start: number; period: number; dur: number}}[] = [
  {d: "M1480 880 C 1560 878, 1660 876, 1735 878", seed: 80, start: 250, dur: 30,
    route: [1480, 880, 1560, 878, 1660, 876, 1735, 878], pulse: {start: 335, period: 65, dur: 42}},   // photo -> NCIC card
  {d: "M2020 1080 C 2120 990, 2180 810, 2252 655", seed: 81, start: 400, dur: 35,
    route: [2020, 1080, 2120, 990, 2180, 810, 2252, 655], pulse: {start: 445, period: 80, dur: 40}},   // NCIC card -> cabinet
  {d: "M3010 640 C 3055 590, 3020 545, 2988 515", seed: 82, start: 748, dur: 25,
    route: [3010, 640, 3055, 590, 3020, 545, 2988, 515], pulse: {start: 785, period: 55, dur: 28}},    // cabinet -> terminal
  {d: "M4335 940 C 4480 880, 4620 780, 4745 700", seed: 83, start: 1132, dur: 35,
    route: [4335, 940, 4480, 880, 4620, 780, 4745, 700]},                                               // hub -> AP card (editorial link)
  {d: "M5400 560 C 5480 600, 5560 690, 5650 770", seed: 84, start: 1440, dur: 24,
    route: [5400, 560, 5480, 600, 5560, 690, 5650, 770]},                                               // AP -> second report (editorial link)
];

// fixed-overlay punches, locked to the spoken words
const PUNCHES: {at: number; hold: number; text: string; sub?: string; stamp?: string; dy?: number}[] = [
  {at: 604, hold: 58, text: "12 MILLION", sub: "active records"},
  {at: 669, hold: 46, text: "10 MILLION", sub: "checks a day"},
  {at: 823, hold: 34, text: "24/7", sub: "never closes"},
  {at: 963, hold: 52, text: "90,000+", sub: "agencies connected", dy: -380},
  {at: 1299, hold: 19, text: "WHO GOT IN?", stamp: "UNKNOWN"},
  {at: 1320, hold: 19, text: "HOW?", stamp: "UNKNOWN"},
  {at: 1341, hold: 30, text: "ANYTHING TAKEN?", stamp: "UNKNOWN"},
  {at: 1411, hold: 40, text: "2ND TIME", sub: "in two months"},
];


export const BoardEpisode: React.FC = () => {
  const f = useCurrentFrame();

  // ---- camera journey: moves with purpose; dwells only where the mechanism animates ----
  // v4: framing keeps the active card fully in frame; stakes whips back along the strings,
  // then pulls wide on "five alarm fire" so the whole lit network reads as the payoff.
  const lookX = interpolate(f,
    [0, 105, 190, 470, 560, 730, 775, 890, 950, 1125, 1185, 1365, 1450, 1636, 1720, 1790, 1830, 2046],
    [600, 640, 1550, 2600, 2640, 2660, 3300, 3322, 4200, 4236, 5080, 5100, 5880, 5900, 1500, 1500, 1640, 1650],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lookY = interpolate(f,
    [0, 900, 1060, 1110, 1125, 1365, 1450, 1636, 1720, 1790, 1830, 2046],
    [1000, 960, 1010, 1010, 880, 880, 980, 980, 700, 720, 960, 960],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camBase = interpolate(f,
    [0, 60, 190, 470, 560, 600, 730, 775, 890, 950, 1050, 1125, 1185, 1365, 1450, 1636, 1720, 1790, 1830, 2046],
    [1.25, 1.06, 1.065, 1.09, 1.16, 1.12, 1.10, 1.075, 1.10, 1.14, 1.32, 1.2, 1.21, 1.32, 1.12, 1.24, 1.1, 1.28, 0.95, 1.0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cam = camBase * (1 + kickAt(f));
  const shake = shakeAt(f);
  const camX = lookX - 540 / cam + shake, camY = lookY - 960 / cam + shake * 0.6;

  // ---- shared progress ----
  const dim = interpolate(f, [1020, 1060, 1090, 1125], [0, 0.55, 0.55, 0.3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const threadGlow = interpolate(f, [1020, 1060], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const stakesPulse = f >= 1808 && f < 1860 ? 1 + Math.sin((f - 1808) / 52 * Math.PI) * 0.5 : 1;
  const lockPop = spring({frame: Math.max(0, f - 1087), fps: 30, config: {damping: 12, stiffness: 200, mass: 0.8}});
  const shackleRot = interpolate(lockPop, [0.55, 1], [0, -40], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockP = clamp01((f - 1048) / 16);
  const hubSwap = clamp01((f - 1040) / 8);
  const counter90 = Math.floor(interpolate(f, [968, 1008], [0, 90000], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const hl = [...DRAWER_HL].reverse().find((d) => f >= d.at && f < 604) || null;
  const typed = "STATUS: ONLINE  24/7/365";
  const typedN = Math.floor(clamp01((f - 740) / 40) * typed.length);

  // active overlay punch (at most one; sequence is disjoint)
  const punch = PUNCHES.find((p) => f >= p.at && f < p.at + p.hold) || null;
  const punchIn = punch ? spring({frame: f - punch.at, fps: 30, config: {damping: 11, stiffness: 260, mass: 0.6}}) : 0;
  const punchDim = interpolate(f,
    [604, 614, 652, 662, 669, 679, 705, 715, 823, 831, 849, 857, 963, 973, 1005, 1015, 1297, 1305, 1363, 1371, 1411, 1419, 1443, 1451],
    [0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.74, 0.74, 0, 0, 0.62, 0.62, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  const bgDriftX = 16 * Math.sin(f / 240);
  const bgDriftY = 9 * Math.cos(f / 310);

  const layerStyle = (k: number, blur = 0, drift = 0): React.CSSProperties => ({
    position: "absolute", left: 0, top: 0, width: W, height: H,
    transform: `scale(${1 + (cam - 1) * k}) translate(${-camX * k + bgDriftX * drift}px, ${-camY * k + bgDriftY * drift}px)`,
    transformOrigin: "0 0", filter: blur ? `blur(${blur}px)` : undefined,
  });

  const headline = f < 105 ? "Someone may have just broken in."
    : f < 390 ? "One FBI system answers."
    : f < 730 ? "21 drawers. 12 million records."
    : f < 900 ? "It never closes."
    : f < 1125 ? "Every connection is a door."
    : f < 1410 ? "An apparent breach."
    : f < 1695 ? "The second time in two months."
    : f < 1851 ? "Every line can put a real person in handcuffs."
    : "";
  const beatStart = f < 105 ? 0 : f < 390 ? 108 : f < 730 ? 393 : f < 900 ? 733 : f < 1125 ? 903 : f < 1410 ? 1128 : f < 1636 ? 1453 : f < 1851 ? 1640 : 1854;
  // v4: one text track at a time - the headline sets context, then hands the frame to captions
  const headlineOp = beatStart === 0 ? 1 : clamp01((f - beatStart) / 14) * (1 - clamp01((f - beatStart - 80) / 14));

  const drawerOn = (i: number) => clamp01((f - (400 + i * 6)) / 10);
  const agencyPop = (i: number) => spring({frame: Math.max(0, f - (1000 + i * 4)), fps: 30, config: {damping: 13, stiffness: 240, mass: 0.6}});

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
        {/* threads into the hub, with continuous query pulses */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0,
          filter: threadGlow > 0 || stakesPulse > 1 ? `drop-shadow(0 0 ${14 * Math.max(threadGlow, stakesPulse - 1)}px ${RED})` : undefined}}>
          {THREADS.map((t, i) => {
            const p = clamp01((f - t.start) / 40);
            return (
              <g key={i} opacity={0.35 + 0.65 * Math.max(threadGlow, stakesPulse - 1, p > 0.99 ? 0.75 : 0)}>
                <DrawOn paths={sPath(t.d, RED, 7, t.seed)} p={p}/>
              </g>
            );
          })}
          {THREADS.map((t, i) => (
            <Pulse key={"tp" + i} c={t.route} f={f} start={1030 + i * 12} period={58 + i * 9} dur={44} r={9}/>
          ))}
        </svg>

        {/* beat-to-beat strings + pulses */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
          {NET.map((t, i) => (
            <g key={"n" + i} opacity={0.85}>
              <DrawOn paths={sPath(t.d, RED, 6, t.seed)} p={clamp01((f - t.start) / t.dur)}/>
            </g>
          ))}
          {NET.map((t, i) => t.pulse ? (
            <Pulse key={"np" + i} c={t.route} f={f} start={t.pulse.start} period={t.pulse.period} dur={t.pulse.dur} r={9}/>
          ) : null)}
        </svg>
        <Pin x={1480} y={880} t={250} f={f}/>
        <Pin x={2020} y={1080} t={400} f={f}/>
        <Pin x={2252} y={655} t={432} f={f}/>
        <Pin x={3010} y={640} t={748} f={f}/>
        <Pin x={4335} y={940} t={1132} f={f}/>
        <Pin x={4745} y={700} t={1160} f={f}/>
        <Pin x={5650} y={770} t={1462} f={f}/>

        {/* v4 alarm shockwaves: hook (open already ringing, big hit on "broken"), breach, five-alarm payoff */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible"}}>
          <Alarm x={610} y={1070} f={f} times={[0, 11, 23, 31, 46]} r0={190} grow={560}/>
          <Alarm x={APCARD.x + 320} y={APCARD.y + 160} f={f} times={[1225, 1235]} r0={300} grow={420}/>
          <Alarm x={TRAFFIC.x + 240} y={TRAFFIC.y + 190} f={f} times={[1808, 1818, 1828]} r0={280} grow={700}/>
        </svg>

        {/* HOOK: face-down card; the string grows OUT of it toward where we travel; card flips to NCIC */}
        {(() => {
          const flip = interpolate(f, [70, 95], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const pop = spring({frame: f + 8, fps: 30, config: {damping: 13, stiffness: 200, mass: 0.8}});
          const crackP = clamp01((f - 23) / 6);
          return (
            <div style={{position: "absolute", left: 460, top: 880, width: 300, height: 380,
              transform: `scale(${0.6 + 0.4 * pop}) rotate(${-3 + flip * 3}deg) scaleX(${Math.abs(1 - flip * 2)})`,
              opacity: pop, background: flip < 0.5 ? "#232f28" : CARD,
              border: `6px solid ${flip < 0.5 ? RED : "#26352f"}`, boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              {flip < 0.5 && crackP > 0 && (
                <svg width="300" height="380" style={{position: "absolute", left: -6, top: -6, overflow: "visible"}}>
                  <DrawOn paths={sPath("M150 -10 L128 90 L176 150 L120 230 L168 300 L140 390", RED, 8, 70)} p={crackP}/>
                  <DrawOn paths={sPath("M176 150 L250 175 M120 230 L50 250", RED, 6, 71)} p={clamp01((f - 27) / 6)}/>
                </svg>
              )}
              {flip >= 0.5 && (
                <span style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 58, color: "#26352f", letterSpacing: 5}}>
                  {"NCIC".split("").map((ch, i) => {
                    const lp = clamp01((f - (76 + i * 3)) / 6);
                    return <span key={i} style={{display: "inline-block", opacity: lp, transform: `translateY(${10 * (1 - lp)}px)`}}>{ch}</span>;
                  })}
                </span>
              )}
            </div>
          );
        })()}
        <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
          <DrawOn paths={sPath("M640 1080 C 1000 1200, 1600 1400, 2300 1500", RED, 8, 40)} p={clamp01((f - 15) / 55)}/>
        </svg>
        <Pin x={640} y={1080} t={15} f={f}/>

        {/* SYSTEM: traffic stop photo; a query pulse runs to the NCIC card as the VO says where answers come from */}
        <PhotoCard x={TRAFFIC.x} y={TRAFFIC.y} rot={-3} f={f} enter={130} img="photos/traffic-stop.jpg"
          label="The answer routinely comes from one FBI system" credit="Ildar Sagdejev, CC BY-SA 4.0"/>
        <PaperCard x={1500} y={880} rot={2} f={f} enter={310} w={520}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: DIM, letterSpacing: 2}}>
            {"NATIONAL CRIME INFORMATION CENTER".split("").map((ch, i) => (
              <span key={i} style={{opacity: clamp01((f - (312 + i * 1.1)) / 4)}}>{ch}</span>
            ))}
          </div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 64, color: "#26352f", marginTop: 8}}>NCIC</div>
        </PaperCard>

        {/* DRAWERS: filing cabinet + counters (numbers punch in the fixed overlay) */}
        <PaperCard x={CABINET.x} y={CABINET.y} rot={-2} f={f} enter={395} w={760}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: DIM, letterSpacing: 2, marginBottom: 12}}>21 DRAWERS</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8}}>
            {Array.from({length: 21}, (_, i) => {
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
          <div style={{display: "flex", gap: 40, marginTop: 18, fontFamily: "monospace"}}>
            <div>
              <div style={{fontSize: 54, fontWeight: 700, color: "#26352f"}}>{f >= 610 ? "12M" : ""}</div>
              <div style={{fontSize: 24, color: DIM}}>active records</div>
            </div>
            <div>
              <div style={{fontSize: 54, fontWeight: 700, color: "#26352f"}}>{f >= 676 ? "10M" : ""}</div>
              <div style={{fontSize: 24, color: DIM}}>checks a day</div>
            </div>
          </div>
        </PaperCard>
        {/* v4: the spoken category, pinned under the cabinet as it is named */}
        {hl && (() => {
          const cp = spring({frame: f - hl.at, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}});
          const out = clamp01((f - 590) / 10);
          return (
            <div key={hl.label} style={{position: "absolute", left: CABINET.x + 40, top: CABINET.y + 470,
              background: "#0b120e", border: `3px solid ${RED}`, padding: "14px 26px", borderRadius: 6,
              fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: 3, color: CARD,
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)", opacity: cp * (1 - out),
              transform: `translateY(${24 * (1 - cp)}px) rotate(-1.5deg)`}}>
              <span style={{color: RED, marginRight: 16}}>&#9679;</span>{hl.label}
            </div>
          );
        })()}

        {/* ALWAYS ON: terminal + 1967 chip + crossed-out office hours */}
        <div style={{position: "absolute", left: TERM.x - 330, top: TERM.y - 200, width: 660, height: 360,
          background: "#0b120e", border: "3px solid #33503f", borderRadius: 10, padding: "26px 30px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          opacity: clamp01((f - 736) / 12), transform: `translateY(${26 * (1 - clamp01((f - 736) / 12))}px)`}}>
          <div style={{fontFamily: "monospace", fontSize: 30, color: GRN}}>
            {typed.slice(0, typedN)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>&#9608;</span>
          </div>
          <div style={{fontFamily: "monospace", fontSize: 26, color: "#4a7a5f", marginTop: 18}}>&gt; agencies connected</div>
          <div style={{fontFamily: "monospace", fontSize: 62, fontWeight: 700, color: GRN, marginTop: 4}}>
            {counter90 >= 90000 ? "90,000+" : f >= 968 ? counter90.toLocaleString("en-US") : ""}
          </div>
        </div>
        <PaperCard x={TERM.x + 160} y={TERM.y - 150} rot={3} f={f} enter={776} w={330}>
          <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 34, color: "#26352f"}}>since January 1967</div>
        </PaperCard>
        <PaperCard x={TERM.x - 240} y={TERM.y + 260} rot={-2} f={f} enter={860} w={300}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 30, color: "#26352f"}}>OFFICE HOURS 9-5</div>
          <svg width="280" height="60" style={{position: "absolute", left: 10, top: 10, overflow: "visible"}}>
            <DrawOn paths={sLine(10, 30, 260, 30, RED, 9, 55)} p={clamp01((f - 887) / 8)}/>
            <DrawOn paths={sLine(10, 50, 260, 10, RED, 9, 56)} p={clamp01((f - 893) / 8)}/>
          </svg>
        </PaperCard>
        {/* status dots */}
        {Array.from({length: 24}, (_, i) => {
          const on = f > 806 + i * 2.4;
          return <div key={"d" + i} style={{position: "absolute", left: TERM.x - 280 + (i % 12) * 46, top: TERM.y + 480 + Math.floor(i / 12) * 46,
            width: 18, height: 18, borderRadius: 9, background: on ? GRN : "#2a3a30",
            boxShadow: on ? "0 0 10px rgba(125,216,160,0.7)" : undefined}}/>;
        })}

        {/* WEAKNESS: hub + agency ring + padlock hanging open beside it */}
        <div style={{position: "absolute", left: HUB.x - 130, top: HUB.y - 130, width: 260, height: 260,
          borderRadius: 130, border: `7px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d2b24", boxShadow: `0 0 ${30 + 40 * threadGlow}px rgba(224,73,46,${0.25 + 0.5 * threadGlow})`,
          opacity: clamp01((f - 920) / 20),
          transform: `scale(${(0.7 + 0.3 * clamp01((f - 920) / 20)) * (1 + 0.12 * Math.sin(Math.PI * clamp01((f - 1087) / 14)))})`}}>
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 52, color: INK, letterSpacing: 6, opacity: 1 - hubSwap}}>NCIC</span>
          {/* v4: the hub itself becomes the open padlock - "a door the FBI can't lock". Drawn metaphor;
              no traffic depicted through it. Caption carries the sentence, so no duplicate on-board text. */}
          {f >= 1048 && (
            <svg width="260" height="260" style={{position: "absolute", left: 0, top: 0, overflow: "visible", opacity: lockP}}>
              <g transform="translate(130 150) scale(1.15)">
                <g transform={`rotate(${shackleRot} -38 -20)`}><DrawOn paths={LOCK_SHACKLE} p={lockP}/></g>
                <g transform="translate(-55 -20)"><DrawOn paths={LOCK_BODY} p={lockP}/></g>
              </g>
            </svg>
          )}
        </div>
        {Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
          const r = 330;
          const p = agencyPop(i);
          if (p <= 0) return null;
          return (
            <div key={"a" + i} style={{position: "absolute",
              left: HUB.x + Math.cos(a) * r - 46, top: HUB.y + Math.sin(a) * r * 1.06 - 30,
              width: 92, height: 60, background: CARD, border: "3px solid #26352f",
              transform: `scale(${0.4 + 0.6 * p})`, opacity: p, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width="40" height="34" viewBox="0 0 40 34">
                <path d="M4 14 L20 4 L36 14 Z M8 16 V28 M16 16 V28 M24 16 V28 M32 16 V28 M4 30 H36" fill="none" stroke="#26352f" strokeWidth="3"/>
              </svg>
            </div>
          );
        })}

        {/* BREACH: editorial only - AP card assembles; questions punch in the fixed overlay */}
        <PaperCard x={APCARD.x} y={APCARD.y} rot={-2} f={f} enter={1138} w={640}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 24, color: DIM, letterSpacing: 2}}>ASSOCIATED PRESS, 21 NOV 2026</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 40, color: "#26352f", marginTop: 10, lineHeight: 1.25}}>
            {["FBI investigating", "an apparent breach,", "found in recent days"].map((line, i) => {
              const lp = clamp01((f - (1155 + i * 13)) / 10);
              return (
                <div key={line} style={{opacity: lp, transform: `translateY(${14 * (1 - lp)}px)`}}>{line}</div>
              );
            })}
          </div>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 20, color: DIM, marginTop: 12}}>apnews.com - single-source report; FBI had not publicly confirmed</div>
        </PaperCard>

        {/* SECOND: claimed breach card + slow-creeping cracks (mechanism animates the dwell) */}
        <PaperCard x={SECOND.x} y={SECOND.y} rot={2} f={f} enter={1452} w={560} stamp="CLAIMED" stampAt={1489}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 24, color: DIM, letterSpacing: 2}}>TWO MONTHS EARLIER</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 34, color: "#26352f", marginTop: 10, lineHeight: 1.3}}>
            Extortion gang says it breached a platform behind the FBI's jobs website
          </div>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 20, color: DIM, marginTop: 12, paddingRight: 150, paddingBottom: 40}}>A claim, not proof - no indication the two are linked</div>
        </PaperCard>
        {/* v4: the crack runs on the board beside the card (never across its text), from "breached" toward the cause */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
          <DrawOn paths={sPath("M5610 860 L5585 960 L5625 1030 L5575 1110 L5612 1190", RED, 5, 90)} p={clamp01((f - 1503) / 89)}/>
          <DrawOn paths={sPath("M5585 960 L5525 990 M5575 1110 L5515 1140", RED, 4, 91)} p={clamp01((f - 1540) / 52)}/>
        </svg>
        <PaperCard x={SECOND.x + 60} y={SECOND.y + 490} rot={-3} f={f} enter={1588} w={380}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 26, color: "#26352f"}}>unpatched software</div>
          <svg width="340" height="120" style={{overflow: "visible"}}>
            <DrawOn paths={sRect(320, 100, "#26352f", 5, 61)} p={clamp01((f - 1594) / 12)}/>
            <DrawOn paths={sPath("M160 10 L120 50 L170 60 L140 95", RED, 6, 62)} p={clamp01((f - 1606) / 10)}/>
            <DrawOn paths={sPath("M160 10 L200 45 L180 70 L215 95", RED, 6, 63)} p={clamp01((f - 1612) / 10)}/>
          </svg>
        </PaperCard>

        {/* STAKES: pullback; one last pulse arrives at the photo as the sentence lands */}
        {/* v4: no duplicate on-board sentence (caption carries it); the last query lands on the photo on "handcuffs" */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
          <Pulse c={[3320, 620, 2800, 560, 2100, 520, 1500, 570]} f={f} start={1688} period={400} dur={40} r={14}/>
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

      {/* OUT: fade to end card */}
      <div style={{position: "absolute", inset: 0, background: BOARD, opacity: clamp01((f - 1904) / 30), pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
        {/* v4: exact handle per README end-card rule; slow push + a query pulse looping the underline so it never parks */}
        <div style={{transform: `scale(${1 + 0.05 * clamp01((f - 1904) / 142)})`, textAlign: "center"}}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 30, color: DIM, letterSpacing: 6, opacity: clamp01((f - 1916) / 16)}}>TECH WHO KNOWS</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 92, color: INK, marginTop: 14,
            opacity: clamp01((f - 1922) / 16), transform: `translateY(${18 * (1 - clamp01((f - 1922) / 16))}px)`}}>Follow @techwhoknows</div>
          <svg width="760" height="40" style={{marginTop: 18, overflow: "visible"}}>
            <DrawOn paths={sLine(20, 20, 740, 20, RED, 7, 95)} p={clamp01((f - 1936) / 20)}/>
            {f >= 1956 && (() => {
              const t = ((f - 1956) % 45) / 45;
              const x = 20 + 720 * t;
              const env = Math.sin(Math.PI * t);
              return <g opacity={env}><circle cx={x} cy={20} r={26} fill={RED} opacity={0.2}/><circle cx={x} cy={20} r={11} fill={RED}/><circle cx={x} cy={20} r={5} fill="#fff4ec"/></g>;
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};
