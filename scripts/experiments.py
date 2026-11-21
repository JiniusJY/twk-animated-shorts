#!/usr/bin/env python3
"""
Experiment record for published shorts.

Each published variant is logged with its hypothesis and outcomes; cohort
medians are computed over matched episodes (same hook style / length bucket)
so we compare like with like. This records and analyzes - it never posts
anything anywhere.

Usage:
  experiments.py log --slug SLUG --variant A --hypothesis "..." \
      [--metric views=1234] [--metric retention3s=0.61] ...
  experiments.py report [--hook-style paradox] [--json]
"""
import argparse
import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "src" / "episodes" / "experiments.json"


def load():
    if LOG.exists():
        return json.loads(LOG.read_text(encoding="utf-8"))
    return []


def save(rows):
    LOG.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")


def parse_metric(kv):
    k, _, v = kv.partition("=")
    try:
        return k, float(v)
    except ValueError:
        raise SystemExit(f"metric must be name=number, got {kv!r}")


def cohort_key(row):
    return (row.get("platform") or "?", row.get("hook_style") or "?", row.get("length_bucket") or "?")


def length_bucket(seconds):
    if seconds is None:
        return "?"
    return "<45s" if seconds < 45 else ("45-60s" if seconds <= 60 else ">60s")


def main():
    ap = argparse.ArgumentParser(description="Record and analyze short-form experiments")
    sub = ap.add_subparsers(dest="cmd", required=True)

    lg = sub.add_parser("log", help="Record one published variant")
    lg.add_argument("--slug", required=True)
    lg.add_argument("--variant", required=True, help="Variant label, e.g. A / captions-off / alt-hook")
    lg.add_argument("--hypothesis", required=True)
    lg.add_argument("--hook-style", default="paradox")
    lg.add_argument("--platform", default=None, help="tiktok | reels | shorts | other")
    lg.add_argument("--length-seconds", type=float, default=None)
    lg.add_argument("--metric", action="append", default=[], help="name=value, repeatable")
    lg.add_argument("--notes", default="")

    rp = sub.add_parser("report", help="Cohort medians across logged variants")
    rp.add_argument("--hook-style", default=None)
    rp.add_argument("--platform", default=None)
    rp.add_argument("--json", action="store_true")

    args = ap.parse_args()
    rows = load()

    if args.cmd == "log":
        row = {
            "slug": args.slug,
            "variant": args.variant,
            "hypothesis": args.hypothesis,
            "hook_style": args.hook_style,
            "platform": args.platform,
            "length_seconds": args.length_seconds,
            "length_bucket": length_bucket(args.length_seconds),
            "metrics": dict(parse_metric(m) for m in args.metric),
            "notes": args.notes,
            "logged_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        rows.append(row)
        save(rows)
        print(f"Logged {row['slug']} variant {row['variant']} ({len(rows)} total rows)")
        return

    if args.hook_style:
        rows = [r for r in rows if r.get("hook_style") == args.hook_style]
    if args.platform:
        rows = [r for r in rows if r.get("platform") == args.platform]
    if not rows:
        print("No experiment rows yet." if not args.json else "[]")
        return

    metric_names = sorted({m for r in rows for m in r.get("metrics", {})})
    cohorts = {}
    for r in rows:
        cohorts.setdefault(cohort_key(r), []).append(r)

    report = []
    for key, members in sorted(cohorts.items()):
        entry = {"cohort": {"platform": key[0], "hook_style": key[1], "length_bucket": key[2]}, "n": len(members)}
        for m in metric_names:
            vals = [r["metrics"][m] for r in members if m in r.get("metrics", {})]
            if vals:
                entry[f"median_{m}"] = round(statistics.median(vals), 4)
        report.append(entry)

    if args.json:
        print(json.dumps(report, indent=2))
        return
    for e in report:
        c = e["cohort"]
        meds = ", ".join(f"{k[7:]}={v}" for k, v in e.items() if k.startswith("median_"))
        print(f"cohort platform={c['platform']} hook={c['hook_style']} len={c['length_bucket']} n={e['n']}: {meds}")
    print("\nMatched-cohort medians only. Small n; treat as directional, never predictive.")


if __name__ == "__main__":
    main()
