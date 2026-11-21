# TWK content system

Updated 21 November 2026 after review of the Boeing episode. The editorial illustration direction was accepted. That acceptance is not a claim that every shot or voice performance is approved.

## Creative contract

A short should give the viewer one new understanding. Every cut either advances the question, demonstrates the mechanism, changes scale, supplies evidence or pays off the promise. Decorative motion is not evidence of a good edit.

### 1. Editorial research

Choose one surprising, supportable question. Record primary sources, exact supported wording, dates and caveats in the claim ledger. Differentiate confirmed behavior from proposed mechanisms. Do not draw speculative internals as a factual teardown. Do not invent a quote, certificate, newspaper or official document: illustration labels must be visible where those forms are used.

### 2. Performance and script

Write spoken English, not an article read aloud. Open on the interesting fact, without a channel intro. Build curiosity, then answer it. Default length is roughly 45-65 seconds only when the story fits; do not race a long script to hit a number. Preserve sources when shortening.

Use `voice.direction` for overall character and `voice.beats` for local sentence-entry intent. One primary intent per sentence, spaced naturally. Put the exact phrase in `before`; missing or duplicate anchors fail. Do not put stage directions in captions.

Audition the hook in three genuinely different deliveries. Judge intelligibility, warmth, emphasis, contrast and absence of cue leakage. More temperature does not equal better performance. Reject an audition that is robotic, rushed or mispronounced. The model policy is exactly `s2.1-pro-free`; any error stops. Never fall back to a model that may charge.

### 3. Shot design

First draw a visual sentence in words: object, action, result. Then choose the drawing or rig. Keep important numbers and diagrams large enough for a phone. Use a narrow palette and consistent stroke hierarchy. Introduce new visual vocabulary only when needed.

- Use evidence or recognizable physical objects, not a dashboard for every story.
- Match-cut related shapes, sizes or positions when continuity helps. A number drum can become an odometer, then return to explain overflow.
- Use hard cuts for new ideas. A transition should connect meanings, not hide indecision.
- Movement needs anticipation, a change and a settled result. Hold long enough to understand the result. Do not add constant camera drift to evade a freeze detector.
- Do not imitate a creator's proprietary assets, mascot, exact shot or script. Study the reasoning behind the work.

Current engine support: `shot.graphic` selects a purpose-built editorial scene; `counter`, `overflow`, `power`, `reset`, `hook`, `lab`, `stakes`, `question`, `clock`, `storage`, `odometer`, `directive`, `payoff` are implemented for the Boeing pilot. These are a pilot vocabulary, not universal templates. Future topics should add a researched rig when these concepts do not fit. The legacy 3D scene renderer is retained when `graphic` is absent.

### 4. Voice-first timeline

Each shot after the hook has a short, unique `anchor` phrase in the speech. Real word alignment maps the authored start to that phrase. `editorial.py` builds a monotone piecewise map; `audio_bed.sync_episode` uses that map for shots, keyframes, action durations, visual FX and sound cues. Approximate proportional captions cannot drive an anchored release.

Anchors are not magic: confirm the intended moment in the final video. Verify intra-shot events, which still use authored relative timing. A later wording or voice change invalidates the previous timing proof. The cache hash includes script, direction settings, voice, alignment path and model policy.

### 5. Caption rhythm

Default to editorial captions: dark ink, active word in restrained red, no rubbery every-word bounce, a stable lower-third block. Use short phrase pages, avoid mid-sentence flashes, and keep captions separate from diagram labels. Review real rendered text rather than assuming a word count guarantees good line breaks. Include silence and punctuation in phrase grouping. Captions must not cover the explanation or platform controls.

### 6. Sound edit

Narration is primary. Music supplies an emotional bed, not a constant wall. Sounds belong to visible events. Use separate layers for anticipation, contact/mechanism and decay; do not add a whoosh to every cut. Stereo movement must survive mono playback. Brief reduction of music can give a failure or punchline more weight than another loud impact.

The current procedural sounds are a cleared starting point, not a claim to equal bespoke recorded foley. Listen on headphones and a phone speaker. Keep voice, music and SFX stems and timing metadata so the mix can be revised without another voice generation. Retain the master and stems with the prep artifact, not only the combined track.

### 7. Whole-edit review

First watch without sound: does it explain the change? Then listen without picture: does the narration feel directed? Then watch the complete combination, at phone size, without pausing. Review caption switches, cut timing, internal event timing, emotional progression and payoff. Inspect transitions as motion, not only stills. A pleasing screenshot is not completion.

Technical QA checks loudness, peaks, duration, black and freeze segments. They do not certify art direction, truth, performance or viewer understanding. A deliberately static explanatory hold may need a documented exception instead of useless motion. Never weaken an existing gate silently.

### 8. Release and learning

No new full workflow run merely to see if it works. Prefer a short local proof and a short free voice audition first. Follow the user's current instructions about reruns. Report what was actually verified, which audio is old and which is new. Full render and release wait for the applicable review/authority. Do not overwrite an earlier delivered release with an unapproved rough cut.

After publication, record the hypothesis and compare actual retention with comparable episodes. There is no evidence-based rule that every video needs a cut every 1-2 seconds. Edit for comprehension and changing energy, then learn from observed results.

## Editor research

- YouTube's Jenny Hoyos interview emphasizes a rapid hook and concise mini-stories: https://blog.youtube/creator-and-artist-stories/youtube-shorts-deep-dive/
- YouTube's editing guide describes text as context through fast cuts and asks creators to inspect its exact timeline: https://support.google.com/youtube/answer/13380879?hl=en
- Hayden Hillier-Smith's interview discusses editing as storytelling and varying energy instead of treating retention as the only goal: https://creatorscience.com/podcast/hayden-hillier-smith/
- Ben Marriott teaches pacing, speed/value graphs, reveals and match cuts: https://www.benmarriott.com/motion-foundation
- Primary production sources and their limits are recorded in `QUALITY_RESEARCH.md`.

These support a process, not a promise that a fixed editing formula will produce a hit. Avoid using stale platform-duration claims from older general editing articles as current posting rules.

## Follow end card

New episodes include a short branded end card after the completed story: Follow @techwhoknows. Keep the handle exact, preserve the payoff before the card, and avoid extra generic like/comment/share requests. The card is visual, not extra narration. New-episode creation supplies it by default; the audio timeline reserves its duration. Record follower conversion and retention as outcomes to measure, never guarantees.

## Evidence media and brand assets

Use real screenshots or video excerpts when they supply evidence or context the illustration cannot. Preserve the original URL, author/account, publication date, capture time, exact excerpt and a rights/usage note in the episode asset ledger. A public X post is not automatically licensed for unrestricted reuse. Prefer permission, licensed media, official press assets or a limited, justified editorial excerpt. Do not bypass paywalls, remove watermarks or expose private messages. Attribute clearly on screen, distinguish a claim from a verified fact, and avoid crops or edits that change meaning. Do not invent a screenshot, quote, metric or engagement count. Keep text legible on a phone. Source media is optional per story, not decorative B-roll.

The end card uses the actual TechWhoKnows logo from the website brand asset, stored at `public/brand/twk-logo.svg`. Do not redraw or improvise the logo. Preserve its proportions and contrast. Website logo provenance is documented in `public/brand/README.md`. The current Boeing render does not add unrelated social footage.
