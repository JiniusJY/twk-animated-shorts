import math, pathlib
import cairosvg
from PIL import Image
OUT=pathlib.Path('/tmp/twk-ronaldo-proof/out/motion');OUT.mkdir(parents=True,exist_ok=True)
W,H=540,960
INK='#26352f';PAPER='#f1eddd';RED='#b92739';SKIN='#d5a27d';DARK='#a76d50'
def path(d,fill,stroke=INK,sw=2):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>'
def limb(points,width,color):
 d='M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in points)
 return path(d,'none',INK,width+3)+path(d,'none',color,width)
def text(x,y,s,size=20,color=INK,weight='600',anchor='start'):
 return f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{s}</text>'
def svg(t):
 # Anticipation, take-off, airborne header, landing, celebration. Fixed camera.
 if t<.75:q=t/.75;rise=-12*math.sin(q*math.pi);rot=-5*q;arms=0
 elif t<2.1:q=(t-.75)/1.35;rise=125*math.sin(q*math.pi*.8);rot=-5+17*math.sin(q*math.pi);arms=0
 elif t<2.8:q=(t-2.1)/.7;rise=74*(1-q);rot=5*(1-q);arms=q
 else:rise=0;rot=0;arms=1
 # Main figure articulated about hips.
 hx,hy=276,639-rise
 headTilt=-8 if .9<t<1.8 else 0
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><rect width="540" height="960" fill="{PAPER}"/>']
 parts += [text(30,43,'TECHWHOKNOWS',11,RED),path('M30 55H510','none',INK,.8),text(30,88,'ILLUSTRATED RECREATION · PORTUGAL v URUGUAY, 2022',8,INK)]
 parts += [text(30,139,'CRISTIANO RONALDO',30,INK,'800'),text(31,181,'Did he even touch it?',27,RED,'700')]
 # Goal and pitch: intentionally light, no fake broadcast UI.
 parts += [path('M32 379 L490 363 L490 712 L32 730 Z','none','#c4cabd',2)]
 for k in range(1,13):
  x=32+k*38;parts +=[path(f'M{x} {379-(x-32)*.035}V{730-(x-32)*.039}','none','#d8dbcf',.7)]
 for k in range(1,9):parts +=[path(f'M32 {379+k*39}L490 {363+k*39}','none','#d8dbcf',.7)]
 parts += [path('M0 787Q270 762 540 780','none','#92a28f',2),f'<ellipse cx="280" cy="796" rx="{72-rise*.24}" ry="{11-rise*.035}" fill="#26352f" opacity=".12"/>']
 # rear leg bent at knee during leap
 parts += ['<g transform="translate(270 550) scale(1.0) translate(-276 -590)">',f'<g transform="rotate({rot} {hx} {hy})">']
 bend=min(1,rise/90)
 parts += [limb([(hx-14,hy),(hx-55,hy+65),(hx-77+bend*40,hy+137-bend*37)],27,SKIN)]
 parts += [limb([(hx-55,hy+65),(hx-77+bend*40,hy+137-bend*37)],22,'#eee9d9')]
 parts += [path(f'M{hx-90+bend*40} {hy+133-bend*37}l-18 15q-7 11 6 13l44-1 6-14-12-13Z','#e6e4d7')]
 # front leg
 parts += [limb([(hx+15,hy),(hx+39,hy+75),(hx+70-bend*60,hy+142-bend*5)],29,SKIN)]
 parts += [limb([(hx+39,hy+75),(hx+70-bend*60,hy+142-bend*5)],23,'#f5f0df')]
 parts += [path(f'M{hx+56-bend*60} {hy+136-bend*5}l3 22 45 1q10-5 0-12l-25-16Z','#e5e2d6')]
 # shoulders and independent arms
 sy=hy-114
 anticip=max(0,1-t/.75)
 left=[(hx-36,sy),(hx-77-arms*20,sy+20-arms*73+anticip*28),(hx-99-arms*30,sy-20-arms*60+anticip*105)]
 right=[(hx+35,sy),(hx+83+arms*19,sy+18-arms*73+anticip*28),(hx+105+arms*20,sy-28-arms*54+anticip*105)]
 parts += [limb(left,20,SKIN),limb(right,20,SKIN)]
 # hands with fingers
 for xx,yy in [left[-1],right[-1]]:
  parts += [f'<ellipse cx="{xx}" cy="{yy-5}" rx="10" ry="14" fill="{SKIN}" stroke="{INK}" stroke-width="2"/>']
  for dx in [-5,0,5]:parts +=[path(f'M{xx+dx} {yy-14}v8','none',DARK,.8)]
 # jersey body tapered, shoulder seams and fabric folds
 parts += [path(f'M{hx-39} {sy-13}Q{hx} {sy-30} {hx+39} {sy-13}l12 26-18 12-6-5 1 82q-28 13-61 0l1-82-8 5-17-13Z',RED)]
 parts += [path(f'M{hx-14} {sy-20}q14 17 28 0l-2-8h-24Z','#e7c7a8'),path(f'M{hx-14} {sy-20}q14 17 28 0','none','#d6b165',3)]
 parts += [path(f'M{hx-22} {sy+12}l-7 28m51-18 8 28m-50 33 18 5','none','#8f2030',2)]
 # crest original simplified flag icon, not a copied brand mark
 parts += [path(f'M{hx+18} {sy+2}h12v15l-6 5-6-5Z','#e9d8b1',INK,.8)]
 parts += [text(hx,sy+61,'7',44,'#e8cc82','800','middle')]
 parts += [path(f'M{hx-31} {hy-9}q32 9 63 0l8 44-38 3-5-19-4 19-37-4Z','#285a45')]
 parts += [path(f'M{hx+9} {hy+2}l5 28','none','#133d30',2),text(hx+24,hy+25,'7',15,'#e8cc82')]
 # neck, defined head, ears and recognisable sharp cropped hairstyle
 parts += [path(f'M{hx-11} {sy-24}v-24h23v24q-11 12-23 0Z',SKIN)]
 cy=sy-67;cx=hx
 parts += [f'<g transform="rotate({headTilt} {cx} {cy})">']
 parts += [path(f'M{cx-23} {cy-21}q-5 29 1 44l15 17q8 4 16-1l14-17q6-29-2-47Z',SKIN)]
 parts += [path(f'M{cx-23} {cy-9}q-12-7-9 8 2 11 10 10m44-18q12-7 9 8-2 11-10 10',SKIN)]
 parts += [path(f'M{cx-25} {cy+7}l2-24 2-14q5-17 22-16l24 5 6 15-6 22-4-18q-17 5-32-3l-9 7-1 25Z','#242724')]
 parts += [path(f'M{cx-18} {cy-30}l22-6m-14 1 20 0','none','#53544b',2),path(f'M{cx-20} {cy-26}q9-22 27-16l9 8-14-3-16 6Z','#242724',INK,1)]
 # Angular cheek planes, temple shading and distinct brow anatomy
 parts += [path(f'M{cx-21} {cy+9}l9 8-4 18-8-10Z','#bf8765','none'),path(f'M{cx+22} {cy+8}l-8 8 4 18 6-10Z','#c28b68','none'),path(f'M{cx-12} {cy+32}q13 10 25-1l-9 9h-7Z','#c28b68','none')]
 # brows, eyes, nose, cheekbones, lips, fine stubble
 parts += [path(f'M{cx-17} {cy-1}l11-3m11 0 12 3','none',INK,3)]
 parts += [path(f'M{cx-17} {cy+4}q6-4 12 0m10 0q6-4 12 0','none',INK,1.5)]
 parts += [f'<circle cx="{cx-10}" cy="{cy+4}" r="1.7" fill="{INK}"/><circle cx="{cx+11}" cy="{cy+4}" r="1.7" fill="{INK}"/>']
 parts += [path(f'M{cx+1} {cy+5}l-3 12 7 1m-18 9q12 7 23 0m-27-12-7-1m34 0 6-1','none',DARK,1.4),path(f'M{cx-10} {cy+29}q10 3 20 0','none',INK,1)]
 parts += ['</g>']
 parts += ['</g>']
 # the ball crosses, with visible gap, never invented contact
 bx=440-320*min(1,max(0,(t-.7)/1.7));by=295-20*math.sin(min(1,max(0,(t-.7)/1.7))*math.pi)
 if t<2.7:
  parts +=[f'<g transform="translate({bx} {by}) rotate({t*160})"><circle r="24" fill="#fffdf0" stroke="{INK}" stroke-width="2"/>',path('M-6-9 8-9 13 4 0 13-12 4Z',INK),path('M-6-9-16-19M8-9 18-17M13 4 23 8M0 13 0 24M-12 4-23 9','none',INK,1.5),'</g>']
 parts += ['</g>']
 if t>=2.8:
  op=min(1,(t-2.8)/.45)
  parts += [f'<g opacity="{op}"><rect x="24" y="826" width="492" height="106" rx="8" fill="{INK}"/>',text(43,864,'DID HE EVEN',22,PAPER,'700'),text(43,902,'TOUCH THE BALL?',24,'#e7ad79','800'),'</g>']
 else:parts +=[text(270,866,'THE CELEBRATION WAS REAL.',19,INK,'700','middle'),text(270,900,'The touch was in question.',18,RED,'600','middle')]
 if t>=3.2:
  q=1; yy=0
  parts += [f'<g transform="translate(0 {yy})" opacity="{q}"><rect x="0" y="100" width="540" height="860" fill="{PAPER}"/>',text(30,145,'THE WITNESS',38,INK,'800'),text(31,185,'was inside the ball.',27,RED,'700'),'<circle cx="270" cy="505" r="190" fill="#fffdf0" stroke="#26352f" stroke-width="3"/>',path('M270 315V695M80 505H460','none','#bdc8b7',2)]
  for a in range(0,360,60):
   x=270+180*math.cos(math.radians(a));y=505+180*math.sin(math.radians(a));parts +=[path(f'M{x} {y}L270 505','none','#637b6b',5)]
  parts += ['<rect x="230" y="468" width="80" height="74" rx="10" fill="#26352f"/>',text(270,510,'IMU',23,PAPER,'700','middle'),text(270,758,'500 measurements / second',24,INK,'700','middle'),text(270,797,'Conceptual cutaway · not a technical blueprint',12,INK,'600','middle')]
  pulse=12+15*abs(math.sin((t-3.2)*6));parts +=[f'<circle cx="270" cy="505" r="{65+pulse}" stroke="{RED}" stroke-width="2" fill="none" opacity=".45"/>','</g>']
 parts += ['</svg>'];return ''.join(parts)
if __name__=='__main__':
 for i in range(150):
  cairosvg.svg2png(bytestring=svg(i/30).encode(),write_to=str(OUT/f'{i:04d}.png'))
 (OUT.parent/'ronaldo-hook-art.svg').write_text(svg(1.25))
