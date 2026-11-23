from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps
import numpy as np,cv2,math,json,os,subprocess,sys
W,H=720,1280;FPS=30;D=53.64;ROOT='/tmp/twk-icecream'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(n,b=True):return ImageFont.truetype(BOLD if b else REG,n)
ink='#282c2c';teal='#247d85';red='#bd492f';cream='#eee8da';muted='#6b716e'
words=json.load(open(ROOT+'/voice-v5/paced-words.json'))
def vid(p):
 c=cv2.VideoCapture(p);out=[]
 while True:
  ok,f=c.read()
  if not ok:break
  out.append(Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)).resize((W,H)))
 c.release();return out
hero=vid(ROOT+'/hero.mp4');section=vid(ROOT+'/section.mp4');logo=Image.open('/tmp/twk-ronaldo-proof/public/brand/twk-owner-logo-centered.png').convert('RGBA')
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def txt(d,xy,s,size=32,fill=ink,center=False,b=True):
 d.text(xy,s,font=font(size,b),fill=fill,anchor='mt' if center else None)
def rr(d,box,fill,r=18,outline=None,width=1):d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)
def arrow(d,a,b,col,w=6):
 d.line([a,b],fill=col,width=w);v=np.array(a)-np.array(b);v=v/(np.linalg.norm(v)+1e-9);n=np.array([-v[1],v[0]]);p=np.array(b);d.polygon([tuple(p),tuple(p+v*18+n*9),tuple(p+v*18-n*9)],fill=col)
def lock(d,x,y,r,closed=True):
 d.arc((x-r*.6,y-r*1.0,x+r*.6,y+r*.2),180 if closed else 205,360,fill=red,width=max(5,int(r*.13)))
 if closed:d.line((x-r*.6,y-r*.4,x-r*.6,y+r*.05),fill=red,width=max(5,int(r*.13)));d.line((x+r*.6,y-r*.4,x+r*.6,y+r*.05),fill=red,width=max(5,int(r*.13)));rr(d,(x-r,y-r*.25,x+r,y+r),red,int(r*.15));d.ellipse((x-5,y+r*.15,x+5,y+r*.4),fill=cream)
def trace(d,box,progress,detail=False):
 x0,y0,x1,y1=box
 # schematic, no numerical fake measurements. Only verified deadline and threshold get numbers.
 d.line((x0,y0,x0,y1,x1,y1),fill='#9a9e95',width=2)
 for frac in [.25,.5,.75]:d.line((x0,y0+(y1-y0)*frac,x1,y0+(y1-y0)*frac),fill='#ddd9ce',width=1)
 # Different phase widths are narrative layout, not a timed x axis.
 pts=[(0,.84),(.08,.74),(.19,.18),(.38,.18),(.52,.19),(.62,.38),(.74,.59),(.87,.71),(1,.74)]
 n=int(progress*160);out=[]
 for i in range(n+1):
  a=i/160
  for j in range(len(pts)-1):
   if pts[j][0]<=a<=pts[j+1][0]:
    t=(a-pts[j][0])/(pts[j+1][0]-pts[j][0]);v=pts[j][1]*(1-t)+pts[j+1][1]*t;out.append((x0+a*(x1-x0),y0+v*(y1-y0)));break
 if len(out)>1:d.line(out,fill=teal,width=7,joint='curve');d.ellipse((out[-1][0]-8,out[-1][1]-8,out[-1][0]+8,out[-1][1]+8),fill=teal)
 yy=y0+(y1-y0)*.84
 for x in range(int(x0),int(x1),18):d.line((x,yy,x+8,yy),fill=red,width=2)
 txt(d,(x1,yy+12),'5°C',22,red,False)
 if detail:
  for a,v in pts:
   if a<=progress:
    x=x0+a*(x1-x0);y=y0+v*(y1-y0);d.ellipse((x-6,y-6,x+6,y+6),fill=cream,outline=teal,width=3)
 txt(d,(x0-10,y0-36),'Mix temperature',20,muted);txt(d,(x1-110,y1+63),'Stages →',17,muted)
 txt(d,(x0,y1+30),'HEAT',20,muted);txt(d,((x0+x1)/2-50,y1+30),'HOLD',20,muted);txt(d,(x1-90,y1+30),'COOL',20,red)
def caption(im,t):
 # Select compact3-5word semantic groups using real aligner timestamps.
 idx=next((i for i,w in enumerate(words) if w['s']<=t<w['e']+.08),None)
 if idx is None:return
 start=idx
 while start>0 and idx-start<4 and not words[start-1]['w'].endswith(('.', '?', '!')):start-=1
 end=start
 while end<len(words) and end-start<5:
  end+=1
  if words[end-1]['w'].endswith(('.', '?', '!')):break
 chunk=words[start:end]
 if idx>=end:chunk=words[idx:min(len(words),idx+4)]
 s=' '.join(w['w'] for w in chunk)
 d=ImageDraw.Draw(im);sz=30
 while d.textlength(s,font=font(sz))>610:sz-=1
 wid=d.textlength(s,font=font(sz));rr(d,((W-wid)/2-16,1110,(W+wid)/2+16,1163),'#242a29',10);txt(d,(W/2,1119),s,sz,'#f8f6ec',True)

close=vid(ROOT+'/close.mp4')

def temp(d,x,y,q):
 rr(d,(x-15,y-160,x+15,y+100),'#eee8da',15,teal,3);d.ellipse((x-36,y+72,x+36,y+144),fill=teal);rr(d,(x-8,y+90-q*230,x+8,y+110),red,6)
def frame(t):
 if t<16.4:
  # Preserve accepted opening/cutaway, shortened only to the new narration.
  if t<5.5:
   im=hero[min(len(hero)-1,int(t*18))].copy();d=ImageDraw.Draw(im);txt(d,(W/2,130),'IT HEATS THE MIX.',42,'#fff7e8',True)
  elif t<10.6:
   im=Image.blend(hero[-1],section[min(len(section)-1,int((t-5.5)*12))],ease((t-5.5)/.8));d=ImageDraw.Draw(im)
   txt(d,(W/2,140),'Taylor C602',32,'#fff7e8',True)
   if t>8.3:txt(d,(440,358),'Hopper',25,'#e6f6ee');arrow(d,(425,405),(390,460),teal,3)
   if t>9.4:txt(d,(80,830),'Freezing barrel',25,teal)
  else:
   im=section[min(len(section)-1,int((t-10.6)/5.8*len(section)))].copy();d=ImageDraw.Draw(im);phase='~66°C' if t<14.0 else 'HOLD' if t<15.2 else 'COOL';txt(d,(W/2,140),phase,45,'#ffd6a2' if t<15.2 else '#b1e9ee',True)
 elif t<26:
  # Physical cooling continues under a clock instead of replacing the machine with an empty panel.
  im=close[int((t-16.4)*18)%len(close)].copy();d=ImageDraw.Draw(im)
  # A studio-dark top band gives the timer room without covering the beater.
  rr(d,(95,110,625,320),'#eee8da',22);x,y,r=185,215,67;d.ellipse((x-r,y-r,x+r,y+r),outline=teal,width=6)
  q=min(1,(t-18.8)/2.7) if t>=18.8 else (t-16.4)/2.4;a=q*math.pi*2;d.line((x,y,x+math.sin(a)*48,y-math.cos(a)*48),fill=red,width=5)
  txt(d,(300,166),'2 HOURS' if t<21.6 else 'TIME OUT',36,red)
  txt(d,(300,225),'Cooling',27,ink)
  if t>=18.8 and t<20.1:txt(d,(W/2,950),'One imaginary night',28,ink,True)
  if t>21.6:
   # Lock physically closes as the timeout occurs, no moving-shackle contradiction.
   lock(d,545,890,58);txt(d,(W/2,1000),'Soft lock',32,red,True)
  # Cooling color sweeps across the visible mix, functional emphasis rather than a fake pipe route.
  ov=Image.new('RGBA',(W,H));od=ImageDraw.Draw(ov);od.ellipse((70,540,590,900),fill=(20,135,170,20));im=Image.alpha_composite(im.convert('RGBA'),ov.filter(ImageFilter.GaussianBlur(40))).convert('RGB')
 elif t<33.6:
  im=Image.new('RGB',(W,H),cream);d=ImageDraw.Draw(im);txt(d,(W/2,135),'FOLLOW THE RECORD',36,ink,True)
  # Record emerges from machine to become readable sampled evidence.
  thumb=close[min(len(close)-1,int((t-26)*15))].resize((230,409));im.paste(thumb,(45,285));d=ImageDraw.Draw(im)
  arrow(d,(260,560),(350,560),teal,5)
  # Three phase records enter sequentially, source-supported fields only.
  for i,label in enumerate(['HEAT','HOLD','COOL']):
   p=ease((t-26.2-i*.6)/.65);x=370+(1-p)*420;y=330+i*155
   rr(d,(x,y,x+265,y+120),'#fcfaf2',18);txt(d,(x+28,y+20),label,30,red if i==2 else teal)
   if i<2:d.line((x+190,y+65,x+205,y+80,x+235,y+40),fill=teal,width=6)
   else:txt(d,(x+28,y+65),'120 min',28,red)
  if t>30.7:
   # Samples march into the timeline at the spoken sampling explanation.
   d.line((85,925,635,925),fill=teal,width=3)
   for i in range(7):
    p=ease((t-31-i*.16)/.3);x=95+i*85;d.ellipse((x-7*p,925-7*p,x+7*p,925+7*p),fill=teal)
   txt(d,(W/2,975),'Saved every 5 min',29,teal,True)
 elif t<38.5:
  im=Image.new('RGB',(W,H),cream);d=ImageDraw.Draw(im);txt(d,(W/2,140),'WHAT HAPPENED?',38,ink,True);txt(d,(90,300),'Mix temperature',23,muted)
  x0,y0,x1,y1=90,375,610,785;d.line((x0,y0,x0,y1,x1,y1),fill='#9a9e95',width=2)
  pts=[(90,400),(180,505),(270,590),(360,640),(450,675),(540,693),(610,701)]
  p=ease((t-33.6)/1.3);n=max(2,int(2+p*5));d.line(pts[:n],fill=teal,width=7,joint='curve')
  for x,y in pts[:n]:d.ellipse((x-7,y-7,x+7,y+7),fill=cream,outline=teal,width=3)
  for x in range(90,610,18):d.line((x,745,x+8,745),fill=red,width=2)
  txt(d,(570,755),'5°C',24,red);txt(d,(90,820),'0',23,muted);txt(d,(510,820),'120 min',23,red);txt(d,(W/2,870),'Cooling time →',24,muted,True)
  if t>35:
   p=ease((t-35)/.8);d.ellipse((610-35*p,701-35*p,610+35*p,701+35*p),outline=red,width=4);txt(d,(W/2,970),'Still too warm.',35,red,True)
  if t>36.5:
   px=90+ease((t-36.5)/2)*520;d.line((px,360,px,800),fill=ink,width=2)
 elif t<44.75:
  im=close[int((t-38.5)*12)%len(close)].copy();d=ImageDraw.Draw(im)
  rr(d,(80,135,640,335),cream,20);txt(d,(W/2,165),'Fix the cause',38,ink,True)
  if t>40:txt(d,(W/2,240),'Successful cycle / required cleaning',24,teal,True)
  # Each recovery step advances along one path; no idle block of text.
  q=ease((t-40)/3.5);d.line((100,980,620,980),fill='#eee8da',width=7);d.line((100,980,100+q*520,980),fill=teal,width=7)
  for i in range(3):
   x=100+i*260;d.ellipse((x-16,964,x+16,996),fill=teal if q>=i/2 else '#eee8da')
 elif t<49.36:
  # Return to the accepted recognisable exterior for the slower final thought.
  im=hero[min(len(hero)-1,int((t-44.75)*15))].copy();d=ImageDraw.Draw(im)
 else:
  ef=min(119,max(0,15+int((t-49.36)*45)));im=Image.open(f'/tmp/twk-ronaldo-proof/out/endcard/{ef:04d}.png').convert('RGB').resize((W,H));full=Image.open('/tmp/twk-ronaldo-proof/out/endcard/0090.png').convert('RGB').resize((W,H));im.paste(full.crop((30,440,690,1080)),(30,440))
 caption(im,t);return im
if '--proof' in sys.argv:
 for t in [0,9.8,13.5,19.5,23,28,32,35.5,41,46,50]:frame(t).save(ROOT+f'/v5-proof-{t}.jpg')
else:
 p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',ROOT+'/picture-v5.mp4'],stdin=subprocess.PIPE,stderr=open(ROOT+'/picture-v5.log','w'))
 for i in range(round(D*FPS)):p.stdin.write(np.asarray(frame(i/FPS)).tobytes())
 p.stdin.close();assert p.wait()==0
