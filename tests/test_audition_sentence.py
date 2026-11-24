import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from audition_voice import hook_text
class HookSentenceTests(unittest.TestCase):
 def test_complete_sentence(self):
  self.assertEqual(hook_text("One two three four five six seven eight. Nine ten eleven twelve thirteen fourteen.",3),"One two three four five six seven eight.")
 def test_short_prefix_not_empty(self):
  self.assertTrue(hook_text("One two three four five six seven eight nine ten eleven",3))
