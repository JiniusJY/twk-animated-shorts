"""One approved free-only full narration. No render, paid fallback or release."""
import json,os,sys,hashlib,urllib.request,zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import voice
root=Path('out/anc-narration');root.mkdir(parents=True,exist_ok=True)
ep=json.loads(Path('src/episodes/anc-commute/episode.json').read_text())
assert voice.MODEL_ORDER==('s2.1-pro-free',)
# Output is uploaded even if alignment fails, so failed-job retries can reuse it.
mp3=root/'narration.mp3'
if mp3.exists():
 old=json.loads((root/'manifest.json').read_text())
 assert old['script']==ep['script'] and old['voice']==ep['voice'],'Cached take does not match script/settings'
if not mp3.exists():
 provider,model=voice.synth_fish_audio(ep['script'],mp3,os.environ['FISH_API_KEY'],os.environ['FISH_VOICE_ID'],ep['voice'])
else:provider,model='fish-audio','s2.1-pro-free'
manifest={'provider':provider,'model':model,'script':ep['script'],'voice':ep['voice'],'developmentOnly':True,'audioSha256':hashlib.sha256(mp3.read_bytes()).hexdigest()}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
words=voice.align_groq_whisper(mp3,os.environ['GROQ_API_KEY'])
(root/'words.json').write_text(json.dumps(words,indent=2))
print('Full free-only narration and alignment retained')
