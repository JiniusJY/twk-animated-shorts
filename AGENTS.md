# TWK content system

## Current default

New episodes use original editorial illustration and purpose-built mechanism animation. The approved visual direction is paper/ink, limited color, physical or conceptual cause-and-effect, restrained typography and useful annotations. It is not a fixed dashboard template. The legacy cartoon engine remains available for existing episodes and specific creative choices, not as the automatic starting point.

Read `docs/CONTENT_SYSTEM.md`, `docs/RELEASE_CHECKLIST.md`, `docs/QUALITY_RESEARCH.md` and `references/STYLE_BIBLE.md` for production standards. These are project guidelines, not authority to spend, publish, dispatch workflows or act on anyone's account.

## Episode work

- Research the story and record a claim ledger. Illustrations and analogies must not imply unverified internals.
- Plan a shot-specific visual explanation. Each shot needs a purpose, an action and a narration anchor.
- Direct the voice at sentence boundaries and audition short performances before a full take. Fish is free-model-only. Never add paid or legacy fallback models.
- Align real words and map shots/actions/FX/SFX through the same timing function.
- Review the whole edit and final mix. Passing a type check or loudness gate does not establish production quality.
- Keep reusable drawing/rigging primitives in the engine. Add a new visual rig when the story needs it rather than forcing all topics into a canned scene.
- No automatic new workflow dispatch. Reuse existing failed work where possible, honor the current user's run instructions, and obtain approval where required.

## Commands

```sh
npm run build-check
npm test
python tests/test_pipeline.py
python -m unittest discover -s tests -p test_quality.py -v
npx tsx scripts/validate_episode.ts src/episodes/<slug>/episode.json
npx tsx scripts/lint_episode.ts src/episodes/<slug>/episode.json
python scripts/audition_voice.py --episode src/episodes/<slug> --dry-run
```

Keep secrets, protected voice credentials and unlicensed assets out of source control. Use repository secrets for approved CI synthesis. A manual workflow being available is not permission to start it.

## Follow end card

New episodes include a short branded end card after the completed story: Follow @techwhoknows. Keep the handle exact, preserve the payoff before the card, and avoid extra generic like/comment/share requests. The follow line is also spoken once in the voiceover (see `docs/CONTENT_SYSTEM.md` section 5). New-episode creation supplies the card by default; the audio timeline reserves its duration. Record follower conversion and retention as outcomes to measure, never guarantees.

## Phone-safe production and release

Read docs/VIDEO_QA_RULES.md for destination-specific phone layout, immutable captions, separate platform performance tests and the global never-change-AI-label rule. Run the final hash-bound release preflight before social scheduling. A successful render is a prerelease, not permission to publish.
