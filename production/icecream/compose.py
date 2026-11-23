from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps
import numpy as np,cv2,math,json,os,subprocess,sys
W,H=720,1280;FPS=30;D=63.5;ROOT='/tmp/twk-icecream'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(n,b=True):return ImageFont.truetype(BOLD if b else REG,n)
ink='#282c2c';teal='#247d85';red='#bd492f';cream='#eee8da';muted='#6b716e'
words=json.load(open(ROOT+'/voice/words.json'))
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
 start=(idx//5)*5;chunk=words[start:start+5];s=' '.join(w['w'] for w in chunk)
 d=ImageDraw.Draw(im);sz=30
 while d.textlength(s,font=font(sz))>610:sz-=1
 wid=d.textlength(s,font=font(sz));rr(d,((W-wid)/2-16,1110,(W+wid)/2+16,1163),'#242a29',10);txt(d,(W/2,1119),s,sz,'#f8f6ec',True)
def frame(t):
 if t<6.2:
  im=hero[min(len(hero)-1,int(t*FPS*.6))].copy();d=ImageDraw.Draw(im)
  if t<3.4:
   a=ease(t/.45);txt(d,(W/2,130),'IT HEATS THE MIX.',42,'#fff7e8',True);d.line((135,195,585,195),fill=red,width=4)
  else:txt(d,(W/2,150),'The missing cone starts here.',32,'#fff7e8',True)
 elif t<11.8:
  q=ease((t-6.2)/1.2);im=Image.blend(hero[-1],section[min(len(section)-1,int((t-6.2)*7))],q);d=ImageDraw.Draw(im)
  if t>7.6:txt(d,(W/2,150),'Taylor C602',32,'#fff7e8',True)
  if t>9:
   txt(d,(430,358),'Hopper',25,'#e6f6ee');arrow(d,(420,400),(390,459),teal,3)
  if t>10:
   txt(d,(80,830),'Freezing barrel',25,teal);arrow(d,(300,840),(310,730),teal,3)
 elif t<17.8:
  f=min(len(section)-1,int((t-11.8)/(6)*len(section)));im=section[f].copy();d=ImageDraw.Draw(im)
  phase='HEAT' if t<15.05 else 'HOLD' if t<16 else 'COOL'
  txt(d,(W/2,140),phase,40,'#ffd6a2' if phase!='COOL' else '#b1e9ee',True)
  if t<15.05:txt(d,(W/2,195),'~66°C',54,'#ffd6a2',True)
  # Thermal sweep runs over mix region, purposeful heat propagation, not claimed fluid route.
  ov=Image.new('RGBA',(W,H));od=ImageDraw.Draw(ov);p=ease((t-12.2)/2);od.ellipse((200,500,520,800),fill=(225,90,30,int(32*p)));ov=ov.filter(ImageFilter.GaussianBlur(35));im=Image.alpha_composite(im.convert('RGBA'),ov).convert('RGB')
 elif t<29.75:
  im=Image.new('RGB',(W,H),cream);d=ImageDraw.Draw(im)
  txt(d,(W/2,135),'THE COOLING DEADLINE',32,ink,True)
  # clock central until failure, transforms into lock.
  if t<22:
   x,y,r=360,500,190;d.ellipse((x-r,y-r,x+r,y+r),outline=teal,width=13)
   for i in range(12):
    a=i*math.pi/6;d.line((x+math.sin(a)*(r-25),y-math.cos(a)*(r-25),x+math.sin(a)*(r-10),y-math.cos(a)*(r-10)),fill=teal,width=4)
   a=(t-17.8)*1.55;d.line((x,y,x+math.sin(a)*125,y-math.cos(a)*125),fill=red,width=9);txt(d,(360,755),'2 HOURS',57,red,True)
  else:
   trace(d,(90,350,590,650),ease((t-22)/1.3));
   px=90+((t-22)*80)%500;d.line((px,350,px,650),fill='#b4b5a9',width=2);txt(d,(W/2,240),'One hypothetical cycle',26,muted,True)
   if t>23.8:
    d.line((590,330,590,680),fill=red,width=3);txt(d,(W/2,740),'120 min cooling: still above 5°C',25,red,True);lock(d,360,860,60);txt(d,(W/2,975),'Cooling timeout → soft lock',30,red,True)
  if t>27.5:txt(d,(W/2,1050),'A failed cycle is not a part diagnosis.',24,ink,True)
 elif t<44.5:
  im=Image.new('RGB',(W,H),cream);d=ImageDraw.Draw(im);txt(d,(W/2,135),'READ THE CYCLE',39,ink,True);txt(d,(W/2,205),'The same hypothetical cycle',23,muted,True)
  if t<36.4:
   trace(d,(85,340,590,650),1,True)
   px=85+((t-29.75)*90)%505;d.line((px,330,px,670),fill='#b4b5a9',width=2)
   q=ease((t-29.8)/1.4)
   # Stage checks build in record order and the failed phase is isolated.
   for i,label in enumerate(['HEAT','HOLD','COOL']):
    if t>30+i*.65:
     x=105+i*200;col=teal if i<2 else red;rr(d,(x-20,790,x+135,870),'#fcfaf2',14);txt(d,(x+57,810),label,25,col,True)
     if i<2:d.line((x+42,896,x+54,907,x+78,879),fill=teal,width=5)
     else:d.line((x+45,883,x+72,908),fill=red,width=5);d.line((x+72,883,x+45,908),fill=red,width=5)
   if t>33.2:txt(d,(W/2,985),'Time limit: 120 min',30,red,True)
   if t>34.5:txt(d,(W/2,1040),'Temperature sampled every 5 min',25,teal,True)
  else:
   txt(d,(W/2,275),'What stopped cooling in time?',32,ink,True)
   # Isolate the cooling tail, removing passed stages from the diagnostic focus.
   x0,y0,x1,y1=90,435,610,795
   d.line((x0,y0,x0,y1,x1,y1),fill='#9a9e95',width=2);txt(d,(90,385),'Mix temperature',22,muted);txt(d,(90,825),'0',22,muted);txt(d,(500,825),'120 min',22,red);txt(d,(W/2,875),'Cooling time →',22,muted,True)
   yy=750
   for x in range(x0,x1,18):d.line((x,yy,x+8,yy),fill=red,width=2)
   txt(d,(x1-40,yy+20),'5°C',25,red)
   pts=[(90,460),(180,555),(270,620),(360,667),(450,694),(540,708),(610,713)]
   d.line(pts,fill=teal,width=7,joint='curve')
   for x,y in pts:d.ellipse((x-7,y-7,x+7,y+7),fill=cream,outline=teal,width=3)
   q=ease((t-36.4)/3.5);px=x0+q*(x1-x0);d.line((px,y0-30,px,y1+25),fill=ink,width=2)
   if t>39.8:
    d.ellipse((585,688,635,738),outline=red,width=4);arrow(d,(575,910),(610,740),red,4);txt(d,(360,925),'Still above the threshold.',30,red,True)
   if t>42:txt(d,(W/2,1020),'A starting point, not a diagnosis.',25,ink,True)
 elif t<53.7:
  im=hero[-1].copy();d=ImageDraw.Draw(im);overlay=Image.new('RGB',(W,H),cream);im=Image.blend(im,overlay,.60);d=ImageDraw.Draw(im)
  if t<50.8:lock(d,360,440,90)
  else:
   d.ellipse((275,350,445,520),outline=teal,width=8);d.line((310,438,346,472,409,396),fill=teal,width=12)
  txt(d,(W/2,610),'Fix the cause.',42,ink,True)
  if t>47.4:
   txt(d,(W/2,710),'Successful heat cycle',31,teal,True);txt(d,(W/2,763),'or required cleaning',31,teal,True)
  if t>51.6:txt(d,(W/2,965),'One cause. Not every outage.',28,ink,True)
 elif t<58.15:
  im=hero[min(len(hero)-1,int((58.15-t)*12))].copy();d=ImageDraw.Draw(im);txt(d,(W/2,140),'Sometimes, it is following the rules.',31,'#fff7e8',True)
 else:
  # Preserve the established endcard visual; existing logo, follow interaction and newsletter design.
  ef=min(119,max(0,int((t-58.15)*30)));im=Image.open(f'/tmp/twk-ronaldo-proof/out/endcard/{ef:04d}.png').convert('RGB').resize((W,H))
 caption(im,t);return im
if '--proof' in sys.argv:
 for t in [0,9.8,13.5,19.5,25.5,32,39,48,60]:frame(t).save(ROOT+f'/proof-{t}.jpg')
else:
 p=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',ROOT+'/picture.mp4'],stdin=subprocess.PIPE,stderr=open(ROOT+'/picture-encode.log','w'))
 for i in range(round(D*FPS)):
  p.stdin.write(np.asarray(frame(i/FPS)).tobytes())
 p.stdin.close();assert p.wait()==0
