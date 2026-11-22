# Tooling research (standing, owner-requested 22 November 2026)

Owner brief: "Find plugins on github that enhances ur workflow and video generation"; goal is better editing (not just camera pan on one scene), live sfx, and visuals that match the voiceover (e.g. a stat lands as a building pile of the thing being counted). Reviewed 22 Nov; re-check each episode pre-production.

## Adopted 22 November 2026

Installed at 4.0.545 (exact, matching Remotion): `@remotion/transitions`, `@remotion/motion-blur`, `@remotion/light-leaks`, `@remotion/noise`, `@remotion/lottie`, `@remotion/sfx`. Transition devices built on top are in `src/engine/devices/transitions.tsx` (see DEVICES.md).

- **@remotion/sfx finding:** it is a list of URLs to sounds hosted at remotion.media, mostly meme sounds. Per its own docs, `whip` and `whoosh` are CC0 (Freesound 838766 and 831936). `ding`, `vine-boom`, `spongebob-fail` and similar say only "probably fine to use", with no license. Rule: use only sounds whose page states CC0 or an equivalent commercial license, record the source in the asset ledger, and never use the meme sounds on brand accounts. Download and keep the file locally, don't stream from remotion.media at render time.
- **Synthesised SFX are the biggest sound gap.** `scripts/audio_bed.py` builds every cue from noise and sine waves. A recorded, commercially licensed SFX library is the next step (sources and rights rules in CONTENT_SYSTEM section 8).
- `@remotion/light-leaks` exports a deprecated `LightLeak` and points to `@remotion/effects`. Not used yet. `FlashHit` (CSS) covers flashes for now.

## Adopt next (ep3 candidates)

- **@remotion/transitions** (official, remotion-dev/remotion, packages/transitions): presentation transitions (wipe, slide, flip, clock wipe, etc.) between scenes via TransitionSeries. Directly upgrades our cut/dissolve-only grammar - motivated scene changes instead of pans on one scene. Docs: remotion.dev/docs/transitions/
- **@remotion/sfx** (official): sound-effect primitives incl. whoosh hits timed to transitions and caption pops. First layer of the "live sfx" ask without the Adobe account; Adobe escalates this further when needed. Docs: remotion.dev/docs/sfx/
- **@remotion/motion-blur** (official): camera/object motion blur. Makes our truck/push moves read as filmed, not screenshotted.
- **@remotion/lottie** (official): drop Lottie animations (animated icons, charts, counters, alert graphics) over the 3D world. This is the fastest path to the visual-VO match rule: "90,000 agencies" can be an animated stacking graphic; alerts, checkmarks, counters come from lottiefiles.com (check per-file license) instead of hand-built props. Docs: remotion.dev/docs/lottie/lottie
- **remotion-dev/animated-captions** (official) and community caption kits (remotion-captions-kit, remotion-captions-themes, remocn.dev karaoke component): compare against our in-house karaoke captions; adopt if word-timing themes beat ours. We already have Groq Whisper word timings.

## Watch / evaluate later

- **remocn.dev** (Remotion component registry, shadcn-style): catalog of caption/text/transition components to cherry-pick per episode.
- **remotion-dev/skills** (official best-practice rules for agents writing Remotion): fold applicable rules into CONTENT_SYSTEM.
- Engine-side (not a plugin): prop spawn/replicate API for "pile builds up" beats (N copies of a prop fly in and stack). Lottie covers the simple cases; engine support covers the in-world 3D cases.

## Sources

- github.com/remotion-dev/remotion (transitions, sfx, motion-blur, lottie, animated-captions, skills packages)
- remotion.dev/docs/{transitions,sfx,lottie/lottie}
- remocn.dev/docs/components, github.com/Fats403/remotion-captions-kit, github.com/vshukla7/remotion-captions-themes, github.com/remotion-dev/animated-captions
