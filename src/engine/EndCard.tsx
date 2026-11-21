import React from "react";
import {AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig} from "remotion";
export const EndCard:React.FC<{start:number;handle:string}>=({start,handle})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const clicked=(f-start)>fps*1.15;
 const press=Math.max(0,1-Math.abs((f-start)-fps*1.15)/5);
 const p=spring({frame:f-start,fps,config:{damping:24,stiffness:170}});
 return <AbsoluteFill style={{background:"#f1eddd",color:"#26352f",justifyContent:"center",alignItems:"center",fontFamily:"Arial,sans-serif",paddingBottom:100,boxSizing:"border-box",opacity:Math.min(1,(f-start+1)/5)}}>
  <div style={{width:230,height:230,borderRadius:"50%",overflow:"hidden",background:"#111316",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36}}><Img src={staticFile("brand/twk-owner-logo-centered.png")} style={{width:230,maxWidth:"none",height:"auto"}} /></div>
  <div style={{fontFamily:"Georgia,serif",fontSize:78,letterSpacing:-3,marginBottom:32}}>Now you know.</div>
  <div style={{width:95,height:4,background:"#cb4a32",marginBottom:35}}/>
  <div style={{fontSize:38,marginBottom:22,letterSpacing:2}}>FOLLOW</div>
  <div style={{fontSize:74,fontWeight:750,letterSpacing:-2,transform:`translateY(${(1-p)*22}px)`}}>{handle}</div>
  <div style={{marginTop:30,border:"2px solid #467765",borderRadius:50,padding:"19px 43px",fontSize:31,color:clicked?"#f1eddd":"#467765",background:clicked?"#467765":"transparent",transform:`scale(${1-press*.1})`,position:"relative"}}>{clicked?"✓ Following":"+ Follow"}<span style={{position:"absolute",right:-30,top:24,fontSize:40,color:"#26352f",opacity:Math.max(0,1-Math.abs((f-start)/fps-1.15))}}>↖</span></div>
  <div style={{opacity:Math.max(0,Math.min(1,(f-start-fps*.8)/(fps*.8))),transform:`translateY(${Math.max(0,1-(f-start-fps*.8)/(fps*.8))*24}px)`,marginTop:70,borderTop:"2px solid #b6b9a6",paddingTop:37,width:850,textAlign:"center"}}>
   <div style={{fontSize:22,letterSpacing:3,color:"#467765",marginBottom:20}}>FREE DAILY NEWSLETTER</div>
   <div style={{fontFamily:"Georgia,serif",fontSize:47}}>Master tech in 1 minute a day.</div>
   <div style={{fontSize:27,marginTop:20,color:"#4d5d54"}}>Tech news. Why it matters. How to use it.</div>
   <div style={{fontSize:32,fontWeight:700,marginTop:27,color:"#cb4a32"}}>Link in bio ↗</div>
  </div>
 </AbsoluteFill>;
};
