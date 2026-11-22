import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {ShotDef} from "./types";
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

const Paper:React.FC<{children:React.ReactNode}>=({children})=>{
 const f=useCurrentFrame();
 const live=0.25+0.75*Math.abs(Math.sin(f/9));
 return <AbsoluteFill style={{background:P}}>
  <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{fontFamily:"Georgia,serif"}}>
   <defs>
    <pattern id="ncic-grain" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M3 6h1m15 8h1m-9 11h1" stroke={I} opacity=".055"/></pattern>
    <marker id="ncic-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={R} strokeWidth="1.5"/></marker>
    <marker id="ncic-arrow-ink" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={I} strokeWidth="1.5"/></marker>
    <marker id="ncic-arrow-green" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8" fill="none" stroke={G} strokeWidth="1.5"/></marker>
   </defs>
   <rect width="1080" height="1920" fill="url(#ncic-grain)"/>
   <text x="64" y="155" fill={R} fontFamily="Arial,sans-serif" fontSize="23" letterSpacing="3">{KICKER}</text>
   <circle cx="1022" cy="147" r="9" fill={R} opacity={live}/>
   <circle cx="1022" cy="147" r="15" fill="none" stroke={R} strokeWidth="2" opacity={live*0.5}/>
   {children}
  </svg>
 </AbsoluteFill>;
};

const Headline:React.FC<{text:string;size?:number}>=({text,size=73})=>(
 <>
  <text x="64" y="255" fill={I} fontSize={size} letterSpacing="-3">{text}</text>
  <path d="M65 292Q320 298 590 289" fill="none" stroke={R} strokeWidth="3"/>
 </>
);

/** A steel drawer with handle and label slot. */
const Drawer:React.FC<{x:number;y:number;w:number;h:number;label?:string;hot?:boolean;opacity?:number}>=({x,y,w,h,label,hot,opacity=1})=>(
 <g opacity={opacity}>
  <rect x={x} y={y} width={w} height={h} rx="6" fill={hot?"#e4d7c8":"#d4d2bf"} stroke={hot?R:I} strokeWidth={hot?5:3}/>
  <rect x={x+w*0.18} y={y+h*0.16} width={w*0.64} height={h*0.34} rx="3" fill={P} stroke={I} strokeWidth="2"/>
  <rect x={x+w*0.38} y={y+h*0.62} width={w*0.24} height={h*0.14} rx={h*0.07} fill={I}/>
  {label&&<text x={x+w/2} y={y+h*0.4} textAnchor="middle" fill={hot?R:I} fontFamily="Arial,sans-serif" fontSize={Math.min(30,w*0.11)} fontWeight="700">{label}</text>}
 </g>
);

/** A door: the unit of attack surface. */
const Door:React.FC<{x:number;y:number;s?:number;hot?:boolean;open?:number}>=({x,y,s=1,hot,open=0})=>(
 <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x="-34" y="-60" width="68" height="120" rx="4" fill="#d4d2bf" stroke={hot?R:I} strokeWidth={hot?5:3}/>
  <g style={{transformOrigin:"-30px 0px",transform:`perspective(300px) rotateY(${-open*70}deg)`}}>
   <rect x="-30" y="-54" width="60" height="108" rx="3" fill={hot?"#e9cdbd":P} stroke={hot?R:I} strokeWidth="3"/>
   <circle cx="18" cy="0" r="5" fill={hot?R:I}/>
  </g>
 </g>
);

/** The NCIC core: one database cylinder. */
const Core:React.FC<{x:number;y:number;s?:number;alarm?:number}>=({x,y,s=1,alarm=0})=>(
 <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ellipse cx="0" cy="150" rx="150" ry="26" fill={I} opacity=".08"/>
  <path d="M-130-110H130V110Q130 150 0 150Q-130 150-130 110Z" fill={alarm>0.5?"#e4c4b4":"#d4d2bf"} stroke={alarm>0.5?R:I} strokeWidth="5"/>
  <ellipse cx="0" cy="-110" rx="130" ry="34" fill={alarm>0.5?"#e9cdbd":P} stroke={alarm>0.5?R:I} strokeWidth="5"/>
  {[-45,10,65].map((yy,i)=><path key={i} d={`M-130 ${yy}Q0 ${yy+40} 130 ${yy}`} fill="none" stroke={alarm>0.5?R:I} strokeWidth="3" opacity=".55"/>)}
  <text x="0" y="30" textAnchor="middle" fill={alarm>0.5?R:I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="44">NCIC</text>
  {alarm>0.5&&<text x="0" y="200" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize="30" letterSpacing="4">APPARENT BREACH</text>}
 </g>
);

export const NcicScene:React.FC<{shot:ShotDef}>=({shot})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const t=f-shot.a, span=shot.b-shot.a, u=Math.max(0,Math.min(1,t/span));
 const m=shot.graphic;
 const pop=spring({frame:t,fps,config:{damping:22,stiffness:160}});

 // 1. HOOK: someone may already be inside the FBI's own files.
 if(m==="ncic-hook"){
  const creep=Math.min(1,u*1.6);
  const stamp=Math.max(0,Math.min(1,(u-0.5)/0.2));
  return <Paper>
   <Headline text="Someone may be inside."/>
   <g transform={`translate(0 ${(1-pop)*40})`}>
    <rect x="310" y="470" width="460" height="730" rx="14" fill="#c0c5b1" stroke={I} strokeWidth="5"/>
    {["WANTED PERSONS","MISSING PERSONS","STOLEN VEHICLES","WARRANTS"].map((l,i)=><Drawer key={l} x={345} y={505+i*170} w={390} h={140} label={l} hot={i===1&&creep>0.7}/>)}
   </g>
   <path d={`M1080 730Q860 710 ${1080-570*creep} ${710-20*creep}`} fill="none" stroke={R} strokeWidth="5" strokeDasharray="14 12" markerEnd="url(#ncic-arrow)"/>
   {stamp>0&&<g transform={`translate(560 400) rotate(-7)`} opacity={stamp}>
    <rect x="0" y="0" width="470" height="146" rx="8" fill="none" stroke={R} strokeWidth="7"/>
    <text x="235" y="64" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="42" letterSpacing="3">APPARENT BREACH</text>
    <text x="235" y="112" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize="27">FBI INVESTIGATING · UNCONFIRMED</text>
   </g>}
   <text x="540" y="1330" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">The FBI's own crime database, reported hacked. Nov 2026.</text>
  </Paper>;
 }

 // 2. TRAFFIC STOP: one plate check, one system answering.
 if(m==="ncic-stop"){
  const send=Math.max(0,Math.min(1,(u-0.1)/0.35));
  const back=Math.max(0,Math.min(1,(u-0.55)/0.3));
  const dotX=interpolate(send,[0,1],[350,760]);
  const retX=interpolate(back,[0,1],[760,350]);
  return <Paper>
   <Headline text="One system answers."/>
   {/* patrol car */}
   <g transform={`translate(${140+30*Math.sin(u*Math.PI)} 780)`}>
    <path d="M0 120L30 40H60L90 0H240L285 45H340L350 120Z" fill={I}/>
    <rect x="150" y="-26" width="60" height="26" rx="6" fill={R}/>
    <path d="M100 45H230M100 20L120 45M250 45L265 20" stroke={P} strokeWidth="5" fill="none"/>
    <circle cx="80" cy="125" r="38" fill={I}/><circle cx="80" cy="125" r="18" fill="#b4b9a6"/>
    <circle cx="270" cy="125" r="38" fill={I}/><circle cx="270" cy="125" r="18" fill="#b4b9a6"/>
   </g>
   {/* plate card */}
   <g transform={`translate(150 ${560+(1-pop)*-30})`}>
    <rect x="0" y="0" width="220" height="110" rx="10" fill={P} stroke={I} strokeWidth="4"/>
    <text x="110" y="70" textAnchor="middle" fill={I} fontFamily="'Courier New',monospace" fontWeight="700" fontSize="52">8JXK-204</text>
    <text x="110" y="150" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="20">PLATE CHECK · ILLUSTRATION</text>
   </g>
   {/* NCIC building */}
   <g transform="translate(700 580)">
    <path d="M0 320V60L60 0H220L280 60V320Z" fill="#d4d2bf" stroke={I} strokeWidth="5"/>
    <path d="M60 0L140 60H220L140 0" fill="none" stroke={I} strokeWidth="3"/>
    {[0,1,2,3].map(i=><rect key={i} x={35+i*60} y={110} width="34" height="48" fill={I} opacity=".8"/>)}
    {[0,1,2,3].map(i=><rect key={i} x={35+i*60} y={190} width="34" height="48" fill={I} opacity=".8"/>)}
    <rect x="115" y="255" width="50" height="65" fill={I}/>
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
  return <Paper>
   <Headline text="Twenty-one drawers."/>
   <g transform="translate(140 440)">
    <rect x="0" y="0" width="800" height="905" rx="16" fill="#c0c5b1" stroke={I} strokeWidth="5"/>
    {Array.from({length:21},(_,i)=>{
     const col=i%3,row=Math.floor(i/3);
     const named=i<5;
     const o=Math.max(0,Math.min(1,(t-i*3)/10));
     const scan=Math.floor(f/7)%21===i;
     return <g key={i}>
      <Drawer x={35+col*250} y={35+row*122} w={220} h={96} label={named?names[i]:undefined} hot={named} opacity={o}/>
      {scan&&o>0.9&&<rect x={35+col*250} y={35+row*122} width={220} height={96} rx="6" fill={R} opacity=".16"/>}
     </g>;
    })}
   </g>
   <text x="540" y="1400" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">plus identity theft, gangs and suspected terrorists (FBI, 2017)</text>
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
     return <g key={i} transform={`translate(${x} 30)`}>
      <rect width="72" height="120" rx="6" fill={P}/>
      <text x="36" y={95+jiggle} textAnchor="middle" fill={I} fontFamily="'Courier New',monospace" fontWeight="700" fontSize="66">{ch}</text>
     </g>;
    })}
    <text x="95" y="200" fill={P} fontFamily="Arial,sans-serif" fontSize="30" letterSpacing="4">{approx?"≈ ":""}{label}</text>
    <text x="985" y="200" textAnchor="end" fill="#a4af9f" fontFamily="Arial,sans-serif" fontSize="22">{sub}</text>
   </g>;
  };
  return <Paper>
   <Headline text="Built to be checked."/>
   {drum(520,"ACTIVE RECORDS","FBI, 2017","12,000,000")}
   {drum(890,"CHECKS PER DAY","DOJ TESTIMONY, 2024","10,000,000",true)}
   <text x="540" y="1300" textAnchor="middle" fill={R} fontSize="46" fontStyle="italic">one answer can change a stop</text>
  </Paper>;
 }

 // 5. CLOCK: open 24/7 since January 1967.
 if(m==="ncic-clock"){
  const sweep=t*6;
  return <Paper>
   <Headline text="It never closes."/>
   <g transform="translate(540 720)">
    <circle r="280" fill="#dedeca" stroke={I} strokeWidth="6"/>
    {Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30})`} d="M0-258v32" stroke={I} strokeWidth="6"/>)}
    <g transform={`rotate(${sweep})`}><path d="M0 0V-185" stroke={I} strokeWidth="13" strokeLinecap="round"/></g>
    <g transform={`rotate(${sweep/12})`}><path d="M0 0L115 60" stroke={R} strokeWidth="16" strokeLinecap="round"/></g>
    <circle r="15" fill={I}/>
   </g>
   <text x="540" y="1160" textAnchor="middle" fill={R} fontSize="120">24/7</text>
   <g>
    <path d="M150 1280H930" stroke={I} strokeWidth="4"/>
    <circle cx="150" cy="1280" r="12" fill={I}/>
    <circle cx={150+780*Math.min(1,u*1.2)} cy="1280" r="14" fill={R}/>
    <circle cx="930" cy="1280" r="12" fill={I}/>
    <text x="150" y="1340" fill={I} fontFamily="Arial,sans-serif" fontSize="26">JAN 27, 1967</text>
    <text x="930" y="1340" textAnchor="end" fill={I} fontFamily="Arial,sans-serif" fontSize="26">TODAY</text>
   </g>
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
  return <Paper>
   <Headline text="Ninety thousand doors." size={66}/>
   {doors.map((d,i)=>{
    const isHot=hot.includes(i);
    const open=isHot?Math.max(0,Math.min(1,(u-0.3-i*0.12)/0.25)):0;
    const lineLive=Math.min(1,u*1.3);
    return <g key={i}>
     <path d={`M540 810L${540+(d.x-540)*lineLive} ${810+(d.y-810)*lineLive}`} stroke={open>0?R:I} strokeWidth={open>0?5:2.5} opacity={open>0?0.95:0.5}/>
     <Door x={d.x} y={d.y} s={0.75} hot={open>0.15} open={open}/>
    </g>;
   })}
   <Core x={540} y={810} s={0.9}/>
   <text x="540" y="1300" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">connected to 90,000+ criminal-justice agencies (FBI, 2017)</text>
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
  return <Paper>
   <Headline text="One door was used." size={66}/>
   {Array.from({length:18},(_,i)=>{
    const aa=(i/18)*Math.PI*2-Math.PI/2;
    const dx=540+Math.cos(aa)*380, dy=810+Math.sin(aa)*400;
    const isDoor=i===7;
    return <g key={i}>
     <path d={`M540 810L${dx} ${dy}`} stroke={isDoor?R:I} strokeWidth={isDoor?6:2.5} opacity={isDoor?1:0.45}/>
     <Door x={dx} y={dy} s={0.75} hot={isDoor} open={isDoor?1:0}/>
    </g>;
   })}
   <Core x={540} y={810} s={0.9} alarm={alarm}/>
   {pulse<1&&<circle cx={px} cy={py} r="16" fill={R}/>}
   {u>0.62&&<g transform={`translate(140 1260)`}>
    {["WHO GOT IN?","HOW?","WHAT WAS TAKEN?"].map((q,i)=>(
     <g key={q} transform={`translate(${i*273} 0)`} opacity={Math.max(0,Math.min(1,(u-0.62-i*0.08)/0.12))}>
      <rect width="253" height="130" rx="10" fill={P} stroke={I} strokeWidth="3"/>
      <text x="126" y="52" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="27">{q}</text>
      <text x="126" y="100" textAnchor="middle" fill={R} fontFamily="Arial,sans-serif" fontSize="27" fontStyle="italic">unknown</text>
     </g>
    ))}
   </g>}
   <text x="540" y="1460" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="24">AP: apparent breach, discovered in recent days. Nov 2026.</text>
  </Paper>;
 }

 // 8. PATTERN: second claimed FBI breach in two months.
 if(m==="ncic-pattern"){
  const card=(x:number,head:string,l1:string,l2:string,l3:string,hot?:boolean)=>(
   <g transform={`translate(${x} 520) rotate(${hot?2:-2})`}>
    <path d="M0 0H380L430 55V560H0Z" fill="#fffcf1" stroke={I} strokeWidth="4"/>
    <path d="M380 0V55H430" fill="#ddd9c9" stroke={I} strokeWidth="3"/>
    <text x="36" y="80" fill={hot?R:I} fontFamily="Arial,sans-serif" fontWeight="700" fontSize="34" letterSpacing="2">{head}</text>
    <path d="M36 110H370" stroke={I} strokeWidth="3"/>
    <text x="36" y="180" fill={I} fontSize="40" fontWeight="700">{l1}</text>
    <text x="36" y="250" fill={I} fontFamily="Arial,sans-serif" fontSize="30">{l2}</text>
    <text x="36" y="310" fill={I} fontFamily="Arial,sans-serif" fontSize="30">{l3}</text>
    <text x="36" y="520" fill={I} opacity=".6" fontFamily="Arial,sans-serif" fontSize="19">ILLUSTRATION · NOT AN ORIGINAL DOCUMENT</text>
   </g>
  );
  const link=Math.max(0,Math.min(1,(u-0.5)/0.25));
  return <Paper>
   <Headline text="Twice in two months." size={66}/>
   {card(90,"SEPT 2026","FBIJobs.gov","extortion gang claim:","unpatched software.")}
   {card(560,"NOV 2026","NCIC","apparent breach:","under investigation.",true)}
   {link>0&&<g opacity={link}>
    <path d="M520 660Q540 600 560 660" fill="none" stroke={R} strokeWidth="5" markerEnd="url(#ncic-arrow)"/>
    <text x="540" y="1200" textAnchor="middle" fill={R} fontSize="42" fontStyle="italic">same agency. no evidence the two are linked.</text>
   </g>}
   <text x="540" y="1330" textAnchor="middle" fill={I} fontFamily="Arial,sans-serif" fontSize="26">BleepingComputer / CNN reporting, Nov 21 2026</text>
  </Paper>;
 }

 // 9. PAYOFF: every line in the system is a real person.
 if(m==="ncic-payoff"){
  const underline=Math.max(0,Math.min(1,(u-0.45)/0.3));
  return <Paper>
   <Headline text="Every line is a person." size={66}/>
   <g transform={`translate(240 460) rotate(-2)`}>
    <path d="M0 0H560L640 85V790H0Z" fill="#fffcf1" stroke={I} strokeWidth="5"/>
    <path d="M560 0V85H640" fill="#ddd9c9" stroke={I} strokeWidth="3"/>
    <rect x="40" y="50" width="200" height="250" fill="#d4d2bf" stroke={I} strokeWidth="3"/>
    <circle cx="140" cy="140" r="52" fill={I}/>
    <path d="M70 280Q140 200 210 280Z" fill={I}/>
    <text x="280" y="88" fill={I} fontFamily="Arial,sans-serif" fontSize="25" letterSpacing="2">NCIC RECORD</text>
    <text x="280" y="122" fill={I} opacity=".6" fontFamily="Arial,sans-serif" fontSize="18" letterSpacing="2">ILLUSTRATION</text>
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

 return <Paper><Headline text="NCIC"/></Paper>;
};
