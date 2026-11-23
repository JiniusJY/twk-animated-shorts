"""Procedural 32-panel material render, generic football, not an official ball replica."""
import numpy as np,math
from PIL import Image,ImageDraw,ImageFilter
from scipy.spatial import ConvexHull
phi=(1+5**.5)/2
v=np.array([(0,a,b) for a in [-1,1] for b in [-phi,phi]]+[(a,b,0) for a in [-1,1] for b in [-phi,phi]]+[(b,0,a) for a in [-1,1] for b in [-phi,phi]],float)
d=np.linalg.norm(v[:,None]-v[None,:],axis=2);edges=np.argwhere((d>0)&(d<2.01));tv=np.array([(2*v[i]+v[j])/3 for i,j in edges]);tv/=np.linalg.norm(tv,axis=1)[:,None]
hull=ConvexHull(tv);faces=[]
for eq in hull.equations:
 if not any(np.linalg.norm(eq-x)<1e-5 for x in faces):faces.append(eq)
faces=np.array(faces);normals=faces[:,:3];offset=-faces[:,3]
counts=np.array([sum(np.abs(tv@n-o)<1e-5) for n,o in zip(normals,offset)])
N=600
y,x=np.mgrid[:N,:N];nx=(x-N/2)/(N/2-5);ny=-(y-N/2)/(N/2-5);r2=nx*nx+ny*ny;z=np.sqrt(np.maximum(0,1-r2));P=np.stack([nx,ny,z],-1);mask=r2<=1
L=np.array([-.45,.65,.85]);L/=np.linalg.norm(L);H=(L+np.array([0,0,1.]));H/=np.linalg.norm(H)
def render(t):
 a=t*.48+.4;b=.3
 R=np.array([[math.cos(a),0,math.sin(a)],[0,1,0],[-math.sin(a),0,math.cos(a)]])@np.array([[1,0,0],[0,math.cos(b),-math.sin(b)],[0,math.sin(b),math.cos(b)]])
 pp=P@R;dots=pp@normals.T;ray=np.where(dots>1e-6,offset/np.maximum(dots,1e-6),100)
 ids=ray.argmin(-1);sort=np.partition(ray,1,axis=-1);gap=sort[:,:,1]-sort[:,:,0]
 seam=np.exp(-(gap/.0035)**2);rim=np.exp(-(gap/.011)**2)
 black=counts[ids]==5
 base=np.where(black[:,:,None],np.array([35,39,40]),np.array([228,229,222]))
 # Fine moulded microtexture and recesses maintain physical material under moving light.
 grain=(np.sin(pp[:,:,0]*670)*np.sin(pp[:,:,1]*690)+np.sin(pp[:,:,2]*430+pp[:,:,0]*540))*3.4
 pore=np.maximum(0,np.sin(pp[:,:,0]*560+np.sin(pp[:,:,2]*130))*np.sin(pp[:,:,1]*560))**8
 grain-=pore*12
 diffuse=np.clip(P@L,0,1);spec=np.clip(P@H,0,1)**29
 shade=.32+.65*diffuse-.15*rim
 rgb=base*shade[:,:,None]+grain[:,:,None]+spec[:,:,None]*13
 rgb=rgb*(1-seam[:,:,None]*.58)
 alpha=np.clip((1-r2)*500,0,1)*255
 return Image.fromarray(np.dstack([np.clip(rgb,0,255).astype('uint8'),alpha.astype('uint8')]))
def shot(t):
 im=Image.new('RGB',(540,960),'#e9eceb');sh=Image.new('RGBA',im.size);d=ImageDraw.Draw(sh);d.ellipse((99,711,449,752),fill=(15,23,27,65));sh=sh.filter(ImageFilter.GaussianBlur(17));im.paste(sh,(0,0),sh)
 ball=render(t).resize((420,420),Image.Resampling.LANCZOS);im.paste(ball,(60,285),ball)
 return im
if __name__=='__main__':
 import pathlib
 p=pathlib.Path('/tmp/realball');p.mkdir(exist_ok=True)
 for i in range(90):shot(i/30).save(p/f'{i:04d}.png')

def cutaway(t):
 # Generic spherical shell in perspective. Geometry is explanatory, not Al Rihla CAD.
 im=Image.new('RGBA',(600,660));d=ImageDraw.Draw(im)
 q=max(0,min(1,t/1.25));q=q*q*(3-2*q);sep=q*94
 a=render(.5).resize((430,430),Image.Resampling.LANCZOS)
 # The equator is opened so inner shell material and suspension can be seen.
 top=a.crop((0,0,430,215));bottom=a.crop((0,215,430,430))
 im.paste(bottom,(85,int(290+sep)),bottom)
 d=ImageDraw.Draw(im)
 # Bottom bowl ellipses provide thickness and visible internal shading.
 cy=290+sep
 for r in range(215,1,-2):
  f=r/215;col=int(73+92*(1-f));d.ellipse((300-r,cy-r*.29,300+r,cy+r*.29),fill=(col,col+3,col+2,255))
 d.ellipse((85,cy-62,515,cy+62),outline='#b2b5ad',width=2)
 im.paste(top,(85,int(75-sep)),top)
 cy2=290-sep
 for r in range(215,1,-2):
  f=r/215;col=int(51+66*(1-f));d.ellipse((300-r,cy2-r*.29,300+r,cy2+r*.29),fill=(col,col+3,col+2,255))
 d.ellipse((85,cy2-62,515,cy2+62),outline='#b9bdb5',width=2)
 # Subtle woven inner-lining texture, clipped to both open rim ellipses.
 for cx,cyy in [(300,cy),(300,cy2)]:
  for j in range(50):
   xx=90+j*8.5;rr=max(0,1-((xx-300)/212)**2)**.5;hh=59*rr
   d.line((xx,cyy-hh,xx,cyy+hh),fill=(98,103,101,255),width=1)
 # Eight suspension tethers converge at a central capsule.
 for x,y in [(124,cy2-22),(215,cy2-52),(385,cy2-52),(476,cy2-22),(124,cy+22),(215,cy+52),(385,cy+52),(476,cy+22)]:
  d.line((x,y,300,290),fill='#525b5e',width=5);d.line((x-1,y,299,289),fill='#b4bab8',width=2)
 d.rounded_rectangle((261,267,339,313),9,fill='#313a40',outline='#9aabae',width=2)
 d.polygon([(261,271),(273,261),(348,261),(339,271)],fill='#68767c');d.polygon([(339,271),(348,261),(348,303),(339,313)],fill='#1b252b')
 d.rounded_rectangle((275,279,325,300),3,fill='#152228');d.ellipse((330,275,334,279),fill='#6aa795')
 return im

def proof(t):
 im=Image.new('RGB',(540,960),'#e9eceb')
 from PIL import ImageFont
 d=ImageDraw.Draw(im);f='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
 d.text((30,80),'INSIDE THE MATCH BALL',font=ImageFont.truetype(f,29),fill='#202b30')
 # Match diameter430scaled. Closed centre and open centre coincide at x270,y465.
 sh=Image.new('RGBA',im.size);sd=ImageDraw.Draw(sh);sd.ellipse((100,712,440,744),fill=(15,23,27,48));sh=sh.filter(ImageFilter.GaussianBlur(18));im.paste(sh,(0,0),sh)
 closed=Image.new('RGBA',im.size);a=render(min(t,.8)).resize((378,378),Image.Resampling.LANCZOS);closed.paste(a,(81,277),a)
 if t<.8:im.paste(closed,(0,0),closed)
 else:
  opened=Image.new('RGBA',im.size);a=cutaway(t-.8).resize((528,581),Image.Resampling.LANCZOS);opened.paste(a,(6,211),a)
  q=max(0,min(1,(t-.8)/.28));q=q*q*(3-2*q)
  layer=Image.blend(closed,opened,q);im.paste(layer,(0,0),layer)
 d=ImageDraw.Draw(im);d.text((35,820),'Generic model, conceptual mechanism',font=ImageFont.truetype(f,17),fill='#516165')
 return im
