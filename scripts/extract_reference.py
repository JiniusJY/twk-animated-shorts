#!/usr/bin/env python3
"""Extract private local review evidence from a permitted video. No downloads or model calls."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

def extract(video, output, transcript=None, interval=2.0):
    video, output = Path(video).resolve(), Path(output)
    if not video.is_file():
        raise ValueError('Video file is missing')
    if interval < 0.5:
        raise ValueError('Sampling interval must be at least 0.5 seconds')
    output.mkdir(parents=True, exist_ok=False)
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(video)]))
    duration = float(probe['format']['duration'])
    # Retain exact sample timestamps. Frames are evidence to inspect, not an automated review.
    samples = []
    for i in range(min(240, int(duration / interval) + 1)):
        t = i * interval
        if t >= duration:
            break
        target = output / ('frame-%04d.jpg' % i)
        subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=540:-2','-y',str(target)],check=True)
        samples.append({'at_seconds':t,'path':str(target.resolve())})
    has_audio = any(s.get('codec_type') == 'audio' for s in probe['streams'])
    if has_audio:
        subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vn','-ac','1','-ar','16000','-y',str(output/'audio.wav')],check=True)
    report = {'video':str(video),'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'duration_seconds':duration,'metadata':probe,'frames':samples,'sample_interval_seconds':interval,'audio_extracted':has_audio,'audio_reviewed':False,'motion_reviewed':False,'limit':'Sampled frames require actual visual inspection. Audio extraction is not hearing. No automatic transcription or AI ranking is performed.'}
    if transcript:
        source = Path(transcript)
        report['transcript'] = {'source':str(source.resolve()),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'limit':'Supplied text, not verified against audio by this extractor.'}
        (output/'supplied-transcript.txt').write_bytes(source.read_bytes())
    (output/'evidence.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--video',required=True);p.add_argument('--output',required=True)
    p.add_argument('--transcript');p.add_argument('--interval',type=float,default=2.0)
    a=p.parse_args()
    print(json.dumps(extract(a.video,a.output,a.transcript,a.interval),indent=2))

if __name__=='__main__':main()
