import unittest,sys,pathlib,copy
sys.path.insert(0,str(pathlib.Path(__file__).parents[1]/'scripts'))
from check_release_review import check
class Review(unittest.TestCase):
 def good(self):return {'assetSha256':'a'*64,'destinations':['instagram'],'reviews':{'instagram':{'layoutPixelReview':True,'overlaySource':'fixture','overlayBasis':'official-ad-fallback','titles':True,'allCaptionCues':True,'keyVisuals':True,'coverCrop':True,'disclosure':'not-required','disclosureReason':'nonrealistic drawing and recorded human narration','optionalPublicCaveats':False}}}
 def test_complete(self):self.assertTrue(check(self.good()))
 def test_no_blanket_default(self):
  x=self.good();del x['reviews']['instagram']['disclosure']
  with self.assertRaises(AssertionError):check(x)
 def test_required_before_release(self):
  x=self.good();x['reviews']['instagram']['disclosure']='required-owner-informed'
  with self.assertRaises(AssertionError):check(x)
 def test_no_unreviewed_layout(self):
  x=self.good();x['reviews']['instagram']['allCaptionCues']=False
  with self.assertRaises(AssertionError):check(x)
 def test_separate_destinations(self):
  x=self.good();x['destinations'].append('tiktok')
  with self.assertRaises(AssertionError):check(x)

 def test_nonboolean_review_rejected(self):
  x=self.good();x['reviews']['instagram']['titles']='false'
  with self.assertRaises(AssertionError):check(x)
 def test_changed_video_rejected(self):
  import tempfile
  with tempfile.NamedTemporaryFile() as f:
   f.write(b'changed');f.flush()
   with self.assertRaises(AssertionError):check(self.good(),f.name)
