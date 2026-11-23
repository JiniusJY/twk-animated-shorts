import subprocess,json,numpy as np
from scipy.io import wavfile
R='/tmp/twk-icecream';subprocess.run(['ffmpeg','-y','-i',R+'/voice-v5/narration.mp3','-ar','48000','-ac','1',R+'/voice-v5/raw.wav'],stderr=open(R+'/voice-v5/decode.log','w'),check=True)
sr,x=wavfile.read(R+'/voice-v5/raw.wav');x=x.astype(float)/32768
# Select low-energy boundary near aligner sentence breaks, not an arbitrary cut through a word.
def boundary(t,r=.12):
 a=int((t-r)*sr);b=int((t+r)*sr);y=np.convolve(x[a:b]**2,np.ones(480)/480,mode='same');return (a+np.argmin(y[480:-480])+480)/sr
b1=boundary(44.44);b2=boundary(47.8);print('Boundaries',b1,b2)
for n,a,b in [('body',0,b1),('ending',b1,b2),('cta',b2,len(x)/sr)]:wavfile.write(R+'/voice-v5/'+n+'.wav',sr,(x[int(a*sr):int(b*sr)]*32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-i',R+'/voice-v5/ending.wav','-af','atempo=0.88',R+'/voice-v5/ending-slow.wav'],stderr=open(R+'/voice-v5/slow.log','w'),check=True)
_,body=wavfile.read(R+'/voice-v5/body.wav');_,end=wavfile.read(R+'/voice-v5/ending-slow.wav');_,cta=wavfile.read(R+'/voice-v5/cta.wav');pause1=.30;pause2=.70;out=np.concatenate([body,np.zeros(int(sr*pause1),np.int16),end,np.zeros(int(sr*pause2),np.int16),cta,np.zeros(int(sr*1.5),np.int16)]);wavfile.write(R+'/voice-v5/paced.wav',sr,out)
start_end=len(body)/sr+pause1;start_cta=start_end+len(end)/sr+pause2;dur=len(out)/sr
w=json.load(open(R+'/voice-v5/words.json'));new=[]
for i,v in enumerate(w):
 if i and v['w']==w[i-1]['w'] and v['s']<w[i-1]['e']:continue
 def tr(t):return t if t<b1 else start_end+(t-b1)/.88 if t<b2 else start_cta+(t-b2)
 new.append({'w':v['w'],'s':round(tr(v['s']),3),'e':round(min(dur,tr(v['e'])),3)})
json.dump(new,open(R+'/voice-v5/paced-words.json','w'),indent=2);json.dump({'bodyEnd':b1,'endingStart':start_end,'ctaStart':start_cta,'duration':dur},open(R+'/voice-v5/timing.json','w'),indent=2);print(start_end,start_cta,dur)
