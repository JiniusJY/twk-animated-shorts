import React from "react";
import {useCurrentFrame, interpolate, spring, Img, staticFile} from "remotion";
import {sPath, sRect, sLine, DrawOn, clamp01} from "./sketch";
import {Captions} from "./Captions";
import ep2Words from "./ep2-words.json";

/**
 * BOARD EPISODE - full ep2 rebuild in the approved case-board language.
 * One continuous board world (6600px), camera journeys through 8 beats.
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
const SECOND = {x: 5450, y: 700};

const PhotoCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; img: string;
  label: string; credit: string; w?: number}> = ({x, y, rot, f, enter, img, label, credit, w = 480}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w,
      transform: `rotate(${rot}deg) scale(${0.55 + 0.45 * pop}) translateY(${40 * (1 - pop)}px)`,
      opacity: pop, background: CARD, padding: "16px 16px 12px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      <Img src={staticFile(img)} style={{width: w - 32, height: 300, objectFit: "cover",
        filter: "contrast(1.08) saturate(0.82) sepia(0.14)"}}/>
      <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 26, color: "#26352f", marginTop: 10}}>{label}</div>
      <div style={{fontFamily: "Arial,sans-serif", fontSize: 14, color: DIM, marginTop: 4}}>{credit}</div>
      <div style={{position: "absolute", top: -16, left: w / 2 - 16, width: 22, height: 22, borderRadius: 11,
        background: RED, boxShadow: "0 3px 8px rgba(0,0,0,0.5)"}}/>
    </div>
  );
};

const PaperCard: React.FC<{x: number; y: number; rot: number; f: number; enter: number; w: number;
  stamp?: string; stampColor?: string; children: React.ReactNode}> = ({x, y, rot, f, enter, w, stamp, stampColor = RED, children}) => {
  const pop = spring({frame: Math.max(0, f - enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w,
      transform: `rotate(${rot}deg) scale(${0.55 + 0.45 * pop})`, opacity: pop,
      background: CARD, padding: "22px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)"}}>
      {children}
      {stamp && (
        <div style={{position: "absolute", right: 14, bottom: 14, transform: "rotate(-9deg)",
          border: `5px solid ${stampColor}`, borderRadius: 6, padding: "2px 12px",
          fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 26, color: stampColor, letterSpacing: 2}}>{stamp}</div>
      )}
    </div>
  );
};

const LOCK_BODY = sRect(110, 84, RED, 7, 31);
const LOCK_SHACKLE = sPath("M-38 -20 L-38 -52 A38 38 0 0 1 38 -52 L38 -20", RED, 7, 32);

// threads from earlier cards into the hub (drawn during WEAKNESS)
const THREADS = [
  {p: sPath(`M${HUB.x} ${HUB.y} C 3400 900, 2400 700, 1500 570`, RED, 7, 41), start: 960},   // traffic stop
  {p: sPath(`M${HUB.x} ${HUB.y} C 3600 1000, 3100 700, 2500 560`, RED, 7, 42), start: 975},   // cabinet
  {p: sPath(`M${HUB.x} ${HUB.y} C 3800 960, 3600 720, 3320 620`, RED, 7, 43), start: 990},    // terminal
];

const DRAWER_LABELS = ["WANTED", "MISSING", "STOLEN CARS", "STOLEN GUNS", "PROTECTION"];

export const BoardEpisode: React.FC = () => {
  const f = useCurrentFrame();

  // ---- camera journey ----
  const lookX = interpolate(f,
    [0, 105, 190, 470, 730, 775, 890, 950, 1125, 1185, 1365, 1470, 1695, 1780, 1851, 2046],
    [600, 600, 1550, 2450, 2450, 3300, 3300, 4200, 4200, 4800, 4950, 5730, 5730, 3300, 1700, 1700],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lookY = interpolate(f,
    [0, 900, 1125, 1410, 1695, 1851, 2046],
    [1000, 960, 860, 900, 960, 640, 640],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cam = interpolate(f,
    [0, 60, 900, 1050, 1125, 1695, 1851, 2046],
    [1.25, 1.06, 1.06, 1.32, 1.2, 1.06, 1.3, 1.7],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camX = lookX - 540 / cam, camY = lookY - 960 / cam;

  // ---- shared progress ----
  const dim = interpolate(f, [1020, 1060, 1090, 1125], [0, 0.55, 0.55, 0.3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const threadGlow = interpolate(f, [1020, 1060], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const stakesPulse = f >= 1800 && f < 1840 ? 1 + Math.sin((f - 1800) / 40 * Math.PI) * 0.5 : 1;
  const lockPop = spring({frame: Math.max(0, f - 1062), fps: 30, config: {damping: 12, stiffness: 200, mass: 0.8}});
  const shackleRot = interpolate(lockPop, [0.55, 1], [0, -40], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockP = clamp01((f - 1048) / 16);
  const counter90 = Math.floor(interpolate(f, [968, 1008], [0, 90000], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const typed = "STATUS: ONLINE  24/7/365";
  const typedN = Math.floor(clamp01((f - 740) / 40) * typed.length);

  const layerStyle = (k: number, blur = 0): React.CSSProperties => ({
    position: "absolute", left: 0, top: 0, width: W, height: H,
    transform: `scale(${1 + (cam - 1) * k}) translate(${-camX * k}px, ${-camY * k}px)`,
    transformOrigin: "0 0", filter: blur ? `blur(${blur}px)` : undefined,
  });

  // fixed-overlay headline per beat
  const headline = f < 105 ? "Someone may have just broken in."
    : f < 390 ? "One FBI system answers."
    : f < 730 ? "21 drawers. 12 million records."
    : f < 900 ? "It never closes."
    : f < 1125 ? "Every connection is a door."
    : f < 1410 ? "An apparent breach."
    : f < 1695 ? "The second time in two months."
    : f < 1851 ? "Every line can put a real person in handcuffs."
    : "Follow Tech Who Knows.";
  const beatStart = f < 105 ? 4 : f < 390 ? 108 : f < 730 ? 393 : f < 900 ? 733 : f < 1125 ? 903 : f < 1410 ? 1128 : f < 1695 ? 1413 : f < 1851 ? 1698 : 1854;

  const drawerOn = (i: number) => clamp01((f - (400 + i * 6)) / 10);
  const agencyPop = (i: number) => spring({frame: Math.max(0, f - (1000 + i * 4)), fps: 30, config: {damping: 13, stiffness: 240, mass: 0.6}});

  return (
    <div style={{position: "absolute", inset: 0, background: BOARD, overflow: "hidden"}}>
      {/* deep background plane */}
      <div style={{...layerStyle(0.45, 2.5), opacity: 0.6}}>
        <svg width={W} height={H}>
          {Array.from({length: 67}, (_, i) => <line key={"v" + i} x1={i * 100} y1="0" x2={i * 100} y2={H} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          {Array.from({length: 20}, (_, i) => <line key={"h" + i} x1="0" y1={i * 100} x2={W} y2={i * 100} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          <text x="3300" y="1150" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="720" fill={INK} opacity="0.04">NCIC</text>
        </svg>
      </div>

      {/* main plane */}
      <div style={layerStyle(1)}>
        {/* threads into the hub */}
        <svg width={W} height={H} style={{position: "absolute", inset: 0,
          filter: threadGlow > 0 || stakesPulse > 1 ? `drop-shadow(0 0 ${14 * Math.max(threadGlow, stakesPulse - 1)}px ${RED})` : undefined}}>
          {THREADS.map((t, i) => {
            const p = clamp01((f - t.start) / 40);
            return (
              <g key={i} opacity={0.35 + 0.65 * Math.max(threadGlow, stakesPulse - 1, p > 0.99 ? 0.75 : 0)}>
                <DrawOn paths={t.p} p={p}/>
              </g>
            );
          })}
        </svg>

        {/* HOOK: face-down card, thread snaps in, card flips to NCIC */}
        {(() => {
          const flip = interpolate(f, [70, 95], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const pop = spring({frame: Math.max(0, f - 4), fps: 30, config: {damping: 13, stiffness: 200, mass: 0.8}});
          return (
            <div style={{position: "absolute", left: 460, top: 880, width: 300, height: 380,
              transform: `scale(${0.6 + 0.4 * pop}) rotate(${-3 + flip * 3}deg) scaleX(${Math.abs(1 - flip * 2)})`,
              opacity: pop, background: flip < 0.5 ? "#232f28" : CARD,
              border: `6px solid ${flip < 0.5 ? RED : "#26352f"}`, boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              {flip >= 0.5 && <span style={{fontFamily: "Arial,sans-serif", fontWeight: 800, fontSize: 58, color: "#26352f", letterSpacing: 5}}>NCIC</span>}
            </div>
          );
        })()}
        <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
          <DrawOn paths={sPath("M2300 1500 C 1600 1400, 1000 1200, 640 1080", RED, 8, 40)} p={clamp01((f - 10) / 50)}/>
        </svg>

        {/* SYSTEM: traffic stop + one-system label */}
        <PhotoCard x={TRAFFIC.x} y={TRAFFIC.y} rot={-3} f={f} enter={130} img="photos/traffic-stop.jpg"
          label="The answer routinely comes from one FBI system" credit="Ildar Sagdejev, CC BY-SA 4.0"/>
        <PaperCard x={1500} y={880} rot={2} f={f} enter={310} w={520}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 22, color: DIM, letterSpacing: 3}}>NATIONAL CRIME INFORMATION CENTER</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 64, color: "#26352f", marginTop: 8}}>NCIC</div>
        </PaperCard>

        {/* DRAWERS: filing cabinet + counters */}
        <PaperCard x={CABINET.x} y={CABINET.y} rot={-2} f={f} enter={395} w={760}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 22, color: DIM, letterSpacing: 3, marginBottom: 12}}>A FILING CABINET WITH 21 DRAWERS</div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8}}>
            {Array.from({length: 21}, (_, i) => (
              <div key={i} style={{height: 44, background: i < 5 ? "#d8cba8" : "#c9c2ab",
                border: "2px solid #26352f", opacity: drawerOn(i), transform: `rotateX(${(1 - drawerOn(i)) * 70}deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 11, color: "#26352f"}}>
                {DRAWER_LABELS[i] || ""}
              </div>
            ))}
          </div>
          <div style={{display: "flex", gap: 40, marginTop: 18, fontFamily: "monospace"}}>
            <div>
              <div style={{fontSize: 54, fontWeight: 700, color: "#26352f"}}>{f >= 610 ? "12M" : ""}</div>
              <div style={{fontSize: 20, color: DIM}}>active records</div>
            </div>
            <div>
              <div style={{fontSize: 54, fontWeight: 700, color: "#26352f"}}>{f >= 676 ? "10M" : ""}</div>
              <div style={{fontSize: 20, color: DIM}}>checks a day</div>
            </div>
          </div>
        </PaperCard>

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
        {/* crossed-out office hours */}
        <PaperCard x={TERM.x - 240} y={TERM.y + 260} rot={-2} f={f} enter={884} w={300}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 30, color: "#26352f"}}>OFFICE HOURS 9-5</div>
          <svg width="280" height="60" style={{position: "absolute", left: 10, top: 10, overflow: "visible"}}>
            <DrawOn paths={sLine(10, 30, 260, 30, RED, 9, 55)} p={clamp01((f - 896) / 12)}/>
            <DrawOn paths={sLine(10, 50, 260, 10, RED, 9, 56)} p={clamp01((f - 902) / 12)}/>
          </svg>
        </PaperCard>
        {/* status dots */}
        {Array.from({length: 24}, (_, i) => {
          const on = f > 806 + i * 2.4;
          return <div key={"d" + i} style={{position: "absolute", left: TERM.x - 280 + (i % 12) * 46, top: TERM.y + 480 + Math.floor(i / 12) * 46,
            width: 18, height: 18, borderRadius: 9, background: on ? GRN : "#2a3a30",
            boxShadow: on ? "0 0 10px rgba(125,216,160,0.7)" : undefined}}/>;
        })}

        {/* WEAKNESS: hub + agency ring + 90,000+ + padlock */}
        <div style={{position: "absolute", left: HUB.x - 130, top: HUB.y - 130, width: 260, height: 260,
          borderRadius: 130, border: `7px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d2b24", boxShadow: `0 0 ${30 + 40 * threadGlow}px rgba(224,73,46,${0.25 + 0.5 * threadGlow})`,
          opacity: clamp01((f - 920) / 20), transform: `scale(${0.7 + 0.3 * clamp01((f - 920) / 20)})`}}>
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 52, color: INK, letterSpacing: 6}}>NCIC</span>
        </div>
        {Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
          const r = 430;
          const p = agencyPop(i);
          if (p <= 0) return null;
          return (
            <div key={"a" + i} style={{position: "absolute",
              left: HUB.x + Math.cos(a) * r - 55, top: HUB.y + Math.sin(a) * r * 1.06 - 36,
              width: 110, height: 72, background: CARD, border: "3px solid #26352f",
              transform: `scale(${0.4 + 0.6 * p})`, opacity: p, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center"}}>
              <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 18, color: "#26352f"}}>AGENCY</span>
            </div>
          );
        })}
        <div style={{position: "absolute", left: HUB.x - 260, top: HUB.y + 330, width: 520, textAlign: "center",
          fontFamily: "monospace", fontSize: 44, fontWeight: 700, color: GRN, opacity: clamp01((f - 965) / 10)}}>
          {counter90 >= 90000 ? "90,000+" : counter90.toLocaleString("en-US")}
        </div>
        <div style={{position: "absolute", left: HUB.x - 260, top: HUB.y + 386, width: 520, textAlign: "center",
          fontFamily: "Arial,sans-serif", fontSize: 24, color: DIM, opacity: clamp01((f - 985) / 10)}}>agencies connected</div>
        {/* drawn open padlock */}
        {f >= 1048 && (
          <div style={{position: "absolute", left: HUB.x, top: 560, opacity: lockP}}>
            <svg width="300" height="300" style={{overflow: "visible", transform: "translate(-150px -130px)"}}>
              <g transform={`translate(150 150) rotate(${shackleRot} -38 -20)`}>
                <DrawOn paths={LOCK_SHACKLE} p={lockP}/>
              </g>
              <g transform="translate(150 150)"><g transform="translate(-55 -20)"><DrawOn paths={LOCK_BODY} p={lockP}/></g></g>
            </svg>
            <div style={{position: "absolute", top: 230, width: 640, left: -320, textAlign: "center",
              fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 54, color: INK,
              opacity: clamp01((f - 1082) / 14)}}>a door the FBI can't lock.</div>
          </div>
        )}

        {/* BREACH: AP card + three UNKNOWN question cards */}
        <PaperCard x={APCARD.x} y={APCARD.y} rot={-2} f={f} enter={1138} w={640}>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 20, color: DIM, letterSpacing: 3}}>ASSOCIATED PRESS, 21 NOV 2026</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 40, color: "#26352f", marginTop: 10, lineHeight: 1.25}}>
            FBI investigating an apparent breach, found in recent days
          </div>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 16, color: DIM, marginTop: 12}}>apnews.com - single-source report; FBI had not publicly confirmed</div>
        </PaperCard>
        {["WHO GOT IN?", "HOW?", "ANYTHING TAKEN?"].map((q, i) => (
          <PaperCard key={q} x={APCARD.x - 60 + i * 260} y={APCARD.y + 520 + (i % 2) * 60} rot={[-3, 2, -1][i]} f={f}
            enter={1298 + i * 14} w={300} stamp="UNKNOWN">
            <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 30, color: "#26352f", paddingRight: 20, paddingBottom: 52}}>{q}</div>
          </PaperCard>
        ))}

        {/* SECOND: claimed breach card + cracked window */}
        <PaperCard x={SECOND.x} y={SECOND.y} rot={2} f={f} enter={1422} w={560} stamp="CLAIMED">
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 20, color: DIM, letterSpacing: 3}}>TWO MONTHS EARLIER</div>
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 34, color: "#26352f", marginTop: 10, lineHeight: 1.3}}>
            Extortion gang says it breached a platform behind the FBI's jobs website
          </div>
          <div style={{fontFamily: "Arial,sans-serif", fontSize: 16, color: DIM, marginTop: 12}}>A claim, not proof - no indication the two are linked</div>
        </PaperCard>
        <PaperCard x={SECOND.x + 80} y={SECOND.y + 470} rot={-3} f={f} enter={1588} w={380}>
          <div style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 26, color: "#26352f"}}>unpatched software</div>
          <svg width="340" height="120" style={{overflow: "visible"}}>
            <DrawOn paths={sRect(320, 100, "#26352f", 5, 61)} p={clamp01((f - 1594) / 12)}/>
            <DrawOn paths={sPath("M160 10 L120 50 L170 60 L140 95", RED, 6, 62)} p={clamp01((f - 1606) / 10)}/>
            <DrawOn paths={sPath("M160 10 L200 45 L180 70 L215 95", RED, 6, 63)} p={clamp01((f - 1612) / 10)}/>
          </svg>
        </PaperCard>

        {/* STAKES: push into the traffic-stop card; record line highlights */}
        {f >= 1780 && (
          <div style={{position: "absolute", left: TRAFFIC.x + 80, top: TRAFFIC.y + 420, width: 560,
            fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 40, color: INK,
            opacity: clamp01((f - 1790) / 16)}}>every line can put a real person in handcuffs.</div>
        )}
      </div>

      {/* foreground scraps */}
      <div style={{...layerStyle(1.28, 7), opacity: 0.5, pointerEvents: "none"}}>
        <div style={{position: "absolute", left: 900, top: 1500, width: 300, height: 380, background: CARD, transform: "rotate(14deg)"}}/>
        <div style={{position: "absolute", left: 2900, top: 650, width: 260, height: 330, background: "#d9d2ba", transform: "rotate(-11deg)"}}/>
        <div style={{position: "absolute", left: 5100, top: 1560, width: 280, height: 360, background: CARD, transform: "rotate(9deg)"}}/>
      </div>

      {/* dim (weakness beat) */}
      <div style={{position: "absolute", inset: 0, background: "#050a08", opacity: dim, pointerEvents: "none"}}/>

      {/* FIXED safe overlay */}
      <div style={{position: "absolute", left: 64, top: 84, pointerEvents: "none"}}>
        <div style={{fontFamily: "Arial,sans-serif", fontSize: 24, letterSpacing: 4, color: RED, opacity: clamp01(f / 18)}}>AMERICA'S CRIME DATABASE</div>
        <div key={headline} style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 70, color: INK, marginTop: 14,
          opacity: clamp01((f - beatStart) / 14), maxWidth: 900}}>{headline}</div>
        <div style={{width: 340 * clamp01((f - 10) / 22), height: 6, background: RED, marginTop: 16}}/>
      </div>

      {/* word captions (fixed safe layer, above all board planes) */}
      <Captions words={ep2Words as {w: string; s: number; e: number}[]} config={{theme: "editorial"}}/>

      {/* OUT: fade to end card */}
      <div style={{position: "absolute", inset: 0, background: BOARD, opacity: clamp01((f - 1904) / 30), pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
        <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 84, color: INK, opacity: clamp01((f - 1916) / 20)}}>Tech Who Knows</div>
        <div style={{fontFamily: "Arial,sans-serif", fontSize: 30, color: RED, letterSpacing: 6, marginTop: 18, opacity: clamp01((f - 1930) / 20)}}>FOLLOW FOR THE NEXT ONE</div>
      </div>
    </div>
  );
};
