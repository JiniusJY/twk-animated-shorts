#!/usr/bin/env python3
"""Fail closed for missing destination-specific layout/disclosure review.
No flag is selected automatically. This checker never publishes or edits accounts.
"""
import json,sys,hashlib
from pathlib import Path
PLATFORMS={'youtube','instagram','tiktok'}
def check(doc,video=None):
 if video is not None:
  h=hashlib.sha256()
  with open(video,'rb') as f:
   for block in iter(lambda:f.read(1048576),b''):h.update(block)
  actual=h.hexdigest()
  assert doc.get('assetSha256')==actual,'Reviewed master hash does not match video'
 assert doc.get('assetSha256') and len(doc['assetSha256'])==64,'Exact reviewed master hash required'
 for p in doc.get('destinations',[]):
  assert p in PLATFORMS,'Unknown destination'
  r=doc.get('reviews',{}).get(p,{});assert r.get('layoutPixelReview') is True,(p,'Phone overlay pixel review missing')
  assert r.get('overlaySource') and r.get('overlayBasis') in {'observed-organic','official-ad-fallback'},(p,'Overlay provenance missing')
  assert all(r.get(k) is True for k in ('titles','allCaptionCues','keyVisuals','coverCrop')),(p,'Incomplete spatial review')
  assert r.get('disclosure') in {'not-required','required-owner-informed','owner-setting-preserved'},(p,'Per-asset disclosure decision missing')
  assert r.get('disclosureReason'),(p,'Missing asset-specific reason')
  if r['disclosure']=='required-owner-informed':assert r.get('ownerInformedBeforeRelease') is True,(p,'Required exception must be raised before release')
  assert r.get('optionalPublicCaveats') is False,(p,'No unasked optional caveats')
 assert doc.get('destinations'),'No destinations'
 return True
if __name__=='__main__':check(json.load(open(sys.argv[1])),sys.argv[2] if len(sys.argv)>2 else None);print('PASS release review')
