#!/usr/bin/env python3
"""Check fixed-caption invariants before render. Usage: script words.json cues.json"""
import json,re,sys

def norm(s):return re.findall(r"[a-z0-9]+",s.lower())
def check(words,cues):
 assert cues,'No caption cues'
 expected=norm(' '.join(w['w'] for w in words));actual=norm(' '.join(c['text'] for c in cues));assert expected==actual,'Caption tokens duplicated, omitted or changed'
 for i,c in enumerate(cues):
  dur=c['e']-c['s'];assert c['s']>=0 and dur>=.45,(i,'flashing/negative cue')
  assert dur<=6,(i,'overlong hold');assert len(c['text'])<=65,(i,'split long phrase')
  assert len(c['text'])/dur<=52,(i,'caption reading rate excessive')
  if i:assert cues[i-1]['e']<=c['s'],(i,'overlap/backward cue')
 return len(cues)
if __name__=='__main__':print('PASS',check(json.load(open(sys.argv[1])),json.load(open(sys.argv[2]))),'fixed caption cues')
