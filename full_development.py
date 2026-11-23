import pathlib,json,math,re
from PIL import Image,ImageDraw,ImageFont
from painted_rig import make as opening
from ball_scenes import draw,base,text,INK,RED,PAPER,BRUNO,REF,act,paste
import cv2,numpy as np
ROOT=pathlib.Path(__file__).parent
OUT=ROOT/'out/full-development';OUT.mkdir(exist_ok=True)
w=json.loads(pathlib.Path('/downloads/ronaldo-full-narration/words.json').read_text())
# Retain raw timings. Caption spelling comes from script, not a homophone ASR error.
for x in w:
 if x['w']=='censor':x['w']='sensor'
 x['e']=min(x['e'],40.672583)
pages=[]
for x in w:
 if not pages or len(pages[-1])>=4 or x['s']-pages[-1][0]['s']>1.7 or re.search(r'[.?!,]$',pages[-1][-1]['w']):pages.append([])
 pages[-1].append(x)
shots=[(0,'hook'),(5.34,'match'),(6.96,'bruno'),(10.74,'adidas'),(15,'suspension'),(18.5,'sampling'),(20.36,'evidence'),(23.84,'euro'),(27.04,'euro-touch'),(29.74,'judgment'),(32.24,'payoff'),(38.04,'cta')]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def caption(im,t):
 if t>=38.04:return im
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
def frame(t):
 a,k=max((a,k) for a,k in shots if a<=t);u=t-a
 if k=='hook':
  im=opening(t)
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
   if t>=9.22:
    text(d,(31,704),'BRUNO',36,INK,True)
   if t>=9.4:text(d,(31,738),'FERNANDES',36,RED,True)
 elif k=='cta':
  return Image.open(endframes/f'{min(119,23+int(u*30)):04d}.png').convert('RGB')
 else:
  if k=='euro-touch':im=draw('euro',u+3.21)
  else:im=draw(k,u)
 return caption(im,t)
if __name__=='__main__':
 for i in range(1281):frame(i/30).save(OUT/f'{i:04d}.png')
 pathlib.Path('/downloads/ronaldo-full-narration/story-timing-map.json').write_text(json.dumps({'shots':shots,'source':'retained take word alignment','duration':42.7,'audioDuration':40.672583,'developmentOnly':True},indent=2))
