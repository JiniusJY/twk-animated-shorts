# Reusable tech-short voice direction

## Verified capability and constraint

Fish's current S2 documentation supports bracketed natural-language delivery cues near the sentence they control. Sentence-level changes should be clear and spaced, not contradictory cues on every word. This project requests only `s2.1-pro-free`. The model accepted and generated actual audio in production runs #18 and #19. That proves acceptance on this account, not equal performance to any paid model.

Sources, inspected 21 November 2026:
- https://docs.fish.audio/developer-guide/core-features/emotions
- https://docs.fish.audio/developer-guide/models-pricing/models-overview

## Configuration

`voice.direction` supplies the overall character. `voice.beats` inserts a local bracket cue before an exact unique phrase. Directions are not part of the displayed narration or caption tokens. The system checks anchors before making a request. Changing voice settings invalidates the take cache.

The Boeing pilot uses temperature 0.8, top_p 0.8, speed 1.0, conversational curiosity overall, and nine local intent changes: restrained urgency at the stakes, factual clarity at the evidence, genuine curiosity at the question, measured explanation at the theory, warmth for the analogy, tension at the sign flip, calm for the remedy and dry amusement for the payoff.

These settings are a starting point, not a measured optimum. Temperature changes sampling variation, not an excitement slider. Higher variation can hurt consistency or pronunciation. Do not change settings and delivery text simultaneously when testing their effect. Keep the same script/reference and compare short takes. Never imply a paid upgrade fixes the performance without a real comparison.

## Performance scorecard

Listen for meaning: does the question sound like a question, the danger have restraint, the explanation have room to understand, and the payoff land without shouting? Reject cue leakage, unnatural pauses, rushed numbers, unstable speaker identity, clipped consonants or a flat line from beginning to end. Clear speech wins over exaggerated emotion.

The supplied reference voice also limits the result. Do not clone another creator's voice or use a person's reference without the necessary rights and consent.

## Alignment and recovery

The voice is generated once, then real word alignment is validated. Large backwards timestamps fail. Retry alignment against the same take rather than synthesizing again. The workflow retains the dry voice and raw alignment even on failure. A retry is not permission to accept a bad word stream. Keep provider, exact model, parameters and alignment method in the manifest. Approximate proportional timings may not drive an anchored release.

## Review claim

A new take and clean transcript prove generation and intelligibility, not that the performance is now top-tier. The final whole-edit review and user listening feedback remain the deciding test. Store what was heard, what changed, and whether the take was accepted so future episodes learn from actual results.
