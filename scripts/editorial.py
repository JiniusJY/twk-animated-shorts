"""Word-anchored editorial timeline. No network, deterministic and fail-closed."""
import re
from bisect import bisect_right


def token(text):
    return re.sub(r"[^a-z0-9']", "", text.lower())


def phrase_time(phrase, words):
    want = [token(w) for w in phrase.split() if token(w)]
    have = [token(w['w']) for w in words]
    hits = [i for i in range(len(have)-len(want)+1) if have[i:i+len(want)] == want]
    if len(hits) != 1:
        raise ValueError(f'Editorial anchor must match once in aligned speech: {phrase!r} ({len(hits)} matches)')
    return float(words[hits[0]]['s'])


def narration_warp(ep, fps, dur, words):
    """Map authored shot starts to phrase onsets, keeping intra-shot action order."""
    authored = int(ep['durationFrames'])
    points = [(0, 0)]
    for shot in ep.get('shots', []):
        if shot.get('anchor') and shot['a'] > 0:
            points.append((shot['a'], round(phrase_time(shot['anchor'], words) * fps)))
    points.append((authored, round(dur * fps)))
    if any(b[0] <= a[0] or b[1] <= a[1] for a,b in zip(points, points[1:])):
        raise ValueError('Editorial anchors must be strictly increasing in source and speech')
    xs = [p[0] for p in points]
    def warp(f):
        i = min(len(points)-2, max(0, bisect_right(xs, f)-1))
        a,b = points[i],points[i+1]
        return round(a[1]+(f-a[0])*(b[1]-a[1])/(b[0]-a[0]))
    return warp, points
