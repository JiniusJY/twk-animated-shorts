# Pipeline: resumability and speed (standing contract)

Owner directive (22 Nov 2026, verbatim): "check thru properly, make sure
failures anywhere debugged wont rerun everything and speed up optimisation".

Rule: no stage ever re-runs completed work. A failure mid-render, mid-upload
or mid-mix restarts only the failed unit. Speed comes from parallelism and
caching, never from dropping quality gates.

## Cloud render (`.github/workflows/render.yml`)

- **Shard-level checkpointing.** The render job is a matrix of up to 28 frame
  shards (`scripts/make_shards.py`), `fail-fast: false`. If shards fail, use
  GitHub's "Re-run failed jobs": only the failed shards re-render; chunk
  artifacts are scoped to the run, so publish merges old + new chunks.
- **Voice takes cached by script hash.** `voice.py` reuses any completed take
  when the script text has not changed; retried runs skip finished synthesis.
  The take + alignment are uploaded as an artifact even on failure
  (`if: always()`), so a later stage never loses finished TTS work.
- **3-attempt wrapper on networked voice step**; 2 attempts per render shard
  with the partial file removed between attempts.
- **Caches**: npm (`setup-node` cache), Remotion headless browser
  (`node_modules/.remotion` keyed by lockfile), pip wheels.
- **Publish gate**: concat is `-c copy` (lossless, seconds); QA gate blocks
  release; release is always `--prerelease [UNGATED]` until the 100/100
  viewer-skip gate promotes it.

## Local iteration (`scripts/render_local.py`)

Checkpointed per-shot preview renderer for the dev loop:

    python3 scripts/render_local.py --episode src/episodes/<slug>        # render only missing/stale shots, concat
    python3 scripts/render_local.py --episode src/episodes/<slug> --shots 0,3   # force-re-render just those shots

- One chunk per shot (semantic units: a debugged shot re-renders alone).
- Manifest records each chunk's content hash (engine + episode sources,
  package.json, scale). Crash/Ctrl-C/failure: the next run renders only what
  is missing or stale.
- Parallel workers (`--workers`, default half the CPUs); concat is `-c copy`.
- Per-chunk logs at `out/local-<slug>/chunk-NN.log`.

## When changing the pipeline

Keep this contract: any new stage must name its checkpoint unit (what re-runs
when it fails) in this file before it ships.
