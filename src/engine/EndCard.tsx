import React from "react";
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from "remotion";
export const EndCard:React.FC<{start:number;handle:string}>=({start,handle})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const p=spring({frame:f-start,fps,config:{damping:24,stiffness:170}});
 return <AbsoluteFill style={{background:"#f1eddd",color:"#26352f",justifyContent:"center",alignItems:"center",fontFamily:"Arial,sans-serif",paddingBottom:200,boxSizing:"border-box",opacity:Math.min(1,(f-start+1)/5)}}>
  <div style={{fontFamily:"Georgia,serif",fontSize:91,letterSpacing:-3,marginBottom:32}}>Now you know.</div>
  <div style={{width:95,height:4,background:"#cb4a32",marginBottom:65}}/>
  <div style={{fontSize:38,marginBottom:22,letterSpacing:2}}>FOLLOW</div>
  <div style={{fontSize:74,fontWeight:750,letterSpacing:-2,transform:`translateY(${(1-p)*22}px)`}}>{handle}</div>
  <div style={{marginTop:50,border:"2px solid #467765",borderRadius:50,padding:"19px 43px",fontSize:31,color:"#467765"}}>+ Follow</div>
 </AbsoluteFill>;
};
