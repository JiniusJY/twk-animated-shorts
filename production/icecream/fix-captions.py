import json,re
from pathlib import Path
R=Path('/tmp/twk-icecream');w=json.loads((R/'voice-v5/paced-words.json').read_text())
phrases='''This ice cream machine|deliberately heats its own mix.|So what happens|when you ask for a cone?|Inside the Taylor C602|used at McDonald's,|the mix sits in a hopper|and a freezing barrel.|Every day a heat treatment cycle|takes it to about 66 Celsius,|holds it hot,|then cools it down.|The cooling stage|gets two hours.|Let's follow one imaginary night.|Heating goes through,|cooling takes too long.|The controller soft locks the machine,|and your cone has to wait.|To find out what happened,|you can look back|through the cycle record.|There's the failed stage,|how long it took,|and temperatures saved|every five minutes.|Here, the mix was still too warm|when time ran out.|That gives the person fixing it|somewhere to start.|Once the problem's sorted,|the machine needs|a successful heat cycle|or the required cleaning|before serving again.|Plenty of other things|can stop a machine.|This is one of them.|Follow Tech Who Knows|for more everyday tech stories.'''.split('|')
# Use each token once, with monotonically ordered cue starts. Overlap repair changes boundaries only.
pos=0;cues=[]
def norm(t):return re.sub('[^a-z0-9]','',t.lower())
for text in phrases:
 n=len(text.split());part=w[pos:pos+n];assert [norm(a) for a in text.split()]==[norm(v['w']) for v in part],(text,part)
 start=part[0]['s'];end=max(v['e'] for v in part);cues.append({'text':text,'s':start,'e':end,'wordStart':pos,'wordEnd':pos+n});pos+=n
assert pos==len(w)
# Repair sentence-initial alignment spans that incorrectly reach backwards over a preceding clause.
for i,t in {6:8.46,12:16.34,14:18.42,17:22.48}.items():cues[i]['s']=t
for i,c in enumerate(cues):
 if i:c['s']=max(c['s'],cues[i-1]['s']+.09)
for i,c in enumerate(cues[:-1]):c['e']=min(c['e'],cues[i+1]['s'])
# Alignment leakage at the final CTA must not put its words before the actual deliberate gap ends.
cta=json.loads((R/'voice-v5/timing.json').read_text())['ctaStart']
ci=next(i for i,c in enumerate(cues) if c['text'].startswith('Follow '));cues[ci]['s']=cta;cues[ci-1]['e']=min(cues[ci-1]['e'],cta-.65)
assert all(c['s']<c['e'] for c in cues)
assert all(cues[i]['e']<=cues[i+1]['s'] for i in range(len(cues)-1))
(R/'voice-v5/caption-cues.json').write_text(json.dumps(cues,indent=2));(R/'caption-audit.txt').write_text('\n'.join(f"{i+1:02} {c['s']:6.2f}-{c['e']:6.2f} {c['text']}" for i,c in enumerate(cues)))
s=(R/'compose-v5.py').read_text();a=s.index('def caption(im,t):');b=s.index('\nclose=vid',a)
s=s[:a]+'''cues=json.load(open(ROOT+'/voice-v5/caption-cues.json'))
def caption(im,t):
 cue=next((c for c in cues if c['s']<=t<c['e']),None)
 if cue is None:return
 s=cue['text'];d=ImageDraw.Draw(im);sz=30
 while d.textlength(s,font=font(sz))>610:sz-=1
 wid=d.textlength(s,font=font(sz));rr(d,((W-wid)/2-16,1110,(W+wid)/2+16,1163),'#242a29',10);txt(d,(W/2,1119),s,sz,'#f8f6ec',True)
''' + s[b:];s=s.replace("ROOT+'/picture-v5.mp4'","ROOT+'/picture-v6.mp4'");(R/'compose-v6.py').write_text(s)
print((R/'caption-audit.txt').read_text())
