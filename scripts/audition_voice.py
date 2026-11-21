#!/usr/bin/env python3
"""
Audition the episode hook across Fish Audio deliveries before committing to a full render.

Generates short (~10s) reads of the hook (first ~2 sentences of the script) in
several directions (default: curious / skeptical / payoff) using the S2 cue
syntax, so a human can pick the best delivery. Requires FISH_API_KEY +
FISH_VOICE_ID; use --dry-run to print the request payloads without calling.
"""
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import voice  # noqa: E402

DIRECTIONS = {
    "curious": "Genuinely curious, leaning in, light and quick.",
    "skeptical": "Skeptical, deadpan, slightly amused disbelief.",
    "payoff": "Confident storyteller delivering the punchline, warm smirk.",
}


def hook_text(script: str, seconds: float = 10.0, wps: float = 3.7) -> str:
    words = script.split()
    take = max(8, int(seconds * wps))
    return " ".join(words[:take])


def main():
    ap = argparse.ArgumentParser(description="Audition Fish Audio hook deliveries")
    ap.add_argument("--episode", required=True, help="Path to episode dir or episode.json")
    ap.add_argument("--directions", default="curious,skeptical,payoff")
    ap.add_argument("--out", default="out/auditions")
    ap.add_argument("--seconds", type=float, default=10.0)
    ap.add_argument("--dry-run", action="store_true", help="Print payloads, no API calls")
    args = ap.parse_args()

    ep_path = Path(args.episode)
    if ep_path.is_dir():
        ep_path = ep_path / "episode.json"
    ep = json.loads(ep_path.read_text(encoding="utf-8"))
    text = hook_text(ep["script"], args.seconds)
    voice_cfg = ep.get("voice", {})

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = []

    for name in [d.strip() for d in args.directions.split(",") if d.strip()]:
        direction = DIRECTIONS.get(name, name)
        cued = voice.apply_cues(text, direction=direction, model_family="s2")
        payload = {
            "model": voice_cfg.get("model", voice.MODEL_ORDER[0]),
            "direction": direction,
            "temperature": voice_cfg.get("temperature", 0.85),
            "top_p": voice_cfg.get("topP", 0.8),
            "text": cued,
        }
        if args.dry_run:
            print(f"--- {name} ---")
            print(json.dumps(payload, indent=2))
            manifest.append({"direction": name, "payload": payload})
            continue
        dest = out_dir / f"{ep_path.parent.name}-hook-{name}.mp3"
        try:
            voice.synthesize(cued, dest, {**voice_cfg, "direction": direction})
        except Exception as exc:
            print(f"[{name}] failed: {exc}", file=sys.stderr)
            continue
        manifest.append({"direction": name, "file": str(dest)})
        print(f"[{name}] -> {dest}")

    (out_dir / "audition_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Listen, pick a direction, then set voice.direction in episode.json.")


if __name__ == "__main__":
    main()
