# TWK editorial shorts

Create original, researched short explainers with narration-led editorial illustration in Remotion. The current default is the approved paper/ink visual direction, not generic cartoon rooms or neon dashboards.

- Production guide: [docs/CONTENT_SYSTEM.md](docs/CONTENT_SYSTEM.md)
- Research and limits: [docs/QUALITY_RESEARCH.md](docs/QUALITY_RESEARCH.md)
- Release gates: [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
- Visual language: [references/STYLE_BIBLE.md](references/STYLE_BIBLE.md)

## Before creating an episode

Write a sourced script and storyboard plan first. Every shot needs a purpose, a visual action and a unique spoken phrase for its start. Build a new rig when the story requires it. The Boeing-specific scenes are a pilot, not a template for unrelated topics.

```sh
npm ci
npm run build-check
npm test
python tests/test_pipeline.py
python -m unittest discover -s tests -p test_quality.py -v
```

Start a new episode from an explicit authored plan:

```sh
python scripts/new_episode.py --plan path/to/plan.json
```

The plan contains `slug`, `title`, `script`, `sourceUrl`, `durationFrames`, `shots`, `claim_ledger`, `topic_card` and `creative_brief`. Shot data must include implemented `graphic`, `purpose` and (after the hook) `anchor`. The script supplies editorial caption/voice defaults, refuses a missing storyboard and does not invent claims. Register the result in `src/episodes/registry.ts` separately after validation.

## Voice

Fish requests are hard-limited to `s2.1-pro-free`. No paid or legacy fallback. Model errors stop the task. Store keys in protected repository secrets, never source control.

```sh
python scripts/audition_voice.py --episode src/episodes/<slug> --dry-run
```

The manual `Voice audition` workflow can generate three short performances without a full render or release. Do not dispatch it without the applicable approval. A real listening check is required before selecting a take.

## Picture and sound

Real aligned words drive the shared shot/action/FX/SFX timeline. Editorial captions are short phrase pages with stable text and restrained active-word color. Procedural sound cues are a starting point and require listening review. Retain the dry voice, aligned words, mix, stems and manifests so retries and revisions do not require another synthesis call.

The `Render Animated Short` workflow still exists, but do not dispatch new runs automatically. Follow current rerun instructions. A successful technical QA gate does not replace factual, visual, performance or final-edit review. The old published Boeing release is not replaced by the local rough cut.
