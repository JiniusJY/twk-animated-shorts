import React from "react";
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {ShotDef} from "./types";
const I="#26352f",P="#f1eddd",R="#cb4a32",G="#467765";
const Plane:React.FC<{x?:number;y?:number;s?:number}>=({x=540,y=620,s=1})=><g transform={`translate(${x} ${y}) scale(${s})`} fill={I}><path d="M-380 0Q-345-40-120-30L10-245 55-245-10-28 260-16 340-90 380-86 340 0 380 86 340 90 260 16-10 28 55 245 10 245-120 30Q-345 40-380 0Z"/><path d="M-310 0H320" stroke={P} strokeWidth="3"/>{[-230,-190,-150,-110,-70,-30,10,50,90,130,170,210].map(x=><rect key={x} x={x} y="-15" width="17" height="7" rx="3" fill={P}/>)}</g>;
export const EditorialScene:React.FC<{shot:ShotDef}>=({shot})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f-shot.a,u=Math.min(1,t/(shot.b-shot.a));
 const m=shot.graphic;
 const reveal=spring({frame:t,fps,config:{damping:24,stiffness:150}});
 const headline:Record<string,string>={hook:"Don't leave it running.",lab:"Found on the ground.",stakes:"Not one. All four.",question:"How does time break a jet?",clock:"A clock, in software.",storage:"One bit for the sign.",odometer:"You've seen this before.",directive:"An official workaround.",payoff:"The oldest fix in IT."};
 return <AbsoluteFill style={{background:P}}><svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{fontFamily:"Georgia,serif"}}>
 <defs><pattern id="editor-paper" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M3 6h1m15 8h1m-9 11h1" stroke={I} opacity=".06"/></pattern></defs>
 <rect width="1080" height="1920" fill="url(#editor-paper)"/>
 <text x="64" y="155" fill={R} fontFamily="Arial,sans-serif" fontSize="23" letterSpacing="3">THE 248-DAY BUG</text>
 <text x="64" y="255" fill={I} fontSize={m==="question"?63:73} letterSpacing="-3">{headline[m??""]}</text>
 <path d="M65 292Q320 298 590 289" fill="none" stroke={R} strokeWidth="3"/>
 {(m==="hook"||m==="stakes")&&<>
  <g transform={`translate(0 ${(1-reveal)*70})`}><Plane x={490+100*u} y={630} s={1.05}/></g>
  <path d="M110 945H970" stroke={I} strokeWidth="4"/>
  {Array.from({length:12},(_,i)=><path key={i} d={`M${110+i*78} 930v30`} stroke={I} strokeWidth="2"/>)}
  <text x="110" y="1014" fill={I} fontFamily="Arial,sans-serif" fontSize="24">POWER ON</text><text x="970" y="1014" textAnchor="end" fill={R} fontFamily="Arial,sans-serif" fontSize="24">248 DAYS</text>
  <circle cx={110+860*Math.min(1,u*1.2)} cy="945" r="14" fill={R}/>
  <text x="540" y="1210" textAnchor="middle" fill={R} fontSize={m==="hook"?190:140}>{m==="hook"?Math.floor(248*u):"4 → 0"}</text>
  <text x="540" y="1290" textAnchor="middle" fill={I} fontSize="39" fontStyle="italic">{m==="hook"?"days without a shutdown":"AC generators, simultaneously"}</text>
 </>}
 {m==="lab"&&<>
  <g transform={`translate(${(1-reveal)*-60} 0)`}>
  <path d="M100 650H980V1050H100Z" fill="#d4d2bf" stroke={I} strokeWidth="4"/>
  <path d="M135 690H610V970H135Z" fill={I}/>
  <path d={`M150 850H250L280 790 320 910 355 850H${360+u*220}`} fill="none" stroke={G} strokeWidth="5"/>
  {[0,1,2,3].map(i=><g key={i}><circle cx={720+i%2*150} cy={760+Math.floor(i/2)*150} r="35" fill={i/4<u?R:G} stroke={I} strokeWidth="4"/><path d={`M${685+i%2*150} ${760+Math.floor(i/2)*150}h70`} stroke={I} strokeWidth="3"/></g>)}
  <path d="M80 1050H1000M150 1050V1180M930 1050V1180" stroke={I} strokeWidth="12"/>
  </g><text x="540" y="480" fill={I} textAnchor="middle" fontSize="145">2015</text>
  <text x="540" y="1290" fill={R} textAnchor="middle" fontSize="43" fontStyle="italic">Lab testing. Not a crash report.</text>
 </>}
 {m==="question"&&<>
  <circle cx="540" cy="800" r="300" fill="#dedeca" stroke={I} strokeWidth="5"/>
  {Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30} 540 800)`} d="M540 522v26" stroke={I} strokeWidth="5"/>)}
  <g transform={`rotate(${t*2} 540 800)`}><path d="M540 800V610" stroke={I} strokeWidth="14" strokeLinecap="round"/></g>
  <g transform={`rotate(${t*.12} 540 800)`}><path d="M540 800l135 68" stroke={R} strokeWidth="18" strokeLinecap="round"/></g>
  <circle cx="540" cy="800" r="14" fill={I}/><text x="540" y="1320" textAnchor="middle" fill={R} fontSize="150">?</text>
 </>}
 {m==="clock"&&<>
  <g transform={`translate(${(1-reveal)*60} 0)`}><rect x="180" y="550" width="720" height="570" rx="16" fill={G} stroke={I} strokeWidth="5"/>
  {Array.from({length:9},(_,i)=><g key={i} stroke={I} strokeWidth="8"><path d={`M${240+i*75} 500v50M${240+i*75} 1120v50`}/></g>)}
  <rect x="280" y="670" width="520" height="310" fill={I} stroke={P} strokeWidth="3"/>
  <text x="540" y="805" fill={P} textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="100">{String(Math.floor(t/fps*100)).padStart(4,"0")}</text>
  <text x="540" y="900" fill={P} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="27">TICKS</text></g>
  <text x="540" y="1300" fill={R} textAnchor="middle" fontSize="55" fontStyle="italic">about 100 times a second</text>
  <text x="540" y="1390" fill={I} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="25">LEADING THEORY · NOT VERIFIED GCU INTERNALS</text>
 </>}
 {m==="storage"&&<>
  {Array.from({length:32},(_,i)=><g key={i} transform={`translate(${90+i%8*116} ${610+Math.floor(i/8)*126})`} opacity={Math.min(1,Math.max(0,(t-i)/7))}>
    <rect width="97" height="105" rx="4" fill={i===0?R:"#d6dac6"} stroke={I} strokeWidth="3"/>
    <text x="48" y="73" fill={i===0?P:I} textAnchor="middle" fontSize="63" fontFamily="'Courier New',monospace">{i===0?0:1}</text>
  </g>)}
  <path d="M150 565Q150 450 400 480" fill="none" stroke={R} strokeWidth="3"/>
  <text x="420" y="490" fill={R} fontSize="38" fontStyle="italic">this one decides + or −</text>
  <text x="540" y="1260" fill={I} textAnchor="middle" fontSize="90">32 bits. Finite room.</text>
  <text x="540" y="1370" fill={I} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="25">ILLUSTRATION OF THE SIGNED-COUNTER THEORY</text>
 </>}
 {m==="odometer"&&<>
  <g transform={`translate(${Math.sin(u*Math.PI)*30} 0)`}><path d="M110 810L210 690H745L890 810H975V1010H90V880Z" fill={R} stroke={I} strokeWidth="5"/>
  <path d="M255 720H480V810H180ZM510 720H715L820 810H510Z" fill="#d7e1d3" stroke={I} strokeWidth="4"/>
  {[270,790].map(x=><g key={x} transform={`translate(${x} 1010) rotate(${t*3})`}><circle r="99" fill={I}/><circle r="62" fill="#b4b9a6"/>{[0,60,120].map(a=><path key={a} transform={`rotate(${a})`} d="M-52 0H52" stroke={I} strokeWidth="9"/>)}</g>)}
  </g><g transform={`translate(0 ${(1-reveal)*80})`}><rect x="145" y="430" width="790" height="180" rx="8" fill={I}/>
  {(u>.6?"000000":"999999").split("").map((n,i)=><g key={i}><rect x={166+i*127} y="450" width="112" height="140" fill={P}/><text x={222+i*127} y="552" fill={I} fontSize="98" textAnchor="middle" fontFamily="'Courier New',monospace">{n}</text></g>)}</g>
  <path d="M540 620V675" fill="none" stroke={I} strokeWidth="3" strokeDasharray="8 8"/>
  <text x="540" y="1285" fill={I} textAnchor="middle" fontSize="48" fontStyle="italic">Like an odometer running out of digits.</text>
 </>}
 {(m==="directive"||m==="payoff")&&<g transform={`translate(${m==="payoff"?-50:0} 0) rotate(-3 540 850)`}>
  <path d="M200 420H835L930 520V1320H200Z" fill="#fffcf1" stroke={I} strokeWidth="4"/>
  <path d="M835 420V520H930" fill="#ddd9c9" stroke={I} strokeWidth="3"/>
  <text x="260" y="570" fill={I} fontFamily="Arial,sans-serif" fontSize="28">FEDERAL AVIATION ADMINISTRATION</text>
  <path d="M260 610H850" stroke={I} strokeWidth="3"/>
  <rect x="250" y="860" width={Math.max(0,Math.min(610,u*710))} height="145" fill="#d7c875" opacity=".35"/>
  <text x="260" y="720" fill={I} fontSize="58">Airworthiness</text><text x="260" y="792" fill={I} fontSize="58">Directive</text>
  <text x="260" y="902" fill={R} fontSize="47" fontStyle="italic">Power cycle</text><text x="260" y="970" fill={R} fontSize="47" fontStyle="italic">at least every 120 days.</text>
  {[1070,1110,1150,1190].map((y,i)=><path key={y} d={`M260 ${y}h${i===3?230:520}`} stroke={I} strokeWidth="3" opacity=".25"/>)}
  <text x="260" y="1270" fill={I} fontFamily="Arial,sans-serif" fontSize="21">ILLUSTRATION · NOT AN ORIGINAL DOCUMENT</text>
 </g>}
 <text x="540" y="1798" fill={I} opacity=".65" fontFamily="Arial,sans-serif" fontSize="20" textAnchor="middle">Simplified illustration · Sources in episode claim ledger</text>
 </svg></AbsoluteFill>;
};
