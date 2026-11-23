"""Mechanism-first explanatory scenes. All demonstrations illustrative, never match data."""
from ball_motion import *
from PIL import ImageFont
from real_ball import render as realistic_ball,cutaway as realistic_cutaway

def hero(im,t,xy=(270,445),r=183):
 sh=Image.new("RGBA",im.size);d=ImageDraw.Draw(sh);d.ellipse((xy[0]-r*.8,xy[1]+r*.94,xy[0]+r*.8,xy[1]+r*1.06),fill=(15,23,27,55));sh=sh.filter(ImageFilter.GaussianBlur(12));im.paste(sh,(0,0),sh);paste(im,realistic_ball(t),(xy[0]-r,xy[1]-r),(r*2,r*2))
def exploded(im,t):
 paste(im,realistic_cutaway(t),(27,205),(486,535));return im

def arrow(d,a,b,c=RED,w=4):
 d.line((*a,*b),fill=c,width=w);ang=math.atan2(b[1]-a[1],b[0]-a[0]);p=[b,(b[0]-13*math.cos(ang-.5),b[1]-13*math.sin(ang-.5)),(b[0]-13*math.cos(ang+.5),b[1]-13*math.sin(ang+.5))];d.polygon(p,fill=c)
def footer(d,s):text(d,(35,770),s,15)
def scene15(k,t):
 if k=='inside':
  im=base();d=ImageDraw.Draw(im);text(d,(30,84),'SUSPENDED AT THE CENTRE',29,INK,True);exploded(im,t);footer(d,'Generic model · conceptual suspension');return im
 if k=='hero':
  im=base();d=ImageDraw.Draw(im);text(d,(30,84),'THE BALL CARRIED EVIDENCE',28,INK,True);hero(im,t);footer(d,'Generic model, not an official product render');return im
 im=base();d=ImageDraw.Draw(im)
 if k=='accel':
  text(d,(30,84),'01 / ACCELEROMETER',31,INK,True);text(d,(30,133),'Measures acceleration',25,RED,True)
  hero(im,t*.2,(270,340),119)
  q=ease(min(1,t/1.2));dx=38*math.sin(min(t,2)*2.5)
  d=ImageDraw.Draw(im);d.rounded_rectangle((96,517,443,663),12,outline=INK,width=3)
  # Generic spring-supported proof mass, not exact device internals.
  cx=270-dx
  for left,right in [(108,cx-42),(cx+42,432)]:
   pts=[(left,590)]+[(left+(right-left)*j/12,590+(11 if j%2 else -11)) for j in range(1,12)]+[(right,590)];d.line(pts,fill=GREEN,width=3)
  d.rounded_rectangle((cx-40,548,cx+40,632),6,fill=INK);text(d,(cx-25,578),'MASS',13,PAPER,True)
  arrow(d,(114,480),(416,480));text(d,(159,685),'Motion changes',25,INK,True)
  footer(d,'Concept: tiny moving mass inside a sensor')
 elif k=='gyro':
  text(d,(30,84),'02 / GYROSCOPE',31,INK,True);text(d,(30,133),'Measures angular velocity',25,RED,True)
  hero(im,t*1.3,(270,425),153);d=ImageDraw.Draw(im)
  d.arc((75,232,465,620),15,302,fill=GREEN,width=5)
  a=math.radians(302);bx=270+195*math.cos(a);by=426+194*math.sin(a);arrow(d,(bx-17,by-26),(bx,by),GREEN)
  text(d,(107,686),'How fast it rotates',28,INK,True);footer(d,'Rotation, not player identity')
 elif k=='samples15':
  text(d,(30,84),'500 READINGS / SECOND',31,INK,True)
  exploded(im,2+t*.2);d=ImageDraw.Draw(im);d.rectangle((0,670,540,814),fill=PAPER)
  text(d,(30,681),'2 ms',48,RED,True);text(d,(210,696),'between readings',21,INK,True)
  for j in range(12):
   x=48+j*40;d.line((x,752,x,766),fill=INK,width=2);d.ellipse((x-3,746,x+3,752),fill=GREEN)
  footer(d,'Sampling interval, not decision accuracy')
 elif k=='signal':
  text(d,(30,84),'WHAT A TOUCH CAN CHANGE',28,INK,True)
  hero(im,t*.2,(270,371),130);d=ImageDraw.Draw(im)
  q=ease(t/.9);arrow(d,(50,371),(115+q*15,371),RED)
  # Discrete before/after samples, no waveform pretending to be match evidence.
  d.line((64,650,480,650),fill=INK,width=2)
  for j in range(11):
   x=70+j*39;y=620 if j<5 else 568
   d.ellipse((x-4,y-4,x+4,y+4),fill=GREEN if j<5 else RED)
  d.line((242,529,242,674),fill=RED,width=2)
  text(d,(67,690),'BEFORE',20,GREEN,True);text(d,(304,690),'CHANGE',20,RED,True)
  footer(d,'Illustrative samples, not actual match data')
 elif k=='ronaldo-result':
  text(d,(30,84),'BACK TO RONALDO',32,INK,True);hero(im,t,(270,394),145)
  text(d,(65,615),'NO MEASURABLE',31,RED,True);text(d,(70,658),'EXTERNAL FORCE',29,RED,True)
  footer(d,'adidas statement via FIFA · 29 Nov 2022')
 elif k=='fusion':
  text(d,(30,84),'A DIFFERENT USE: OFFSIDE',29,INK,True)
  hero(im,t*.2,(125,302),86);paste(im,act(VAR,t),(328,251),(170,184))
  d=ImageDraw.Draw(im);text(d,(43,421),'BALL TIMING',20,RED,True);text(d,(300,421),'PLAYER POSITIONS',18,GREEN,True)
  # Generic camera-tracked pitch positions, explicitly not Ronaldo match.
  d.rectangle((94,502,447,689),outline=GREEN,width=2);d.line((270,502,270,689),fill=GREEN,width=2)
  for x,y,c in [(195,550,RED),(306,566,INK),(342,617,INK),(180,630,RED)]:
   d.ellipse((x-8,y-8,x+8,y+8),fill=c);d.line((x-12,y-14,x+12,y-14),fill=c,width=1)
  arrow(d,(125,465),(190,517));arrow(d,(399,465),(337,517),GREEN)
  footer(d,'Concept: timing combined with camera tracking')
 elif k=='validate':
  text(d,(30,84),'VIDEO OFFICIALS VALIDATE',28,INK,True)
  paste(im,act(VAR,t),(49,227),(303,322));d=ImageDraw.Draw(im)
  text(d,(39,597),'01  Suggested kick point',26,INK,True)
  if t>.7:text(d,(39,649),'02  Suggested offside line',25,INK,True)
  if t>1.3:text(d,(39,704),'Can check and correct',26,RED,True)
  footer(d,'FIFA semi-automated offside workflow')
 elif k=='meaning':
  text(d,(30,84),'THE SENSOR HELPS WITH',29,INK,True);text(d,(30,130),'WHEN.',51,RED,True)
  hero(im,t*.3,(145,386),104);paste(im,act(REF,t),(331,257),(154,391))
  d=ImageDraw.Draw(im);text(d,(30,698),'OFFICIALS INTERPRET THE PLAY.',26,INK,True)
 return im
