import sys;sys.path.insert(0,'/tmp/twk-ronaldo-proof')
from pathlib import Path
import numpy as np,cv2,subprocess,json,re
from PIL import Image,ImageDraw,ImageFont
from reflow_common import card
P=Path('/tmp/twk-ronaldo-proof/compose_tech_final.py');s=P.read_text();s=s[:s.index("if __name__")];s=s.replace('def frame(t):','def original(t):');ns={'__file__':str(P)};exec(compile(s,str(P),'exec'),ns)
# Exact source timeline, shot assets and music unchanged. Titles/captions rendered independently.
CAP=cv2.VideoCapture('/downloads/TWK-Ronaldo-Final-v16.mp4')
words=ns['words'];pages=ns['pages'];F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def frame(t):
 idx=round(t*30);CAP.set(cv2.CAP_PROP_POS_FRAMES,idx) if '--proof' in __import__('sys').argv else None;ok,arr=CAP.read();assert ok;im=Image.fromarray(cv2.cvtColor(arr,cv2.COLOR_BGR2RGB)).resize((540,960));ar=np.array(im)
 # Extend studio/paper, not a full-frame blurred copy with ghost text.
 bg=Image.new('RGB',(540,960),tuple(ar[820,20]));d=ImageDraw.Draw(bg)
 if t<2.66:head=['CRISTIANO RONALDO','Did he even touch it?'];crop=(40,210,510,820)
 elif t>=38.94:
  return card(540,960)
 else:
  if t<4.16:head=['THE BALL CARRIED','EVIDENCE.']
  elif t<8.88:head=['SUSPENDED SENSOR','AT THE CENTRE']
  elif t<10.94:head=['ACCELEROMETER','Changes in motion']
  elif t<13.46:head=['GYROSCOPE','How fast it rotates']
  elif t<19.62:head=['500 READINGS / SECOND','ONE EVERY 2 ms']
  elif t<22.04:head=['A TOUCH CAN CHANGE','THE SIGNAL']
  elif t<25.72:head=['NO MEASURABLE','EXTERNAL FORCE']
  elif t<27.68:head=['GOAL CREDIT','BRUNO FERNANDES']
  elif t<32.14:head=['ANOTHER USE: OFFSIDE','TIMING + POSITION']
  elif t<35.64:head=['VIDEO OFFICIALS','CHECK AND VALIDATE']
  else:head=['SENSOR HELPS WITH WHEN.','OFFICIALS INTERPRET.']
  crop=(15,145,525,810)
  if t<13.46 or 22.04<=t<25.72:crop=(70,200,470,805)
  if 25.72<=t<27.68:crop=(130,170,515,805)
 # Full-canvas physical action, with independently reflowed information.
 bg=Image.new('RGB',(540,960),tuple(ar[820,20]))
 if 13.46<=t<19.62:
  bg=Image.new('RGB',(540,960),'#142027')
  body=im.crop((22,575,518,788)).resize((370,159));bg.paste(body,(60,378))
  top=im.crop((155,185,385,425));top.thumbnail((140,140));bg.paste(top,(170,207))
  d=ImageDraw.Draw(bg);d.text((65,351),'SAMPLES, NOT A VERDICT',font=ImageFont.truetype(F,17),fill='#f6f4eb')
 elif 19.62<=t<22.04:
  bg=Image.new('RGB',(540,960),'#142027');body=im.crop((15,210,525,755)).resize((370,340));bg.paste(body,(60,213))
 elif 27.68<=t<38.94:
  body=im.crop((85,270,490,610)).resize((540,453));bg.paste(body,(0,210))
 else:
  if t<2.66:crop=(20,160,520,820)
  elif t<13.46:crop=(30,180,510,805)
  elif t<25.72:crop=(20,180,520,820)
  else:crop=(95,170,520,805)
  body=im.crop(crop);body.thumbnail((530,655));bg.paste(body,((540-body.width)//2,210))
 d=ImageDraw.Draw(bg)
 for j,line in enumerate(head):
  n=23
  while d.textlength(line,font=ImageFont.truetype(F,n))>370:n-=1
  d.text((235,151+j*32),line,font=ImageFont.truetype(F,n),fill=('#26352f' if t<2.66 or 25.72<=t<27.68 else '#f6f4eb'),anchor='mt')
 pg=next((p for p in pages if p[0]['s']<=t<max(p[-1]['e'],p[0]['s']+.22)),None)
 if pg:
  txt=' '.join(x['w'] for x in pg);lines=[];n=21
  for word in txt.split():
   if lines and d.textlength(lines[-1]+' '+word,font=ImageFont.truetype(F,n))<=305:lines[-1]+=' '+word
   else:lines.append(word)
  d.rounded_rectangle((60,557,390,566+len(lines)*28),8,fill='#142027')
  for j,line in enumerate(lines):d.text((220,564+j*28),line,font=ImageFont.truetype(F,n),fill='white',anchor='mt')
 return bg
if __name__=='__main__':
 import sys
 if '--proof' in sys.argv:
  for t in [0,3,5,10,15,20,24,26,30,34,37,40]:frame(t).save('/tmp/safearea/ron-native-'+str(t)+'.png')
 else:
  p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pix_fmt','rgb24','-s','540x960','-r','30','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','/tmp/safearea/ron-picture-v17.mp4'],stdin=subprocess.PIPE,stderr=open('/tmp/safearea/ron-native.log','w'))
  for i in range(1275):p.stdin.write(np.array(frame(i/30)).tobytes())
  p.stdin.close();assert p.wait()==0
