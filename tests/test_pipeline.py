#!/usr/bin/env python3
"""Python pipeline tests: shard coverage and episode/audio sync. Run: python3 tests/test_pipeline.py"""
import copy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from make_shards import compute_shards  # noqa: E402
from audio_bed import sync_episode  # noqa: E402


def check(name, cond):
    if not cond:
        print(f"FAIL: {name}")
        sys.exit(1)
    print(f"ok: {name}")


# --- compute_shards covers [0, total) exactly once ---
for total, n in [(1372, 15), (1372, 16), (100, 3), (1, 5), (47, 47), (1372, 1), (10, 100)]:
    shards = compute_shards(total, n)
    covered = []
    for sh in shards:
        a, b = sh["a"], sh["b"]
        check(f"shard range sane ({total},{n}): {a}-{b}", 0 <= a <= b < total)
        covered.extend(range(a, b + 1))
    check(f"no gaps/overlaps ({total},{n})", covered == list(range(total)))

try:
    compute_shards(0, 3)
    check("rejects zero frames", False)
except ValueError:
    check("rejects zero frames", True)

# --- sync_episode scales cues by the SAME factor as frames (the sync bug) ---
ep = {
    "durationFrames": 1386,
    "shots": [{"a": 0, "b": 200, "flashAt": 150, "kickAt": [50, 100]}],
    "actors": [{"keyframes": [{"f": 30}, {"f": 300}]}],
    "props": [{"keyframes": [{"f": 60, "action": {"type": "counterValue", "value": 5, "dur": 10}}]}],
    "fx": [{"a": 90, "b": 120}],
    "cues": [{"t": 3.0, "type": "thud"}, {"t": 15.4, "type": "riser"}],
}
out, dur, scale = sync_episode(copy.deepcopy(ep), fps=30, voice_dur=46.2)
expected_frames = round(max(15.0, 46.2 + 0.4) * 30)
expected_scale = expected_frames / 1386
check("duration floor + 0.4s pad", abs(dur - 46.6) < 1e-9)
check("scale = synced/authored frames", abs(scale - expected_scale) < 1e-9)
check("last shot b pins to synced frame count", out["shots"][0]["b"] == expected_frames)
check("shot flash/kick scale", out["shots"][0]["flashAt"] == round(150 * expected_scale)
      and out["shots"][0]["kickAt"] == [round(50 * expected_scale), round(100 * expected_scale)])
check("actor keyframes scale", out["actors"][0]["keyframes"][1]["f"] == round(300 * expected_scale))
check("fx scale", out["fx"][0]["a"] == round(90 * expected_scale))
check(
    "cues scale by the SAME factor (sync fix)",
    abs(out["cues"][0]["t"] - 3.0 * expected_scale) < 1e-3
    and abs(out["cues"][1]["t"] - 15.4 * expected_scale) < 1e-3,
)
check(
    "prop action dur scales with its keyframe",
    out["props"][0]["keyframes"][0]["action"]["dur"] == max(1, round(10 * expected_scale)),
)

# long voice still respects the 15s floor
out2, dur2, _ = sync_episode(copy.deepcopy(ep), fps=30, voice_dur=5.0)
check("15s minimum duration", abs(dur2 - 15.0) < 1e-9)

print("\nAll python pipeline tests passed.")
