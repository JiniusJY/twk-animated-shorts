import importlib.util,pathlib,unittest
p=pathlib.Path(__file__).resolve().parents[1]/'scripts/check_caption_cues.py';sp=importlib.util.spec_from_file_location('caption_check',p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
class FixedCueTests(unittest.TestCase):
 def test_valid(self):self.assertEqual(m.check([{'w':'one'},{'w':'two'}],[{'text':'one two','s':0,'e':1}]),1)
 def test_duplicate_rejected(self):
  with self.assertRaises(AssertionError):m.check([{'w':'one'}],[{'text':'one one','s':0,'e':1}])
 def test_overlap_rejected(self):
  with self.assertRaises(AssertionError):m.check([{'w':'one'},{'w':'two'}],[{'text':'one','s':0,'e':1},{'text':'two','s':.8,'e':1.5}])
 def test_flash_rejected(self):
  with self.assertRaises(AssertionError):m.check([{'w':'one'}],[{'text':'one','s':0,'e':.1}])
if __name__=='__main__':unittest.main()
