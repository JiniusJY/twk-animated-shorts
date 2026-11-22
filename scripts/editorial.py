"""Word-anchored editorial timeline. No network, deterministic and fail-closed."""
import re
from bisect import bisect_right


def token(text):
    return re.sub(r"[^a-z0-9']", "", text.lower())


_NUM = {'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11,
        'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
        'seventy': 70, 'eighty': 80, 'ninety': 90}
_MAG = {'hundred': 100, 'thousand': 1_000, 'million': 1_000_000, 'billion': 1_000_000_000}


def canon_tokens(tokens):
    """Canonicalize number phrases to digits so spoken 'twelve million' matches
    whisper's '12 million'. Scripts spell numbers for the TTS; whisper transcribes
    digits, and anchors must match either form."""
    out = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t.isdigit() or t in _NUM or t in _MAG:
            total, current, j, consumed = 0, 0, i, False
            while j < len(tokens):
                u = tokens[j]
                if u.isdigit():
                    current += int(u); consumed = True
                elif u in _NUM:
                    current += _NUM[u]; consumed = True
                elif u == 'hundred':
                    current = max(1, current) * 100; consumed = True
                elif u in ('thousand', 'million', 'billion'):
                    total += max(1, current) * _MAG[u]; current = 0; consumed = True
                else:
                    break
                j += 1
            if consumed:
                out.append(str(total + current))
                i = j
                continue
        out.append(t)
        i += 1
    return out


def phrase_time(phrase, words):
    want = canon_tokens([token(w) for w in phrase.split() if token(w)])
    have = canon_tokens([token(w['w']) for w in words])
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
