"""Illustrated story scenes v9, no fabricated match footage/data."""
from PIL import Image,ImageDraw,ImageFont
import math,numpy as np,pathlib,cv2
AS=pathlib.Path(__file__).parent/'assets/ronaldo-connected-ball'
PHOTO=Image.open(AS/'al-rihla-photo-crop.png').convert('RGBA');CUT=Image.open(AS/'cutaway.png').convert('RGBA');HAND=Image.open(AS/'hand.png').convert('RGBA')
BALL=Image.open(AS/'whole-ball.png').convert('RGBA');_m=Image.new('L',BALL.size);ImageDraw.Draw(_m).ellipse((4,4,BALL.width-4,BALL.height-4),fill=255);BALL.putalpha(Image.fromarray(np.minimum(np.array(BALL.getchannel('A')),np.array(_m)).astype('uint8')));BRUNO=Image.open(AS/'bruno.png').convert('RGBA');REF=Image.open(AS/'ref-listen.png').convert('RGBA');CALL=Image.open(AS/'ref-call.png').convert('RGBA');VAR=Image.open(AS/'var-review.png').convert('RGBA')
PAPER='#f1eddd';INK='#26352f';RED='#b33337';GREEN='#467765'
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(d,xy,s,n=24,c=INK,b=False):d.text(xy,s,font=ImageFont.truetype(B if b else F,n),fill=c)
def base():return Image.new('RGB',(540,960),PAPER)
def paste(im,a,xy,wh):
 a=a.resize(tuple(map(int,wh)),Image.Resampling.LANCZOS);im.paste(a,tuple(map(int,xy)),a)
def act(a,t,strength=1):
 # Local deformation, shoulders/arm/hand/head move independently within silhouette.
 w,h=a.size;yy,xx=np.mgrid[:h,:w].astype('float32');dx=np.zeros_like(xx);dy=np.zeros_like(xx)
 for cx,cy,rx,ry,vx,vy in [(.5,.15,.2,.16,1.5,-1),(.15,.35,.22,.25,-3,2),(.8,.35,.22,.25,3,-2),(.5,.6,.28,.3,1,0)]:
  q=np.exp(-(((xx/w-cx)/rx)**2+((yy/h-cy)/ry)**2)*2)*math.sin(t*2.3)*strength;dx+=vx*q;dy+=vy*q
 return Image.fromarray(cv2.remap(np.array(a),xx-dx,yy-dy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT))
def shell(im,xy,r,t=0):
 # Simulated ball motion, not a logged trajectory.
 a=BALL.rotate(t*13,Image.Resampling.BICUBIC,expand=False);paste(im,a,(xy[0]-r,xy[1]-r),(2*r,2*r))
def wires(d,a,b,t,count=7):
 # Discrete moving samples, not a fabricated measured waveform.
 for j in range(count):
  q=((t*.7+j/count)%1);x=a[0]+(b[0]-a[0])*q;y=a[1]+(b[1]-a[1])*q+15*math.sin(q*math.pi)
  d.ellipse((x-3,y-3,x+3,y+3),fill=GREEN)
def draw(kind,t):
 im=base();d=ImageDraw.Draw(im)
 if kind=='adidas':
  text(d,(30,96),'THE NEXT DAY',22,RED,True)
  if t>=.62:text(d,(30,140),'adidas',54,INK,True)
  # Exterior is evidence of design only, never proof of connected internals.
  paste(im,PHOTO,(90,267),(360,360))
  if t>=2.3:
   q=min(1,(t-2.3)/.4);d.line((89,677,89+350*q,677),fill=RED,width=4);text(d,(85,697),'No Ronaldo contact',29,INK,True)
  text(d,(95,764),'Statement via FIFA · retail exterior photo',13)
 elif kind=='suspension':
  text(d,(30,98),'INSIDE THE BALL',33,INK,True)
  # Match shape into original cutaway through a progressive curved reveal.
  if t<.25:shell(im,(270,452),187,0)
  art=CUT.resize((362,448),Image.Resampling.LANCZOS)
  # Conceptual shell sway, suspended central capsule stays fixed.
  yy,xx=np.mgrid[:448,:362].astype('float32');weight=1-np.exp(-((yy-224)/95)**2);dx=weight*4*math.sin(max(0,t-.8)*3);art=Image.fromarray(cv2.remap(np.array(art),xx-dx,yy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT))
  q=min(1,max(0,t/.35));m=Image.new('L',art.size,int(255*q))
  # Hide whole ball behind conceptual cutaway once transition completes.
  if q>0:d.rectangle((66,228,474,665),fill=PAPER)
  layer=Image.new('RGBA',im.size);layer.paste(art,(89,223));alpha=Image.new('L',im.size);alpha.paste(m,(89,223));layer.putalpha(Image.fromarray(np.minimum(np.array(layer.getchannel('A')),np.array(alpha)).astype('uint8')));im.paste(layer,(0,0),layer)
  d=ImageDraw.Draw(im)
  if t>=1.3:
   # Motion evidence emerges from central sensor, not an arbitrary circuit diagram.
   for j in range(5):
    q=((t-1.3)*.6+j/5)%1;x=270+q*155;y=448-q*215;d.ellipse((x-3,y-3,x+3,y+3),fill=RED)
  text(d,(150,741),'Conceptual cutaway',15)
 elif kind=='sampling':
  # Keep ball/sensor in view while dense samples leave it. No generic grid.
  paste(im,CUT,(14,263),(255,315));text(d,(308,224),'500',65,RED,True)
  text(d,(310,305),'PER SECOND',16,INK,True)
  for j in range(65):
   q=((j/65+t*.5)%1);x=246+q*243;y=444+65*math.sin(j*2.4)*(q*.7+.3)
   d.line((x,y,x+4,y),fill=GREEN,width=2)
  text(d,(94,702),'Movement, sampled.',30,INK,True)
  text(d,(65,751),'Illustrative samples, not a measured trace',17)
 elif kind in ['evidence','euro']:
  euro=kind=='euro'
  text(d,(30,90),'EURO 2024' if euro else 'CHECKING A TINY TOUCH',36 if euro else 28,RED if euro else INK,True)
  if euro:text(d,(30,144),'BELGIUM v SLOVAKIA',25,INK,True)
  touch=3.2 if euro else .9;q=min(1,t/touch)
  shell(im,(190,425),140,t*.09)
  paste(im,act(HAND,t,.5),(316+65*(1-q),376),(302,159))
  if t>=touch:
   # Small evidence ring marks the illustration's brush, not a specific measured location.
   r=12+8*min(1,t-touch);d.ellipse((326-r,411-r,326+r,411+r),outline=RED,width=2)
   if euro:
    text(d,(31,673),"OPENDA'S TOUCH",30,INK,True)
    if t>4.3:text(d,(31,726),'Before the equaliser',23,GREEN,True)
   else:
    paste(im,act(VAR,t),(325,598),(164,176));wires(d,(184,554),(371,649),t)
 elif kind=='judgment':
  text(d,(30,96),'THE OFFICIALS DECIDE',31,INK,True)
  # Illustrated operator -> on-field official, not an automated ball verdict.
  paste(im,act(VAR,t),(0,291),(271,289))
  a=act(REF if t<1.54 else CALL,t,.8);ww=164 if t<1.54 else 254
  paste(im,a,(310 if t<1.54 else 263,230),(ww,414))
  wires(d,(209,494),(329,384),t,5)
  if t>.88:text(d,(32,683),'HANDBALL',30,RED,True)
  if t>1.54:text(d,(32,732),'Goal cancelled',27,INK,True)
 elif kind=='payoff':
  # Two tournament cases become evidence and human call through physical objects.
  text(d,(30,100),'DIFFERENT TOURNAMENT.',29,INK,True)
  if t>.94:text(d,(30,145),'DIFFERENT DECISION.',29,RED,True)
  paste(im,CUT,(30,311),(230,285));paste(im,act(REF,t),(339,252),(161,407))
  if t>2.9:
   wires(d,(250,450),(351,431),t,7);text(d,(57,700),'EVIDENCE',26,GREEN,True)
  if t>4.25:text(d,(326,700),'THE CALL',26,RED,True)
  text(d,(104,758),'Concept: evidence to human judgment',16)
 return im
