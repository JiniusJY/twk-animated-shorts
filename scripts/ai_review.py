#!/usr/bin/env python3
"""Advisory AI video review of a rendered cut against the CONTENT_SYSTEM release gate.

Uses Gemini video understanding (default: gemini-4-hydrogen, free tier) to watch the
cut and return a structured verdict. ADVISORY ONLY: a human/agent frame review still
owns the pass/fail decision; this flags beats and timestamps to inspect.

Usage:
  GEMINI_API_KEY_FILE=/path/to/key python3 scripts/ai_review.py --video out/final.mp4 \
      [--model gemini-4-hydrogen] [--out out/ai_review.json]

Free-tier note: content sent to the free tier may be used by Google for training.
Fine for publication-bound cuts; never send private material.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"
UPLOAD = "https://generativelanguage.googleapis.com/upload/v1beta"

RUBRIC = """You are reviewing a vertical 9:16 animated tech-news short before publication.
Judge it as a viewer with a skip thumb, against this release rubric:
1. HOOK: the first 2.5s must land a visual event or an arresting claim. Weak/open-ended = fail.
2. PACING: top tech creators run 25-30 shots per 60-70s. Flag any shot that overstays, sags, or repeats information.
3. CAPTIONS: karaoke-style captions must track the voice (words highlighted as spoken, 1-4 words per group, no lag). Flag lag, wrong words, or unreadable placement.
4. TRANSITIONS: hard cuts by default; whip/dissolve only where motivated. Flag any jarring or screensaver-feeling move.
5. ENERGY ARC: the narration should build, with hush beats and emphatic beats - not a monotone metronome. Flag flat stretches with timestamps.
6. ALIVENESS: no frozen frames; static scenes must still breathe. Flag any segment that looks frozen or dead.
7. THE SKIP TEST: name EVERY timestamp range where a viewer would be inclined to skip, and why. "Inclined to skip" is a fail for that beat.

Return ONLY compact JSON (no whitespace, no markdown fence) with this shape:
{"overall_score": 0-100, "pass": true/false, "hook_verdict": "...", "skip_risk": [{"start_s": 0.0, "end_s": 0.0, "reason": "..."}], "caption_issues": [{"at_s": 0.0, "issue": "..."}], "energy_flat_spans": [{"start_s": 0.0, "end_s": 0.0}], "frozen_look_spans": [{"start_s": 0.0, "end_s": 0.0}], "top_fixes": ["..."]}"""


def post_json(url, payload, retries=4):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            body = e.read()[:200]
            last = f"HTTP {e.code}: {body}"
            if e.code in (429, 500, 502, 503, 504):
                wait = 20 * (attempt + 1)
                print(f"attempt {attempt+1} got {e.code}, retrying in {wait}s...", flush=True)
                time.sleep(wait)
                continue
            raise RuntimeError(last)
    raise RuntimeError(f"generateContent failed after {retries} attempts: {last}")


def upload_file(key, path, mime):
    size = os.path.getsize(path)
    start = urllib.request.Request(
        f"{UPLOAD}/files?key={key}",
        data=b"",
        headers={
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": str(size),
            "X-Goog-Upload-Header-Content-Type": mime,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(start, timeout=120) as r:
        upload_url = r.headers["X-Goog-Upload-URL"]
    with open(path, "rb") as fh:
        data = fh.read()
    up = urllib.request.Request(
        upload_url,
        data=data,
        headers={"X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0", "Content-Type": mime},
        method="POST",
    )
    with urllib.request.urlopen(up, timeout=600) as r:
        return json.loads(r.read())["file"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--model", default="gemini-4-hydrogen")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    key_file = os.environ.get("GEMINI_API_KEY_FILE", "")
    key = open(key_file).read().strip() if key_file else os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("no Gemini key: set GEMINI_API_KEY_FILE or GEMINI_API_KEY")

    size = os.path.getsize(args.video)
    if size > 19_000_000:
        print(f"uploading {size/1e6:.1f} MB via Files API...", flush=True)
        f = upload_file(key, args.video, "video/mp4")
        uri, name = f["uri"], f["name"]
        for _ in range(60):
            with urllib.request.urlopen(f"{API}/{name}?key={key}", timeout=60) as r:
                state = json.loads(r.read()).get("state")
            if state == "ACTIVE":
                break
            time.sleep(5)
        else:
            sys.exit("file never became ACTIVE")
        part = {"file_data": {"mime_type": "video/mp4", "file_uri": uri}}
    else:
        part = {"inline_data": {"mime_type": "video/mp4", "data": base64.b64encode(open(args.video, "rb").read()).decode()}}

    payload = {
        "contents": [{"parts": [part, {"text": RUBRIC}]}],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.2, "maxOutputTokens": 8192},
    }
    print(f"reviewing with {args.model}...", flush=True)
    resp = post_json(f"{API}/models/{args.model}:generateContent?key={key}", payload)
    cand = resp["candidates"][0]
    text = cand["content"]["parts"][0]["text"]
    if cand.get("finishReason") == "MAX_TOKENS":
        raise RuntimeError("model output truncated at maxOutputTokens")
    usage = resp.get("usageMetadata", {})
    print(f"tokens: prompt={usage.get('promptTokenCount')} out={usage.get('candidatesTokenCount')}", flush=True)
    verdict = json.loads(text)
    out = args.out or args.video + ".ai_review.json"
    with open(out, "w") as fh:
        json.dump({"model": args.model, "usage": usage, "verdict": verdict}, fh, indent=2)
    print(json.dumps(verdict, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
