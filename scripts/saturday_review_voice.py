"""Local staged helper. Do not execute until scoped owner approval and branch review."""
import json, os, pathlib, urllib.request, urllib.error, subprocess, sys, re
OUT=pathlib.Path('out/saturday-review-voice');OUT.mkdir(parents=True,exist_ok=True)
TEXT="""Your lunch is steaming. One bite is hot. The next is cold. And the microwave plate was spinning the whole time.

Inside the metal box, microwaves reflect and overlap. That creates stronger and weaker heating regions.

The turntable moves food through that uneven pattern, helping spread the energy around.

But it cannot stir the food. A thick pile still heats differently from a thin layer, and different ingredients absorb energy differently.

So follow the packet's stirring and standing instructions. Stirring moves hotter and cooler food together. Standing gives heat more time to spread.

The plate moves your lunch. It doesn't guarantee every bite is equally hot.

Follow TechWhoKnows for more everyday tech explained."""
key=os.environ['FISH_API_KEY'].strip();voice=os.environ['FISH_VOICE_ID'].strip();groq=os.environ['GROQ_API_KEY'].strip()
if not all([key,voice,groq]):raise RuntimeError('Required saved configuration unavailable. No request made.')
payload={'text':'[Curious and conversational, amused by the cold bite, then clear and measured on the mechanism.] '+TEXT,'reference_id':voice,'format':'mp3','mp3_bitrate':192,'latency':'normal','temperature':.8,'top_p':.8}
req=urllib.request.Request('https://api.fish.audio/v1/tts',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json','model':'s2.1-pro-free','User-Agent':'TWK-Saturday-review/1.0'},method='POST')
try:
 with urllib.request.urlopen(req,timeout=120) as response:
  mime=response.headers.get('Content-Type','');audio=response.read()
except urllib.error.HTTPError as error:
 # No response body or URLs printed: never echo user-configured fields or auth values.
 (OUT/'failure.json').write_text(json.dumps({'stage':'Fish','http_status':error.code,'model':'s2.1-pro-free','fallback':False,'requests':1}))
 raise SystemExit('Free-model request failed with HTTP '+str(error.code)+'. Stopped. No fallback or retry.')
if not mime.startswith('audio/') or len(audio)<1000:raise RuntimeError('Response not a usable audio payload. Stopped.')
(OUT/'narration.mp3').write_bytes(audio)
# Use the existing alignment helper, without silent proportional timings.
sys.path.insert(0,'scripts');import voice as voice_helpers
words=voice_helpers.align_groq_whisper(OUT/'narration.mp3',groq)
if not words:raise RuntimeError('Word alignment unavailable. Audio retained, no timing substitute.')
(OUT/'words.json').write_text(json.dumps(words,indent=2))
(OUT/'manifest.json').write_text(json.dumps({'model':'s2.1-pro-free','route':'direct-fish-api','fallback':False,'requests':1,'scope':'Saturday-review-only','audio_bytes':len(audio),'script':TEXT,'voice_reference':'existing-saved-shorts-voice','alignment':'groq-whisper'},indent=2))
print('Saturday review narration and real word timings saved. No render, release or publication.')
