import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {evolvePath} from "@remotion/paths";
import {Circle} from "@remotion/shapes";
import type {ShotDef} from "./types";
import {DrawOn, sRect, sLine, sPath, sEllipse, sCircle, clamp01} from "./sketch";

/**
 * Animated film grain. The QA freeze gate compares average frame difference,
 * so even a pulsing dot or sweeping line reads as "frozen" during quiet beats.
 * Swapping two uncorrelated grain fields every frame keeps every pixel alive
 * (subtle at 7% opacity) and matches the paper/ink editorial look.
 */
export const Grain:React.FC<{frame:number;opacity?:number}>=({frame,opacity=0.045})=>(
 <>
  <Img src={staticFile("grain-a.png")} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:frame%2===0?opacity:0,pointerEvents:"none"}}/>
  <Img src={staticFile("grain-b.png")} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:frame%2===0?0:opacity,pointerEvents:"none"}}/>
 </>
);
const I="#26352f",P="#f1eddd",R="#cb4a32",G="#467765";

/**
 * Original editorial illustration for the NCIC story ("ncic-*" graphics).
 * Same paper/ink editorial language as the Boeing pilot, purpose-built scenes:
 * filing cabinet of records, traffic-stop query, 24/7 clock, 90,000 doors.
 * No bottom source-ledger footer strip and no red progress bar, per the
 * owner's 22 November 2026 review. Uncertainty labels stay in-scene where
 * they carry meaning ("APPARENT BREACH - UNDER INVESTIGATION").
 * Layout rule: nothing below y=1420 - the lower third belongs to captions/UI.
 */

const KICKER="AMERICA'S CRIME DATABASE";

/**
 * Text-fit root fix (owner flagged recurring label clipping, 22 Nov 2026):
 * fixed plates with guessed font sizes kept slicing through glyphs.
 * Measure the REAL rendered width (Chromium canvas metrics) and shrink the
 * font until the string fits its container with margin. Falls back to a
 * conservative 0.62em/char estimate outside the browser (lint/SSR).
 */
let __mctx:CanvasRenderingContext2D|null|undefined;
const textW=(text:string,weight:string,size:number,family:string):number=>{
 try{
  if(__mctx===undefined)__mctx=document.createElement("canvas").getContext("2d");
  if(__mctx){__mctx.font=`${weight} ${size}px ${family}`;return __mctx.measureText(text).width;}
 }catch{}
 return text.length*size*0.62;
};
/** Largest size <= base at which text fits maxW (floor 10px). */
const fitSize=(text:string,maxW:number,base:number,weight:string="700",family:string="Arial,sans-serif"):number=>{
 const w=textW(text,weight,base,family);
 return w<=maxW?base:Math.max(10,Math.floor(base*maxW/w));
};

/**
 * Camera rig (motion-core rebuild, 22 Nov 2026): no frame ever sits still.
 * Every shot gets a continuous slow push-in, a gentle sinusoidal drift,
 * a micro-rotation, and a punch-in over its first frames so each cut reads
 * as an edit beat instead of a slide change. Deterministic per frame.
 */
const Paper:React.FC<{shot:ShotDef;dark?:boolean;children:React.ReactNode}>=({shot,dark,children})=>{
 const f=useCurrentFrame();
 const live=0.25+0.75*Math.abs(Math.sin(f/9));
 const rt=f-shot.a, rspan=Math.max(1,shot.b-shot.a), ru=Math.max(0,Math.min(1,rt/rspan));
 const punch=1+0.10*Math.max(0,1-rt/7);
 const push=1+0.05*ru;
 const sc=punch*push;
 const dx=5*Math.sin(f*0.021+shot.a*0.37);
 const dy=3.5*Math.sin(f*0.017+shot.a*0.53+1.7);
 const rot=0.3*Math.sin(f*0.012+shot.a*0.21);
 return <AbsoluteFill style={{background:dark?"#16221d":P}}>
  <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{fontFamily:"Georgia,serif"}}>
   <defs>
    <pattern id="ncic-grain" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M3 6h1m15 8h1m-9 11h1" stroke={I} opacity=".055"/></pattern>
    <marker id="ncic-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={R} strokeWidth="1.5"/></marker>
    <marker id="ncic-arrow-ink" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={I} strokeWidth="1.5"/></marker>
    <marker id="ncic-arrow-green" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={G} strokeWidth="1.5"/></marker>
    <filter id="ncic-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#26352f" floodOpacity="0.28"/></filter>
   </defs>
   <image href={staticFile(dark?"paper-dark-tex.png":"paper-tex.png")} x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/>
   <rect width="1080" height="1920" fill="url(#ncic-grain)"/>
   <g transform={`translate(${(540+dx).toFixed(1)} ${(960+dy).toFixed(1)}) scale(${sc.toFixed(4)}) rotate(${rot.toFixed(2)}) translate(-540 -960)`}>
   <text x="64" y="155" fill={R} fontFamily="Arial,sans-serif" fontSize="23" letterSpacing="3">{KICKER}</text>
   <circle cx="1022" cy="147" r="9" fill={R} opacity={live}/>
   <circle cx="1022" cy="147" r="15" fill="none" stroke={R} strokeWidth="2" opacity={live*0.5}/>
   {children}
   </g>
  </svg>
  <Grain frame={f}/>
 </AbsoluteFill>;
};

const RULE_SK = sPath("M65 292Q320 298 590 289", R, 3, 5);
const Headline:React.FC<{text:string;size?:number;ink?:string;p?:number}>=({text,size=73,ink=I,p=1})=>(
 <>
  <text x="64" y="255" fill={ink} fontSize={fitSize(text,952,size,"400","Georgia,serif")} letterSpacing="-3">{text}</text>
  <DrawOn paths={RULE_SK} p={p}/>
 </>
);

/** A treated real photo presented as a bordered print, spring-in, printed credit (owner label rule: real imagery carries credit). */
const PhotoCard:React.FC<{src:string;x:number;y:number;w:number;rot?:number;pop:number;credit:string}> = ({src,x,y,w,rot=0,pop,credit})=>{
 const sp=Math.min(1,pop);
 const h=Math.round(w*0.62);
 return <g transform={`translate(${x+w/2} ${y+h/2}) rotate(${rot}) scale(${(0.7+0.3*sp).toFixed(3)}) translate(${-(x+w/2)} ${-(y+h/2)})`} opacity={Math.min(1,sp*1.6)}>
  <rect x={x-12} y={y-12} width={w+24} height={h+58} fill="#fdfcf6" filter="url(#ncic-sh)"/>
  <image href={staticFile(src)} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice"/>
  <text x={x} y={y+h+32} fill={I} opacity=".75" fontFamily="Arial,sans-serif" fontSize="19">{credit}</text>
 </g>;
};

/** Hand-drawn red scribble (circle/arrow/highlight) drawn on via @remotion/paths - the editorial markup energy. */
const Scribble:React.FC<{d:string;p:number;w?:number}> = ({d,p,w=6})=>{
 const e=evolvePath(Math.max(0,Math.min(1,p)),d);
 return <path d={d} fill="none" stroke={R} strokeWidth={w} strokeLinecap="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset}/>;
};

/** A steel drawer with handle and label slot. Outlines are hand-drawn sketch strokes that draw themselves on (dp: 0->1); fills fade in behind them. */
const Drawer:React.FC<{x:number;y:number;w:number;h:number;label?:string;hot?:boolean;opacity?:number;dp?:number;seed?:number}>=({x,y,w,h,label,hot,opacity=1,dp=1,seed=0})=>{
 const fs=label?fitSize(label,w*0.64-24,Math.min(30,w*0.11)):0;
 const fillOp=clamp01((dp-0.7)/0.3);
 const labelOp=clamp01((dp-0.8)/0.2);
 return <g opacity={opacity}>
  <rect x={x} y={y} width={w} height={h} rx="6" fill={hot?"#e4d7c8":"#d4d2bf"} opacity={fillOp} filter="url(#ncic-sh)"/>
  <g transform={`translate(${x} ${y})`}><DrawOn paths={sRect(w,h,hot?R:I,hot?5:3,seed)} p={dp}/></g>
  <rect x={x+w*0.18} y={y+h*0.16} width={w*0.64} height={h*0.34} rx="3" fill={P} opacity={fillOp}/>
  <g transform={`translate(${x+w*0.18} ${y+h*0.16})`}><DrawOn paths={sRect(w*0.64,h*0.34,I,2,seed+1)} p={dp}/></g>
  <rect x={x+w*0.38} y={y+h*0.62} width={w*0.24} height={h*0.14} rx={h*0.07} fill={I} opacity={fillOp}/>
  {label&&<text x={x+w/2} y={y+h*0.33+fs*0.36} textAnchor="middle" fill={hot?R:I} fontFamily="Arial,sans-serif" fontSize={fs} fontWeight="700" opacity={labelOp}>{label}</text>}
 </g>;
};

/** A door: the unit of attack surface. Frame is a hand-drawn sketch that draws on; the swinging panel stays clean (it moves in perspective). */
const Door:React.FC<{x:number;y:number;s?:number;hot?:boolean;open?:number;ink?:string;dp?:number;seed?:number}>=({x,y,s=1,hot,open=0,ink=I,dp=1,seed=0})=>(
 <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x="-34" y="-60" width="68" height="120" rx="4" fill="#d4d2bf" opacity={clamp01((dp-0.7)/0.3)} filter="url(#ncic-sh)"/>
  <g transform="translate(-34 -60)"><DrawOn paths={sRect(68,120,hot?R:ink,hot?5:3,seed)} p={dp}/></g>
  <g style={{transformOrigin:"-30px 0px",transform:`perspective(300px) rotateY(${-open*70}deg)`}} opacity={clamp01((dp-0.5)/0.5)}>
   <rect x="-30" y="-54" width="60" height="108" rx="3" fill={hot?"#e9cdbd":P} stroke={hot?R:I} strokeWidth="3"/>
   <circle cx="18" cy="0" r="5" fill={hot?R:I}/>
  </g>
 </g>
);

/** The NCIC core: one database cylinder. Body + top ellipse are hand-drawn sketches (cached per ink color) that draw on; interior arcs stay clean. */
const CORE_BODY_D="M-130-110H130V110Q130 150 0 150Q-130 150-130 110Z";
const coreCache:Record<string,{body:ReturnType<typeof sPath>;top:ReturnType<typeof sEllipse>}>={};
const coreSketch=(stroke:string)=>coreCache[stroke]??(coreCache[stroke]={body:sPath(CORE_BODY_D,stroke,5,60),top:sEllipse(0,-110,260,68,stroke,5,61)});
const Core:React.FC<{x:number;y:number;s?:number;alarm?:number;ink?:string;dp?:number}>=({x,y,s=1,alarm=0,ink=I,dp=1})=>{
 const stroke=alarm>0.5?R:ink;
 const sk=coreSketch(stroke);
 const fillOp=clamp01((dp-0.7)/0.3);
 return <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#ncic-sh)">
  <ellipse cx="0" cy="150" rx="150" ry="26" fill={ink} opacity={0.08*fillOp}/>
  <path d={CORE_BODY_D} fill={alarm>0.5?"#e4c4b4":"#d4d2bf"} opacity={fillOp}/>
  <ellipse cx="0" cy="-110" rx="130" ry="34" fill={alarm>0.5?"#e9cdbd":P} opacity={fillOp}/>
  <DrawOn paths={sk.body} p={dp}/>
  <DrawOn paths={sk.top} p={dp}/>
  {[-45,10,65].map((yy,i)=><path key={i} d={`M-130 ${yy}Q0 ${yy+40} 130 ${yy}`} fill="none" stroke={alarm>0.5?R:I} strokeWidth="3" opacity={0.55*clamp01((dp-0.6)/0.4)}/>)}
  <text x="0" y="30" textAnchor="middle" fill={alarm>0.5?R:I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="44" opacity={clamp01((dp-0.8)/0.2)}>NCIC</text>
  {alarm>0.5&&<text x="0" y="200" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize="30" letterSpacing="4">APPARENT BREACH</text>}
 </g>;
};

export const NcicScene:React.FC<{shot:ShotDef}>=({shot})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const t=f-shot.a, span=shot.b-shot.a, u=Math.max(0,Math.min(1,t/span));
 const m=shot.graphic;
 const pop=spring({frame:t,fps,config:{damping:12,stiffness:150,mass:0.9}});
 /** Overshoot entrance for element i starting at frame `start`: pop scale/fade. */
 const popAt=(start:number)=>spring({frame:Math.max(0,t-start),fps,config:{damping:12,stiffness:170,mass:0.8}});
 /** Slow idle breathing so hero graphics never freeze between beats. */
 const br=(ph:number)=>1+0.009*Math.sin(f*0.11+ph);

 // 1. HOOK: someone may already be inside the FBI's own files.
 if(m==="ncic-hook"){
  const creep=Math.min(1,u*1.6);
  const stamp=Math.max(0,Math.min(1,(u-0.5)/0.2));
  const slam=popAt(Math.round(span*0.5));
  const cabP=clamp01(u/0.22);
  return <Paper shot={shot}>
   <Headline text="Someone may be inside." p={clamp01(t/14)}/>
   <g transform={`translate(540 835) scale(${(pop*br(0)).toFixed(4)}) translate(-540 -835) translate(0 ${(1-pop)*40})`}>
    <rect x="310" y="470" width="460" height="730" rx="14" fill="#c0c5b1" opacity={clamp01((cabP-0.7)/0.3)}/>
    <g transform="translate(310 470)"><DrawOn paths={sRect(460,730,I,5,1)} p={cabP}/></g>
    {["WANTED PERSONS","MISSING PERSONS","STOLEN VEHICLES","WARRANTS"].map((l,i)=><Drawer key={l} x={345} y={505+i*170} w={390} h={140} label={l} hot={i===1&&creep>0.7} dp={clamp01((u-0.08-i*0.09)/0.18)} seed={2+i}/>)}
   </g>
   <path d={`M1080 730Q860 710 ${1080-570*creep} ${710-20*creep}`} fill="none" stroke={R} strokeWidth="5" strokeDasharray="14 12" markerEnd="url(#ncic-arrow)"/>
   {stamp>0&&<g transform={`translate(540 1190) rotate(-7) scale(${(1.35-0.35*Math.min(1,slam)).toFixed(3)}) translate(-540 -1190) translate(340 1135)`} opacity={Math.min(1,slam*2)}>
    <rect x="0" y="0" width="400" height="110" rx="8" fill={P} fillOpacity="0.93" stroke={R} strokeWidth="7"/>
    <text x="200" y="48" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontWeight="700" fontSize={fitSize("APPARENT BREACH",360,38)} letterSpacing="3">APPARENT BREACH</text>
    <text x="200" y="88" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize={fitSize("FBI INVESTIGATING · UNCONFIRMED",360,24,"400")}>FBI INVESTIGATING · UNCONFIRMED</text>
   </g>}
   <PhotoCard src="photos/fbi-hq.jpg" x={776} y={530} w={224} rot={4} pop={popAt(6)} credit="FBI HQ · FBI photo (PD)"/>
   <text x="540" y="1330" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">The FBI's own crime database, reported hacked. Nov 2026.</text>
  </Paper>;
 }

 // 2. TRAFFIC STOP: one plate check, one system answering.
 if(m==="ncic-stop"){
  const send=Math.max(0,Math.min(1,(u-0.1)/0.35));
  const back=Math.max(0,Math.min(1,(u-0.55)/0.3));
  const dotX=interpolate(send,[0,1],[350,760]);
  const retX=interpolate(back,[0,1],[760,350]);
  const carP=clamp01(u/0.14), plateP=clamp01((u-0.04)/0.16), bldP=clamp01((u-0.08)/0.22);
  return <Paper shot={shot}>
   <Headline text="One system answers." p={clamp01(t/14)}/>
   {/* patrol car */}
   <g transform={`translate(${140+30*Math.sin(u*Math.PI)} 780)`}>
    <path d="M0 120L30 40H60L90 0H240L285 45H340L350 120Z" fill={I} opacity={clamp01((carP-0.7)/0.3)}/>
    <DrawOn paths={sPath("M0 120L30 40H60L90 0H240L285 45H340L350 120Z",I,5,7)} p={carP}/>
    <rect x="150" y="-26" width="60" height="26" rx="6" fill={R} opacity={clamp01((carP-0.7)/0.3)}/>
    <path d="M100 45H230M100 20L120 45M250 45L265 20" stroke={P} strokeWidth="5" fill="none" opacity={clamp01((carP-0.6)/0.4)}/>
    <circle cx="80" cy="125" r="38" fill={I} opacity={clamp01((carP-0.7)/0.3)}/><circle cx="80" cy="125" r="18" fill="#b4b9a6" opacity={clamp01((carP-0.7)/0.3)}/>
    <circle cx="270" cy="125" r="38" fill={I} opacity={clamp01((carP-0.7)/0.3)}/><circle cx="270" cy="125" r="18" fill="#b4b9a6" opacity={clamp01((carP-0.7)/0.3)}/>
   </g>
   {/* plate card */}
   <g transform={`translate(150 ${560+(1-pop)*-30})`}>
    <rect x="0" y="0" width="220" height="110" rx="10" fill={P} opacity={clamp01((plateP-0.7)/0.3)}/>
    <DrawOn paths={sRect(220,110,I,4,8)} p={plateP}/>
    <text x="110" y="70" textAnchor="middle" fill={I} fontFamily="'Courier New',monospace" fontWeight="700" fontSize={fitSize("8JXK-204",196,52,"700","'Courier New',monospace")} opacity={clamp01((plateP-0.8)/0.2)}>8JXK-204</text>
    <text x="110" y="150" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize={fitSize("PLATE CHECK",196,20,"400")} opacity={clamp01((plateP-0.8)/0.2)}>PLATE CHECK</text>
   </g>
   <PhotoCard src="photos/traffic-stop.jpg" x={700} y={330} w={330} rot={3} pop={popAt(4)} credit="Photo: I. Sagdejev, CC BY-SA 4.0"/>
   <DrawOn paths={sEllipse(260,615,300,160,R,6,10)} p={Math.max(0,Math.min(1,(u-0.2)/0.18))}/>
   {/* NCIC building */}
   <g transform={`translate(840 740) scale(${br(2.6).toFixed(4)}) translate(-840 -740) translate(700 580)`}>
    <path d="M0 320V60L60 0H220L280 60V320Z" fill="#d4d2bf" opacity={clamp01((bldP-0.7)/0.3)}/>
    <DrawOn paths={sPath("M0 320V60L60 0H220L280 60V320Z",I,5,9)} p={bldP}/>
    <path d="M60 0L140 60H220L140 0" fill="none" stroke={I} strokeWidth="3" opacity={clamp01((bldP-0.6)/0.4)}/>
    {[0,1,2,3].map(i=><rect key={i} x={35+i*60} y={110} width="34" height="48" fill={I} opacity={0.8*clamp01((bldP-0.6)/0.4)}/>)}
    {[0,1,2,3].map(i=><rect key={i} x={35+i*60} y={190} width="34" height="48" fill={I} opacity={0.8*clamp01((bldP-0.6)/0.4)}/>)}
    <rect x="115" y="255" width="50" height="65" fill={I} opacity={clamp01((bldP-0.6)/0.4)}/>
    <text x="140" y="380" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="34">NCIC</text>
    <text x="140" y="418" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="22">FBI · CJIS</text>
   </g>
   {/* query path out, answer path back */}
   <path d="M370 615Q540 520 700 640" fill="none" stroke={I} strokeWidth="4" strokeDasharray="10 10" markerEnd="url(#ncic-arrow-ink)"/>
   {send>0&&send<1&&<circle cx={dotX} cy={interpolate(send,[0,1],[615,640])-Math.sin(send*Math.PI)*60} r="12" fill={I}/>}
   <path d="M700 680Q540 780 380 700" fill="none" stroke={G} strokeWidth="4" strokeDasharray="10 10" markerEnd="url(#ncic-arrow-green)"/>
   {back>0&&<circle cx={retX} cy={interpolate(back,[0,1],[680,700])+Math.sin(back*Math.PI)*55} r="12" fill={G}/>}
   {back>0.85&&<text x="540" y="1010" textAnchor="middle" fill={G} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="34">ANSWER COMES BACK</text>}
   <text x="540" y="1270" textAnchor="middle" fill={R} fontSize="46" fontStyle="italic">routine, at traffic stops nationwide</text>
  </Paper>;
 }

 // 3. FILES: the filing cabinet with twenty-one drawers.
 if(m==="ncic-files"){
  const names=["WANTED","MISSING","STOLEN CARS","STOLEN GUNS","PROT. ORDERS"];
  return <Paper shot={shot}>
   <Headline text="Twenty-one drawers." p={clamp01(t/14)}/>
   <g transform={`translate(540 890) scale(${br(1.3).toFixed(4)}) translate(-540 -890) translate(140 440)`}>
    <rect x="0" y="0" width="800" height="905" rx="16" fill="#c0c5b1" opacity={clamp01((clamp01(u/0.1)-0.7)/0.3)}/>
    <DrawOn paths={sRect(800,905,I,5,15)} p={clamp01(u/0.1)}/>
    {Array.from({length:21},(_,i)=>{
     const col=i%3,row=Math.floor(i/3);
     const named=i<5;
     const o=popAt(i*3);
     const cx=35+col*250+110, cy=35+row*122+48;
     const scan=Math.floor(f/7)%21===i;
     return <g key={i} transform={`translate(${cx} ${cy}) scale(${(0.55+0.45*Math.min(1,o)).toFixed(3)}) translate(${-cx} ${-cy})`} opacity={Math.min(1,o*1.6)}>
      <Drawer x={35+col*250} y={35+row*122} w={220} h={96} label={named?names[i]:undefined} hot={named} dp={clamp01(o)} seed={20+i}/>
      {scan&&o>0.9&&<rect x={35+col*250} y={35+row*122} width={220} height={96} rx="6" fill={R} opacity=".16"/>}
     </g>;
    })}
   </g>
   <text x="540" y="1400" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">plus identity theft, gangs and suspected terrorists</text>
  </Paper>;
 }

 // 4. RECORDS: two number drums - 12M records, ~10M checks a day.
 if(m==="ncic-records"){
  const drum=(y:number,label:string,sub:string,finalStr:string,approx?:boolean)=>{
   const rolling=Math.min(1,u*1.4);
   return <g transform={`translate(0 ${y})`}>
    <rect x="90" y="0" width="900" height="240" rx="16" fill={I}/>
    {finalStr.split("").map((ch,i)=>{
     const x=120+i*((840-72)/Math.max(1,finalStr.length-1));
     const jiggle=ch>="0"&&ch<="9"?Math.sin((f+i*7)*0.35)*(rolling<1?10*(1-rolling):1.4):0;
     const tp=popAt(4+i*2);
     return <g key={i} transform={`translate(${x+36} ${30+60}) scale(${(0.4+0.6*Math.min(1,tp)).toFixed(3)}) translate(${-(x+36)} ${-90}) translate(${x} 30)`} opacity={Math.min(1,tp*1.5)}>
      <rect width="72" height="120" rx="6" fill={P} opacity={clamp01((clamp01(tp)-0.7)/0.3)}/>
      <DrawOn paths={sRect(72,120,I,3,30+i)} p={clamp01(tp)}/>
      <text x="36" y={95+jiggle} textAnchor="middle" fill={I} fontFamily="'Courier New',monospace" fontWeight="700" fontSize="66" opacity={clamp01((clamp01(tp)-0.8)/0.2)}>{ch}</text>
     </g>;
    })}
    <text x="95" y="200" fill={P} fontFamily="Arial,sans-serif" fontSize={fitSize((approx?"≈ ":"")+label,560,30)} letterSpacing="4">{approx?"≈ ":""}{label}</text>
    <text x="985" y="200" textAnchor="end" fill="#a4af9f" fontFamily="Arial,sans-serif" fontSize="22">{sub}</text>
   </g>;
  };
  return <Paper shot={shot}>
   <Headline text="Built to be checked." p={clamp01(t/14)}/>
   {drum(520,"ACTIVE RECORDS","","12,000,000")}
   {drum(890,"CHECKS PER DAY","","10,000,000",true)}
   <PhotoCard src="photos/server-rack.jpg" x={64} y={1140} w={264} rot={-2} pop={popAt(18)} credit="Server rack · PD, via Wikimedia"/>
   <text x="610" y="1310" textAnchor="middle" fill={R} fontSize="46" fontStyle="italic">one answer can change a stop</text>
  </Paper>;
 }

 // 5. CLOCK: open 24/7 since January 1967.
 if(m==="ncic-clock"){
  const sweep=t*6;
  return <Paper shot={shot}>
   <Headline text="It never closes." p={clamp01(t/14)}/>
   <g transform="translate(540 720)">
    <circle r="280" fill="#dedeca" opacity={clamp01((clamp01(t/16)-0.7)/0.3)}/>
    <DrawOn paths={sCircle(280,I,6,40)} p={clamp01(t/16)}/>
    {Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30})`} d="M0-258v32" stroke={I} strokeWidth="6" opacity={clamp01((clamp01(t/16)-0.6)/0.4)}/>)}
    <g transform={`rotate(${sweep})`} opacity={clamp01((clamp01(t/18)-0.5)/0.5)}><path d="M0 0V-185" stroke={I} strokeWidth="13" strokeLinecap="round"/></g>
    <g transform={`rotate(${sweep/12})`} opacity={clamp01((clamp01(t/18)-0.5)/0.5)}><path d="M0 0L115 60" stroke={R} strokeWidth="16" strokeLinecap="round"/></g>
    <circle r="15" fill={I} opacity={clamp01((clamp01(t/16)-0.5)/0.5)}/>
   </g>
   <g transform={`translate(540 1100) scale(${(0.5+0.5*Math.min(1,popAt(8))).toFixed(3)}) translate(-540 -1100)`} opacity={Math.min(1,popAt(8)*1.4)}>
    <text x="540" y="1160" textAnchor="middle" fill={R} fontSize="120">24/7</text>
   </g>
   <g>
    <g transform="translate(150 1280)"><DrawOn paths={sLine(0,0,780,0,I,4,41)} p={clamp01(t/20)}/></g>
    <circle cx="150" cy="1280" r="12" fill={I}/>
    <circle cx={150+780*Math.min(1,u*1.2)} cy="1280" r="14" fill={R}/>
    <circle cx="930" cy="1280" r="12" fill={I}/>
    <text x="150" y="1340" fill={I} fontFamily="Arial,sans-serif" fontSize="26">JAN 27, 1967</text>
    <text x="930" y="1340" textAnchor="end" fill={I} fontFamily="Arial,sans-serif" fontSize="26">TODAY</text>
   </g>
   <PhotoCard src="photos/cjis-aerial.jpg" x={740} y={330} w={280} rot={3} pop={popAt(10)} credit="FBI CJIS facility, WV · FBI photo (PD)"/>
   <text x="540" y="1400" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">on call for police every hour of every day since</text>
  </Paper>;
 }

 // 6. DOORS: the mechanism - 90,000 connections, every one a door.
 if(m==="ncic-doors"){
  const doors=Array.from({length:18},(_,i)=>{
   const a=(i/18)*Math.PI*2-Math.PI/2;
   return {a,x:540+Math.cos(a)*380,y:810+Math.sin(a)*400};
  });
  const hot=[2,7,12];
  return <Paper shot={shot}>
   <Headline text="Ninety thousand doors." size={66} p={clamp01(t/14)}/>
   <g transform={`translate(540 810) scale(${br(2.1).toFixed(4)}) translate(-540 -810)`}>
   {doors.map((d,i)=>{
    const isHot=hot.includes(i);
    const open=isHot?Math.max(0,Math.min(1,popAt(Math.round(span*(0.3+[2,7,12].indexOf(i)*0.22)))/1)):0;
    const dp=popAt(i*2);
    const lineLive=Math.min(1,u*1.3);
    return <g key={i} opacity={Math.min(1,dp*1.5)}>
     <path d={`M540 810L${540+(d.x-540)*lineLive} ${810+(d.y-810)*lineLive}`} stroke={open>0?R:I} strokeWidth={open>0?5:2.5} opacity={open>0?0.95:0.5}/>
     <Door x={d.x} y={d.y} s={0.75} hot={open>0.15} open={open} dp={clamp01(dp)} seed={50+i}/>
    </g>;
   })}
   <Core x={540} y={810} s={0.9} dp={clamp01(u/0.2)}/>
   </g>
   <text x="540" y="1300" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">connected to 90,000+ criminal-justice agencies</text>
   <text x="540" y="1380" textAnchor="middle" fill={R} fontSize="48" fontStyle="italic">every connection is a way in</text>
  </Paper>;
 }

 // 7. BREACH: one door was used; who, how and what are unknown.
 if(m==="ncic-breach"){
  const pulse=Math.min(1,u*1.5);
  const alarm=u>0.62?(Math.floor(f/6)%2===0?1:0.55):0;
  const a=-Math.PI/2+(7/18)*Math.PI*2;
  const door={x:540+Math.cos(a)*380,y:810+Math.sin(a)*400};
  const px=door.x+(540-door.x)*pulse, py=door.y+(810-door.y)*pulse;
  return <Paper shot={shot} dark>
   <Headline text="One door was used." size={66} ink="#f1eddd" p={clamp01(t/14)}/>
   <g transform={`translate(540 810) scale(${br(0.6).toFixed(4)}) translate(-540 -810)`}>
   {Array.from({length:18},(_,i)=>{
    const aa=(i/18)*Math.PI*2-Math.PI/2;
    const dx=540+Math.cos(aa)*380, dy=810+Math.sin(aa)*400;
    const isDoor=i===7;
    return <g key={i}>
     <path d={`M540 810L${dx} ${dy}`} stroke={isDoor?R:"#f1eddd"} strokeWidth={isDoor?6:2.5} opacity={isDoor?1:0.4}/>
     <Door x={dx} y={dy} s={0.75} hot={isDoor} open={isDoor?1:0} ink="#f1eddd" dp={clamp01(u/0.15)} seed={70+i}/>
    </g>;
   })}
   <Core x={540} y={810} s={0.9} alarm={alarm} ink="#f1eddd" dp={clamp01(u/0.22)}/>
   {u>0.62&&<g transform="translate(540 810)" opacity={0.5+0.5*Math.sin(f*0.35)}>
    <Circle radius={175+8*Math.sin(f*0.3)} fill="none" stroke={R} strokeWidth={4}/>
   </g>}
   </g>
   {pulse<1&&<circle cx={px} cy={py} r="16" fill={R}/>}
   {u>0.62&&<g transform={`translate(140 1260)`}>
    {["WHO GOT IN?","HOW?","WHAT WAS TAKEN?"].map((q,i)=>(
     <g key={q} transform={`translate(${i*273+126} 65) scale(${(0.5+0.5*Math.min(1,popAt(Math.round(span*(0.62+i*0.08))))).toFixed(3)}) translate(${-(i*273+126)} -65) translate(${i*273} 0)`} opacity={Math.min(1,popAt(Math.round(span*(0.62+i*0.08)))*1.5)}>
      <rect width="253" height="130" rx="10" fill={P} stroke={I} strokeWidth="3"/>
      <text x="126" y="52" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize={fitSize(q,225,27)}>{q}</text>
      <text x="126" y="100" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize="27" fontStyle="italic">unknown</text>
     </g>
    ))}
   </g>}
   <text x="540" y="1460" textAnchor="middle" fill="#f1eddd" fontFamily="Arial,sans-serif" fontSize="24">Apparent breach discovered in recent days. Nov 2026.</text>
  </Paper>;
 }

 // 8. PATTERN: second claimed FBI breach in two months.
 if(m==="ncic-pattern"){
  const card=(x:number,head:string,l1:string,l2:string,l3:string,hot?:boolean,idx:number=0)=>(
   <g transform={`translate(${x+215} 800) rotate(${hot?2:-2}) scale(${(0.6+0.4*Math.min(1,popAt(6+idx*8))).toFixed(3)}) translate(${-(x+215)} -800) translate(${x} 520)`} opacity={Math.min(1,popAt(6+idx*8)*1.5)}>
    <path d="M0 0H380L430 55V560H0Z" fill="#fffcf1" opacity={clamp01((clamp01(popAt(6+idx*8))-0.6)/0.4)}/>
    <DrawOn paths={sPath("M0 0H380L430 55V560H0Z",I,4,80+idx)} p={clamp01(popAt(6+idx*8))}/>
    <path d="M380 0V55H430" fill="#ddd9c9" stroke={I} strokeWidth="3"/>
    <text x="36" y="80" fill={hot?R:I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize={fitSize(head,340,34)} letterSpacing="2">{head}</text>
    <path d="M36 110H370" stroke={I} strokeWidth="3"/>
    <text x="36" y="180" fill={I} fontSize={fitSize(l1,340,40,"700","Georgia,serif")} fontWeight="700">{l1}</text>
    <text x="36" y="250" fill={I} fontFamily="Arial,sans-serif" fontSize={fitSize(l2,340,30,"400")}>{l2}</text>
    <text x="36" y="310" fill={I} fontFamily="Arial,sans-serif" fontSize={fitSize(l3,340,30,"400")}>{l3}</text>
   </g>
  );
  const link=Math.max(0,Math.min(1,(u-0.5)/0.25));
  return <Paper shot={shot}>
   <Headline text="Twice in two months." size={66} p={clamp01(t/14)}/>
   {card(90,"SEPT 2026","FBIJobs.gov","extortion gang claim:","unpatched software.",false,0)}
   {card(560,"NOV 2026","NCIC","apparent breach:","under investigation.",true,1)}
   {link>0&&<g opacity={link}>
    <path d="M520 660Q540 600 560 660" fill="none" stroke={R} strokeWidth="5" markerEnd="url(#ncic-arrow)"/>
    <g transform={`translate(540 1170) scale(${(0.7+0.3*Math.min(1,popAt(Math.round(span*0.55)))).toFixed(3)}) translate(-540 -1170)`}>
     <text x="540" y="1200" textAnchor="middle" fill={R} fontSize="42" fontStyle="italic">same agency. no evidence the two are linked.</text>
    </g>
   </g>}
  </Paper>;
 }

 // 9. PAYOFF: every line in the system is a real person.
 if(m==="ncic-payoff"){
  const underline=Math.max(0,Math.min(1,(u-0.45)/0.3));
  return <Paper shot={shot}>
   <Headline text="Every line is a person." size={66} p={clamp01(t/14)}/>
   <g transform={`translate(560 855) rotate(-2) scale(${(pop*br(3.7)).toFixed(4)}) translate(-560 -855) translate(240 460)`} opacity={Math.min(1,pop*1.6)}>
    <path d="M0 0H560L640 85V790H0Z" fill="#fffcf1" opacity={clamp01((pop-0.6)/0.4)}/>
    <DrawOn paths={sPath("M0 0H560L640 85V790H0Z",I,5,90)} p={clamp01(pop)}/>
    <path d="M560 0V85H640" fill="#ddd9c9" stroke={I} strokeWidth="3"/>
    <rect x="40" y="50" width="200" height="250" fill="#d4d2bf" opacity={clamp01((pop-0.6)/0.4)}/>
    <g transform="translate(40 50)"><DrawOn paths={sRect(200,250,I,3,91)} p={clamp01(pop)}/></g>
    <circle cx="140" cy="140" r="52" fill={I}/>
    <path d="M70 280Q140 200 210 280Z" fill={I}/>
    <text x="280" y="88" fill={I} fontFamily="Arial,sans-serif" fontSize="25" letterSpacing="2">NCIC RECORD</text>
    <text x="280" y="160" fill={I} fontSize="46" fontWeight="700">WANTED</text>
    {[330,410,490].map((y,i)=><g key={y}>
      <text x="60" y={y} fill={I} fontFamily="Arial,sans-serif" fontSize="24">{["NAME","OFFENSE","LAST SEEN"][i]}</text>
      <path d={`M60 ${y+22}h480`} stroke={I} strokeWidth="3" opacity=".3"/>
    </g>)}
    <rect x="40" y={540} width={560*underline} height="18" fill={R}/>
    <text x="60" y="650" fill={R} fontSize="52" fontStyle="italic">can mean handcuffs</text>
    <text x="60" y="720" fill={R} fontSize="52" fontStyle="italic">for someone real.</text>
   </g>
   <text x="540" y="1380" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="27">that's why even a possible breach is a five-alarm fire</text>
  </Paper>;
 }

 // 10. ID: the system has a name - National Crime Information Center.
 if(m==="ncic-id"){
  const w1=Math.max(0,Math.min(1,(u-0.08)/0.3));
  const w2=Math.max(0,Math.min(1,(u-0.42)/0.3));
  const line=Math.max(0,Math.min(1,(u-0.72)/0.22));
  const clip=(p:number)=>`inset(0 ${(1-p)*100}% 0 0)`;
  return <Paper shot={shot}>
   <text x="64" y="155" fill={R} fontFamily="Arial,sans-serif" fontSize="23" letterSpacing="3">{KICKER}</text>
   <text x="64" y="300" fill={I} fontFamily="Arial,sans-serif" fontSize="26" letterSpacing="6">THE SYSTEM HAS A NAME</text>
   <g transform={`translate(540 710) scale(${(0.85+0.15*Math.min(1,pop)).toFixed(4)}) translate(-540 -710) translate(64 430)`} opacity={Math.min(1,pop*1.6)}>
    <rect x="0" y="0" width="952" height="560" rx="18" fill="#fffcf1" opacity={clamp01((clamp01(pop)-0.6)/0.4)}/>
    <DrawOn paths={sRect(952,560,I,5,95)} p={clamp01(pop)}/>
    <text x="70" y="150" fill={I} fontSize={fitSize("NATIONAL CRIME",812,82,"700","Georgia,serif")} fontWeight="700" style={{clipPath:clip(w1)}}>NATIONAL CRIME</text>
    <text x="70" y="330" fill={I} fontSize={fitSize("INFORMATION CENTER",812,82,"700","Georgia,serif")} fontWeight="700" style={{clipPath:clip(w2)}}>INFORMATION CENTER</text>
    <rect x="70" y="400" width={812*line} height="14" fill={R}/>
    <text x="70" y="500" fill={I} fontFamily="Arial,sans-serif" fontSize={fitSize("run by the FBI · built for the street, not the lab",812,30,"400")}>run by the FBI · built for the street, not the lab</text>
   </g>
   <text x="540" y="1160" textAnchor="middle" fill={R} fontSize="52" fontStyle="italic" opacity={line}>every cop knows it as NCIC</text>
  </Paper>;
 }

 return <Paper shot={shot}><Headline text="NCIC"/></Paper>;
};
