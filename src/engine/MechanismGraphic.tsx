import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {ShotDef} from "./types";
const INK="#26352f", PAPER="#f1eddd", RED="#cb4a32", GREEN="#467765";

/** Original editorial illustration. A physical counter is an analogy, not a GCU teardown. */
export const MechanismGraphic: React.FC<{shot:ShotDef}>=({shot})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const t=f-shot.a, span=shot.b-shot.a, u=Math.max(0,Math.min(1,t/span));
 const mode=shot.graphic;
 const isCounter=mode==="counter"||mode==="overflow";
 const flipped=mode==="overflow"&&u>.32;
 const off=mode==="power"&&u>.12 || flipped;
 const reset=mode==="reset";
 const live=reset?u>.48:!off;
 const pop=spring({frame:t,fps,config:{damping:22,stiffness:160}});
 const flipProgress=mode==="overflow"?Math.max(0,Math.min(1,(u-.25)/.14)):0;
 const signAngle=flipProgress*180;
 const number=reset&&live?"0000000000":flipped||mode==="power"?"2147483648":"2147483647";
 const title=isCounter?(mode==="overflow"?"One more tick.":"Every counter has an edge."):reset?"Off. Then on again.":"All four. At once.";
 return <AbsoluteFill style={{background:PAPER}}>
  <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{fontFamily:"Georgia, serif"}}>
   <defs>
    <pattern id="paper-grain" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M3 6h1m15 8h1m-9 11h1" stroke={INK} opacity=".055"/></pattern>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v9" stroke={INK} opacity=".13" strokeWidth="2"/></pattern>
    <clipPath id="reel-window"><rect x="207" y="574" width="754" height="135" rx="5"/></clipPath>
    <marker id="arrow-tip" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={RED} strokeWidth="1.5"/></marker>
   </defs>
   <rect width="1080" height="1920" fill="url(#paper-grain)"/>
   <text x="64" y="155" fill={RED} fontFamily="Arial,sans-serif" fontSize="23" letterSpacing="3">THE 248-DAY BUG</text>
   <text x="64" y="260" fill={INK} fontSize="77" letterSpacing="-3">{title}</text>
   <path d="M66 291Q310 297 600 289" fill="none" stroke={RED} strokeWidth="3"/>
   {/* A drafted silhouette connects the software event back to an aircraft. */}
   <g transform="translate(788 380) rotate(-13) scale(.72)" fill={INK}>
    <path d="M-180 0Q-168-20-70-17L-14-118 11-120-16-16 113-10 159-49 180-48 159 0 180 48 158 49 113 10-16 16 11 120-14 118-70 17Q-168 20-180 0Z"/>
    <path d="M-148 0H145" stroke={PAPER} strokeWidth="2"/>
   </g>
   <text x="70" y="423" fill={INK} fontFamily="Arial,sans-serif" fontSize="25">{isCounter?"Imagine the software clock":"The airplane's electrical generation"}</text>
   <text x="70" y="460" fill={INK} fontFamily="Arial,sans-serif" fontSize="25">{isCounter?"as a mechanical number drum.":reset?"comes back after a power cycle.":"can fail at the same moment."}</text>
   {/* Case extrusion, fasteners and rolling reels are drawn as one object. */}
   <g transform={`translate(0 ${(1-pop)*25})`}>
    <path d="M81 533H993V766L967 796H104L81 770Z" fill="#b6b4a3" stroke={INK} strokeWidth="4"/>
    <path d="M104 557H967V796H104Z" fill="url(#hatch)"/>
    <rect x="66" y="513" width="927" height="249" rx="17" fill="#d4d2bf" stroke={INK} strokeWidth="4"/>
    <rect x="87" y="533" width="885" height="209" rx="9" fill={INK}/>
    {[ [82,530],[975,530],[82,744],[975,744] ].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle r="6" fill="#aaa995" stroke={INK}/><path d="M-3 3l6-6" stroke={INK}/></g>)}
    <g style={{transformOrigin:"146px 638px",transform:`perspective(400px) rotateX(${signAngle}deg)`}}>
     <rect x="106" y="572" width="79" height="137" rx="5" fill={flipped||mode==="power"?RED:GREEN}/>
     <text x="145" y="665" fill={PAPER} fontFamily="Arial,sans-serif" fontSize="65" textAnchor="middle" style={{transformOrigin:"145px 640px",transform:flipped?"rotateX(180deg)":"none"}}>{flipped||mode==="power"?"−":"+"}</text>
     <path d="M108 638h75" stroke={INK} opacity=".3"/>
    </g>
    <g clipPath="url(#reel-window)">
    {number.split("").map((n,i)=>{
      const x=207+i*75.6;
      const roll=mode==="overflow"&&i===9?Math.sin(flipProgress*Math.PI)*18:0;
      return <g key={i} transform={`translate(${x} 574)`}>
       <rect width="70" height="135" rx="4" fill={PAPER}/>
       <rect y="0" width="70" height="18" fill={INK} opacity=".07"/>
       <text x="35" y={95-roll} fontFamily="'Courier New',monospace" fontWeight="700" fontSize="82" fill={INK} textAnchor="middle">{n}</text>
       <path d="M0 66h70" stroke={INK} opacity=".12"/>
      </g>;
    })}
    </g>
    <text x="109" y="734" fontFamily="Arial,sans-serif" fontSize="15" fill="#a4af9f" letterSpacing="3">SIGNED 32-BIT · ILLUSTRATIVE MECHANISM</text>
   </g>
   {/* A red pencil annotation points at the only detail that matters. */}
   <path d="M112 908Q35 870 142 777" fill="none" stroke={RED} strokeWidth="3" markerEnd="url(#arrow-tip)"/>
   <text x="133" y="918" fill={RED} fontSize="36" fontStyle="italic">{reset?"the clock starts over":flipped?"the sign flips":"the sign has its own bit"}</text>
   <text x="540" y="1340" fill={INK} fontFamily="Arial,sans-serif" fontSize="21" textAnchor="middle">SAME SOFTWARE, REPEATED IN ALL FOUR GCUs</text>
   {/* Diagram connector denotes repeated control logic, not actual aircraft wiring. */}
   <path d="M540 792V981M164 1070V981H916V1070M415 981V1070M666 981V1070" fill="none" stroke={INK} strokeWidth="9" strokeLinejoin="round"/>
   {live&&<path d="M540 792V981M164 1070V981H916V1070M415 981V1070M666 981V1070" fill="none" stroke={GREEN} strokeWidth="4" strokeDasharray="9 32" strokeDashoffset={-t*3}/>}
   {[164,415,666,916].map((x,i)=>{
     const coast=mode==="power"?Math.max(0,t-span*.12):mode==="overflow"?Math.max(0,t-span*.32):0;
     const rot=live?t*4+i*30:(t-coast)*4+100*(1-Math.exp(-coast/40))+i*30;
     return <g key={i} transform={`translate(${x} 1140)`}>
      <ellipse cy="105" rx="92" ry="17" fill={INK} opacity=".08"/>
      <path d="M-73-12h146v101H-73Z" fill="#c0c5b1" stroke={INK} strokeWidth="3"/>
      <path d="M-74 62h148v30H-74Z" fill="url(#hatch)"/>
      {Array.from({length:9},(_,j)=><path key={j} d={`M${-62+j*15} 11v53`} stroke={INK} strokeWidth="3" opacity=".5"/>)}
      <circle r="78" fill="#e0dfce" stroke={INK} strokeWidth="4"/>
      <circle r="62" fill={INK}/>
      <g transform={`rotate(${rot})`} stroke={live?GREEN:"#899383"} fill="none" strokeWidth="8">
       {[0,60,120,180,240,300].map(a=><path key={a} transform={`rotate(${a})`} d="M0-14Q20-30 0-51"/>)}
      </g>
      <circle r="13" fill="#d0d6c0" stroke={INK} strokeWidth="3"/>
      <rect x="-17" y="-106" width="34" height="17" rx="4" fill={live?GREEN:RED} stroke={INK} strokeWidth="2"/>
      <text y="155" fill={INK} fontFamily="Arial,sans-serif" fontSize="24" textAnchor="middle">{String(i+1).padStart(2,"0")}</text>
     </g>;
   })}
   <path d={`M135 1470H${135+810*u}`} stroke={live?GREEN:RED} strokeWidth="7"/>
   <text x="540" y="1403" fill={off?RED:INK} fontSize="44" textAnchor="middle" fontStyle="italic">{reset?(live?"Back to zero. Back to work.":"First, switch it off."):off?"Four generators. Zero AC power.":"Tick. Tick. Tick."}</text>
   <text x="540" y="1798" fill={INK} opacity=".65" fontFamily="Arial,sans-serif" fontSize="20" textAnchor="middle">{isCounter?"Counter theory. Conceptual illustration, not aircraft wiring.":"Simplified illustration · FAA directive, 2015"}</text>
  </svg>
 </AbsoluteFill>;
};
