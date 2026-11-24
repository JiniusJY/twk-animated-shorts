import sys,importlib.util,pathlib
p=pathlib.Path('/tmp/twk-icecream/compose-v6.py');s=p.read_text();s=s[:s.index("if '--proof' in sys.argv:")];s=s.replace("1110", "760").replace("1163", "820").replace("1119", "769")
s=s.replace("sz=30", "sz=28").replace(">610", ">410").replace("(W-wid)/2", "(600-wid)/2").replace("(W+wid)/2", "(600+wid)/2").replace("txt(d,(W/2,794)","txt(d,(300,769)")
# Whole title states lowered; not an extra disclaimer or creative rewrite.
s=s.replace("(W/2,130)","(340,215)").replace("(W/2,140)","(340,215)").replace("(W/2,135)","(340,215)")
# frame function renamed so spatial changes can be shot-specific rather than shrink whole export
s=s.replace('def frame(t):','def source_frame(t):').replace(' caption(im,t);return im',' return im')
ns={};exec(compile(s,str(p),'exec'),ns)
from PIL import Image,ImageDraw
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
 elif 26<=t<38.5:
  # retain width and readable diagram labels while compressing only vertical whitespace
  head=im.crop((0,190,720,275));body=im.crop((20,280,670,1050)).resize((470,425));im=Image.new('RGB',(720,1280),ns['cream']);im.paste(head,(0,190));im.paste(body,(75,285))
 elif 38.5<=t<44.75:
  plate=im.crop((80,135,640,335));im.paste(ns['close'][int((t-38.5)*12)%len(ns['close'])]);im.paste(plate.resize((560,200)),(50,205))
  d=ImageDraw.Draw(im);d.line((80,700,520,700),fill=ns['teal'],width=5)
 elif t>=49.36:
  # preserve populated card, move it up without changing text; original large full card center crop
  full=Image.open('/tmp/twk-ronaldo-proof/out/endcard/0090.png').convert('RGB').resize((720,1280));card=full.crop((30,325,690,1080));im=Image.new('RGB',(720,1280),'#111719');card.thumbnail((540,600));im.paste(card,(65,220))
 safe_caption(im,t);return im
if __name__=='__main__':
 if '--proof' in sys.argv:
  for t in [0,9.8,13.5,19.5,23,28,32,35.5,41,46,50]:frame(t).save('/tmp/safearea/ice-native-'+str(t)+'.png')
 else:
  dst='/tmp/safearea/ice-picture-v7.mp4';p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',dst],stdin=subprocess.PIPE,stderr=open(dst+'.log','w'))
  for i in range(round(D*FPS)):p.stdin.write(np.array(frame(i/FPS)).tobytes())
  p.stdin.close();assert p.wait()==0
