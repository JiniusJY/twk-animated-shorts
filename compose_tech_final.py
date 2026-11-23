"""Compose sourced technical explanation over coherent physically rendered scene."""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import pathlib,json,math,re
import numpy as np,cv2
from painted_rig import make as opening
ROOT=pathlib.Path(__file__).parent
P=pathlib.Path('/tmp/ronaldo-3d-production')
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
  n=min(435,max(0,round((t-2.66)*12)));src=Image.open(P/f'{n:04d}.png').convert('RGB')
  # Stage image in a fixed safe-area viewport. Gradient extensions avoid hard edges.
  im=src.resize((540,960)).filter(ImageFilter.GaussianBlur(38))
  small=src.resize((410,634),Image.Resampling.LANCZOS);mask=Image.new('L',small.size,255);ma=np.array(mask,dtype=float);yy,xx=np.mgrid[:634,:410];ma*=np.minimum(1,np.minimum(xx+1,410-xx)/24);ma*=np.minimum(1,np.minimum(yy+1,634-yy)/24);im.paste(small,(65,174),Image.fromarray(ma.astype('uint8')))
  # Titles/captions use the same studio palette. No fake interfaces or real-match waveform.
  im=panel(im,(18,24,522,173),175);d=ImageDraw.Draw(im)
  text(d,(35,38),'TECHWHOKNOWS  /  INSIDE THE GAME',12,MINT,True)
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
  text(d,(35,68),lines[0],26,INK,True);text(d,(35,103),lines[1],27,MINT,True);text(d,(35,148),sub,13,INK)
  if 8.88<=t<10.94:
   im=panel(im,(32,675,508,796));d=ImageDraw.Draw(im);cx=270-22*math.sin((t-8.88)*9);d.rounded_rectangle((73,705,467,767),6,outline=MINT,width=2)
   d.line((80,736,cx-26,736),fill=MINT,width=2);d.line((cx+26,736,460,736),fill=MINT,width=2);d.rectangle((cx-26,714,cx+26,758),fill='#a7bbb8');text(d,(54,777),'Concept inset: relative mass response',13)
   d.line((140,692,397,692),fill=RED,width=3);d.polygon([(397,692),(386,686),(386,698)],fill=RED)
  if 13.46<=t<19.62:
   im=panel(im,(28,699,512,800));d=ImageDraw.Draw(im)
   for j in range(11):
    x=52+j*43;active=j<=int((t*6)%11);d.ellipse((x-4,748,x+4,756),fill=MINT if active else '#58666a');
    if j%2==0:text(d,(x-8,770),str(j*2),12)
   text(d,(51,711),'READING',14,MINT,True);text(d,(465,710),'ms',12)
  if 19.62<=t<22.04:
   im=panel(im,(30,682,510,800));d=ImageDraw.Draw(im)
   for j in range(12):
    x=58+j*38;y=748 if j<6 else 715;d.ellipse((x-4,y-4,x+4,y+4),fill=MINT if j<6 else RED)
   text(d,(62,774),'SCHEMATIC BEFORE / AFTER',12)
  if 27.68<=t<35.64:
   im=panel(im,(32,569,508,800),220);d=ImageDraw.Draw(im)
   d.rectangle((66,606,474,755),outline=MINT,width=2)
   phase=min(1,max(0,(t-27.68)/3));px=170+40*phase
   for x,y,c in [(px,640,RED),(306,628,INK),(352,700,INK),(170,715,RED)]:d.ellipse((x-7,y-7,x+7,y+7),fill=c)
   d.line((290,607,290,754),fill=RED,width=2);d.line((px,608,px,754),fill=MINT,width=2)
   text(d,(66,768),'Generic positional diagram, not match footage',12)
  d=ImageDraw.Draw(im);text(d,(31,811),'GENERIC 3D MODEL · CONCEPTUAL MECHANISM',10,MINT,True)
 # Caption backing stays fixed in safe area, white/ink for illustrated bookend.
 d=ImageDraw.Draw(im);d.rectangle((0,836,540,960),fill='#142027' if t>=2.66 else '#f1eddd')
 pg=next((p for p in pages if p[0]['s']<=t<max(p[-1]['e'],p[0]['s']+.22)),None)
 if pg:
  st=' '.join(x['w'] for x in pg);n=26
  while d.textlength(st,font=ImageFont.truetype(B,n))>460:n-=1
  f=ImageFont.truetype(B,n);x=(540-d.textlength(st,font=f))/2
  for z in pg:
   tok=z['w']+' ';d.text((x,860),tok,font=f,fill=MINT if z['s']<=t<z['e'] else INK if t>=2.66 else '#26352f');x+=d.textlength(tok,font=f)
 return im
if __name__=='__main__':
 out=ROOT/'out/tech-final';out.mkdir(exist_ok=True)
 for i in range(1275):frame(i/30).save(out/f'{i:04d}.png')
