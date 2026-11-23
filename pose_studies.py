from pathlib import Path
import cairosvg
P='#f1eddd';I='#26352f';R='#af293c';G='#245b48';S='#cf9875';D='#ac7556'
def path(d,fill,stroke=I,w=2):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def txt(x,y,t,size=20,c=I):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-weight="700" font-size="{size}" fill="{c}">{t}</text>'
def art(pose):
 # Coordinates authored afresh from the published three-quarter match frame.
 out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960"><rect width="540" height="960" fill="{P}"/>',txt(30,42,'TECHWHOKNOWS · POSE STUDY',12,R),txt(30,91,['01  THE REACH','02  THE NEAR-MISS','03  FOLLOW-THROUGH'][pose],28),txt(30,126,'Illustrated recreation · not match footage',12)]
 # pitch and distant goal framing keep spatial context, not headline decoration
 out +=[path('M0 762 540 724M42 320 480 265V702','none','#c5cebf',2)]
 for j in range(10):out +=[path(f'M{42+j*43} {320-j*5.5}V{748-j*3}','none','#dde0d4',.8)]
 # Whole action varies momentum, not camera.
 dx=[-4,-15,25][pose];dy=[45,0,60][pose];ang=[-9,-21,-9][pose]
 out +=[f'<ellipse cx="285" cy="799" rx="80" ry="12" fill="{I}" opacity=".12"/>',f'<g transform="translate({dx} {dy-55}) rotate({ang} 292 550)">']
 # rear leg. Sock colour corrected to the actual red Portugal kit.
 out +=[path('M317 561q27 15 26 42l-13 85-21 54-19-7 16-65-1-72-13-30Z',S),path('M328 649 316 715 296 749 279 739 296 698 303 646Z',R),path('M292 727 278 746 246 757q-8 10 4 16l40-3 25-28-7-14Z','#f6f5ea')]
 # near leg stretching down and slightly back
 out +=[path('M285 564q-19 29-10 57l5 82-27 65 20 10 39-64 1-103 6-36Z',S),path('M280 678 278 709 253 758 275 774 308 714 309 679Z',R),path('M255 754 241 777 206 793q-11 8-2 16l45 1 36-36-11-14Z','#f9f7ee')]
 # Rear arm: bent down close to the chest, not a symmetrical celebration.
 out +=[path('M334 394q32 20 40 61l-22 39-14-12 12-36-27-25Z',S)]
 # torso side/three-quarter, shoulders forward and hips trailing
 out +=[path('M267 361q44-8 72 34l17 47-26 12-10-20-1 116-50 24-20-17 1-75-16-61 6-38Z',R)]
 out +=[path('M267 366 255 389 265 401 282 378Z','#bd3650'),path('M320 405 335 442 319 465 311 536 274 555','none','#791d30',3),path('M255 465 275 479m-15 18 21 9','none','#871f32',2)]
 # far shoulder and short sleeve are foreshortened
 out +=[path('M271 373q-35-6-40 25l8 28 28-6 8-22Z','#c2384a')]
 # front bent arm tucks inward, matching body balance in actual evidence frame
 out +=[path('M245 417q-3 30 23 50l39 13 6-16-33-18-12-32Z',S),path('M301 458q18-2 21 10l-2 14-16-4Z',S)]
 out +=[path('M266 547q29 10 54-9l12 50-28 9-10-18-8 25-35-17Z',G),txt(306,579,'7',21,'#e9ca7c')]
 # neck runs forward into the attempted glancing header
 out +=[path('M275 374 269 344 286 323 307 340 302 378 288 387Z',S),path('M288 356 300 350 301 377 290 380Z',D,'none')]
 # profile head with angular jaw, projecting nose, close-cropped temporal hair
 out +=[path('M264 273q33-20 51 12l-2 40-13 27-20 4-17-16-10-25-8-10 14-11Z',S)]
 out +=[path('M260 306 251 299 256 281q4-18 25-21l26 7 13 18-6 25-8-22-15-3-27 6Z','#202522')]
 out +=[path('M257 285q17-30 42-14l-26-1Z','#30352e','none'),path('M263 284 286 276m-16 6 22-2','none','#565a4b',2)]
 out +=[path('M263 301 277 302','none',I,3),path('M263 308q6-5 12 0','none',I,1.6),'<circle cx="267" cy="308" r="2" fill="#26352f"/>']
 out +=[path('M260 311 251 322 262 324 264 333 275 337 283 336','none',D,1.8),path('M265 337 279 339','none',I,1),path('M279 314 290 324 287 344 276 347Z',D,'none')]
 out +=[path('M301 308q11-7 11 7-2 16-11 13Z',S),path('M303 313q5-3 5 4','none',D,1.4)]
 # back number is partly foreshortened, this is not a fake licensed jersey asset
 out +=[f'<text x="282" y="457" font-family="DejaVu Sans" font-size="49" font-weight="800" fill="#e7cb82" transform="rotate(-7 282 457)">7</text>']
 out +=['</g>']
 # Free ball follows crossing direction. Deliberately no drawn contact.
 bx=[175,165,106][pose];by=[216,174,188][pose]
 out +=[f'<circle cx="{bx}" cy="{by}" r="30" fill="#fffdf0" stroke="{I}" stroke-width="2"/>',path(f'M{bx-8} {by-12}l17 2 7 15-16 12-16-12Z',I),path(f'M{bx-8} {by-12}l-8-12m25 14 13-13m-6 28 12 7m-28 3v13m-16-13-13 8','none',I,1.5)]
 out +=[txt(30,870,'TORSO FIRST. HEAD TOWARD THE CROSS.',16,R),txt(30,906,'Staging reference: Sky Sports, 29 November 2022',10),txt(30,926,'Exact spacing and follow-through remain illustrative.',10),'</svg>']
 return ''.join(out)
if __name__=='__main__':
 r=Path('/tmp/twk-ronaldo-proof/out/poses');r.mkdir(exist_ok=True)
 for i in range(3):cairosvg.svg2png(bytestring=art(i).encode(),write_to=str(r/f'pose-{i}.png'))
 from PIL import Image
 ims=[Image.open(r/f'pose-{i}.png') for i in range(3)];sheet=Image.new('RGB',(1620,960),'white')
 for i,im in enumerate(ims):sheet.paste(im,(i*540,0))
 sheet.save('/downloads/ronaldo-reference-grounded-poses-v1.jpg')
