#!/usr/bin/env python3
"""Final approval preflight, never publishes. Render-only qa_gate remains separate."""
import argparse,json,subprocess,sys
from check_release_review import check
p=argparse.ArgumentParser()
p.add_argument('--video',required=True)
p.add_argument('--review',required=True)
p.add_argument('--expected-seconds',type=float,required=True)
a=p.parse_args()
check(json.load(open(a.review)),a.video)
subprocess.run([sys.executable,__file__.replace('release_gate.py','qa_gate.py'),'--video',a.video,'--expected-seconds',str(a.expected_seconds)],check=True)
print('PASS final preflight. Publishing still requires owner authority.')
