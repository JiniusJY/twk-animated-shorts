#!/usr/bin/env python3
"""One free-only request, no retries or fallback. Never prints request credentials."""
import json,os,pathlib,re,urllib.request,urllib.error
out=pathlib.Path('out/fish-diagnostic');out.mkdir(parents=True,exist_ok=True)
key=os.environ['FISH_API_KEY'];voice=os.environ['FISH_VOICE_ID']
payload={'text':'Why does the last twenty percent take forever?','reference_id':voice,'format':'mp3','mp3_bitrate':192,'latency':'normal','temperature':0.8,'top_p':0.8}
def clean(value):
 value=str(value)
 for secret in (key,voice):
  if secret:value=value.replace(secret,'[REDACTED]')
 value=re.sub(r'[A-Za-z0-9_+.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','[EMAIL]',value)
 value=re.sub(r'(?i)(bearer\s+|api[_ -]?key[=: ]+)[A-Za-z0-9._-]+',r'\1[REDACTED]',value)
 return value[:1200]
req=urllib.request.Request('https://api.fish.audio/v1/tts',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json','User-Agent':'twk-animated-shorts/2.0','model':'s2.1-pro-free'},method='POST')
result={'model':'s2.1-pro-free','requests':1,'fallback':False,'text_bytes':len(payload['text'].encode())}
try:
 with urllib.request.urlopen(req,timeout=90) as resp:
  data=resp.read();result.update(http=resp.status,bytes=len(data),content_type=resp.headers.get('Content-Type'))
  (out/'charging-diagnostic-hook.mp3').write_bytes(data)
except urllib.error.HTTPError as e:
 result['http']=e.code
 raw=e.read(16000)
 try:
  body=json.loads(raw)
  result['provider_error']={k:clean(body[k]) for k in ('status','message','reason','code') if k in body}
 except Exception:result['provider_error']={'non_json_body':True,'body_bytes':len(raw)}
except Exception as e:result.update(network_error=type(e).__name__)
(out/'diagnostic.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
