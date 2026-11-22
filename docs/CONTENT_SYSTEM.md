# TWK content system

This is the current rulebook for every new episode. Each rule appears once, in present tense. Dated owner rulings and the history behind them are in [RULINGS_LOG.md](RULINGS_LOG.md). When the owner gives a new ruling, edit the rule here in place and add the ruling, with its date and wording, to the log. Do not add dated paragraphs to this file.

Related docs: release gates and commands in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), motion and layout rules in [MOTION_LANGUAGE.md](MOTION_LANGUAGE.md), voice settings in [VOICE_DIRECTION.md](VOICE_DIRECTION.md), publishing and music rights in [PUBLISHING_SYSTEM.md](PUBLISHING_SYSTEM.md), render resumability in [PIPELINE.md](PIPELINE.md), research sources in [QUALITY_RESEARCH.md](QUALITY_RESEARCH.md).

## 1. The bar

- **Quality target:** top-tier editorial animated motion graphics at the level of Cleo Abram's channel. That means typography, easing, layout and pacing working as one design system. Live-action VFX in the Zach King style is out of scope.
- **The skip test:** watch every cut as a viewer. If you would be inclined to skip at any point, it fails. Fix it and render again before anyone sees it. The target score is 100/100.
- **Views target:** every episode is built to clear 10,000 views. Views can't be guaranteed, so optimise what can be controlled: topic, hook, visual quality and packaging. The bar stands until the owner raises it.
- **The owner is never the QC layer.** Nothing with a visible defect reaches him. Only finished work is shown.
- **Truth comes before every other rule.** An honesty rule wins any conflict with a pacing or style rule.

## 2. Episode flow and who decides

When the owner says "episode N" or approves a topic, the system runs every stage without him driving each step:

1. Trend and creator research (section 3)
2. Topic pick with a viral-potential check
3. Claim ledger (section 4)
4. Script with the cue pass (section 5)
5. Storyboard: one visual per spoken claim, picked from the device library ([DEVICES.md](DEVICES.md)) first, plus a camera move and a transition for each boundary (section 6)
6. Voice take, word alignment and timing map
7. Build, short local proof, full render
8. Defect gate, then the skip test (section 10)
9. Two-cover shortlist (section 9), publishing package ([PUBLISHING_SYSTEM.md](PUBLISHING_SYSTEM.md))
10. Owner approves the final cut, plus the cover unless he has delegated it. **This step is never skipped.**

Report what was verified at each gate. Never start a workflow dispatch or publish automatically. A local rough cut with old narration is not a finished voice or sound revision.

## 3. Pre-production research

Do this for every episode, without being asked. Record the evidence in the episode's plan notes.

- **Ground decisions in real videos.** Base motion, pacing, transition and hook choices on frame-level study of current top tech shorts (Bright Data TikTok/Shorts scrape and direct reference pulls). Articles about virality are background only.
- **Refresh every episode.** Pull recent videos from the target creators and note cut cadence, camera moves, transition types and hook framing.
- **Read the feedback first.** Check `docs/COVER_PERFORMANCE.md`, `experiments.py report` and the last episode's 10k review before picking a topic.
- Research informs topic choice and packaging. It never justifies a claim the ledger can't support.

### Current evidence (checked 22 November 2026, re-verify as it ages)

- **Genre:** tech shorts that travel are "this affects you" stories about breaches, scams, your data, your money and your phone. Stories about the failure behind a headline (Boeing ep1, NCIC ep2) fit here. High-concept comparisons ("$10 vs $10,000") work for Mrwhosetheboss but need props we can only borrow as framing.
- **Openers:** a bold claim is the most common opener among standout tech TikToks (33% of 1,663 analysed). Hook formulas don't separate hits from flops by the same creator. What hits share is starting instantly (first word at about 0.1s) and being short. Open on the boldest claim the ledger supports.
- **On-screen hook text** went with 1.79x the views of same-account videos without it (Postdom, 1,272 videos). Applied as the hook line in section 7.
- **Endings:** "let me know below" endings went with 0.61x the views. End on the payoff plus the follow CTA. Discussion prompts go in the pinned comment.
- **Pacing (Fireship study):** about 13 hard cuts a minute, 3s median shot, no talking head. Diagrams assemble one element per narrated clause.
- **Length:** standouts cluster at 30-60s. Viral Shorts have a 21s median.
- **Humor:** dry wit in the payoff works. Forced jokes hurt retention.

Sources: writepanda.ai Fireship study, viralmint.net hook study, viralvault.studio tech niche, postdom.com viral research, growwly.co Mrwhosetheboss playbook, YouTube's Shorts blog. Full URLs are in the rulings log archive.

## 4. Story and claims

- One short gives the viewer one new understanding. Every cut advances the question, shows the mechanism, changes scale, supplies evidence or pays off the promise.
- Pick one surprising, supportable question. Record primary sources, exact supported wording, dates and caveats in the claim ledger.
- Keep confirmed behaviour separate from proposed mechanisms. Don't draw speculative internals as a factual teardown.
- Never invent a quote, certificate, newspaper, official document, screenshot, metric or engagement count.
- **No false precision.** Counters land on supported wording ("90,000+", not 90,214). Drop a stat that can't be verified from a primary source, even if it was in an earlier draft.
- **No simulated system states.** Nothing may read as authentic footage or evidence of an event (no fake terminal stamps). Metaphors are drawn in the visible sketch style.
- **Uncertainty is carried by the narration** ("apparent breach", "claimed", "we don't know who got in"). The script must say it out loud, and the captions show those words, so a muted viewer still gets them. No UNKNOWN / CLAIMED / APPARENT stamps. A visual must never look more certain than the VO: if the picture alone would suggest a confirmed fact, change the picture, don't add a stamp.

## 5. Script and voice

### Writing

- Write spoken English. Open on the interesting fact, with no channel intro. Speak from the first frame.
- The first 3 seconds establish the specific tension or consequence in both voice and picture.
- Default length is 45-65s. Prefer the short end when the story fits. Never pad to a number, and never race a long script to hit one.
- Build curiosity, then answer it. Deliver the hook's promise.
- Include one short, natural spoken follow line near the end ("Follow TechWhoKnows for the next one"), backed by the visual end card with the exact handle @techwhoknows. Check it's audible in the final mix. Ask once, with no extra like/comment/share requests. A next-story promise must be true.
- Write jokes only when they're actually funny.

### Cue pass (required before render)

- Every sentence carries a Fish S2 bracket cue or direction. A flat sentence is a defect.
- Write an energy arc: hushed beats, emphatic beats, and placed `[pause]` / `[long pause]`. Vary cues line by line and avoid long runs of the same cue.
- The narration runs without gaps longer than 0.3s, except for scripted tension pauses.
- Use `voice.direction` for overall character and `voice.beats` for sentence-entry intent. Put the exact phrase in `before`. Missing or duplicate anchors fail.
- Audition the hook in three genuinely different deliveries. Reject robotic, rushed or mispronounced takes and any cue leakage.

### Voice model

- Free Fish model only: `s2.1-pro-free`. Temperature 0.8, top_p 0.8. Never add a paid or legacy fallback. Any error stops.
- If the owner still calls a full read robotic, show him the priced paid options. Spending on voice is his call and is never done silently.

### Timing

- Each shot after the hook has a short, unique `anchor` phrase. Real word alignment maps shots, keyframes, actions, FX and SFX through one timing map (`editorial.py`, `audio_bed.sync_episode`).
- A wording or voice change invalidates the previous timing proof. Confirm intra-shot events in the final video.

## 6. Visuals

### Spine

- **Default: editorial motion graphics** (`style: "editorial"`): animated paper, ink and red graphics per story beat, upgraded with licensed real footage or photos where they beat a graphic.
- The 3D toon world (`style: "world"`) is opt-in for beats where it honestly beats the gate. The all-2D lint error applies only to `world` episodes.
- The legacy cartoon renderer is for existing compositions or an explicit creative choice.
- Don't force a new story into a dashboard, a stock scene or a previous episode's rig. Reuse devices from [DEVICES.md](DEVICES.md) where they demonstrate the sentence. Build a new device (in the library, with its settings exposed) when none does.

### Designing a shot

Write the visual sentence in words first (object, action, result), then choose the drawing or rig. Use a narrow palette and a consistent stroke hierarchy. Bring in new visual vocabulary only when the story needs it. Prefer evidence or recognisable physical objects to a dashboard.

### Visual-voiceover match

Every spoken claim has a matching on-screen event at the moment it is spoken. A stat builds as a pile or count of the thing being counted. A named entity appears. An action is shown happening. A static scene, a held sign, or a character flapping its mouth while the VO says something interesting fails the release gate. Check this line by line against the script.

### Story-world match

The world is the story's subject. An FBI story stages in an FBI world, a factory story in a factory. If no existing world fits, build or dress one before staging. Real staging logic still applies inside it.

### Shot budget and rhythm

- Budget 25-30 visual beats for a 60-70s episode (median 2.0-2.5s, about 4-4.5 per 10s). A beat is a hard cut, a camera reframe to a new subject, or a major in-frame event that changes what the viewer is looking at (a card slam, a burst, a scale jump). A continuous-camera world like ep2's board counts the same way. Small motion inside a held frame (a pulse, a counter tick) does not count.
- Never go more than 4s without a beat, unless it's a documented mechanism hold.
- First shot is 2.5s or less, then a cut or an in-frame event (flash, burst, camera kick). Never a slow settle.
- Burst montage at evidence or scale moments: 3-5 shots of 0.5-0.8s.
- Alternate context shots and mechanism shots. One idea per shot.
- Comprehension still outranks metronome cutting. A deliberate mechanism hold is allowed when the mechanism is animating, with the reason documented.

### Camera language

The camera tells the story. Every shot declares its move class: static lock, lateral truck, slow push (emphasis beats only), pull-back reveal, crane or pan. No two adjacent shots use the same class. A uniform push-in on every shot is a defect. Moves have anticipation, a change and a settled result. Never add drift just to beat a freeze detector.

### Transitions

Hard cut is the default (about 90%) and marks a new idea. Match cut links shape, size or position. Whip pan swaps subjects at the same energy. Zoom-punch emphasises a number or product. Dissolve marks a time or place shift. Record the choice for every boundary in the episode plan. Lint fails adjacent identical moves and transition-less monotony.

### On-screen text

- **Show, don't tell.** Captions carry the spoken words. No duplicate on-screen sentences, headline chains, persistent kickers or tell-text that repeats the VO. The one full-sentence exception is the hook line (section 7).
- Small anchored chips may name parts of an object as the word lands. Scenes explain, chips only label.
- No "ILLUSTRATION" tags or source citations on original graphics.
- Titles and captions live in a fixed safe overlay, never inside a scene-camera transform.
- Every text element is measured to fit with real font metrics. Never estimate glyph widths.
- No text is covered by another element in any frame, in motion. Check the whole beat, not the settled frame.
- Keep important numbers and diagrams large enough for a phone, and clear of platform UI.
- No source-ledger footer strip, red progress bar or circular avatar.

Detailed motion, parallax, board-layout and string rules are in [MOTION_LANGUAGE.md](MOTION_LANGUAGE.md).

### Real media and brand assets

- Use real screenshots, photos or footage when they supply evidence the illustration can't. Record URL, author, publication date, capture time, exact excerpt and rights note in the asset ledger.
- A public post isn't automatically licensed. Prefer permission, licensed media or official press assets. Never bypass paywalls, remove watermarks or expose private messages. Don't crop in a way that changes meaning.
- Credits go in the post description and `CREDITS.md`. Put a credit on screen only when the license requires on-image attribution.
- One exception for evidence: when a real screenshot or clip shows a third party's claim (a news article, a post, an official statement) and the VO doesn't name who said it, add a small source tag such as "AP, 21 Nov". That tag tells the viewer whose claim it is, so it counts as content. When the VO names the source ("The Associated Press says"), skip the tag.
- The cover keeps its small printed photo credit, because covers get shared without the description.
- The end card uses the real logo at `public/brand/twk-logo.svg`. Never redraw it.
- Study the reasoning behind other creators' work. Never copy their assets, mascot, exact shot or script.

## 7. Captions

- **Hook line:** for the hook sentence only (the first 2.5s or less), show the whole hook claim as one large text block in the safe overlay, readable in frame 1. It replaces the karaoke captions for that sentence, so the words never appear twice. Keep it to 8 words or fewer, with one red accent on the key word. Karaoke captions take over from the second sentence. This is the only full-sentence text in the episode.
- Karaoke phrase pages of 1-4 words, swapping every 1-2s even within one shot (`groupCaptionPages`: maxWords 4, maxDur 1.7s).
- Editorial theme: dark ink, active word in restrained red, stable lower-third block, no rubbery bounce on every word.
- Group on silence and punctuation. No mid-sentence flashes, no stage directions.
- Never cover the explanation, scene text or platform controls. Check line breaks in rendered frames.

## 8. Sound

- Narration comes first. Music is an emotional bed, not a wall.
- Every SFX belongs to a visible event, layered as anticipation, contact and decay. No whoosh on every cut.
- Each scene has its own sonic signature (server fans in a server room, street ambience in town).
- A brief music drop can give a failure or punchline more weight than another impact.
- Stereo movement must survive mono. Listen on headphones and a phone speaker.
- Keep voice, music and SFX stems plus timing metadata so the mix can change without a new voice take.
- Loudness: -15 LUFS ±1.5, true peak at or below -1.0 dBTP.

### Music

- **Fresh track every episode.** Never reuse a bed across episodes.
- Tracks must be cleared for commercial use on each platform (brand accounts can't use commercial popular music). Per-platform routes and rights evidence follow [PUBLISHING_SYSTEM.md](PUBLISHING_SYSTEM.md). Always keep a narration-plus-SFX export for native platform music.
- The procedural fallback seeds from the episode directory, so no two episodes share a bed. It's a stopgap. A licensed, per-platform-cleared track is the target.
- Music never ends early or restarts audibly. Loop short tracks with an equal-power crossfade (about 1.5s) at every seam.
- **Outro:** music stays ducked after the last word, glides down about 8 dB under the end card, and fades over 1.2s at video end.

## 9. Cover

A cover is a value promise. A scrolling viewer gives it about 2 seconds and asks what watching does for them.

- Headline of 3-5 words naming concrete stakes or payoff for the viewer, not the topic. "What police know about you" passes. "Ninety thousand doors" fails.
- A curiosity line must still promise value ("Is your name in it?").
- Readable at thumbnail size: few words, large type, high contrast, one accent colour on the key word. Check the actual pixels at small size.
- Licensed real photography, paper/ink/red palette, 1080x1920.
- Never overclaim an unconfirmed story.
- Two-option shortlist. The owner picks unless he delegates.
- Log the shipped variant and its performance in `docs/COVER_PERFORMANCE.md`, failures included. Retire losing patterns explicitly.

## 10. Review and release gates

Run these in order before any cut goes to the owner. Automated commands and the scoring rubric are in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

1. **Defect gate.** Full-resolution sweep of every shot: text occlusion, clipped labels, off-screen subjects, caption collisions. For every beat, check frames at the entrance, the hold and the midpoint of every camera move.
2. **Three-pass watch.** Picture without sound: does it explain the change? Sound without picture: does the narration feel directed? Then the full combination at phone size without pausing. Judge transitions as motion, not stills.
3. **Line-by-line match.** Every spoken claim has its on-screen event (section 6).
4. **Benchmark.** Compare side by side with current top creators on pacing, visual density, motion polish and sound. Report the honest gap per dimension. A gap you can't close gets named with a plan.
5. **Skip test.** Any skippable beat (a sagging shot, lagging caption, screensaver camera move, energy drop) is a fail.

Technical QA (loudness, peaks, duration, black and freeze checks) doesn't certify art direction, truth, performance or understanding. The Gemini advisory (`scripts/ai_review.py`) is a source of hypotheses to check on real frames, never the bar. Never weaken an existing gate silently.

## 11. Production discipline

- No new full workflow run just to see if it works. Prove it with a short local render and a short free voice audition first.
- No stage re-runs completed work ([PIPELINE.md](PIPELINE.md)). Render defaults: 28 shards, x264 veryfast, crf 18.
- Report what was actually verified, and which audio is old and which is new.
- Never overwrite a delivered release with an unapproved cut, and never silently edit a published video.
- No spend without the owner's scoped approval. Existing subscriptions (Adobe enterprise) are authorised. Firefly credits need approval and an exact cost first.
- Cloud rendering (Remotion Lambda, Oracle Always Free) is off the table unless the owner raises it.
- Keep researching tools and GitHub plugins that improve editing, SFX or visual richness, and fold the wins into the pipeline.

## 12. Learning loop

- After publication, the metrics automation reviews views against the 10k bar. Lessons go into the next episode's pre-production notes.
- Log each published variant with `experiments.py log` (one hypothesis, one deliberate change) and compare matched cohorts with `experiments.py report`.
- Record follower conversion and retention as outcomes, never guarantees. One winner is never a formula.

## Engine reference

- 3D worlds: office, town, server_room, tarmac, courtroom, plus the FBI building. Actors: worker, boss, engineer, pilot, bot, kid, parent, officer, soldier. Prop kinds include desk, screen, server, coin, plane, car, clock, with typed actions (counterValue, beaconIntensity, clockHands, leverAngle).
- Editorial scenes (`shot.graphic`): the Boeing set (counter, overflow, power, reset, hook, lab, stakes, question, clock, storage, odometer, directive, payoff) and the `ncic-*` set. These are pilot vocabulary, not universal templates.
- `board-ep2` (`BoardEpisode.tsx`) is the ep2 case-board composition.
