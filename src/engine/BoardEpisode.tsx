import React from "react";
import {useCurrentFrame, interpolate, spring} from "remotion";
import {clamp01} from "./sketch";
import {Captions} from "./Captions";
import ep2Words from "./ep2-words.json";
import {EndCard} from "./EndCard";
import {CARDS, ENTER, W, H, BUILT_LINKS, FOCUS, cameraAt, linkById, reverseCubic, ringBoxes, type Cubic} from "./boardLayout";
import {
  BOARD_PALETTE as P, kickEnvelope, shakeEnvelope, parallaxLayer, PhotoCard, PaperCard, LineAssemble, LetterReveal,
  QueryPulse, Shockwave, StringNetwork, PunchOverlay, dimTrack, SceneDim, DrawerGrid, CategoryChip, Terminal,
  StatusDots, Strike, Padlock, NodeBox, FlipRevealCard, type Punch, type DrawerHighlight,
} from "./devices";

/**
 * BOARD EPISODE (ep2, NCIC) - "demonstrate, don't describe" (docs/EP2_REDESIGN.md).
 * The case board is a LIVING SYSTEM: query pulses travel the strings as the VO names the
 * mechanism. Breach stays editorial (origin/path/method unknown).
 *
 * This file is now the episode's SCRIPT for the device library (src/engine/devices, docs/DEVICES.md):
 * layout lives in boardLayout.ts, every visual is a device, and what remains here is timing
 * (frames from the shipped take's words.json, run 45010023328, stats-omitted VO):
 *   HOOK     0-110    "Someone may have just broken into..." (0.22-3.52s)
 *   SYSTEM   110-423  traffic stop 6.74s, NCIC name 11.28s
 *   DRAWERS  423-678  cabinet 14.52s, 22 drawers 15.28s
 *   ALWAYSON 678-895  never closes 22.64s, jan 1967 24.12s, business hours 28.72s
 *   WEAKNESS 895-1100 weakness 29.84s, 90,000 31.5s, can't lock 35.56s
 *   BREACH   1100-1375 AP 36.7s, apparent breach 39.34s, don't know 42.0s
 *   SECOND   1375-1624 second time 45.88s, gang 47.5s, unpatched 52.6s
 *   STAKES   1624-1851 handcuffs 57.28s, five-alarm 60.2s
 *   OUT      1851-2014 follow 61.7s, VO ends 63.58s
 */

const TRAFFIC = CARDS.photo, CABINET = CARDS.cabinet, APCARD = CARDS.ap, SECOND = CARDS.second;

// word-locked camera kicks (zoom impulse) and the hook shake, scene layers only
const kickAt = kickEnvelope([[26, 0.07], [458, 0.04], [945, 0.04], [1067, 0.05], [1191, 0.05],
  [1453, 0.06], [1578, 0.04], [1718, 0.05], [1806, 0.06]]);
const shakeAt = shakeEnvelope([26]);

// drawer categories light up on the spoken word
const DRAWER_HL: DrawerHighlight[] = [
  {i: 0, at: 480, label: "WANTED FUGITIVES"},
  {i: 1, at: 533, label: "MISSING PERSONS"},
  {i: 2, at: 569, label: "STOLEN CARS"},
  {i: 3, at: 600, label: "STOLEN GUNS"},
  {i: 4, at: 630, label: "PROTECTION ORDERS"},
];
const DRAWERS_UNTIL = 679;

// fixed-overlay punches, locked to the spoken words
const PUNCHES: Punch[] = [
  {at: 785, hold: 34, text: "24/7", sub: "never closes"},
  {at: 943, hold: 52, text: "90,000+", sub: "agencies connected", dy: -380},
  {at: 1265, hold: 19, text: "WHO GOT IN?"},
  {at: 1286, hold: 19, text: "HOW?"},
  {at: 1307, hold: 38, text: "ANYTHING TAKEN?"},
  {at: 1376, hold: 40, text: "2ND TIME", sub: "in two months"},
];
const punchDimAt = dimTrack([[785, 795, 809, 819, 0.62], [943, 953, 995, 1005, 0.62], [1263, 1271, 1337, 1345, 0.74], [1376, 1384, 1408, 1416, 0.62]]);

export const BoardEpisode: React.FC = () => {
  const f = useCurrentFrame();

  // camera: one held shot per topic (boardLayout.SHOTS) + word-locked kicks
  const shot = cameraAt(f);
  const zoom = shot.zoom * (1 + kickAt(f));
  const shake = shakeAt(f);
  const cam = {zoom, x: shot.cx - FOCUS.x / zoom + shake, y: shot.cy - FOCUS.y / zoom + shake * 0.6};

  // shared progress
  const dim = interpolate(f, [1000, 1040, 1070, 1100], [0, 0.55, 0.55, 0.3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const threadGlow = interpolate(f, [1000, 1040], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const stakesPulse = f >= 1806 && f < 1858 ? 1 + Math.sin((f - 1806) / 52 * Math.PI) * 0.5 : 1;
  const hubSwap = clamp01((f - 1020) / 8);
  const agencyPop = (i: number) => spring({frame: Math.max(0, f - (980 + i * 4)), fps: 30, config: {damping: 13, stiffness: 240, mass: 0.6}});
  const paperInk = {color: P.PAPER_INK};

  return (
    <div style={{position: "absolute", inset: 0, background: P.BOARD, overflow: "hidden"}}>
      {/* deep background plane */}
      <div style={{...parallaxLayer(W, H, cam, 0.45, 2.5), opacity: 0.6}}>
        <svg width={W} height={H}>
          {Array.from({length: 67}, (_, i) => <line key={"v" + i} x1={i * 100} y1="0" x2={i * 100} y2={H} stroke={P.INK} strokeWidth="1" opacity="0.06"/>)}
          {Array.from({length: 20}, (_, i) => <line key={"h" + i} x1="0" y1={i * 100} x2={W} y2={i * 100} stroke={P.INK} strokeWidth="1" opacity="0.06"/>)}
          <text x="3300" y="1150" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="720" fill={P.INK} opacity="0.04">NCIC</text>
        </svg>
      </div>

      {/* main plane */}
      <div style={parallaxLayer(W, H, cam, 1)}>
        <StringNetwork links={BUILT_LINKS} f={f} w={W} h={H}
          glow={Math.max(threadGlow, stakesPulse - 1)}
          glowOf={(l) => Math.max(stakesPulse - 1, l.id === "term-hub" ? threadGlow : 0)}/>

        {/* alarm shockwaves: hook, breach, five-alarm payoff */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible"}}>
          <Shockwave x={CARDS.hook.x + CARDS.hook.w / 2} y={CARDS.hook.y + CARDS.hook.h / 2} f={f} times={[0, 11, 26, 31, 49]} r0={190} grow={560}/>
          <Shockwave x={APCARD.x + APCARD.w / 2} y={APCARD.y + APCARD.h / 2} f={f} times={[1191, 1201]} r0={300} grow={420}/>
          <Shockwave x={TRAFFIC.x + TRAFFIC.w / 2} y={TRAFFIC.y + TRAFFIC.h / 2} f={f} times={[1806, 1816, 1826]} r0={280} grow={700}/>
        </svg>

        {/* HOOK: face-down card cracks on "broken", flips to NCIC */}
        <FlipRevealCard rect={CARDS.hook} f={f} word="NCIC" crackAt={26} flipAt={75} letterAt={81}/>

        {/* SYSTEM: traffic stop photo; a query pulse runs to the NCIC card */}
        <PhotoCard x={TRAFFIC.x} y={TRAFFIC.y} w={TRAFFIC.w} h={TRAFFIC.h} rot={-3} f={f} enter={ENTER.photo} img="photos/traffic-stop.jpg"/>
        <PaperCard x={CARDS.ncic.x} y={CARDS.ncic.y} rot={2} f={f} enter={ENTER.ncic} w={CARDS.ncic.w} h={CARDS.ncic.h}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 26, color: P.DIM, letterSpacing: 2}}>
            <LetterReveal text="NATIONAL CRIME INFORMATION CENTER" f={f} start={340} step={1.1}/>
          </div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 64, ...paperInk, marginTop: 8}}>NCIC</div>
        </PaperCard>

        {/* DRAWERS: filing cabinet; each category lights on its word, chip names it */}
        <PaperCard x={CABINET.x} y={CABINET.y} rot={-2} f={f} enter={ENTER.cabinet} w={CABINET.w} h={CABINET.h}>
          <DrawerGrid f={f} count={22} cols={11} openAt={433} highlights={DRAWER_HL} until={DRAWERS_UNTIL} title="22 DRAWERS"/>
        </PaperCard>
        <CategoryChip rect={CARDS.drawerChip} f={f} highlights={DRAWER_HL} until={DRAWERS_UNTIL} outAt={658}/>

        {/* ALWAYS ON: terminal + 1967 chip + crossed-out office hours + status lights */}
        <Terminal rect={CARDS.terminal} f={f} enter={ENTER.terminal} typed="STATUS: ONLINE  24/7/365" typeAt={688}
          subline="agencies connected" counter={{from: 0, to: 90000, at: 948, dur: 40, final: "90,000+"}}/>
        <PaperCard x={CARDS.chip1967.x} y={CARDS.chip1967.y} rot={3} f={f} enter={ENTER.chip1967} w={CARDS.chip1967.w} h={CARDS.chip1967.h}>
          <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 32, ...paperInk, lineHeight: 1.15}}>since<br/>January 1967</div>
        </PaperCard>
        <PaperCard x={CARDS.office.x} y={CARDS.office.y} rot={-2} f={f} enter={ENTER.office} w={CARDS.office.w} h={CARDS.office.h}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 30, ...paperInk}}>OFFICE HOURS 9-5</div>
          <Strike f={f} at={862}/>
        </PaperCard>
        <StatusDots rect={CARDS.dots} f={f} enter={ENTER.dots} count={24} cols={12}/>

        {/* WEAKNESS: hub becomes the open padlock; agency ring around it */}
        <div style={{position: "absolute", left: CARDS.hub.x, top: CARDS.hub.y, width: CARDS.hub.w, height: CARDS.hub.h, boxSizing: "border-box",
          borderRadius: 130, border: `7px solid ${P.INK}`, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d2b24", boxShadow: `0 0 ${30 + 40 * threadGlow}px rgba(224,73,46,${0.25 + 0.5 * threadGlow})`,
          opacity: clamp01((f - ENTER.hub) / 20),
          transform: `scale(${(0.7 + 0.3 * clamp01((f - ENTER.hub) / 20)) * (1 + 0.12 * Math.sin(Math.PI * clamp01((f - 1067) / 14)))})`}}>
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 52, color: P.INK, letterSpacing: 6, opacity: 1 - hubSwap}}>NCIC</span>
          <Padlock f={f} drawAt={1028} openAt={1067}/>
        </div>
        {ringBoxes().map((b, i) => <NodeBox key={"a" + i} rect={b} p={agencyPop(i)}/>)}

        {/* BREACH: editorial only - AP report assembles; questions punch in the fixed overlay */}
        <PaperCard x={APCARD.x} y={APCARD.y} rot={-2} f={f} enter={ENTER.ap} w={APCARD.w} h={APCARD.h}>
          <LineAssemble f={f} style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 40, ...paperInk, lineHeight: 1.25}}
            lines={[["FBI investigating", 1130], ["an apparent breach,", 1143], ["found in recent days", 1156]]}/>
        </PaperCard>

        {/* SECOND: the gang's claim assembles on the spoken words */}
        <PaperCard x={SECOND.x} y={SECOND.y} rot={2} f={f} enter={ENTER.second} w={SECOND.w} h={SECOND.h}>
          <LineAssemble f={f} style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 32, ...paperInk, lineHeight: 1.3, whiteSpace: "nowrap"}}
            lines={[["Extortion gang says", 1419], ["it breached a platform", 1477], ["behind the FBI's jobs website", 1507], ["through unpatched software", 1578]]}/>
        </PaperCard>

        {/* STAKES: the last query lands back on the photo on "handcuffs" */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
          <QueryPulse c={reverseCubic(linkById("photo-ncic").route) as Cubic} f={f} start={1692} period={400} dur={26} r={14}/>
        </svg>
      </div>

      <SceneDim opacity={Math.max(dim, punchDimAt(f))}/>
      <PunchOverlay punches={PUNCHES} f={f}/>

      {/* word captions (fixed safe layer, above all board planes) */}
      <Captions words={ep2Words as {w: string; s: number; e: number}[]} config={{theme: "editorial"}}/>

      {f >= 1908 && <EndCard start={1908} handle="@techwhoknows"/>}
    </div>
  );
};
