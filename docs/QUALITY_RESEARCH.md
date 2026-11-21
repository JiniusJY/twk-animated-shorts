# TWK production quality study

21 November 2026. Status: engineering changes tested locally; editorial illustration direction accepted, whole-picture rough cut inspected. Full production render authorized after that review; final voice/mix still require verification.

## Finding

The gap is art direction and performance, not the absence of an After Effects plugin. Strong explainers construct a different visual explanation for each idea, time it to a finished voice performance, and revise the work after watching and listening. Replacing a character tableau with a neon dashboard makes the information clearer, but it still looks templated. That first experiment was rejected and must not be treated as the approved direction.

## Ranked work

| Priority | Change | Proof and limit |
|---|---|---|
| 1 | Fix the story-to-picture relationship | All 13 shot-start phrases match the retained run #15 word alignment exactly once. A piecewise map moves shots, actions, FX and cues together. This is much better than stretching the entire episode by one ratio, but internal actions still need precise editorial placement. |
| 2 | Direct a performance, not a whole paragraph in one mood | Nine specific sentence-entry directions added, while preserving the sourced narration. Direction remains separate from display/caption text. Three short auditions are supported. The improved performance has not been heard yet. |
| 3 | Replace decorative staging with a designed explanation | An initial status-card design was rejected. The second experiment uses an original number-drum metaphor, sign flap, four generator symbols, drafted silhouette and explicit theory/illustration labels. The user accepted this visual direction. It is not a factual aircraft wiring diagram. |
| 4 | Design sound around physical events | Added deterministic relay, rising tension, powerdown and restart cues, equal-power pan, voice ducking and a short music drop around the failure. Tests prove rendering behavior, not that synthetic effects equal a professional foley recording. |
| 5 | Protect the free-only constraint | Only s2.1-pro-free can be requested. Plan errors stop instead of falling through to paid or legacy aliases. Voice-cache version includes this policy. |

## What the creators actually do

### Kurzgesagt: a visual metaphor for the sentence

Its own production page describes research and expert checking, many script drafts, illustration, a recorded human performance that determines animation timing, and an original score with sound effects. The older making-of film describes scene-by-scene illustration, manually animated parts, recorded retakes and repeated reviews. That historical film is not evidence of the current team size or turnaround time.

For TWK: storyboard the conceptual transformation before writing animation code. Keep an object through the cut when it helps viewers understand what changed. A signed integer can be shown by a sign changing, not another text label announcing an overflow. Do not assume a palette or a mascot creates this level of quality.

### Branch Education: technical specificity

Branch's production account puts research and storyboarding before modeling, records voice to guide timing, animates component behavior in Blender, reviews visual accuracy and adds sound tied to component movement. Its modeling partner describes physical teardowns, reference research, detailed geometry and multiple rounds of revision.

For TWK: an actual component should look and behave like that component. A generic clock and generic generator cannot be passed off as a verified GCU teardown. Where internals are uncertain, use an explicitly labeled analogy, not invented circuit detail. Real 3D work requires reference assets and shot-specific modeling, not extra camera shake.

### Veritasium: the tool follows the explanation

Credited animator Ivy Tello describes a full process from storyboards through illustration, rigging, animation and compositing. For the micromouse video, simulations were written in Python and data moved into Cavalry. She later moved her main work from After Effects to Cavalry for complex vector rigs. This is primary practitioner evidence that code-driven animation is compatible with serious explanatory work.

For TWK: build purpose-specific rigs and import physically meaningful data when useful. Do not make every topic fit the same character scene or data card. Derek Muller's interview also emphasizes demonstrations, precise explanations and editing out uninteresting parts rather than choosing equipment for its name.

### Ben Marriott: motion and design are decisions

His course curriculum covers speed/value graphs, pacing, mattes, reveals and match cuts. His interview emphasizes early design/storyboard work and a cohesive story over animation done merely to impress other animators.

For TWK: use deliberate holds, anticipation, a meaningful state change and a settled result. A spring entrance is a tool, not a substitute for timing. Avoid spraying grain, glow and whooshes over every beat.

## Why the first visual pass failed

- A dark gradient, technical grid, neon status cards and a large all-caps heading are a common dashboard vocabulary. They did not belong specifically to this story.
- Repetition of the same panel layout read as a reusable template.
- The screen stated the result instead of showing a physical or conceptual transformation.
- Generic character motion and camera pushes did not add explanatory information.
- Technical loudness QA cannot judge any of these things.

The second pass changes the composition and metaphor rather than merely reskinning the cards. Its number drum is still an analogy, so it is labeled as such. The user accepted this second direction and it has been applied to the whole-episode picture rough cut.

## Voice and sound facts

Current Fish documentation supports natural-language bracket directions placed near the sentence they control. It advises spacing changes and avoiding conflicting emotions. These are learned acoustic controls, not a guarantee of excitement. A human must hear an actual take. The current free model still needs to be auditioned with the user's chosen voice.

The old audition script was broken: it referenced helper functions that did not exist. It is repaired to call the real synthesizer and use free-only requests. A manual audition workflow is available. It was not dispatched during the picture study. No Fish credential is locally available; the existing protected repository secrets can be used by that workflow if a new short audition run is approved.

The retained prep artifact contains the mixed track and props/captions, but not the dry narration stem. Therefore the first four-second picture proof uses old sound for timing reference. It is not proof of a better voice or new final mix.

## Validation

- TypeScript type check and existing 19 engine/caption tests passed after the first engineering pass.
- Nine new Python tests cover free-only calls, direction placement, ambiguous/missing anchors, edge fallback cleanup, cache-policy hashing, shared timeline mapping and deterministic stereo SFX.
- Existing Python shard/timeline checks passed after preserving subframe cue precision for episodes without word anchors.
- All 13 real shot phrases matched exactly once in run #15's captions.
- Actual local frames were inspected for type size, caption overlap, numerical state and illustration labels. A reset bug in the design experiment was caught and fixed so the counter returns to zero.
- Full production render, improved voice listening test, final sound mix and full-episode art review remain unverified.

## Next gate

1. Completed: user accepted the second visual direction and reviewed the whole-picture rough cut.
2. With permission for a new short test run, generate the three free-only hook auditions. Listen for natural emphasis, pacing, intelligibility, cue leakage, stability and contrast. Select a take or revise direction.
3. Render a short complete voice/picture/sound section, not the whole episode. Review the actual motion and mix on headphones and a phone speaker.
4. Only then propose a full render and a new release. Do not claim creator-level parity from passing unit tests or one attractive still.

## Sources and confidence

1. https://kurzgesagt.org/what-we-do?visit=videos . Primary studio account, current page fetched. Research, drafts, illustration, narration-led timing, custom music/SFX. High confidence about stated process.
2. https://www.youtube.com/watch?v=uFk0mgljtns . Primary historical making-of film, discovered through search. Its transcript was inspected through the secondary mirror below, not independently timed against the video. Do not use old hours/team counts as current facts.
3. https://rosetta.to/u/kurzgesagt/how-to-make-a-kurzgesagt-video-in-1200-hours . Secondary transcript mirror, fetched. Used for historical retake/animation/review detail with the preceding limitation.
4. https://branch.education/about . Primary channel account, fetched. Research, voice-first timing, Blender, visual review and sound design. High confidence about stated process; not an independent production audit.
5. https://www.acoroidstudio.com/case-studies/branch-education-3d-modeling-animation . Credited vendor/practitioner case study, fetched. Teardowns, technical research, custom models, revision. Self-reported case study.
6. https://ivytello.art/en/projects/veritasium . Primary credited animator portfolio, fetched. AE-to-Cavalry workflow and Python simulations. High confidence for her own work, not a claim about every Veritasium video.
7. https://www.creatorhandbook.net/inside-veritasium-an-interview-with-dr-derek-muller-12ad2351a4b3/ . Published interview, fetched. Precise explanation, demonstrations, editing and results over equipment.
8. https://www.benmarriott.com/motion-foundation . Primary curriculum, fetched. Graphs, pacing, reveals and match cuts. A course syllabus, not an independent quality test.
9. https://elements.envato.com/learn/ben-marriott . Published interview, fetched. Preproduction, story and design process.
10. https://docs.fish.audio/developer-guide/core-features/emotions . Current official docs, fetched. Sentence-level natural-language bracket cues and performance guidance.
11. https://docs.fish.audio/developer-guide/models-pricing/models-overview . Current official docs, fetched. Model identities and legacy redirect warning. The account-specific free constraint comes from the user's project context, not a universal claim that all accounts get free synthesis.
12. https://www.remotion.dev/docs/motion-blur/ and https://www.remotion.dev/docs/spring/ . Official renderer docs, fetched. Motion tools are available in code; temporal motion blur has a rendering cost. No expensive full-scene motion-blur pass was added merely for polish.

Reference images inspected: Branch partner's hard-drive illustration and Veritasium micromouse thumbnail. These are composition references, not a frame-by-frame animation study and not assets licensed for reuse. No third-party image was inserted into TWK output.
