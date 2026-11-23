"""Development-only connected-ball scenes, times are replaced by real word anchors."""
from PIL import Image,ImageDraw,ImageFont
import math,numpy as np,pathlib
AS=pathlib.Path(__file__).parent/'assets/ronaldo-connected-ball'
PHOTO=Image.open(AS/'al-rihla-photo-crop.png').convert('RGBA')
CUT=Image.open(AS/'cutaway.png').convert('RGBA')
HAND=Image.open(AS/'hand.png').convert('RGBA')
def paste(im,asset,xy,wh):
 a=asset.resize(wh,Image.Resampling.LANCZOS);im.paste(a,tuple(map(int,xy)),a)
PAPER='#f1eddd';INK='#26352f';RED='#b33337';GREEN='#467765'
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(d,xy,s,n=24,c=INK,b=False):d.text(xy,s,font=ImageFont.truetype(B if b else F,n),fill=c)
def base():return Image.new('RGB',(540,960),PAPER)
def ball(d,c=(270,455),r=164,cut=False,t=0):
 x,y=c;d.ellipse((x-r,y-r,x+r,y+r),fill='#fffdf1',outline=INK,width=3)
 if cut:
  for a in range(0,360,60):
   z=math.radians(a);d.line((x+(r-12)*math.cos(z),y+(r-12)*math.sin(z),x,y),fill=GREEN,width=3)
  d.rounded_rectangle((x-32,y-27,x+32,y+27),8,fill=INK);text(d,(x-22,y-12),'IMU',18,PAPER,True)
 else:
  for a in range(0,360,72):
   z=math.radians(a);xx=x+r*.62*math.cos(z);yy=y+r*.62*math.sin(z)
   d.arc((xx-34,yy-34,xx+34,yy+34),a,a+145,fill=GREEN,width=3)

def draw(kind,t):
 im=base();d=ImageDraw.Draw(im)
 if kind=='adidas':
  text(d,(30,90),'THE NEXT DAY',22,RED,True)
  if t>=.62:text(d,(30,142),'adidas',63,INK,True)
  paste(im,PHOTO,(102,276),(336,336))
  if t>2.3:
   d.line((138,672,139+min(274,(t-2.3)*240),672),fill=RED,width=3)
  if t>=2.3:text(d,(75,672),'No Ronaldo contact',30,INK,True)
  text(d,(80,723),'adidas statement via FIFA',18)
  text(d,(74,769),'Al Rihla exterior: retail-ball photo',13)
 elif kind=='suspension':
  text(d,(35,120),'INSIDE THE MATCH BALL',30,INK,True)
  q=min(1,t/1.25)
  if q<1:paste(im,PHOTO,(90,290),(360,360))
  else:
   paste(im,CUT,(98,218),(344,425))
   if t>=2.08:
    d.line((277,422,409,683),fill=RED,width=2);text(d,(351,690),'SENSOR',17,RED,True)
  text(d,(113,730),'Conceptual cutaway',16)
 elif kind=='sampling':
  text(d,(36,108),'500',110,RED,True);text(d,(39,240),'measurements each second',25,INK,True)
  # One-second strip is assembled as 500 discrete samples, not a measured event trace.
  progress=min(1,t/1.2)
  for i in range(int(500*progress)):
   x=36+(i%50)*9.4;y=350+(i//50)*24
   d.rectangle((x,y,x+4,y+12),fill=INK)
  text(d,(36,664),'1 SECOND',21,INK,True);text(d,(36,713),'Movement samples, not a verdict.',21)
 elif kind=='evidence':
  text(d,(35,110),'A TINY TOUCH',36,INK,True)
  ball(d,(188,426),123)
  # Hand actually brushes surface, then a packet moves to official review.
  q=min(1,max(0,t/.9));paste(im,HAND,(290+70*(1-q),381),(315,166))
  if t>.9:
   r=14+10*(t-.9);d.ellipse((309-r,411-r,309+r,411+r),outline=RED,width=2)
   z=min(1,(t-.9)/1.6);xx=192+235*z;yy=600+40*z
   d.rectangle((xx-16,yy-13,xx+16,yy+13),fill=GREEN)
   d.ellipse((402,582,452,632),outline=INK,width=3);d.arc((378,630,476,727),180,360,fill=INK,width=3)
  text(d,(80,769),'Data helps officials check.',25,INK,True)
 elif kind=='euro':
  text(d,(34,100),'EURO 2024',44,RED,True);text(d,(34,165),'BELGIUM v SLOVAKIA',27,INK,True)
  ball(d,(202,448),124)
  q=min(1,t/3.2);paste(im,HAND,(304+60*(1-q),403),(298,157))
  if t>3.2:
   d.ellipse((303,419,333,465),outline=RED,width=3);text(d,(38,666),"OPENDA'S TOUCH",32,INK,True)
  if t>4.3:
   text(d,(38,733),'Before the equaliser',25,GREEN,True)
 elif kind=='judgment':
  text(d,(32,100),'THE OFFICIALS DECIDE',32,INK,True)
  # Evidence moves into referee review, then decision changes goal state.
  d.rounded_rectangle((36,259,236,460),15,outline=GREEN,width=4)
  text(d,(65,324),'TOUCH',29,GREEN,True)
  d.line((254,359,330,359),fill=RED,width=4)
  d.polygon([(330,359),(312,349),(312,369)],fill=RED)
  d.ellipse((370,292,432,354),fill=INK);d.rounded_rectangle((349,357,455,477),20,fill=INK)
  text(d,(345,499),'REVIEW',23)
  if t>.88:
   text(d,(332,547),'HANDBALL',20,RED,True)
  if t>1.54:
   d.rounded_rectangle((50,601,490,716),10,fill=RED);text(d,(83,632),'GOAL CANCELLED',32,PAPER,True)
 elif kind=='payoff':
  text(d,(30,108),'DIFFERENT TOURNAMENT.',29,INK,True)
  if t>=.94:text(d,(30,153),'DIFFERENT DECISION.',29,RED,True)
  paste(im,CUT,(62,310),(179,221))
  d.line((252,419,323,419),fill=GREEN,width=3)
  d.ellipse((378,343,436,401),fill=INK);d.rounded_rectangle((349,407,467,527),18,fill=INK)
  text(d,(52,582),'SENSOR',25,GREEN,True);text(d,(322,582),'OFFICIALS',25,INK,True)
  if t>2.9:
   text(d,(45,642),'EVIDENCE',27,GREEN,True)
   d.line((216,615,313,615),fill=GREEN,width=3);d.polygon([(313,615),(298,606),(298,624)],fill=GREEN)
  if t>4.25:
   text(d,(337,642),'CALL',27,RED,True)
 return im
