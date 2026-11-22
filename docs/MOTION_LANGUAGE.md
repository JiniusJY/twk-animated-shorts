# Motion language - permanent rules (settled 22 Nov 2026)

Context: owner verdict on ep2's scene-based flat style was "no cool motion graphics, too basic".
Two probes (`unfold-test`, `board-test`) established the upgrade direction. These rules are
permanent for all future scenes and episodes.

## Framing
- **Titles, headlines and captions NEVER live inside a scene-camera transform.** They sit in a
  fixed safe overlay layer. Scene cameras may only move in-world art. (v1 cropped its own
  headline during a push-in.)
- In-world text (signs, card labels, terminal readouts) may travel with the camera; frame-edge
  cropping during a dolly is normal. But text must never be covered by another element, in any
  frame, in motion. Check the whole beat, not the settled frame.

## Honesty in visuals (same guardrail as narration)
- **No false precision in motion.** Animated counters land on supported wording only
  ("90,000+", never an invented exact tally like 90,214).
- **No simulated system states.** Nothing may read as authentic footage/evidence of the breach
  (no fake terminal stamps like "ACCESS: OPEN"). Metaphors are rendered in our visibly drawn
  sketch style (e.g. the open padlock illustrating "a door the FBI can't lock").
- APPARENT BREACH / unknowns framing applies to visuals: attribution cards, "claimed" labels
  and question marks carry meaning and stay.

## Camera and depth
- Continuous camera over scene cuts: dolly, push, pull. Parallax via 3 planes
  (bg 0.45x blurred, main 1.0x, fg scraps 1.28x heavily blurred).
- Object transformation over replacement: one element becomes the next beat's element
  (ring -> clock -> network; ticks -> doors).
- Physics entrances (springs) for cards/stamps; drawn-on lines ride their draw tip.

## Verification loop (owner is never the QC layer)
- Every beat: frame-strip the ENTRANCE and the HOLD, plus the midpoint of every camera move.
  Collisions found by inspection this cycle: hands over label (v1), terminal over card caption
  (v2), padlock over narration line (v2). All three were caught on pixels, not by the advisory.
- Gemini advisory (`scripts/ai_review.py`) is advisory only - scores are not the creative bar
  and not the owner's verdict. Treat its flags as hypotheses to verify on real frames.
- Advisory "burned-in captions" flags are out of scope for probes: production captions are a
  separate system.

## Tooling position (verified 22 Nov)
- Code pipeline (Remotion) is the primary route: it owns camera, parallax, morphs, physics,
  beat sync, checkpointing, CI render.
- Adobe: owner's NTU enterprise plan (Adobe for Enterprise, full CC incl. AE/Premiere) verified
  signed in. Desktop apps are not operable from our environment. Express web editor tested:
  preset-only text animation (In/Loop/Out phases), no keyframes/paths/camera in that panel -
  bounded claim, other surfaces not exhaustively tested. Firefly spends generative credits:
  scoped approval + exact cost BEFORE any generation.
- No spend without owner's scoped approval. Existing subscription access is authorized.

## Board strings and pins (settled 22 Nov 2026)
- Card positions/sizes live in `src/engine/boardLayout.ts` only (border-box rects). Components render
  from those rects; never hand-type a card or string coordinate in the scene.
- Strings are declared card-to-card by edge and derived from the rects. Pins sit on the board just
  outside the card edge. No string or pin may touch any card or agency box.
- `tests/boardLayout.test.ts` enforces this (plus no overlapping cards). Move a card -> run the test.
