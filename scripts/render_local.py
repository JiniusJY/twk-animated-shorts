#!/usr/bin/env python3
"""Checkpointed local preview renderer (owner directive 22 Nov 2026:
"make sure failures anywhere debugged wont rerun everything and speed up
optimisation").

Renders an episode as one chunk PER SHOT in parallel. Each completed chunk is
recorded in a manifest keyed by a content hash of the render inputs. A crash,
Ctrl-C or a failed chunk never reruns completed work: the next invocation
renders only missing or stale chunks, then concatenates.

Usage:
  python3 scripts/render_local.py --episode src/episodes/ncic-fbi-breach
  python3 scripts/render_local.py --episode src/episodes/ncic-fbi-breach --shots 0,3,7   # iterate on specific shots
  python3 scripts/render_local.py --episode src/episodes/ncic-fbi-breach --stale-code     # force: code changed

Checkpoint semantics:
  - Chunk valid = file exists AND manifest hash matches current inputs.
  - The input hash covers src/engine + src/episodes/<slug> + package.json, so
    any code/spec change invalidates exactly the chunks you ask it to (with
    --shots) or everything (default), never silently mixing old code frames
    with new.
  - Concat ALWAYS runs from the chunk files on disk, so a concat failure costs
    seconds, never a rerender.
"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def input_hash(episode_dir: Path, scale: str) -> str:
    h = hashlib.sha256()
    h.update(scale.encode())
    for base in [ROOT / "src" / "engine", episode_dir, ROOT / "src" / "episodes" / "registry.ts", ROOT / "src" / "Root.tsx"]:
        files = [base] if base.is_file() else sorted(base.rglob("*"))
        for p in files:
            if p.is_file() and p.suffix in (".ts", ".tsx", ".json", ".png", ".jpg", ".wav", ".mp3"):
                h.update(str(p.relative_to(ROOT)).encode())
                h.update(p.read_bytes())
    h.update((ROOT / "package.json").read_bytes())
    return h.hexdigest()[:16]


def run(cmd: list[str], log: Path) -> int:
    with log.open("w") as fh:
        return subprocess.call(cmd, cwd=ROOT, stdout=fh, stderr=subprocess.STDOUT)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", required=True, help="episode dir, e.g. src/episodes/ncic-fbi-breach")
    ap.add_argument("--scale", default="1")
    ap.add_argument("--workers", type=int, default=max(2, (os.cpu_count() or 4) // 2))
    ap.add_argument("--shots", default="", help="comma shot indexes to (re)render; default = all missing/stale")
    ap.add_argument("--stale-code", action="store_true", help="treat code changes as invalidating ONLY --shots (default) - flag kept for clarity")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    ep = (ROOT / args.episode).resolve()
    slug = ep.name
    spec = json.loads((ep / "episode.json").read_text())
    shots = spec["shots"]
    fps = spec["fps"]
    out_dir = Path(args.out) if args.out else ROOT / "out" / f"local-{slug}"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    code_h = input_hash(ep, args.scale)
    only = {int(s) for s in args.shots.split(",") if s.strip() != ""} if args.shots else None

    jobs = []
    for i, sh in enumerate(shots):
        a, b = int(sh["a"]), int(sh["b"]) - 1  # shot b is exclusive end
        chunk = out_dir / f"chunk-{i:02d}.mp4"
        key = str(i)
        fresh = chunk.exists() and manifest.get(key, {}).get("hash") == f"{code_h}:{a}-{b}"
        if only is not None:
            if i not in only:
                continue  # untouched: keep existing chunk whatever its state
        elif fresh:
            continue  # default mode: skip valid chunks - the checkpoint
        jobs.append((i, a, b, chunk, key))

    if jobs:
        print(f"rendering {len(jobs)} chunk(s) with {args.workers} workers: {[j[0] for j in jobs]}")

        def render(job):
            i, a, b, chunk, key = job
            rc = run([
                "npx", "remotion", "render", "src/index.ts", slug, str(chunk),
                "--codec", "h264", "--crf", "18", "--x264-preset", "veryfast",
                "--scale", args.scale, f"--frames={a}-{b}", "--muted", "--timeout=120000",
            ], out_dir / f"chunk-{i:02d}.log")
            return job, rc

        failed = []
        with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
            for job, rc in ex.map(render, jobs):
                i, a, b, chunk, key = job
                if rc == 0 and chunk.exists():
                    manifest[key] = {"hash": f"{code_h}:{a}-{b}", "range": f"{a}-{b}"}
                    manifest_path.write_text(json.dumps(manifest, indent=1))
                    print(f"  chunk {i:02d} ok ({a}-{b})")
                else:
                    failed.append(i)
                    print(f"  chunk {i:02d} FAILED - see {out_dir}/chunk-{i:02d}.log", file=sys.stderr)
        if failed:
            print(f"failed chunks: {failed} - rerun this command to retry ONLY these", file=sys.stderr)
            return 1
    else:
        print("all chunks current - nothing to render")

    if only is not None:
        print("--shots mode: skipping concat (partial refresh)")
        return 0

    chunks = sorted(out_dir.glob("chunk-*.mp4"))
    if len(chunks) < len(shots):
        print(f"only {len(chunks)}/{len(shots)} chunks on disk; fix failures before concat", file=sys.stderr)
        return 1
    concat = out_dir / "concat.txt"
    concat.write_text("".join(f"file '{c}'\n" for c in chunks))
    final = out_dir / "preview.mp4"
    rc = run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(final)],
             out_dir / "concat.log")
    if rc != 0:
        print(f"concat failed - see {out_dir}/concat.log (chunks intact, no rerender needed)", file=sys.stderr)
        return 1
    dur = spec["durationFrames"] / fps
    print(f"preview: {final} ({dur:.0f}s, {len(chunks)} chunks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
