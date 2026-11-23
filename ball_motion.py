"""Detailed illustrated ball motion. All trajectories and anatomy are conceptual."""
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,cv2,math
from ball_scenes import BALL,CUT,base,text,paste,INK,RED,GREEN,PAPER,VAR,REF,CALL,act
N=420
yy,xx=np.mgrid[:N,:N].astype('float32');nx=(xx-N/2)/(N/2-4);ny=(yy-N/2)/(N/2-4);inside=nx*nx+ny*ny<=1
z=np.sqrt(np.maximum(0,1-nx*nx-ny*ny));lon=np.arctan2(nx,z);lat=np.arcsin(np.clip(ny,-1,1))
tex=np.array(BALL.resize((N,N),Image.Resampling.LANCZOS))
def ease(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def sphere(angle):
 # Reproject the illustrated surface over a lit sphere, rather than spinning a flat disc.
 u=((lon+angle+math.pi)%(2*math.pi)-math.pi);sx=N/2+np.sin(u)*np.cos(lat)*(N/2-18);sy=N/2+np.sin(lat)*(N/2-18)
 a=cv2.remap(tex,sx.astype('float32'),sy.astype('float32'),cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
 light=np.clip(.66+.37*z-.12*nx-.09*ny,.4,1.08)
 a[:,:,:3]=np.clip(a[:,:,:3]*light[:,:,None],0,255);a[:,:,3]=np.where(inside,255,0)
 return Image.fromarray(a)
def hero(im,t,xy=(270,445),r=183):
 sh=Image.new('RGBA',im.size);d=ImageDraw.Draw(sh);d.ellipse((xy[0]-r*.8,xy[1]+r*.91,xy[0]+r*.8,xy[1]+r*1.02),fill=(38,53,47,40));sh=sh.filter(ImageFilter.GaussianBlur(8));im.paste(sh,(0,0),sh)
 paste(im,sphere(t*.7),(xy[0]-r,xy[1]-r),(r*2,r*2))
def exploded(im,t):
 # Art parts share a locked center; shell opens once and sensor remains suspended.
 q=ease(t/.95);w=365;h=452;x=87;y=227
 art=CUT.resize((w,h),Image.Resampling.LANCZOS)
 top=art.crop((0,0,w,201));bottom=art.crop((0,252,w,h));sensor=art.crop((137,200,224,252))
 if q<1:
  a=sphere(t*.35);a.putalpha(a.getchannel('A').point(lambda v:int(v*(1-q))));paste(im,a,(87,260),(365,365))
 if q>0:
  # Shell starts compressed and separates with eased vertical travel.
  top.putalpha(top.getchannel('A').point(lambda v:int(v*q)));bottom.putalpha(bottom.getchannel('A').point(lambda v:int(v*q)))
  dy=(1-q)*90-5*math.sin(max(0,t-.95)*2)*q;paste(im,top,(x,y+dy),(w,201));paste(im,bottom,(x,y+252-dy),(w,200))
  # Show tethers emerging from sensor, not detached chips or arbitrary circuit lines.
  d=ImageDraw.Draw(im)
  if q>.4:
   for bx,by in [(139,327),(211,274),(329,274),(401,327),(139,567),(211,629),(329,629),(401,567)]:
    d.line((270,453,bx,453+(by-453)*q),fill='#6d6e5f',width=2)
  sensor.putalpha(sensor.getchannel('A').point(lambda v:int(v*q)));paste(im,sensor,(224,427),(92,55))
  if t>1.1:
   d=ImageDraw.Draw(im);d.line((315,450,471,450,471,238),fill=RED,width=2);text(d,(350,209),'SENSOR',18,RED,True)
 return im

def scene(kind,t):
 im=base();d=ImageDraw.Draw(im)
 if kind=='hero':
  text(d,(30,86),'THE BALL HAD EVIDENCE.',31,INK,True)
  r=156+28*ease(t/.7);hero(im,t,(270,446),r)
  if t>.6:text(d,(117,696),'NO RONALDO CONTACT',23,RED,True)
  text(d,(85,758),'adidas statement via FIFA · 29 Nov 2022',14)
 elif kind=='inside':
  text(d,(30,88),'HIDDEN AT THE CENTRE',31,INK,True);exploded(im,t)
  text(d,(125,739),'Conceptual suspension system',17)
 elif kind=='samples':
  text(d,(30,88),'MOVEMENT. NOT VIDEO.',32,INK,True)
  exploded(im,2)
  # A moving sweep indexes illustrative discrete samples, never an invented real trace.
  d=ImageDraw.Draw(im);d.rectangle((20,704,520,788),fill=PAPER)
  text(d,(30,681),'500',65,RED,True);text(d,(191,709),'TIMES A SECOND',23,INK,True)
  for j in range(54):
   q=(j/54+t*.6)%1;x=286+q*192;y=484+q*135
   d.ellipse((x-2,y-2,x+2,y+2),fill=GREEN)
 elif kind=='check':
  text(d,(30,88),'EVIDENCE FOR THE OFFICIALS',27,INK,True)
  hero(im,t,(161,415),123);paste(im,act(VAR,t),(297,300),(213,230))
  d=ImageDraw.Draw(im)
  for j in range(7):
   q=(j/7+t*.7)%1;x=220+q*129;y=494+q*27;d.ellipse((x-3,y-3,x+3,y+3),fill=GREEN)
  text(d,(44,672),'A tiny touch. A better check.',27,INK,True)
  text(d,(114,754),'Illustrative data transfer',16)
 elif kind=='myths':
  text(d,(30,88),'NO CAMERA INSIDE.',33,INK,True)
  if t>.95:text(d,(30,141),'NO AUTOMATIC REFEREE.',30,RED,True)
  hero(im,t,(270,451),162)
  if t>1.8:text(d,(120,722),'A motion sensor.',29,INK,True)
 elif kind=='call':
  text(d,(30,88),'THE SENSOR SUPPLIES',31,INK,True);text(d,(30,134),'EVIDENCE.',39,GREEN,True)
  paste(im,act(VAR,t),(21,306),(225,240));paste(im,act(REF,t),(324,268),(166,419))
  if t>1.1:text(d,(30,718),'PEOPLE MAKE THE CALL.',31,RED,True)
 return im
