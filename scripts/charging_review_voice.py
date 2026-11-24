#!/usr/bin/env python3
"""Approved review-only full narration using free Fish relay and existing Groq aligner."""
import os,json,pathlib,urllib.request,urllib.error,uuid
out=pathlib.Path('out/charging-review-voice');out.mkdir(parents=True,exist_ok=True)
ep=json.loads(pathlib.Path('src/episodes/iphone-charging-finish/episode.json').read_text())
auth=os.environ['TWK_DIAGNOSTIC_RELAY_AUTH'];bypass=os.environ['TWK_DIAGNOSTIC_RELAY_BYPASS'];voice=os.environ['FISH_VOICE_ID']
text=ep['script']
payload={'action':'tts','model':'s2.1-pro-free','text':'[Curious and conversational, lightly impatient at the wait, clear and measured on mechanism.] '+text,'referenceId':voice,'temperature':.8,'topP':.8,'speed':1.0}
req=urllib.request.Request('https://techwhoknows.com/api/automation/podcast',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+auth,'x-vercel-protection-bypass':bypass,'Content-Type':'application/json'},method='POST')
try:
 with urllib.request.urlopen(req,timeout=90) as resp:audio=resp.read()
except urllib.error.HTTPError as e:
 raw=e.read(3000).decode(errors='replace')
 for s in (auth,bypass,voice):raw=raw.replace(s,'[REDACTED]')
 (out/'failure.json').write_text(json.dumps({'http':e.code,'error':raw}));raise SystemExit('Fish request failed; no fallback')
(out/'narration.mp3').write_bytes(audio)
boundary=uuid.uuid4().hex;parts=[]
def field(n,v):parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'.encode())
for n,v in [('model','whisper-large-v3-turbo'),('response_format','verbose_json'),('timestamp_granularities[]','word'),('language','en')]:field(n,v)
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="narration.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()+audio+b'\r\n');parts.append(f'--{boundary}--\r\n'.encode())
req=urllib.request.Request('https://api.groq.com/openai/v1/audio/transcriptions',data=b''.join(parts),headers={'Authorization':'Bearer '+os.environ['GROQ_API_KEY'],'Content-Type':'multipart/form-data; boundary='+boundary})
with urllib.request.urlopen(req,timeout=90) as r:alignment=json.load(r)
(out/'alignment.json').write_text(json.dumps(alignment,indent=2))
(out/'manifest.json').write_text(json.dumps({'model':'s2.1-pro-free','route':'existing-vercel','fallback':False,'scope':'review-only','audio_bytes':len(audio),'script':text},indent=2))
print('Review-only narration and alignment saved; no render or publishing workflow invoked.')
