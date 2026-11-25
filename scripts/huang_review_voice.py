import json,os,pathlib,sys,urllib.request
OUT=pathlib.Path('out/huang-review-voice');OUT.mkdir(parents=True,exist_ok=True)
TEXT=pathlib.Path('scripts/huang_script.txt').read_text()
# Existing free-only model and saved shorts voice, no paid fallback or relays.
TEXT=TEXT.replace('November twelfth:', '[emphatic] November twelfth:').replace('November seventeenth:', '[emphatic] November seventeenth:').replace('November twenty-third:', '[excited] November twenty-third:').replace("But Nvidia's independent investigation continued.", "[serious] But Nvidia's independent investigation continued.").replace("Sam Altman", "[animated] Sam Altman",1).replace('Steve Jobs took', '[animated] Steve Jobs took',1).replace('The real test comes', '[serious] The real test comes').replace('Follow TechWhoKnows', '[upbeat] Follow TechWhoKnows')
payload={'text':'[Energetic, animated, brisk conversational delivery.] '+TEXT,'reference_id':os.environ['FISH_VOICE_ID'].strip(),'format':'mp3','mp3_bitrate':192,'latency':'normal','temperature':.9,'top_p':.8}
req=urllib.request.Request('https://api.fish.audio/v1/tts',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+os.environ['FISH_API_KEY'].strip(),'Content-Type':'application/json','model':'s2.1-pro-free'},method='POST')
with urllib.request.urlopen(req,timeout=120) as r:
 assert r.headers.get('Content-Type','').startswith('audio/')
 (OUT/'narration.mp3').write_bytes(r.read())
sys.path.insert(0,'scripts');import voice
words=voice.align_groq_whisper(OUT/'narration.mp3',os.environ['GROQ_API_KEY'].strip())
assert words
(OUT/'words.json').write_text(json.dumps(words,indent=2))
(OUT/'manifest.json').write_text(json.dumps({'model':'s2.1-pro-free','route':'direct-fish','requests':1,'fallback':False,'alignment':'groq-whisper','script':TEXT},indent=2))
print('Huang review narration and alignment saved. No release or publication.')
