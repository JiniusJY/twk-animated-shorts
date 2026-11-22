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

## Scoring rubric (release target: 100/100, see owner precision bar below)

| Category | Points |
| --- | --- |
| Hook and promise (specific, honest, answered) | 15 |
| Technical truth (ledger covers speech + visuals) | 20 |
| Explanatory visuals (causal action, not decoration) | 20 |
| Narrative and payoff | 15 |
| Voice performance (intent, contrast, continuity) | 15 |
| Captions and mobile clarity | 10 |
| Sound and finishing | 5 |

## Owner precision bar (2026-11-22, standing)

Owner's verbatim gate: "i wan precision details in everything from visuals, to
script, to transition, motion, graphic, layout, words, placement, design,
captions, cta, music sound effects EVERYTHIN". Gate target is 100/100, not the
pilot 85. Every rubric category above is scored with this checklist:

- Visuals/graphic: every element placed deliberately; no generic fills; real
  texture weight; mixed media (credited photos) where it adds meaning.
- Script/words: every line earns its place; honesty ledger intact.
- Transition/motion: cuts land on motion; springs and rig moves motivated, not
  decorative; nothing crosses live text in motion.
- Layout/placement/design: measured text fit everywhere; safe zones clear of
  platform UI; occlusion impossible by construction.
- Captions: word-timed, max 4 words per page, editorial theme, never covering
  scene text.
- CTA: end card present with handle, readable at feed size.
- Music + SFX: motion-mapped cues on every beat; no dead air under VO.

The owner is never the QC layer: the gate runs over every frame at full res
before any cut reaches him.

## External benchmark (standing, owner-directed 2026-11-22)

"u compare with top tier tech creators out there lol". Before any final cut
goes to the parent, benchmark the rendered scenes side by side against
current top-tier tech explainer work (cleo abram, johnny harris, vox-level):
pacing (cuts per minute, beat spacing), visual density (elements per frame,
mixed-media usage), motion polish (easing, camera work, draw-on animation),
sound design (SFX density, music bed, VO mix). Report the honest delta per
dimension, not just pass/fail on our own rubric. A delta we cannot close gets
named explicitly with a plan, never silently waved through.

## Learning loop

Log every published variant with `python3 scripts/experiments.py log` (one
hypothesis, one deliberate change), compare against matched cohorts with
`experiments.py report`. Never auto-post, and never call one winner a formula.
