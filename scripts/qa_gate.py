#!/usr/bin/env python3
"""
Publish-blocking QA gate for a rendered short.

Checks (any failure exits 1 and blocks the release):
  - integrated loudness within target +/- tolerance (default -15 LUFS +/- 1.5)
  - true peak <= ceiling (default -1.0 dBTP)
  - duration within expected +/- 1.5s when --expected-seconds given
  - no black segment longer than --max-black seconds (default 0.6)
  - no frozen segment longer than --max-freeze seconds (default 2.0)

Requires ffmpeg + ffprobe on PATH.
"""
import argparse
import json
import re
import subprocess
import sys


def run(cmd):
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode, res.stdout + res.stderr


def loudness_stats(path):
    rc, out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path,
                   "-af", "ebur128=peak=true", "-f", "null", "-"])
    if rc != 0:
        raise RuntimeError(f"ffmpeg ebur128 failed: {out[-800:]}")
    summary = out.split("Summary:")[-1]
    def grab(pattern, cast=float):
        m = re.search(pattern, summary)
        return cast(m.group(1)) if m else None
    return {
        "integrated_lufs": grab(r"I:\s*(-?[\d.]+)\s*LUFS"),
        "true_peak_dbtp": grab(r"Peak:\s*(-?[\d.]+)\s*dBFS"),
    }


def duration_seconds(path):
    rc, out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                   "-of", "json", path])
    if rc != 0:
        raise RuntimeError(f"ffprobe failed: {out[-400:]}")
    return float(json.loads(out)["format"]["duration"])


def detect_segments(path, kind, thresh):
    if kind == "black":
        vf = f"blackdetect=d=0.1:pix_th=0.10"
        key = "blackdetect"
        pat = r"black_start:([\d.]+) black_end:([\d.]+)"
    else:
        vf = f"freezedetect=n=0.003:d=0.5"
        key = "freezedetect"
        pat = r"freeze_start: ([\d.]+).*?freeze_end: ([\d.]+)"
    rc, out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path,
                   "-vf", vf, "-an", "-f", "null", "-"])
    if rc != 0:
        raise RuntimeError(f"ffmpeg {kind}detect failed: {out[-800:]}")
    segs = [(float(a), float(b)) for a, b in re.findall(pat, out.replace("\n", " "))]
    return [s for s in segs if s[1] - s[0] > thresh]


def main():
    ap = argparse.ArgumentParser(description="Publish-blocking QA gate for rendered shorts")
    ap.add_argument("--video", required=True)
    ap.add_argument("--expected-seconds", type=float, default=None)
    ap.add_argument("--loudness-target", type=float, default=-15.0)
    ap.add_argument("--loudness-tolerance", type=float, default=1.5)
    ap.add_argument("--peak-ceiling", type=float, default=-1.0)
    ap.add_argument("--max-black", type=float, default=0.6)
    ap.add_argument("--max-freeze", type=float, default=2.0)
    ap.add_argument("--metrics-out", default=None)
    args = ap.parse_args()

    failures, metrics = [], {"video": args.video}

    try:
        stats = loudness_stats(args.video)
        metrics.update(stats)
        if stats["integrated_lufs"] is None:
            failures.append("loudness: could not measure integrated LUFS")
        elif abs(stats["integrated_lufs"] - args.loudness_target) > args.loudness_tolerance:
            failures.append(
                f"loudness {stats['integrated_lufs']} LUFS outside "
                f"{args.loudness_target} +/- {args.loudness_tolerance}")
        if stats["true_peak_dbtp"] is not None and stats["true_peak_dbtp"] > args.peak_ceiling:
            failures.append(f"true peak {stats['true_peak_dbtp']} dBTP above ceiling {args.peak_ceiling}")
    except Exception as exc:
        failures.append(str(exc))

    try:
        dur = duration_seconds(args.video)
        metrics["duration_s"] = dur
        if args.expected_seconds is not None and abs(dur - args.expected_seconds) > 1.5:
            failures.append(f"duration {dur:.2f}s vs expected {args.expected_seconds:.2f}s")
    except Exception as exc:
        failures.append(str(exc))

    for kind, thresh in (("black", args.max_black), ("freeze", args.max_freeze)):
        try:
            segs = detect_segments(args.video, kind, thresh)
            metrics[f"{kind}_segments"] = segs
            for a, b in segs:
                failures.append(f"{kind} segment {b - a:.2f}s at {a:.2f}-{b:.2f}s (max {thresh}s)")
        except Exception as exc:
            failures.append(str(exc))

    if args.metrics_out:
        with open(args.metrics_out, "w", encoding="utf-8") as fh:
            json.dump({"ok": not failures, "metrics": metrics, "failures": failures}, fh, indent=2)

    if failures:
        print("QA GATE FAILED:", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)
    print(f"QA gate passed: {metrics.get('integrated_lufs')} LUFS, "
          f"{metrics.get('true_peak_dbtp')} dBTP, {metrics.get('duration_s')}s")


if __name__ == "__main__":
    main()
