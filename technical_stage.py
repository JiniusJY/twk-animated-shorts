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
  line(d,[(270,596),(270,689)],RED,2);
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
  
  return Image.blend(im,over,e(19.62,19.92,t))
 if t<25.72:return im
 over=base();d=ImageDraw.Draw(over)
 if t<27.68:
  over=Image.new('RGB',(540,960),'#f1eddd');q=e(25.72,26.2,t)
  from ball_scenes import BRUNO,act
  import cv2
  ar=np.array(BRUNO.copy());rgb=ar[:,:,:3];bg=(rgb[:,:,0]>207)&(rgb[:,:,1]>204)&(rgb[:,:,2]>185)&((rgb[:,:,0].astype(int)-rgb[:,:,2])<45)
  nn,ll=cv2.connectedComponents(bg.astype('uint8'));edge=np.unique(np.concatenate([ll[0],ll[-1],ll[:,0],ll[:,-1]]));ar[:,:,3]=np.where(np.isin(ll,edge[edge!=0]),0,255).astype('uint8')
  br=act(Image.fromarray(ar),t-25.72,.7).resize((330,575),Image.Resampling.LANCZOS)
  over.paste(br,(180-int(15*q),170),br);d=ImageDraw.Draw(over)
  txt(d,(28,70),'GOAL CREDIT',22,'#a43d3d');txt(d,(28,110),'BRUNO FERNANDES',32,'#26352f')
  return Image.blend(im,over,e(25.72,25.95,t))
 # Three-dimensional player pass, selected instant and review share one camera move.
 local=t-27.68
 idx=min(235,max(0,round(local*30)))
 path=f'/tmp/ronaldo-players-smooth/{idx+1:04d}.png'
 if not __import__('os').path.exists(path):path=f'/tmp/ronaldo-players/{min(95,max(0,round(local*12))):04d}.png'
 if not __import__('os').path.exists(path):path='/tmp/ronaldo-players/0048.png'
 pitch=Image.open(path).convert('RGB');d=ImageDraw.Draw(pitch)
 if t<30.2:lab='1  THE PASS'
 elif t<32.14:lab='2  RETURN TO THE PASS'
 else:lab='3  SAME INSTANT. CHECK POSITIONS.'
 txt(d,(30,175),lab,20,MINT)
 if t>=30.2:
  # The selected instant is marked on the timing ribbon, not a fabricated recorded trace.
  line(d,[(40,740),(500,740)],INK,2)
  for j in range(12):
   xx=40+j*41;line(d,[(xx,734),(xx,746)],MINT,2)
  cx=300-210*e(30.2,30.7,t);line(d,[(cx,722),(cx,758)],RED,3)
 if t>=32.14:
  # Review the frozen instant in a moving loupe, from pass boot to defender position.
  q=e(32.14,35.64,t);d.rounded_rectangle((27,257,513,696),12,outline=INK,width=2)
  focus=e(32.14,34.5,t);fx=50+302*focus;fy=582-88*focus
  clean=pitch.copy();box=(int(fx-44),int(fy-44),int(fx+44),int(fy+44))
  loupe=clean.crop(box).resize((136,136),Image.Resampling.LANCZOS)
  d.ellipse((fx-20,fy-20,fx+20,fy+20),outline=RED,width=3)
  pitch.paste(loupe,(340,218));d=ImageDraw.Draw(pitch);d.rectangle((339,217,477,355),outline=MINT,width=2)
  line(d,[(fx,fy-21),(408,357)],RED,2)
  txt(d,(40,775),'SAME INSTANT: KICK + POSITION',17,INK)
 if t>=35.64:
  pitch=Image.open('/tmp/ronaldo-players-smooth/0236.png').convert('RGB') if __import__('os').path.exists('/tmp/ronaldo-players-smooth/0236.png') else pitch
  q=e(35.64,36.4,t);end=base();thumb=pitch.crop((0,220,540,800)).resize((410,440));end.paste(thumb,(65,194));dd=ImageDraw.Draw(end)
  txt(dd,(40,674),'SENSOR: WHEN',30,MINT);txt(dd,(40,725),'OFFICIALS: CONTEXT',28,INK)
  sy=210+380*e(35.64,38.94,t);line(dd,[(55,sy),(485,sy)],RED,2)
  return Image.blend(pitch,end,q)
 return Image.blend(im,pitch,e(27.68,28.05,t))
