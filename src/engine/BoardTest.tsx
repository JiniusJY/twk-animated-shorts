import React from "react";
import {useCurrentFrame, interpolate, spring, Img, staticFile} from "remotion";
import {sPath, sRect, DrawOn, clamp01} from "./sketch";

/**
 * BOARD TEST - v2 motion-design probe: "the case board".
 * Same real VO slice as unfold-test (24.68-38.52s = 415f) so the two are
 * directly comparable. A dark war-room board the camera DOLLIES across in
 * layered parallax; credited real photos pin on with physics, a terminal
 * types, an agency counter rolls, red thread connects every node, then the
 * push-in lands on the unlocked door. All titles/captions live in a FIXED
 * safe overlay - never inside a camera transform (permanent framing rule).
 *
 * Beat map (f @30fps, VO-relative):
 *   0-40   "And it never closes"     CJIS card slams in, thread starts
 *   40-115 "No office hours. 24/7"   dolly to terminal, types ONLINE 24/7/365
 *   115-190 "live. Always on."       agency counter rolls 0 -> 90,000+
 *   190-290 "every patrol car..."    dolly right, 3 more cards, threads draw
 *   290-340 "That's the weakness."   board dims, threads glow
 *   340-415 "a door the FBI can't lock" push into terminal, ACCESS: OPEN
 */

const INK = "#e8e2d2", RED = "#e0492e", GRN = "#7dd8a0", BOARD = "#16211c", CARD = "#f1eddd";

const WORLD_W = 2600, WORLD_H = 1920;

// world anchors
const HUB = {x: 1180, y: 880};
const TERM = {x: 950, y: 520};
const CARDS = [
  {img: "photos/cjis-aerial.jpg", x: 96, y: 440, rot: -4, enter: 6,
   label: "CJIS, Clarksburg WV - home of NCIC", credit: "FBI photo, public domain"},
  {img: "photos/traffic-stop.jpg", x: 1420, y: 380, rot: 3, enter: 182,
   label: "Every traffic stop queries it", credit: "Ildar Sagdejev, CC BY-SA 4.0"},
  {img: "photos/fbi-hq.jpg", x: 1960, y: 460, rot: -2, enter: 196,
   label: "Every field office hits it at once", credit: "FBI photo, public domain"},
  {img: "photos/server-rack.jpg", x: 1960, y: 1080, rot: 2, enter: 208,
   label: "One database. Always on.", credit: "Public domain"},
] as const;

const LOCK_BODY = sRect(110, 84, RED, 7, 31);
const LOCK_SHACKLE = sPath("M-38 -20 L-38 -52 A38 38 0 0 1 38 -52 L38 -20", RED, 7, 32);

const THREADS = [
  sPath(`M${HUB.x} ${HUB.y} C 900 700, 640 640, 420 560`, RED, 7, 21),      // to CJIS
  sPath(`M${HUB.x} ${HUB.y} C 1300 800, 1420 700, 1660 560`, RED, 7, 22),    // to traffic stop
  sPath(`M${HUB.x} ${HUB.y} C 1500 880, 1800 800, 2200 640`, RED, 7, 23),    // to FBI HQ
  sPath(`M${HUB.x} ${HUB.y} C 1500 1000, 1800 1120, 2200 1220`, RED, 7, 24), // to server rack
];

const Card: React.FC<{c: (typeof CARDS)[number]; f: number}> = ({c, f}) => {
  const pop = spring({frame: Math.max(0, f - c.enter), fps: 30, config: {damping: 12, stiffness: 220, mass: 0.7}});
  if (pop <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: c.x, top: c.y, width: 480,
      transform: `rotate(${c.rot}deg) scale(${0.55 + 0.45 * pop}) translateY(${40 * (1 - pop)}px)`,
      opacity: pop, background: CARD, padding: "16px 16px 12px",
      boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
    }}>
      <Img src={staticFile(c.img)} style={{width: 448, height: 300, objectFit: "cover",
        filter: "contrast(1.08) saturate(0.82) sepia(0.14)"}}/>
      <div style={{fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 26, color: "#26352f", marginTop: 10}}>{c.label}</div>
      <div style={{fontFamily: "Arial,sans-serif", fontSize: 14, color: "#8a8574", marginTop: 4}}>{c.credit}</div>
      <div style={{position: "absolute", top: -16, left: 224, width: 22, height: 22, borderRadius: 11,
        background: RED, boxShadow: "0 3px 8px rgba(0,0,0,0.5)"}}/>
    </div>
  );
};

export const BoardTest: React.FC = () => {
  const f = useCurrentFrame();

  // ---- camera: dolly across the board, then push into the terminal ----
  const lookX = interpolate(f, [0, 40, 115, 175, 255, 320, 415], [420, 420, 880, 1180, 1700, 1180, 940], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lookY = interpolate(f, [320, 415], [900, 560], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const cam = interpolate(f, [0, 340, 415], [1.06, 1.06, 1.8], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camRot = interpolate(f, [0, 415], [-1.6, 0]);
  const camX = lookX - 540 / cam, camY = lookY - 960 / cam;

  // ---- beat progress ----
  const typed = "STATUS: ONLINE  24/7/365";
  const typedN = Math.floor(clamp01((f - 52) / 40) * typed.length);
  const counter = Math.floor(interpolate(f, [118, 160], [0, 90000], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const dim = interpolate(f, [222, 262, 300, 415], [0, 0.62, 0.62, 0.35], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const threadGlow = interpolate(f, [222, 262], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockPop = spring({frame: Math.max(0, f - 350), fps: 30, config: {damping: 12, stiffness: 200, mass: 0.8}});
  const shackleRot = interpolate(lockPop, [0.55, 1], [0, -40], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const lockP = clamp01((f - 336) / 16);
  const threadP = [clamp01((f - 40) / 45), clamp01((f - 182) / 40), clamp01((f - 196) / 40), clamp01((f - 208) / 40)];

  const layerStyle = (k: number, blur = 0): React.CSSProperties => ({
    position: "absolute", left: 0, top: 0, width: WORLD_W, height: WORLD_H,
    transform: `scale(${1 + (cam - 1) * k}) translate(${-camX * k}px, ${-camY * k}px) rotate(${camRot * k}deg)`,
    transformOrigin: "0 0", filter: blur ? `blur(${blur}px)` : undefined,
  });

  return (
    <div style={{position: "absolute", inset: 0, background: BOARD, overflow: "hidden"}}>
      {/* deep background: blueprint grid + watermark, slowest plane */}
      <div style={{...layerStyle(0.45, 2.5), opacity: 0.6}}>
        <svg width={WORLD_W} height={WORLD_H}>
          {Array.from({length: 27}, (_, i) => <line key={"v" + i} x1={i * 100} y1="0" x2={i * 100} y2={WORLD_H} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          {Array.from({length: 20}, (_, i) => <line key={"h" + i} x1="0" y1={i * 100} x2={WORLD_W} y2={i * 100} stroke={INK} strokeWidth="1" opacity="0.06"/>)}
          <text x="1300" y="1080" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="720" fill={INK} opacity="0.045">NCIC</text>
        </svg>
      </div>

      {/* main plane: cards, hub, threads, terminal, counter */}
      <div style={layerStyle(1)}>
        {/* red threads (under cards) */}
        <svg width={WORLD_W} height={WORLD_H} style={{position: "absolute", inset: 0,
          filter: threadGlow > 0 ? `drop-shadow(0 0 ${14 * threadGlow}px ${RED})` : undefined}}>
          {THREADS.map((t, i) => (
            <g key={i} opacity={0.35 + 0.65 * Math.max(threadGlow, threadP[i] > 0.99 ? 0.75 : 0)}>
              <DrawOn paths={t} p={threadP[i]}/>
            </g>
          ))}
        </svg>

        {CARDS.map((c, i) => <Card key={i} c={c} f={f}/>)}

        {/* NCIC hub node */}
        <div style={{position: "absolute", left: HUB.x - 130, top: HUB.y - 130, width: 260, height: 260,
          borderRadius: 130, border: `7px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#1d2b24", boxShadow: `0 0 ${30 + 40 * threadGlow}px rgba(224,73,46,${0.25 + 0.5 * threadGlow})`,
          opacity: clamp01((f - 30) / 20), transform: `scale(${0.7 + 0.3 * clamp01((f - 30) / 20)})`}}>
          <span style={{fontFamily: "Arial,sans-serif", fontWeight: 700, fontSize: 52, color: INK, letterSpacing: 6}}>NCIC</span>
        </div>

        {/* terminal */}
        <div style={{position: "absolute", left: TERM.x - 330, top: TERM.y - 200, width: 660, height: 400,
          background: "#0b120e", border: `3px solid #33503f`, borderRadius: 10, padding: "26px 30px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          opacity: clamp01((f - 44) / 12) * (1 - interpolate(f, [348, 378], [0, 0.8], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})),
          transform: `translateY(${26 * (1 - clamp01((f - 44) / 12))}px)`}}>
          <div style={{fontFamily: "monospace", fontSize: 30, color: GRN}}>
            {typed.slice(0, typedN)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>&#9608;</span>
          </div>
          <div style={{fontFamily: "monospace", fontSize: 26, color: "#4a7a5f", marginTop: 22}}>
            &gt; agencies connected
          </div>
          <div style={{fontFamily: "monospace", fontSize: 66, fontWeight: 700, color: GRN, marginTop: 6}}>
            {counter >= 90000 ? "90,000+" : counter.toLocaleString("en-US")}
          </div>
        </div>

        {/* drawn open padlock: editorial illustration of "a door the FBI can't lock" */}
        {f >= 336 && (
          <div style={{position: "absolute", left: 940, top: 350, opacity: lockP}}>
            <svg width="300" height="300" style={{overflow: "visible", transform: "translate(-150px -130px)"}}>
              <g transform={`translate(150 150) rotate(${shackleRot} -38 -20)`}>
                <DrawOn paths={LOCK_SHACKLE} p={lockP}/>
              </g>
              <g transform="translate(150 150)"><g transform="translate(-55 -20)"><DrawOn paths={LOCK_BODY} p={lockP}/></g></g>
            </svg>
            <div style={{position: "absolute", top: 260, width: 560, left: -280, textAlign: "center",
              fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 52, color: INK,
              opacity: clamp01((f - 370) / 14)}}>a door the FBI can't lock.</div>
          </div>
        )}

        {/* status dots wave */}
        {Array.from({length: 24}, (_, i) => {
          const on = f > 122 + i * 2.4;
          return <div key={"d" + i} style={{position: "absolute", left: 560 + (i % 12) * 46, top: 1180 + Math.floor(i / 12) * 46,
            width: 18, height: 18, borderRadius: 9, background: on ? GRN : "#2a3a30",
            boxShadow: on ? "0 0 10px rgba(125,216,160,0.7)" : undefined}}/>;
        })}
      </div>

      {/* foreground scraps: fastest plane, heavy blur = depth */}
      <div style={{...layerStyle(1.28, 7), opacity: 0.5, pointerEvents: "none"}}>
        <div style={{position: "absolute", left: 300, top: 1450, width: 300, height: 380, background: CARD, transform: "rotate(14deg)"}}/>
        <div style={{position: "absolute", left: 2050, top: 150, width: 260, height: 330, background: "#d9d2ba", transform: "rotate(-11deg)"}}/>
      </div>

      {/* dim for the weakness beat */}
      <div style={{position: "absolute", inset: 0, background: "#050a08", opacity: dim, pointerEvents: "none"}}/>

      {/* FIXED safe overlay: never camera-transformed */}
      <div style={{position: "absolute", left: 64, top: 84, pointerEvents: "none"}}>
        <div style={{fontFamily: "Arial,sans-serif", fontSize: 24, letterSpacing: 4, color: RED, opacity: clamp01(f / 18)}}>AMERICA'S CRIME DATABASE</div>
        {f < 190 ? (
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 76, color: INK, marginTop: 14, opacity: clamp01((f - 8) / 18)}}>It never closes.</div>
        ) : (
          <div style={{fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 70, color: INK, marginTop: 14, opacity: clamp01((f - 196) / 14)}}>Every desk is a door.</div>
        )}
        <div style={{width: 340 * clamp01((f - 14) / 22), height: 6, background: RED, marginTop: 16}}/>
      </div>

      {/* end-state red vignette */}
      <div style={{position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(circle at 50% 42%, transparent 40%, rgba(224,73,46,0.35) 100%)`,
        opacity: interpolate(f, [330, 415], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}/>
    </div>
  );
};
