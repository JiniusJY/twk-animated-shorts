from PIL import Image,ImageDraw,ImageFont
import cv2,json,pathlib
R=pathlib.Path('/tmp/safearea');F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
profiles={'tiktok':(240,660,120,120),'youtube':(288,672,48,192),'instagram':(270,672,65,65)}
def overlay(im,p):
 a=im.convert('RGBA');l=Image.new('RGBA',a.size);d=ImageDraw.Draw(l);top,bot,left,right=profiles[p];c=(235,50,50,110)
 for b in [(0,0,1080,top),(0,1920-bot,1080,1920),(0,0,left,1920),(1080-right,0,1080,1920)]:d.rectangle(b,fill=c)
 if p=='tiktok':d.rectangle((780,840,1080,1260),fill=c)
 if p=='instagram':d.rectangle((850,950,1080,1600),fill=c)
 d.text((130,80),p.upper()+' QA OVERLAY',font=ImageFont.truetype(F,30),fill='white');return Image.alpha_composite(a,l).convert('RGB')
def run(src,kind,times):
 cap=cv2.VideoCapture(src);ims=[]
 for j,t in enumerate(times):
  cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,a=cap.read();assert ok
  im=Image.fromarray(cv2.cvtColor(a,cv2.COLOR_BGR2RGB));im.thumbnail((216,384));ims.append((t,im))
 out=Image.new('RGB',(216*8,408*((len(ims)+7)//8)),'white');d=ImageDraw.Draw(out)
 for i,(t,im) in enumerate(ims):x=i%8*216;y=i//8*408;out.paste(im,(x,y));d.text((x+5,y+386),str(round(t,2)),fill='black')
 out.save(R/(kind+'-all-cues.jpg'),quality=93)
 cap.set(cv2.CAP_PROP_POS_MSEC,5000);ok,a=cap.read();im=Image.fromarray(cv2.cvtColor(a,cv2.COLOR_BGR2RGB));trip=Image.new('RGB',(1080*3,1920))
 for i,p in enumerate(profiles):trip.paste(overlay(im,p),(i*1080,0))
 trip.resize((1296,768)).save(R/(kind+'-platform-overlays.jpg'),quality=95)
 cap.release()
if __name__=='__main__':
 cues=json.load(open('/tmp/twk-icecream/voice-v5/caption-cues.json'));run('/downloads/TWK-Ice-Cream-Safearea-v7-preview.mp4','ice-v7',[(v['s']+v['e'])/2 for v in cues])
 words=json.load(open('/downloads/ronaldo-tech-narration/words.json'));times=[];last=-1
 for w in words:
  if w['s']>=last+1:times.append(w['s']+.05);last=w['s']
 run('/downloads/TWK-Ronaldo-Safearea-v17-preview.mp4','ron-v17',times+[39.5,41])
