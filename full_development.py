import pathlib,json,math,re
from PIL import Image,ImageDraw,ImageFont
from painted_rig import make as opening
from ball_scenes import draw,base,text,INK,RED,PAPER
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
  while d.textlength(s,font=ImageFont.truetype(font,n))>478:n-=1
  f=ImageFont.truetype(font,n);x=(540-d.textlength(s,font=f))/2
  for z in pg:
   tok=z['w']+' ';d.text((x,848),tok,font=f,fill=RED if z['s']<=t<z['e'] else INK);x+=d.textlength(tok,font=f)
 return im
endframes=ROOT/'out/endcard';endframes.mkdir(exist_ok=True)
def frame(t):
 a,k=max((a,k) for a,k in shots if a<=t);u=t-a
 if k=='hook':
  im=opening(t)
 elif k in ['match','bruno']:
  im=base();d=ImageDraw.Draw(im)
  text(d,(30,110),'PORTUGAL v URUGUAY',29,INK,True);text(d,(30,156),'WORLD CUP 2022',22,RED,True)
  if k=='match':
   # A small pitch establishes the match, before the attribution reveal.
   d.rectangle((60,300,480,688),outline=INK,width=3);d.line((60,494,480,494),fill=INK,width=2);d.ellipse((216,440,324,548),outline=INK,width=2)
   d.ellipse((213,332,245,364),fill=RED);d.ellipse((321,572,353,604),fill=INK)
  else:
   q=min(1,u/.35);y=int(345+45*(1-q));d.rounded_rectangle((30,y,510,y+220),10,fill=INK)
   text(d,(57,y+26),'THE OFFICIAL CREDIT',20,PAPER,True);text(d,(57,y+73),'BRUNO',53,PAPER,True);text(d,(57,y+137),'FERNANDES',42,PAPER,True)
 elif k=='cta':
  return Image.open(endframes/f'{min(119,int(u*30)):04d}.png').convert('RGB')
 else:
  if k=='euro-touch':im=draw('euro',u+3.21)
  else:im=draw(k,u)
 return caption(im,t)
if __name__=='__main__':
 for i in range(1281):frame(i/30).save(OUT/f'{i:04d}.png')
 pathlib.Path('/downloads/ronaldo-full-narration/story-timing-map.json').write_text(json.dumps({'shots':shots,'source':'retained take word alignment','duration':42.7,'audioDuration':40.672583,'developmentOnly':True},indent=2))
