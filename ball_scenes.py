"""Development-only connected-ball scenes, times are replaced by real word anchors."""
from PIL import Image,ImageDraw,ImageFont
import math,numpy as np
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
  text(d,(30,90),'THE NEXT DAY',22,RED,True);text(d,(30,142),'adidas',63,INK,True)
  ball(d,(270,450),140,t=t)
  if t>1:
   d.line((169,409,216,450,363,316),fill=RED,width=9)
  text(d,(75,672),'No Ronaldo contact',30,INK,True)
  text(d,(80,723),'adidas statement via FIFA',18)
 elif kind=='suspension':
  # Shell opens to reveal centrally suspended sensor. Conceptual construction.
  q=min(1,t/1.3);ball(d,(270,455),164,cut=True,t=t)
  if q<1:
   d.pieslice((106,291,434,619),-90,-90+int(360*(1-q)),fill='#fffdf1',outline=INK,width=2)
  text(d,(35,120),'INSIDE THE MATCH BALL',30,INK,True)
  if t>1.3:
   d.line((285,430,378,262),fill=RED,width=2);text(d,(312,227),'SENSOR',19,RED,True)
   d.line((179,513,87,690),fill=GREEN,width=2);text(d,(43,710),'SUSPENSION',19,GREEN,True)
  text(d,(117,783),'Conceptual cutaway',15)
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
  # Clearly abstract finger touching ball, transferred as evidence to official.
  ball(d,(198,425),104)
  shift=20*max(0,1-t)
  d.rounded_rectangle((295+shift,398,461+shift,429),14,fill='#bfa087',outline=INK,width=2)
  if t>1:
   for j in range(5):
    y=590+j*18;d.line((126,y,210,y),fill=GREEN,width=2)
   d.line((240,625,368,625),fill=RED,width=3);d.polygon([(368,625),(354,616),(354,634)],fill=RED)
   d.ellipse((402,582,452,632),outline=INK,width=3);d.arc((378,630,476,727),180,360,fill=INK,width=3)
  text(d,(80,769),'Data helps officials check.',25,INK,True)
 elif kind=='euro':
  text(d,(34,100),'EURO 2024',44,RED,True);text(d,(34,165),'BELGIUM v SLOVAKIA',27,INK,True)
  ball(d,(210,440),120)
  finger=302+max(0,1-t)*80
  d.rounded_rectangle((finger,402,474,433),15,fill='#bfa087',outline=INK,width=3)
  if t>3.2:
   d.ellipse((307,393,337,440),outline=RED,width=3);text(d,(38,666),"OPENDA'S TOUCH",32,INK,True)
  text(d,(38,733),'Touch evidence',25,GREEN,True)
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
  text(d,(30,108),'DIFFERENT TOURNAMENT.',29,INK,True);text(d,(30,153),'DIFFERENT DECISION.',29,RED,True)
  ball(d,(150,419),83,cut=True)
  d.line((252,419,323,419),fill=GREEN,width=3)
  d.ellipse((378,343,436,401),fill=INK);d.rounded_rectangle((349,407,467,527),18,fill=INK)
  text(d,(52,582),'SENSOR',25,GREEN,True);text(d,(322,582),'OFFICIALS',25,INK,True)
  if t>2.9:
   text(d,(45,642),'EVIDENCE',27,GREEN,True)
   d.line((216,615,313,615),fill=GREEN,width=3);d.polygon([(313,615),(298,606),(298,624)],fill=GREEN)
  if t>4.25:
   text(d,(337,642),'CALL',27,RED,True)
 return im
