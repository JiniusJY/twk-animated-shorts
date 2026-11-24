import sys,importlib.util,pathlib
p=pathlib.Path('/tmp/twk-icecream/compose-v6.py');s=p.read_text();s=s[:s.index("if '--proof' in sys.argv:")];s=s.replace("1110", "760").replace("1163", "820").replace("1119", "769")
s=s.replace("sz=30", "sz=28").replace(">610", ">410").replace("(W-wid)/2", "(600-wid)/2").replace("(W+wid)/2", "(600+wid)/2").replace("txt(d,(W/2,794)","txt(d,(300,769)")
# Whole title states lowered; not an extra disclaimer or creative rewrite.
s=s.replace("(W/2,130)","(340,215)").replace("(W/2,140)","(340,215)").replace("(W/2,135)","(340,215)")
# frame function renamed so spatial changes can be shot-specific rather than shrink whole export
s=s.replace('def frame(t):','def source_frame(t):').replace(' caption(im,t);return im',' return im')
ns={};exec(compile(s,str(p),'exec'),ns)
from PIL import Image,ImageDraw
from reflow_common import card
import numpy as np,subprocess
D=53.64;FPS=30;W,H=720,1280
# preserve physical media full bleed; reflow only information-heavy sections into clear center.
def safe_caption(im,t):
 cue=next((v for v in ns['cues'] if v['s']<=t<v['e']),None)
 if not cue:return
 d=ImageDraw.Draw(im);lines=[];sz=27
 for word in cue['text'].split():
  if lines and d.textlength(lines[-1]+' '+word,font=ns['font'](sz))<=395:lines[-1]+=' '+word
  else:lines.append(word)
 hh=37*len(lines)+18;d.rounded_rectangle((82,735,510,735+hh),10,fill='#142027')
 for j,line in enumerate(lines):d.text((296,744+37*j),line,font=ns['font'](sz),fill='white',anchor='mt')

def frame(t):
 im=ns['source_frame'](t)
 if 16.4<=t<26:
  # timer plate down from top cutout; keep beater action behind, lock label lifted above subtitle
  plate=im.crop((95,110,625,320));im.paste(ns['close'][int((t-16.4)*18)%len(ns['close'])]);im.paste(plate.resize((530,210)),(75,205))
  if t>21.6:
   d=ImageDraw.Draw(im);ns['lock'](d,460,660,48);ns['txt'](d,(340,695),'Soft lock',29,ns['red'],True)
 elif 26<=t<33.6:
  # Full-bleed machine remains visual context. Records are independently laid out at readable size.
  im=ns['close'][min(len(ns['close'])-1,int((t-26)*15))].copy();veil=Image.new('RGBA',im.size,(238,232,218,220));im=Image.alpha_composite(im.convert('RGBA'),veil).convert('RGB');d=ImageDraw.Draw(im)
  ns['txt'](d,(300,215),'FOLLOW THE RECORD',33,ns['ink'],True)
  for i,label in enumerate(['HEAT','HOLD','COOL']):
   q=ns['ease']((t-26.2-i*.6)/.65);x=82+(1-q)*720;y=300+i*110
   ns['rr'](d,(x,y,x+428,y+94),'#fcfaf2',14);ns['txt'](d,(x+22,y+22),label,32,ns['red'] if i==2 else ns['teal'])
   if i<2:d.line((x+330,y+50,x+345,y+67,x+380,y+23),fill=ns['teal'],width=7)
   else:ns['txt'](d,(x+255,y+27),'120 min',28,ns['red'])
  if t>30.7:
   d.line((82,653,510,653),fill=ns['teal'],width=4)
   for i in range(7):
    q=ns['ease']((t-31-i*.16)/.3);x=90+i*68;d.ellipse((x-8*q,653-8*q,x+8*q,653+8*q),fill=ns['teal'])
   ns['txt'](d,(296,680),'Saved every 5 min',28,ns['teal'],True)
 elif 33.6<=t<38.5:
  im=Image.new('RGB',(720,1280),ns['cream']);d=ImageDraw.Draw(im);ns['txt'](d,(296,215),'WHAT HAPPENED?',36,ns['ink'],True)
  ns['txt'](d,(82,285),'Mix temperature',28,ns['muted']);x0,y0,x1,y1=82,340,510,590;d.line((x0,y0,x0,y1,x1,y1),fill='#9a9e95',width=2)
  pts=[(82,350),(156,414),(230,466),(304,496),(378,517),(452,528),(510,533)];q=ns['ease']((t-33.6)/1.3);n=max(2,int(2+q*5));d.line(pts[:n],fill=ns['teal'],width=6)
  for x,y in pts[:n]:d.ellipse((x-6,y-6,x+6,y+6),fill=ns['cream'],outline=ns['teal'],width=3)
  for x in range(82,510,18):d.line((x,563,x+8,563),fill=ns['red'],width=2)
  ns['txt'](d,(455,570),'5°C',28,ns['red']);ns['txt'](d,(82,612),'0',28,ns['muted']);ns['txt'](d,(393,612),'120 min',28,ns['red']);ns['txt'](d,(296,652),'Cooling time →',27,ns['muted'],True)
  if t>35:
   q=ns['ease']((t-35)/.8);d.ellipse((510-28*q,533-28*q,510+28*q,533+28*q),outline=ns['red'],width=4);ns['txt'](d,(296,693),'Still too warm.',29,ns['red'],True)
  if t>36.5:
   px=82+ns['ease']((t-36.5)/2)*428;d.line((px,330,px,600),fill=ns['ink'],width=2)
 elif 38.5<=t<44.75:
  plate=im.crop((80,135,640,335));im.paste(ns['close'][int((t-38.5)*12)%len(ns['close'])]);im.paste(plate.resize((560,200)),(50,205))
  d=ImageDraw.Draw(im);d.line((80,700,520,700),fill=ns['teal'],width=5)
 elif t>=49.36:
  im=card(540,960).resize((720,1280))

 if t<49.36:safe_caption(im,t)
 return im
if __name__=='__main__':
 if '--proof' in sys.argv:
  for t in [0,9.8,13.5,19.5,23,28,32,35.5,41,46,50]:frame(t).save('/tmp/safearea/ice-native-'+str(t)+'.png')
 else:
  dst='/tmp/safearea/ice-picture-v7.mp4';p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',dst],stdin=subprocess.PIPE,stderr=open(dst+'.log','w'))
  for i in range(round(D*FPS)):p.stdin.write(np.array(frame(i/FPS)).tobytes())
  p.stdin.close();assert p.wait()==0
