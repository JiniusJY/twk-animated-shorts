# Release checklist (publish-blocking)

Every episode must clear the automated gates AND the human review below before
publishing. A high craft score never offsets a failed hard gate. This is TWK
editorial policy from the content-system playbook, not a platform formula.

## Editorial default

Use the original editorial illustration system in `CONTENT_SYSTEM.md`. New episodes start from `scripts/new_episode.py` and an authored plan, not a repeated dashboard or a fixed cartoon scene. Review a real free-only voice audition and the whole assembled edit. A rough cut with old audio is not final.

## Automated gates (CI, blocking)

- `npx tsx scripts/validate_episode.ts <episode.json>` - schema: required fields,
  typed prop actions only (unsupported actions BLOCK), claim_ids must exist in
  claim_ledger, keyframe ordering, sourceUrl required.
- `npx tsx scripts/lint_episode.ts <episode.json>` - warnings for decorative-only
  staging, >4s without an informational state change (deliberate mechanism holds
  are fine - say why), pacing outside 45-65s, missing editorial metadata.
- `npx vitest run && python3 tests/test_pipeline.py && python3 -m unittest discover -s tests -p test_quality.py` - engine + pipeline tests.
- `python3 scripts/qa_gate.py --video out/final.mp4 --expected-seconds <s>` -
  loudness -15 +/- 1.5 LUFS, true peak <= -1.0 dBTP, duration match, no black
  segment >0.6s, no frozen segment >2.0s. Release publish stops if this fails.

## Hard gates (human, blocking)

- Unsupported central claim, misleading comparison or scale: back to claim_ledger.
- Unresolved asset rights: only catalog tracks marked `cleared`/`licensed` may ship.
- Caption/cue drift or voice/animation sync off: regenerate timings, do not nudge.
- Broken mobile presentation: inspect at real phone size with the current
  TikTok/Reels/Shorts UI overlays - no covered labels or citations.
- Missing human review of the actual rendered pixels AND the final mix.

## Scoring rubric (pilot target: >= 85/100, no category under 70%)

| Category | Points |
| --- | --- |
| Hook and promise (specific, honest, answered) | 15 |
| Technical truth (ledger covers speech + visuals) | 20 |
| Explanatory visuals (causal action, not decoration) | 20 |
| Narrative and payoff | 15 |
| Voice performance (intent, contrast, continuity) | 15 |
| Captions and mobile clarity | 10 |
| Sound and finishing | 5 |

## Learning loop

Log every published variant with `python3 scripts/experiments.py log` (one
hypothesis, one deliberate change), compare against matched cohorts with
`experiments.py report`. Never auto-post, and never call one winner a formula.
