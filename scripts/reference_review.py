#!/usr/bin/env python3
"""Validate authored video-reference evidence and rank usefulness. No network or AI calls."""
import argparse
import json
import math
from urllib.parse import urlparse
from pathlib import Path

DIMENSIONS = ('hook', 'pacing', 'visuals', 'platform_fit')

def validate_research(report):
    def need(ok, message):
        if not ok:
            raise ValueError('Reference research: ' + message)
    need(isinstance(report, dict), 'record required before concept/storyboard creation')
    need(report.get('stage') == 'before_concept', 'stage must be before_concept')
    need(bool(report.get('discovery_notes')), 'record queries, sources, dates and access limits')
    refs = report.get('references', [])
    need(isinstance(refs, list) and bool(refs), 'discover candidate videos')
    ids, urls, eligible = set(), set(), {}
    for ref in refs:
        rid, url = ref.get('id'), ref.get('url', '')
        need(isinstance(rid, str) and rid and rid not in ids, 'unique reference id required')
        need(urlparse(url).scheme == 'https' and bool(urlparse(url).netloc), rid + ': native HTTPS source URL required')
        need(url not in urls, rid + ': duplicate URL')
        ids.add(rid); urls.add(url)
        need(all(isinstance(ref.get(k), str) and ref[k].strip() for k in ('creator', 'platform', 'checked_at', 'access_notes')), rid + ': provenance/access fields missing')
        extraction = ref.get('extraction', {})
        for kind in ('video', 'metadata', 'transcript', 'audio'):
            item = extraction.get(kind, {})
            need(item.get('status') in ('available', 'unavailable', 'not_attempted') and bool(item.get('evidence')), rid + ': extraction status/evidence required for ' + kind)
        coverage = ref.get('coverage')
        need(coverage in ('metadata_only', 'sampled_frames', 'sampled_sequence', 'motion_review'), rid + ': invalid coverage')
        need(ref.get('audio') in ('heard', 'not_heard', 'unavailable'), rid + ': declare audio access')
        if coverage not in ('motion_review', 'sampled_sequence'):
            need('scores' not in ref, rid + ': metadata/stills cannot receive a video-craft ranking')
            continue
        need(extraction['video']['status'] == 'available', rid + ': sequence review needs accessible video evidence')
        duration = ref.get('duration_seconds')
        need(isinstance(duration, (int, float)) and not isinstance(duration, bool) and math.isfinite(duration) and duration > 0, rid + ': verified duration required')
        observations = ref.get('observations', [])
        need(len(observations) >= 2, rid + ': timestamped hook and later beat observations required')
        times = []
        for obs in observations:
            t = obs.get('at_seconds')
            need(isinstance(t, (int, float)) and not isinstance(t, bool) and math.isfinite(t) and 0 <= t < duration and bool(obs.get('observed')), rid + ': invalid observation')
            times.append(t)
        need(min(times) <= min(3, duration / 2) and max(times) > min(times), rid + ': cover opening and a later beat')
        need(bool(ref.get('review_method')), rid + ': explain actual sequence review method and extent')
        scores = ref.get('scores', {})
        for dimension in DIMENSIONS:
            score = scores.get(dimension, {})
            value = score.get('value')
            need(bool(score.get('reason')), rid + ': explain assessed or unassessed ' + dimension)
            need(value is None or (isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 5), rid + ': invalid score')
            if coverage == 'sampled_sequence' and dimension == 'pacing':
                need(value is None, rid + ': sampled frames do not establish motion pacing')
        need(any(scores[d]['value'] is not None for d in DIMENSIONS), rid + ': assess at least one supported dimension')
        baseline = ref.get('creator_baseline')
        if baseline:
            need(bool(baseline.get('comparable_evidence')) and bool(baseline.get('limitations')), rid + ': baseline needs comparable evidence and limits')
        eligible[rid] = ref
    need(bool(eligible), 'at least one actually reviewed video sequence is required; report access blockers instead of inventing review')
    selected = report.get('selected_lessons', [])
    need(isinstance(selected, list) and bool(selected), 'map selected lessons into concept/storyboard')
    for lesson in selected:
        need(lesson.get('reference_id') in eligible and all(bool(lesson.get(k)) for k in ('lesson', 'application', 'do_not_copy')), 'selected lesson needs sequence-reviewed reference, application and copying boundary')
    return sorted(({'id': rid, 'usefulness_score': round(sum(ref['scores'][d]['value'] for d in DIMENSIONS if ref['scores'][d]['value'] is not None) / sum(ref['scores'][d]['value'] is not None for d in DIMENSIONS), 2), 'assessed_dimensions': [d for d in DIMENSIONS if ref['scores'][d]['value'] is not None], 'url': ref['url']} for rid, ref in eligible.items()), key=lambda row: (-row['usefulness_score'], row['id']))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps({'ranked_references': validate_research(json.loads(Path(args.report).read_text())), 'limit': 'Mean of assessed editorial dimensions; compare coverage before comparing scores. Not predicted views or proof of full playback.'}, indent=2))
    except (ValueError, KeyError, TypeError) as exc:
        raise SystemExit(str(exc))

if __name__ == '__main__':
    main()
