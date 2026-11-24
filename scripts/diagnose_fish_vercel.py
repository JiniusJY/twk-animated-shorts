#!/usr/bin/env python3
"""Exactly one free-only request through existing Vercel Fish relay."""
import json,os,pathlib,re,urllib.request,urllib.error
out=pathlib.Path('out/fish-vercel-diagnostic');out.mkdir(parents=True,exist_ok=True)
auth=os.environ['TWK_DIAGNOSTIC_RELAY_AUTH'];bypass=os.environ['TWK_DIAGNOSTIC_RELAY_BYPASS'];voice=os.environ['FISH_VOICE_ID']
payload={'action':'tts','model':'s2.1-pro-free','text':'Why does the last twenty percent take forever?','referenceId':voice,'temperature':0.8,'topP':0.8,'speed':1.0}
def clean(value):
 value=str(value)
 for secret in (auth,bypass,voice):
  if secret:value=value.replace(secret,'[REDACTED]')
 value=re.sub(r'[A-Za-z0-9_+.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','[EMAIL]',value)
 return value[:1500]
req=urllib.request.Request('https://techwhoknows.com/api/automation/podcast',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+auth,'x-vercel-protection-bypass':bypass,'Content-Type':'application/json'},method='POST')
result={'model':'s2.1-pro-free','route':'existing-vercel-podcast-tts','requests':1,'fallback':False,'text_bytes':len(payload['text'].encode())}
try:
 with urllib.request.urlopen(req,timeout=90) as resp:
  data=resp.read();result.update(http=resp.status,bytes=len(data),content_type=resp.headers.get('Content-Type'))
  (out/'charging-hook.mp3').write_bytes(data)
except urllib.error.HTTPError as e:
 result['http']=e.code
 raw=e.read(16000)
 try:
  body=json.loads(raw);result['provider_error']={k:clean(body[k]) for k in ('status','message','reason','code','error') if k in body}
 except Exception:result['provider_error']={'non_json_body':True,'body_bytes':len(raw)}
except Exception as e:result.update(network_error=type(e).__name__)
(out/'diagnostic.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
