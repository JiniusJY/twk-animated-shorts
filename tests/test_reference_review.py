import copy
import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from reference_review import validate_research
from new_episode import build_episode

def research_fixture():
    # Synthetic contract fixture, never production evidence or a real reviewed clip.
    return {'stage':'before_concept','discovery_notes':'TEST ONLY: synthetic discovery fixture', 'references':[{'id':'test','url':'https://example.com/synthetic-test','creator':'fixture','platform':'test','checked_at':'2026-11-24T00:00:00Z','access_notes':'Synthetic fixture, not an actual review','extraction':{k:{'status':'available','evidence':'TEST ONLY synthetic artifact'} for k in ('video','metadata','transcript','audio')},'coverage':'motion_review','audio':'not_heard','duration_seconds':10,'review_method':'TEST ONLY','observations':[{'at_seconds':0,'observed':'Synthetic opening'},{'at_seconds':8,'observed':'Synthetic payoff'}],'scores':{d:{'value':3,'reason':'Synthetic test reason'} for d in ('hook','pacing','visuals','platform_fit')}}], 'selected_lessons':[{'reference_id':'test','lesson':'fixture','application':'fixture','do_not_copy':'fixture'}]}

class ReferenceTests(unittest.TestCase):
    def test_extraction_evidence_required(self):
        p=research_fixture();del p['references'][0]['extraction']
        with self.assertRaises(ValueError):validate_research(p)
    def test_inaccessible_video_cannot_count_as_watched(self):
        p=research_fixture();p['references'][0]['extraction']['video']['status']='unavailable'
        with self.assertRaises(ValueError):validate_research(p)
    def test_sampled_sequence_is_useful_with_pacing_unknown(self):
        p=research_fixture();p['references'][0]['coverage']='sampled_sequence';p['references'][0]['scores']['pacing']={'value':None,'reason':'Motion not inspected'}
        self.assertEqual(len(validate_research(p)[0]['assessed_dimensions']),3)
    def test_sampled_sequence_cannot_claim_pacing(self):
        p=research_fixture();p['references'][0]['coverage']='sampled_sequence'
        with self.assertRaises(ValueError):validate_research(p)
    def test_rank(self):
        self.assertEqual(validate_research(research_fixture())[0]['usefulness_score'],3)
    def test_new_episode_fails_without_research(self):
        p={'slug':'t','title':'T','script':'T','sourceUrl':'https://example.com','durationFrames':300,'shots':[],'claim_ledger':[{'id':'x'}],'topic_card':{},'creative_brief':{}}
        with self.assertRaisesRegex(ValueError,'Reference research'):build_episode(p)
    def test_metadata_cannot_masquerade_as_video_review(self):
        p=research_fixture();p['references'][0]['coverage']='metadata_only'
        with self.assertRaises(ValueError):validate_research(p)
    def test_stills_not_motion(self):
        p=research_fixture();p['references'][0]['coverage']='sampled_frames';del p['references'][0]['scores']
        with self.assertRaises(ValueError):validate_research(p)
    def test_audio_status_required(self):
        p=research_fixture();del p['references'][0]['audio']
        with self.assertRaises(ValueError):validate_research(p)
    def test_lesson_must_use_reviewed_reference(self):
        p=research_fixture();p['selected_lessons'][0]['reference_id']='missing'
        with self.assertRaises(ValueError):validate_research(p)
    def test_timestamp_outside_clip(self):
        p=research_fixture();p['references'][0]['observations'][1]['at_seconds']=11
        with self.assertRaises(ValueError):validate_research(p)
    def test_baseline_needs_evidence(self):
        p=research_fixture();p['references'][0]['creator_baseline']={'ratio':10}
        with self.assertRaises(ValueError):validate_research(p)
    def test_duplicates_rejected(self):
        p=research_fixture();p['references'].append(copy.deepcopy(p['references'][0]))
        with self.assertRaises(ValueError):validate_research(p)

if __name__=='__main__':unittest.main()
