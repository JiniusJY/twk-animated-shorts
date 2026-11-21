#!/usr/bin/env python3
"""Create a new editorial episode from a researched, authored plan. No API calls."""
import argparse
import json
from pathlib import Path
import re

GRAPHICS = {'hook','lab','stakes','question','clock','storage','counter','odometer','overflow','power','directive','payoff','reset'}
REQUIRED = {'slug','title','script','sourceUrl','durationFrames','shots','claim_ledger','topic_card','creative_brief'}

def build_episode(plan):
    missing = REQUIRED - plan.keys()
    if missing: raise ValueError('Missing authored plan fields: '+', '.join(sorted(missing)))
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}',plan['slug']):raise ValueError('Invalid slug')
    if not plan['claim_ledger']:raise ValueError('A sourced claim ledger is required')
    for i,s in enumerate(plan['shots']):
        if s.get('graphic') not in GRAPHICS:raise ValueError(f'Shot {i}: implement and register the required editorial rig before creation')
        if not s.get('purpose'):raise ValueError(f'Shot {i}: missing editorial purpose')
        if i and not s.get('anchor'):raise ValueError(f'Shot {i}: missing narration anchor')
    out={'fps':30,'world':'office','musicMood':'mystery','actors':[],'props':[],'fx':[],'cues':[],**plan}
    out['endCard']={'handle':'@techwhoknows','seconds':3.2,**plan.get('endCard',{})}
    out['captions']={'enabled':True,'maxWordsPerPage':4,'theme':'editorial',**plan.get('captions',{})}
    out['voice']={'temperature':0.8,'topP':0.8,'speed':1.0,'direction':'curious and conversational','beats':[],**plan.get('voice',{})}
    return out

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--plan',required=True);a=p.parse_args()
    ep=build_episode(json.loads(Path(a.plan).read_text()))
    dest=Path(__file__).resolve().parents[1]/'src'/'episodes'/ep['slug']/'episode.json'
    if dest.exists():raise SystemExit('Refusing to overwrite an existing episode')
    dest.parent.mkdir(parents=True)
    dest.write_text(json.dumps(ep,indent=2)+'\n')
    print(f'Created {dest}. Validate, register, and review before rendering.')
if __name__=='__main__':main()
