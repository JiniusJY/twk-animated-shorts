"""Compose sourced technical explanation over coherent physically rendered scene."""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import pathlib,json,math,re
import numpy as np,cv2
from painted_rig import make as opening
from technical_stage import stage
ROOT=pathlib.Path(__file__).parent
P=pathlib.Path('/tmp/ronaldo-3d-smooth')
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
INK='#f3f4ee';MINT='#97d4c3';RED='#f3a19b'
words=json.loads(pathlib.Path('/downloads/ronaldo-tech-narration/words.json').read_text())
for x in words:x['e']=min(x['e'],41.168917)
pages=[]
for x in words:
 if not pages or len(pages[-1])>=4 or x['s']-pages[-1][0]['s']>1.65 or re.search(r'[.?!,]$',pages[-1][-1]['w']):pages.append([])
 pages[-1].append(x)
def text(d,xy,s,n=25,c=INK,b=False):d.text(xy,s,font=ImageFont.truetype(B if b else F,n),fill=c)
def ease(a,b,t):
 q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
def panel(im,box,alpha=190):
 layer=Image.new('RGBA',im.size);d=ImageDraw.Draw(layer);d.rounded_rectangle(box,14,fill=(16,26,30,alpha));return Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB')
def frame(t):
 if t<2.66:
  im=opening(t*5.34/2.66)
  if t<.45:
   ar=np.array(im);roi=ar[210:760].copy();edges=cv2.Canny(cv2.cvtColor(roi,cv2.COLOR_RGB2GRAY),65,140);sketch=np.empty_like(roi);sketch[:]=(241,237,221);sketch[edges>0]=(73,78,65);yy,xx=np.mgrid[:roi.shape[0],:roi.shape[1]];mask=(yy/roi.shape[0]*.75+(xx%57)/57*.25)<min(1,(t+.08)/.53);sketch[mask]=roi[mask];ar[210:760]=sketch;im=Image.fromarray(ar)
 elif t>=38.94:
  return Image.open(ROOT/'out/endcard'/f'{min(119,23+int((t-38.94)*30)):04d}.png').convert('RGB')
 else:
  n=min(1086,max(1,1+round((t-2.66)*30)));src=Image.open(P/f'{n:04d}.png').convert('RGB')
  # Fit the physical object without a visible inset: extrapolate each scanline's
  # actual studio edge colours, then blend only the outer pixels of the source.
  small=src.resize((420,680),Image.Resampling.LANCZOS)
  ar=np.array(small);bg=np.empty((960,540,3),dtype=np.uint8)
  for yy in range(960):
   sy=max(0,min(679,yy-135));left=ar[sy,0].astype(float);right=ar[sy,-1].astype(float)
   bg[yy]=np.linspace(left,right,540).astype('uint8')
  im=Image.fromarray(bg);ma=Image.new('L',(420,680),255)
  mask=np.full((680,420),255.,dtype=float);yy,xx=np.mgrid[:680,:420]
  mask*=np.minimum(1,np.minimum(xx+1,420-xx)/24);mask*=np.minimum(1,np.minimum(yy+1,680-yy)/24)
  im.paste(small,(60,135),Image.fromarray(mask.astype('uint8')))
  im=stage(im,t)

  # Titles/captions use the same studio palette. No fake interfaces or real-match waveform.
  if not 25.72<=t<27.68:im=panel(im,(18,24,522,135),175)
  d=ImageDraw.Draw(im)

  if t<4.16:lines=['THE BALL CARRIED','EVIDENCE.'];sub='Generic model, not the official 2022 ball'
  elif t<8.88:lines=['SUSPENDED SENSOR','AT THE CENTRE'];sub='IMU = inertial measurement unit'
  elif t<10.94:lines=['ACCELEROMETER','Changes in motion'];sub='Concept: a tiny mass responds to acceleration'
  elif t<13.46:lines=['GYROSCOPE','How fast it rotates'];sub='Angular velocity, not player identity'
  elif t<19.62:lines=['500 READINGS / SECOND','ONE EVERY 2 ms'];sub='Sample spacing, not decision time or accuracy'
  elif t<22.04:lines=['A TOUCH CAN CHANGE','THE SIGNAL'];sub='Illustrative demonstration, not match data'
  elif t<25.72:lines=['NO MEASURABLE','EXTERNAL FORCE'];sub='adidas statement via FIFA · Ronaldo attempt'
  elif t<27.68:lines=['GOAL CREDIT','BRUNO FERNANDES'];sub='Portugal v Uruguay · World Cup 2022'
  elif t<32.14:lines=['ANOTHER USE: OFFSIDE','TIMING + POSITION'];sub='Separate workflow, not this goal-credit decision'
  elif t<35.64:lines=['VIDEO OFFICIALS','CHECK AND VALIDATE'];sub='Suggested kick point + offside line'
  else:lines=['SENSOR HELPS WITH WHEN.','OFFICIALS INTERPRET.'];sub='Motion measurements need match context'
  if not 25.72<=t<27.68:
   text(d,(35,38),lines[0],26,INK,True);text(d,(35,76),lines[1],27,MINT,True)
  if 8.88<=t<10.94:
   im=panel(im,(32,675,508,796));d=ImageDraw.Draw(im);cx=270-22*math.sin((t-8.88)*9);d.rounded_rectangle((73,705,467,767),6,outline=MINT,width=2)
   d.line((80,736,cx-26,736),fill=MINT,width=2);d.line((cx+26,736,460,736),fill=MINT,width=2);d.rectangle((cx-26,714,cx+26,758),fill='#a7bbb8')
   d.line((140,692,397,692),fill=RED,width=3);d.polygon([(397,692),(386,686),(386,698)],fill=RED)

 # Caption backing stays fixed in safe area, white/ink for illustrated bookend.
 d=ImageDraw.Draw(im);d.rectangle((0,836,540,960),fill='#142027' if t>=2.66 else '#f1eddd')
 pg=next((p for p in pages if p[0]['s']<=t<max(p[-1]['e'],p[0]['s']+.22)),None)
 if pg:
  st=' '.join(x['w'] for x in pg);n=26
  while d.textlength(st,font=ImageFont.truetype(B,n))>460:n-=1
  f=ImageFont.truetype(B,n);x=(540-d.textlength(st,font=f))/2
  for z in pg:
   tok=z['w']+' ';d.text((x,860),tok,font=f,fill=(MINT if t>=2.66 else '#a43d3d') if z['s']<=t<z['e'] else INK if t>=2.66 else '#26352f');x+=d.textlength(tok,font=f)
 return im
if __name__=='__main__':
 out=ROOT/'out/tech-final';out.mkdir(exist_ok=True)
 for i in range(1275):frame(i/30).save(out/f'{i:04d}.png')
