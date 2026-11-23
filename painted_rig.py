from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np,math,pathlib,cv2
SRC=Image.open(pathlib.Path(__file__).resolve().parent/'assets/ronaldo-connected-ball/keyposes.png').convert('RGBA').resize((1313,875),Image.Resampling.LANCZOS)
R=pathlib.Path('/tmp/twk-ronaldo-proof/out/painted');R.mkdir(exist_ok=True)
size=SRC.size
outline=[(505,52),(557,48),(585,67),(584,112),(616,129),(694,147),(759,159),(817,175),(844,220),(867,249),(869,278),(848,289),(832,272),(812,257),(801,230),(762,213),(735,213),(757,266),(766,305),(814,371),(843,436),(871,487),(891,535),(922,567),(947,620),(945,654),(923,664),(904,641),(889,602),(871,575),(852,557),(827,521),(802,483),(773,453),(744,427),(714,417),(704,433),(733,472),(766,506),(780,546),(777,574),(756,594),(735,576),(722,547),(710,520),(675,495),(645,469),(626,447),(613,414),(610,379),(619,341),(605,318),(575,311),(548,298),(519,285),(495,280),(477,269),(473,251),(486,235),(505,237),(515,250),(523,253),(532,230),(529,210),(529,176),(518,156),(509,141),(497,132),(495,108),(499,87)]
def mask(poly):
 m=Image.new('L',size);ImageDraw.Draw(m).polygon(poly,fill=255);return m
full=mask(outline)
# Remove pale background pixels near silhouette without eating boots highlights inside.
parts={
 'head':([(490,45),(590,44),(603,132),(585,178),(546,188),(507,151),(487,130)],(555,165)),
 'rightarm':([(719,145),(822,164),(848,212),(879,253),(881,289),(851,302),(819,270),(795,226),(741,218)],(738,183)),
 'leftarm':([(538,174),(565,223),(537,270),(514,293),(477,290),(462,270),(467,241),(498,224),(523,231)],(552,190)),
 'frontleg':([(647,325),(708,330),(726,398),(704,437),(745,482),(782,515),(793,566),(776,599),(747,605),(720,567),(703,528),(662,504),(626,469),(609,427),(609,378)],(666,351)),
 'backleg':([(711,319),(763,323),(799,377),(827,430),(852,476),(878,522),(906,553),(940,590),(958,640),(944,676),(913,673),(890,636),(876,597),(842,567),(815,528),(791,491),(751,454),(718,424),(691,380)],(726,343))}
layers={};bodyalpha=full.copy()
for name,(poly,pivot) in parts.items():
 m=Image.fromarray(np.minimum(np.array(mask(poly)),np.array(full)).astype('uint8'));im=SRC.copy();im.putalpha(m);layers[name]=(im,pivot);bodyalpha=Image.fromarray(np.maximum(0,np.array(bodyalpha,dtype=int)-np.array(m,dtype=int)).astype('uint8'))
body=SRC.copy();body.putalpha(bodyalpha)
def isolate(box):
 roi=np.array(SRC.crop(box));rgb=roi[:,:,:3]
 bg=(rgb[:,:,0]>207)&(rgb[:,:,1]>204)&(rgb[:,:,2]>185)&((rgb[:,:,0].astype(int)-rgb[:,:,2])<45)
 n,l=cv2.connectedComponents(bg.astype('uint8'));e=np.unique(np.concatenate([l[0],l[-1],l[:,0],l[:,-1]]));alpha=np.where(np.isin(l,e[e!=0]),0,255).astype('uint8')
 n,l,st,_=cv2.connectedComponentsWithStats((alpha>0).astype('uint8'));k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]);roi[:,:,3]=np.where(l==k,255,0)
 return Image.fromarray(roi)
approach=isolate((0,125,495,815));landing=isolate((947,150,1306,810))
# Remove painted ground scraps from isolated grounded keyposes.
a=np.array(approach); yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];a[((yy>655)&((xx<43)|(xx>147)))|(yy>=680),3]=0;approach=Image.fromarray(a)
a=np.array(landing);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];a[((yy>620)&((xx<194)|(xx>258)))|(yy>=650),3]=0;landing=Image.fromarray(a)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(d,xy,s,n=24,fill='#26352f',b=False):d.text(xy,s,font=ImageFont.truetype(bold if b else font,n),fill=fill)
def make(t):
 im=Image.new('RGB',(540,960),'#f1eddd');d=ImageDraw.Draw(im)
 text(d,(28,28),'TECHWHOKNOWS',12,'#b33337',True);d.line((28,52,512,52),fill='#566453')
 text(d,(28,72),'CRISTIANO RONALDO',28,b=True);text(d,(28,111),'Did he even touch it?',27,'#b33337',True)
 text(d,(28,161),'ILLUSTRATED RECREATION · WORLD CUP 2022',10)
 if t<6:
  replay=False
  local=t
  q=min(1,max(0,(local-.55)/2.45));jump=math.sin(q*math.pi)*85
  # Smooth inverse skinning of a single clean silhouette avoids cut-out seams.
  phase=math.sin(q*math.pi)
  clean=SRC.copy(); arr=np.array(clean)
  # Flood background only inside the central-figure crop; pale boot interiors remain enclosed.
  roi=arr[40:683,465:963,:3].copy()
  bg=(roi[:,:,0]>207)&(roi[:,:,1]>204)&(roi[:,:,2]>185)&((roi[:,:,0].astype(int)-roi[:,:,2])<45)
  labels_n,labels=cv2.connectedComponents(bg.astype('uint8'))
  edge=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]])); remove=np.isin(labels,edge[edge!=0])
  alpha=np.where(remove,0,255).astype('uint8')
  nn,ll,stats,_=cv2.connectedComponentsWithStats((alpha>0).astype('uint8')); keep=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);alpha=np.where(ll==keep,255,0).astype('uint8')
  figure=Image.fromarray(np.dstack([roi,alpha]))
  yy,xx=np.mgrid[:643,:498].astype('float32')
  dx=np.zeros_like(xx);dy=np.zeros_like(xx)
  # Torso leads, head dips forward; arms counterbalance and legs change extension.
  for cx,cy,rx,ry,vx,vy in [(91,76,86,98,-9,-4),(43,202,76,80,-9,9),(365,174,82,105,11,-6),(219,400,94,120,-12,7),(393,497,75,130,9,-8)]:
   w=np.exp(-(((xx-cx)/rx)**2+((yy-cy)/ry)**2)*2)*phase
   dx+=vx*w;dy+=vy*w
  warped=cv2.remap(np.array(figure),xx-dx,yy-dy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
  figure=Image.fromarray(warped).resize((359,463),Image.Resampling.LANCZOS)
  x=112-30*q;y=int(303-jump)
  # Accentuate torso-led action, not whole-sheet panning.
  figure=figure.rotate(-4*phase,Image.Resampling.BICUBIC,expand=False,center=(174,242))
  d.ellipse((164,777,394,798),fill='#d6d7c6')
  if not replay and t<.55:
   figure=approach.resize((346,483),Image.Resampling.LANCZOS);x=89+25*t;y=311
  elif not replay and t>3.05:
   figure=landing.resize((264,485),Image.Resampling.LANCZOS);x=153-25*min(1,t-3.05);y=309+12*min(1,(t-3.05)*3)
  im.paste(figure,(int(x),int(y)),figure)
  # Generic schematic ball; not a branded Al Rihla representation.
  bx=455-480*q;by=192

  d.ellipse((bx-22,by-22,bx+22,by+22),fill='#fffdf0',outline='#26352f',width=2)
  pts=[(bx+10*math.cos(a*math.pi/2.5-1.5),by+10*math.sin(a*math.pi/2.5-1.5)) for a in range(5)];d.polygon(pts,fill='#26352f')
  if t>=3.65:
   # Forensic detail replay from the same single attempt, never restart full-body jump.
   # Crop captures forehead and ball gap. Ball crosses on its own while pose holds.
   detail=make(1.68).crop((107,224,278,391)).resize((414,405),Image.Resampling.LANCZOS)
   im.paste(Image.new('RGB',(540,630),'#f1eddd'),(0,184))
   # Fade crop edges into paper instead of a hard rectangular torso cut.
   mask=Image.new('L',detail.size,255);ma=np.array(mask,dtype=float)
   ma*=np.minimum(1,(414-np.arange(414))[None,:]/44)
   ma*=np.minimum(1,(405-np.arange(405))[:,None]/34)
   im.paste(detail,(63,307),Image.fromarray(ma.astype('uint8')))
   d=ImageDraw.Draw(im)
   bx=414-255*min(1,(t-3.65)/1.5);by=266
   d.ellipse((bx-25,by-25,bx+25,by+25),fill='#fffdf0',outline='#26352f',width=2)
   d.polygon([(bx,by-11),(bx+11,by-3),(bx+7,by+10),(bx-7,by+10),(bx-11,by-3)],fill='#26352f')
   text(d,(31,212),'THE TINY-TOUCH QUESTION',22,'#b33337',True)
   # Explicitly illustrative framing, no fabricated contact result or data trace.
   text(d,(74,728),'Detail replay · illustrated recreation',14)
  cap='Cristiano Ronaldo celebrated' if t<2.3 else 'this World Cup goal.' if t<3.9 else 'But did he even touch the ball?'
  text(d,(28,839),cap,24 if t<3.9 else 23,b=True)
  text(d,(28,882),'Schematic ball · illustrated recreation',13,'#b33337')
 else:
  text(d,(28,215),'PORTUGAL v URUGUAY',29,b=True);text(d,(28,260),'WORLD CUP 2022',22,'#b33337',True)
  d.rounded_rectangle((28,363,512,570),12,fill='#26352f')
  text(d,(63,386),'THE OFFICIAL GOAL CREDIT',17,'#f1eddd',True)
  text(d,(63,429),'BRUNO',53,'#f1eddd',True);text(d,(63,490),'FERNANDES',43,'#f1eddd',True)
  text(d,(28,640),'FIFA awarded him the goal.',26,b=True)
  text(d,(28,700),'The sensor supplied evidence.',22)
  text(d,(28,736),'The officials made the call.',22)
  text(d,(28,895),'Source: adidas statement via FIFA, 29 Nov 2022',11)
 return im
if __name__=='__main__':
 for i in range(313):make(i/30).save(R/f'{i:04d}.png')
 for n,(im,p) in layers.items():im.crop((465,40,963,683)).save(R.parent/f'rig-{n}.png')
