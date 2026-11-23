from PIL import Image,ImageDraw,ImageFont,ImageFilter
import math,numpy as np
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
INK='#f3f4ee';MINT='#97d4c3';RED='#f3a19b';BG='#142027'
def txt(d,xy,s,n=24,c=INK):d.text(xy,s,font=ImageFont.truetype(B,n),fill=c)
def e(a,b,t):
 q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
def line(d,pts,c=MINT,w=3):d.line(pts,fill=c,width=w)
def arrow(d,a,b,c=MINT,w=3):
 line(d,[a,b],c,w);dx=b[0]-a[0];dy=b[1]-a[1];l=max(1,math.hypot(dx,dy));ux,uy=dx/l,dy/l
 d.polygon([b,(b[0]-12*ux+6*uy,b[1]-12*uy-6*ux),(b[0]-12*ux-6*uy,b[1]-12*uy+6*ux)],fill=c)
def ball_asset():
 im=Image.open('/tmp/ronaldo-3d-smooth/0870.png').convert('RGBA').crop((89,290,452,656));m=Image.new('L',im.size);ImageDraw.Draw(m).ellipse((3,2,357,361),fill=255);im.putalpha(m.filter(ImageFilter.GaussianBlur(1)));return im
BALL=ball_asset()
def ball(im,x,y,r):
 b=BALL.resize((int(2*r),int(2*r)),Image.Resampling.LANCZOS);im.paste(b,(int(x-r),int(y-r)),b)
def base():
 a=np.zeros((960,540,3),dtype=np.uint8);yy,xx=np.mgrid[:960,:540];v=np.exp(-((xx-280)**2+(yy-430)**2)/250000)
 for i,c in enumerate((20,32,39)):a[:,:,i]=c+v*14
 return Image.fromarray(a)
def stage(im,t):
 if t<13.46:return im
 if t<19.62:
  q=e(13.46,14.4,t);over=base();d=ImageDraw.Draw(over)
  # A material crop becomes the sensor loupe, then feeds a growing sample train.
  sensor=Image.open('/tmp/ronaldo-3d-smooth/0390.png').convert('RGB').crop((170,390,365,580)).resize((210,205))
  mask=Image.new('L',(210,205));ImageDraw.Draw(mask).ellipse((0,0,209,204),fill=255);over.paste(sensor,(165,211),mask)
  d=ImageDraw.Draw(over);d.ellipse((164,210,376,416),outline=MINT,width=2);txt(d,(224,429),'IMU',22,MINT)
  grow=e(14,15.2,t);line(d,[(270,462),(270,462+55*grow)],MINT,3)
  d.rounded_rectangle((26,530,514,768),16,outline='#4d6c70',width=2)
  txt(d,(47,550),'SAMPLES, NOT A VERDICT',19)
  # Samples stream through a fixed capture boundary, each equivalent interval marked.
  offset=((t-14)*64)%64
  for j in range(-1,9):
   x=55+j*64-offset
   if 46<x<495:
    amp=18*math.sin(j*.9+(t-14)*.6);line(d,[(x,680),(x,636-amp)],MINT,3);d.ellipse((x-6,630-amp,x+6,642-amp),fill=MINT)
  line(d,[(45,681),(495,681)],'#60777b',2)
  d.arc((202,696,270,723),0,180,fill=RED,width=2);txt(d,(218,730),'2 ms',21,RED)
  line(d,[(270,596),(270,689)],RED,2);txt(d,(48,784),'Conceptual sample train, slowed down',16)
  return Image.blend(im,over,q)
 if t<22.04:
  over=base();d=ImageDraw.Draw(over);q=e(19.62,20.7,t);cx=120+260*q;cy=332-50*math.sin(q*math.pi)
  line(d,[(95,362),(425,362)],'#587278',2);ball(over,cx,cy,55);d=ImageDraw.Draw(over)
  if t>20.3:
   d.line((335,245,335,411),fill=RED,width=4);txt(d,(320,433),'TOUCH',20,RED)
  txt(d,(40,501),'A MOTION CHANGE',25);txt(d,(40,538),'CAN APPEAR IN THE SAMPLES',20,MINT)
  line(d,[(40,693),(500,693)],'#587278',2)
  pts=[];end=40+460*e(19.62,22.04,t)
  for x in range(40,int(end)):
   y=650 if x<275 else 650-75*math.exp(-(x-275)/65)*math.sin((x-275)/14)
   pts.append((x,y))
  if len(pts)>1:line(d,pts,MINT,4)
  if end>275:line(d,[(275,580),(275,710)],RED,2)
  txt(d,(40,753),'ILLUSTRATION, NOT MATCH DATA',18,RED)
  return Image.blend(im,over,e(19.62,19.92,t))
 if t<25.72:return im
 over=base();d=ImageDraw.Draw(over)
 if t<27.68:
  q=e(25.72,27.2,t);ball(over,270+240*e(27.25,27.68,t),330,110-45*q);d=ImageDraw.Draw(over)
  txt(d,(51,509),'GOAL AWARDED TO',23);txt(d,(51,556),'BRUNO',58,MINT);txt(d,(51,623),'FERNANDES',46,MINT)
  line(d,[(53,699),(53+430*q,699)],RED,3);txt(d,(53,738),'Portugal v Uruguay / 2022',20)
  return Image.blend(im,over,e(25.72,26.12,t))
 # Field and timeline occupy the whole stage. This is a distinct conceptual workflow.
 q=e(27.68,29,t);box=(40,270,500,646)
 txt(d,(43,247),'ATTACK >  /  RED: DEFENDERS',16,MINT)
 d.rounded_rectangle(box,12,outline='#63837f',width=3);d.line((270,271,270,645),fill='#63837f',width=2);d.ellipse((213,405,327,517),outline='#63837f',width=2)
 d.rectangle((40,358,110,555),outline='#63837f',width=2);d.rectangle((430,358,500,555),outline='#63837f',width=2)
 if t<30.5:phase=e(27.68,30.5,t)
 else:phase=1
 # Motion stops at the selected kick point; the next step validates rather than inventing a decision.
 kx=155+70*phase;ax=338+16*phase;dx=353
 for x,y,c in [(kx,494,MINT),(ax,369,MINT),(dx,402,RED),(395,548,RED)]:
  d.ellipse((x-10,y-10,x+10,y+10),fill=c);d.ellipse((x-16,y-16,x+16,y+16),outline=c,width=1)
 ball(over,kx+25,505-120*e(29.2,30.5,t),16);d=ImageDraw.Draw(over)
 if t<30.5:
  arrow(d,(190,474),(320,387),MINT,2);txt(d,(61,214),'1  LOCATE THE KICK',25,MINT)
 elif t<32.14:
  line(d,[(dx,275),(dx,640)],RED,3);txt(d,(61,214),'2  MATCH PLAYER POSITION',21,MINT);txt(d,(62,665),'SECOND-LAST DEFENDER LINE',17,RED)
 else:
  txt(d,(61,214),'3  CHECK THE SUGGESTION',23,MINT)
  a=e(32.14,33.5,t);line(d,[(dx,275),(dx,275+365*a)],RED,3)
  d.rounded_rectangle((70,300,470,612),8,outline=INK,width=2)
  # Operator review reticle settles onto the proposed line without declaring an on/offside outcome.
  ry=300+250*e(32.4,34.6,t);line(d,[(dx-24,ry),(dx+24,ry)],INK,2);line(d,[(dx,ry-24),(dx,ry+24)],INK,2)
  txt(d,(62,665),'KICK POINT + LINE: HUMAN REVIEW',17,RED)
 line(d,[(55,731),(485,731)],'#63837f',2)
 for j in range(10):
  x=56+j*47;d.ellipse((x-3,728,x+3,734),fill=MINT)
 cx=56+282*e(27.68,30.5,t);line(d,[(cx,714),(cx,749)],RED,4)
 txt(d,(58,772),'TIMING / POSITION CONCEPT, NOT A RULING',14,MINT)
 if t>=35.64:
  # The field shrinks into a context window while a timing bracket connects to the human decision.
  final=base();f=ImageDraw.Draw(final);thumb=over.crop((30,195,510,790)).resize((300,372));final.paste(thumb,(120,220))
  txt(f,(55,626),'SENSOR: WHEN',30,MINT);txt(f,(55,679),'OFFICIALS: CONTEXT',28,INK)
  arrow(f,(270,595),(270,616),RED,3)
  # A review sweep links the timing record to the context image, not a decorative progress bar.
  sy=265+280*e(35.64,38.94,t);line(f,[(110,sy),(430,sy)],RED,2)
  return Image.blend(over,final,e(35.64,36.2,t))
 return Image.blend(im,over,e(27.68,28.2,t))
