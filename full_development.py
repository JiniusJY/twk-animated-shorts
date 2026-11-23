import pathlib,json,math,re
from PIL import Image,ImageDraw,ImageFont
from painted_rig import make as opening
from tech_scenes import scene15 as ballscene
from ball_scenes import draw,base,text,INK,RED,PAPER,BRUNO,REF,act,paste
import cv2,numpy as np
ROOT=pathlib.Path(__file__).parent
OUT=ROOT/'out/full-development';OUT.mkdir(exist_ok=True)
w=json.loads(pathlib.Path('/downloads/ronaldo-tech-narration/words.json').read_text())
# Retain raw timings. Caption spelling comes from script, not a homophone ASR error.
for x in w:
 if x['w']=='censor':x['w']='sensor'
 x['e']=min(x['e'],41.168917)
pages=[]
for x in w:
 if not pages or len(pages[-1])>=4 or x['s']-pages[-1][0]['s']>1.7 or re.search(r'[.?!,]$',pages[-1][-1]['w']):pages.append([])
 pages[-1].append(x)
shots=[(0,'hook'),(2.66,'hero'),(4.16,'inside'),(8.88,'accel'),(10.94,'gyro'),(13.46,'samples15'),(19.62,'signal'),(22.04,'ronaldo-result'),(25.72,'bruno'),(27.68,'fusion'),(32.14,'validate'),(35.64,'meaning'),(38.94,'cta')]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def caption(im,t):
 if t>=38.94:return im
 d=ImageDraw.Draw(im);d.rectangle((0,814,540,960),fill=PAPER)
 pg=next((p for p in pages if p[0]['s']<=t<max(p[-1]['e'],p[0]['s']+.22)),None)
 if pg:
  s=' '.join(x['w'] for x in pg);n=26
  while d.textlength(s,font=ImageFont.truetype(font,n))>418:n-=1
  f=ImageFont.truetype(font,n);x=(540-d.textlength(s,font=f))/2
  for z in pg:
   tok=z['w']+' ';d.text((x,848),tok,font=f,fill=RED if z['s']<=t<z['e'] else INK);x+=d.textlength(tok,font=f)
 return im
endframes=ROOT/'out/endcard';endframes.mkdir(exist_ok=True)
def rawframe(t):
 a,k=max((a,k) for a,k in shots if a<=t);u=t-a
 if k=='hook':
  im=opening(t*5.34/2.66)
  # Optional drawing-on reveal, same likeness and action, complete within0.55s.
  if t<.55:
   ar=np.array(im);roi=ar[210:760].copy();gray=cv2.cvtColor(roi,cv2.COLOR_RGB2GRAY);edges=cv2.Canny(gray,65,140)
   sketch=np.empty_like(roi);sketch[:]=(241,237,221);sketch[edges>0]=(73,78,65)
   q=min(1,(t+.08)/.63);yy,xx=np.mgrid[:roi.shape[0],:roi.shape[1]]
   # Fast staggered stroke bands, not a slow wipe that delays the question.
   rank=(yy/roi.shape[0]*.75+(xx%57)/57*.25);mask=rank<q
   sketch[mask]=roi[mask];ar[210:760]=sketch;im=Image.fromarray(ar)

 elif k in ['match','bruno']:
  im=base();d=ImageDraw.Draw(im)
  text(d,(30,95),'PORTUGAL v URUGUAY',29,INK,True);text(d,(30,140),'WORLD CUP 2022',22,RED,True)
  if k=='match':
   # Carry the same football action into an illustrated celebration, not pitch dots.
   a=act(BRUNO,u,.7);paste(im,a,(117+10*min(1,u),225),(300,523))
  else:
   a=act(BRUNO,u,1);paste(im,a,(144,205),(274,477))
   if u>=.15:
    text(d,(31,704),'BRUNO',36,INK,True)
   if u>=.4:text(d,(31,738),'FERNANDES',36,RED,True)
 elif k in ['hero','inside','accel','gyro','samples15','signal','ronaldo-result','fusion','validate','meaning']:
  im=ballscene(k,u)
 elif k=='cta':
  return Image.open(endframes/f'{min(119,23+int(u*30)):04d}.png').convert('RGB')
 else:
  if k=='euro-touch':im=draw('euro',u+3.21)
  else:im=draw(k,u)
 return caption(im,t)
def frame(t):
 im=rawframe(t)
 # Continuous position/scale carry between explanation beats, readable by0.25s.
 a,k=max((a,k) for a,k in shots if a<=t)
 if a>0 and t-a<.23 and k!='cta':
  q=(t-a)/.23;q=q*q*(3-2*q)
  prev=rawframe(max(0,a-.001))
  # Slide content above captions; text/caption region stays legible and stable.
  shift=int(540*q)
  merged=Image.new('RGB',(540,960),PAPER)
  merged.paste(prev.crop((0,0,540,814)),(-shift,0))
  merged.paste(im.crop((0,0,540,814)),(540-shift,0))
  merged.paste(im.crop((0,814,540,960)),(0,814));im=merged
 return im
if __name__=='__main__':
 for i in range(1275):frame(i/30).save(OUT/f'{i:04d}.png')
 pathlib.Path('/downloads/ronaldo-full-narration/story-timing-map.json').write_text(json.dumps({'shots':shots,'source':'retained take word alignment','duration':42.5,'audioDuration':41.168917,'developmentOnly':True},indent=2))
