"""Regression tests for directed free-only voice, real-word timing, and SFX."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import urllib.error
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import voice
from editorial import phrase_time
from audio_bed import sync_episode, build_sfx

class VoiceTests(unittest.TestCase):
    def test_free_only(self):
        seen=[]
        def fail(req,**kwargs):
            seen.append(req.get_header('Model'))
            raise urllib.error.HTTPError(req.full_url,402,'plan',{},None)
        with tempfile.TemporaryDirectory() as t, patch('urllib.request.urlopen',side_effect=fail):
            with self.assertRaises((RuntimeError,urllib.error.HTTPError)):
                voice.synth_fish_audio('Hi.',Path(t)/'a.mp3','not-a-key','test',{})
        self.assertEqual(seen,['s2.1-pro-free'])
    def test_direction_at_exact_phrase(self):
        out=voice.direct_script('A question. The answer.',{'direction':'curious','beats':[{'before':'The answer.','direction':'warm and confident'}]})
        self.assertEqual(out,'[curious] A question. [warm and confident] The answer.')
        self.assertEqual(voice.strip_cues(out),'A question. The answer.')
    def test_bad_anchor_stops_before_request(self):
        with self.assertRaises(ValueError): voice.direct_script('Yes. Yes.',{'beats':[{'before':'Yes.','direction':'curious'}]})
    def test_no_directions_spoken_by_edge(self):
        self.assertEqual(voice.normalize_cues('[warm and confident] Hello.', 'edge'),'Hello.')
    def test_model_policy_in_hash(self):
        a=voice.script_hash('Hi','voice',{},'align')
        with patch.object(voice,'MODEL_ORDER',('different',)):
            self.assertNotEqual(a,voice.script_hash('Hi','voice',{},'align'))

class TimingTests(unittest.TestCase):
    def setUp(self):
        self.ep={'durationFrames':300,'shots':[{'a':0,'b':150},{'a':150,'b':300,'anchor':'The answer'}], 'props':[{'keyframes':[{'f':150,'action':{'type':'counterValue','value':4,'dur':30}}]}], 'cues':[{'t':5,'kind':'relay'}]}
        self.words=[{'w':'The','s':8,'e':8.1},{'w':'answer.','s':8.1,'e':8.5}]
    def test_piecewise_sync_same_beat(self):
        ep,dur,_=sync_episode(copy.deepcopy(self.ep),30,12,self.words)
        self.assertEqual(ep['shots'][1]['a'],240)
        self.assertEqual(ep['props'][0]['keyframes'][0]['f'],240)
        self.assertEqual(ep['cues'][0]['t'],8)
        self.assertEqual(ep['props'][0]['keyframes'][0]['action']['dur'],42)
    def test_cta_duration_reserved_after_narration(self):
        ep=copy.deepcopy(self.ep);ep["endCard"]={"handle":"@techwhoknows","seconds":2}
        out,dur,_=sync_episode(ep,30,12,self.words)
        self.assertEqual(out["durationFrames"],510)
        self.assertAlmostEqual(dur,14.4 if False else 17.0)

    def test_missing_words_stop(self):
        with self.assertRaises(ValueError):sync_episode(copy.deepcopy(self.ep),30,12)
    def test_ambiguous_anchor_stops(self):
        with self.assertRaises(ValueError):phrase_time('The answer',self.words+self.words)
    def test_sfx_deterministic_stereo_finite(self):
        cues=[{'t':0.05,'kind':k,'gain':0.3,'pan':0.5} for k in ['riser','powerdown','startup','relay']]
        a=build_sfx(1.5,cues)
        np.testing.assert_array_equal(a,build_sfx(1.5,cues))
        self.assertTrue(np.isfinite(a).all())
        self.assertGreater(np.linalg.norm(a[1]),np.linalg.norm(a[0]))

if __name__=='__main__':unittest.main()
