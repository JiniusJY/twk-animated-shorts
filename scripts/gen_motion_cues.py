#!/usr/bin/env python3
"""
Generate motion-mapped SFX cues for an episode.

Hand-authored cue lists drift out of sync with the graphics and are too
sparse to carry the edit. This generator reads the shot timeline plus the
motion events each ncic-* graphic actually animates (staggered pops, slams,
alarms, reveals) and emits a dense, deterministic cue list so every visible
beat has a sound. Cue times are authored seconds (frames/fps); audio_bed.py
warps them with the same narration map as the shots, so they stay glued to
their visual beats.

Usage: python3 scripts/gen_motion_cues.py --episode src/episodes/<slug>
"""
import argparse
import json
from pathlib import Path


def cues_for(shot: dict, fps: int) -> list[dict]:
    g = shot.get("graphic", "")
    a, b = shot["a"], shot["b"]
    span = max(1, b - a)
    out: list[dict] = []

    def at(off_frames: float) -> float:
        return round((a + off_frames) / fps, 3)

    # Punch-in transition on every graphic shot (first shots included):
    # the camera rig punches in over 7 frames at each cut.
    if g:
        out.append({"t": at(1), "kind": "punch", "gain": 0.26})

    if g == "ncic-hook":
        out.append({"t": at(span * 0.5), "kind": "thud", "gain": 0.5})
    elif g == "ncic-stop":
        out.append({"t": at(span * 0.1), "kind": "relay", "gain": 0.35})
        out.append({"t": at(span * 0.55), "kind": "relay", "gain": 0.3})
        out.append({"t": at(span * 0.87), "kind": "chime", "gain": 0.22})
    elif g == "ncic-id":
        out.append({"t": at(span * 0.08), "kind": "whoosh", "gain": 0.22})
        out.append({"t": at(span * 0.42), "kind": "whoosh", "gain": 0.22})
        out.append({"t": at(span * 0.72), "kind": "pop", "gain": 0.2})
    elif g == "ncic-files":
        for i in range(0, 21, 3):  # every 3rd drawer pop: a rolling clack run
            out.append({"t": at(i * 3), "kind": "clack", "gain": 0.10, "pan": -0.2 + 0.4 * ((i // 3) % 2)})
    elif g == "ncic-records":
        for i in range(10):  # drum tiles, staggered
            out.append({"t": at(4 + i * 2), "kind": "clack", "gain": 0.09})
        out.append({"t": at(span * 0.75), "kind": "chime", "gain": 0.18})
    elif g == "ncic-clock":
        out.append({"t": at(8), "kind": "chime", "gain": 0.2})
        step = max(10, span // 8)
        for off in range(step, span - 4, step):  # quiet sweep ticks
            out.append({"t": at(off), "kind": "tick", "gain": 0.07})
    elif g == "ncic-doors":
        for i in range(3):  # the three hot doors spring open
            out.append({"t": at(span * (0.3 + i * 0.12)), "kind": "snap", "gain": 0.16})
        out.append({"t": at(span * 0.8), "kind": "riser", "gain": 0.22})
    elif g == "ncic-breach":
        out.append({"t": at(span * 0.55), "kind": "snap", "gain": 0.3})
        out.append({"t": at(span * 0.62), "kind": "alarm", "gain": 0.4})
        for i in range(3):  # WHO / HOW / WHAT cards
            out.append({"t": at(span * (0.62 + i * 0.08) + 2), "kind": "pop", "gain": 0.18})
    elif g == "ncic-pattern":
        out.append({"t": at(6), "kind": "pop", "gain": 0.2, "pan": -0.2})
        out.append({"t": at(14), "kind": "pop", "gain": 0.22, "pan": 0.2})
        out.append({"t": at(span * 0.5), "kind": "whoosh", "gain": 0.2})
        out.append({"t": at(span * 0.55), "kind": "chime", "gain": 0.18})
    elif g == "ncic-payoff":
        out.append({"t": at(2), "kind": "thud", "gain": 0.3})
        out.append({"t": at(span * 0.45), "kind": "flash", "gain": 0.2})

    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", required=True)
    ap.add_argument("--keep", action="append", default=[],
                    help="cue kind to preserve from the hand-authored list (repeatable)")
    args = ap.parse_args()

    ep_dir = Path(args.episode)
    ep_path = ep_dir / "episode.json"
    ep = json.loads(ep_path.read_text(encoding="utf-8"))
    fps = int(ep["fps"])
    dur_s = ep["durationFrames"] / fps

    cues: list[dict] = [c for c in ep.get("cues", []) if c.get("kind") in args.keep]
    for shot in ep.get("shots", []):
        cues.extend(cues_for(shot, fps))

    cues = [c for c in cues if 0 <= float(c["t"]) <= dur_s]
    cues.sort(key=lambda c: float(c["t"]))
    ep["cues"] = cues
    ep_path.write_text(json.dumps(ep, indent=1) + "\n", encoding="utf-8")
    kinds = {}
    for c in cues:
        kinds[c["kind"]] = kinds.get(c["kind"], 0) + 1
    print(f"wrote {len(cues)} cues: {kinds}")


if __name__ == "__main__":
    main()
