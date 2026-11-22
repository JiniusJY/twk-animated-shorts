# TWK content system

## The standard episode flow (standing, per owner 22 November 2026)

When the owner says "episode N" (or just approves a topic), the whole pipeline runs without him driving each step: trend and creator research, topic pick with viral-potential check, script, scene production, voiceover, render, cover shortlist under the cover rules, quality gate. He is shown the final video (and cover options if he has not delegated the pick) and approves before anything publishes. Approval of the final cut is the one step that is never skipped; everything before it is the system's job, not his.

Each stage follows its section below: pre-production research, creative contract, cover design, then the release and learning rules. Report what was verified at each gate, and never ship a cut that has not passed the quality gate and his approval.

Updated 21 November 2026 after review of the Boeing episode. The editorial illustration direction was accepted. That acceptance is not a claim that every shot or voice performance is approved.

Updated 22 November 2026 after the owner's review of the first NCIC cut: the all-2D editorial rendering was rejected ("overall visual, transition all degraded from ep 1"). The staging rule below (story beats play in the 3D world) is now a HARD requirement and supersedes the all-editorial direction for shot staging. The owner also set a standing performance target: every episode must be built to clear 10,000 views, reviewed against that bar after publication, until he raises it.

## Pre-production research (standing, per owner 22 November 2026)

Before any episode enters production, without being asked each time: research the candidate topic deeply and check it against what is working for top tech shorts creators. Record the evidence in the episode's topic card or plan notes. This is a required pre-production step, not a promise of virality; findings inform selection and packaging and never justify an unsupported claim.

GROUNDING RULE (owner, 22 November 2026, "maybe ur research is bad"): motion, pacing, transition and hook decisions must be grounded in studying ACTUAL current top tech-shorts videos - frame-level analysis of real cuts (via the Bright Data TikTok/shorts scrape and direct reference pulls), not articles about virality. Writeups (including every source listed below) are secondary context, never the primary evidence. Each episode's pre-production refreshes this: pull real recent videos from the target creators, note their cut cadence, camera moves, transition types and hook framing, and record the observed evidence in the plan notes.

MEASURED PLAYBOOK (22 November 2026 frame-level study of Fireship, Cleo Abram, Mrwhosetheboss, johnnyytech, BBC shorts - evidence grids retained). Apply from episode 3 in full; episode 2 folds in the hook event, transition palette and render speedups only:
- SHOT BUDGET: 25-30 shots for a 60-70s episode (median 2.0-2.5s, ~4-4.5 cuts/10s). Long single-take shots read slow against the genre.
- FIRST SHOT: <=2.5s, then a cut or an in-frame visual event (flash, burst, camera kick) - never a slow settle.
- BURST MONTAGE: at evidence/scale moments, 3-5 shots of 0.5-0.8s. Lint allows sub-1s shots inside a declared burst while still flagging metronome monotony.
- CAPTIONS: karaoke phrase bursts of 1-4 words, swap every ~1-2s even within one shot (the engine's groupCaptionPages already does this: maxWords 4, maxDur 1.7s - verify the rhythm in rendered frames, do not redesign).
- VO NONSTOP: no gap >0.3s except scripted tension pauses from the cue pass.
- TRANSITION PALETTE: hard cut is the default (~90%); match cut for scale/shape links; whip pan for same-energy subject swaps; zoom-punch on number/product emphasis. Dissolve marks time/place shifts. Every boundary picks deliberately.
- EVIDENCE INSERTS (engine work, ep3+): a shot type for real B-roll/screenshots with an auto top-left "* SOURCE: X" tag, matching how Cleo Abram grounds claims.
- MUSIC: the genre is voice-driven; trending audio is not the growth lever, packaging is. The fresh-track-per-episode rule stands as hygiene, not as a virality bet.
- RENDER SPEED (adopted 22 November): shards cap 16->30 (default 28; the tail was shard-bound at 15.6 min vs 4.0 for equal ranges), x264 preset veryfast + crf 18 (indistinguishable for toon content), more to come (validate+prepare merge, storyboard skip on rebuild runs). Remotion Lambda / cloud rendering is OFF the table (owner decision 22 Nov: not truly free, saving doesn't justify it) - do not build it unless he raises it again.
- REDO COST (adopted 22 November): a failed shard never costs a full re-render. render.yml runs fail-fast: false (one bad shard doesn't cancel the other 27) and each shard retries its render once in-step. Recovery: "Re-run failed jobs" on the run re-renders ONLY the failed shards; chunk artifacts are run-scoped, so publish merges the kept chunks with the retried ones.

What the current evidence says (checked 22 November 2026; re-verify as it ages):

- **Genre:** tech shorts that travel are "this affects YOU" stories: breaches, scams, your data, your money, your phone. Fear and outrage outperform neutral explainers. Failure-behind-the-headline explainers (Boeing ep1, NCIC ep2) sit inside this genre. High-concept comparisons and superlative stunts ('$10 vs $10,000', 'World's X') are Mrwhosetheboss's most repeatable reach engine but need props/budget our illustrated format can borrow only as framing devices.
- **Openers:** the bold claim is the most common opener among standout tech TikToks (33% of 1,663 analyzed), ahead of question hooks (12%) and story opens (11%). ViralMint's 943-viral-Short study found textbook hook formulas (questions, numbers, POV) do NOT separate hits from same-creator flops; what hits share is starting instantly (first word ~0.1s) and being short (median 21s). So: open on the boldest truthful claim we can support, speak immediately, and do not trust formulas over a genuinely surprising fact.
- **On-screen text hook:** a hook written on screen went with 1.79x the views of same-account videos without one (Postdom, 1,272 TikToks/Reels). Every episode's first frame carries a written version of the hook claim.
- **Endings:** a "let me know below" ending went with 0.61x views (Postdom). End on payoff + follow CTA, never comment-bait; discussion prompts live in the first/pinned comment, not the video.
- **Mechanics of pacing (Fireship study):** ~13 hard cuts/minute, ~3s median shot, 0% talking head; meme/stock inserts act as paragraph breaks after each explanatory beat (35% of frames); diagrams are additive, assembling one element per narrated clause (25% of frames). Our editorial scenes must assemble in sync with the narration the same way: no finished diagram explained after the fact. Comprehension still outranks metronome cutting.
- **Length:** tech TikTok standouts cluster at 30-60s; viral Shorts median is 21s. Prefer the short end of our 45-65s default when the story fits; never pad to a number.
- **Humor:** dry wit in the payoff works (Boeing's "oldest fix in IT"); forced funny kills retention. Write jokes only when the writing is actually funny.

Sources: https://www.writepanda.ai/blog/fireship-editing-style-measured/ ; https://viralmint.net/blog/viral-hooks-data-study/ ; https://viralvault.studio/niches/tech ; https://postdom.com/research/what-makes-a-video-go-viral ; https://growwly.co/youtube-playbooks/@mrwhosetheboss ; https://blog.youtube/creator-and-artist-stories/cracking-the-code-to-youtube-shorts/

## Creative contract

A short should give the viewer one new understanding. Every cut either advances the question, demonstrates the mechanism, changes scale, supplies evidence or pays off the promise. Decorative motion is not evidence of a good edit.

### 1. Editorial research

Choose one surprising, supportable question. Record primary sources, exact supported wording, dates and caveats in the claim ledger. Differentiate confirmed behavior from proposed mechanisms. Do not draw speculative internals as a factual teardown. Do not invent a quote, certificate, newspaper or official document: illustration labels must be visible where those forms are used.

### 2. Performance and script

Write spoken English, not an article read aloud. Open on the interesting fact, without a channel intro. The first three seconds must establish the specific tension, question or supported consequence in both voice and picture; do not spend them on a logo, greeting or generic setup. This is an editorial design rule, not a claim that three seconds alone determine distribution. Deliver the hook's promise and preserve uncertainty labels. Build curiosity, then answer it. Default length is roughly 45-65 seconds only when the story fits; do not race a long script to hit a number. Preserve sources when shortening.

Use `voice.direction` for overall character and `voice.beats` for local sentence-entry intent. One primary intent per sentence, spaced naturally. Put the exact phrase in `before`; missing or duplicate anchors fail. Do not put stage directions in captions.

VOICE EXPRESSIVENESS STANDARD (owner, 22 November 2026, after he heard episode 2's read as "super monotonous"): the narration must sound like a person telling a story they find fascinating, not a newsreader on one register. CUE ARCHITECTURE IS A REQUIRED SCRIPT PASS, not optional (research verdict, 22 November): monotony is structural (a flat intensity metronome), and the fix is an energy arc - hush beats ([whispering]) + emphatic beats + placed pauses ([pause] / [long pause]) - written into every script before render. Every sentence carries an S2 cue or direction; flat sentences are a defect. Production settings: temp 0.8 / topP 0.8 (higher variance risks drift over a full script). The free model (`s2.1-pro-free`) is the confirmed standard after the 22 November A/B (aggressive cues beat the plain read on objective prosody vs human reference tracks); if the owner still calls a full read robotic, escalate with the priced paid options (Fish S2 Pro pay-as-you-go ~1 cent/episode, ElevenLabs) - spend on voice is his decision, never silent. Never fall back to a model that may charge without that approval; any error stops.

Audition the hook in three genuinely different deliveries. Judge intelligibility, warmth, emphasis, contrast and absence of cue leakage. More temperature does not equal better performance. Reject an audition that is robotic, rushed or mispronounced.

### 3. Shot design

HARD REQUIREMENT (owner, 22 November 2026): story beats play in the 3D world - actors, props and camera moves carry the episode. 2D editorial cards (`shot.graphic`) are for data beats only (number drums, document facsimiles, diagram payloads the 3D props cannot show). An episode plan in which every shot has a graphic renders all-2D and FAILS the structural lint gate; it must not reach render. Ep1 (Boeing, 3D characters and camera moves) is the floor for visual quality; the benchmark is top-tier tech storytellers, not our own back catalogue.

STORY-WORLD MATCH (hard rule, owner, 22 November 2026): the world must be the story's subject. An FBI story stages in an FBI world - federal building exterior, CJIS-branded interiors - not a generic street. A factory story stages in a factory. If no existing world is the story's subject, dress or build one in `worlds.ts` before staging; do not substitute the nearest stock world. Real-world staging logic still applies within the story world (a traffic stop happens on a road, but the road belongs to the story's setting, dressed accordingly).

CAMERA LANGUAGE (hard rule, owner, 22 November 2026): the camera is a storyteller, not a screensaver. A uniform push-in on every shot is a defect ("why does it alw auto zoom in???"). Every shot declares its move class - static lock, lateral truck, slow push (emphasis beats only), pull-back reveal, crane, pan - and no two adjacent shots may use the same class. Shot boundaries use the transition vocabulary: hard cut (new idea, the default), whip pan (same energy, new subject), match cut (related shape/scale/position), dissolve (time or place shift), chosen to connect meanings and recorded per boundary in the episode plan. Transitions are motivation, not decoration; lint fails adjacent identical moves and transition-less monotony.

First draw a visual sentence in words: object, action, result. Then choose the drawing or rig. Keep important numbers and diagrams large enough for a phone. Use a narrow palette and consistent stroke hierarchy. Introduce new visual vocabulary only when needed.

- Use evidence or recognizable physical objects, not a dashboard for every story.
- Match-cut related shapes, sizes or positions when continuity helps. A number drum can become an odometer, then return to explain overflow.
- Use hard cuts for new ideas. A transition should connect meanings, not hide indecision.
- Movement needs anticipation, a change and a settled result. Hold long enough to understand the result. Do not add constant camera drift to evade a freeze detector.
- Do not imitate a creator's proprietary assets, mascot, exact shot or script. Study the reasoning behind the work.

Current engine support: a shot without `graphic` renders in the 3D toon world (worlds: office, town, server_room, tarmac, courtroom; actor presets: worker, boss, engineer, pilot, bot, kid, parent, officer, soldier; prop kinds: desk, screen, book, box, server, coin, plane, pile, sign, chart, crate, car, clock, gcu, switch, with typed actions such as counterValue, beaconIntensity, clockHands, leverAngle). This is the default stage. `shot.graphic` selects a purpose-built 2D editorial scene; `counter`, `overflow`, `power`, `reset`, `hook`, `lab`, `stakes`, `question`, `clock`, `storage`, `odometer`, `directive`, `payoff` are implemented for the Boeing pilot, plus the `ncic-*` set. These are a pilot vocabulary, not universal templates. Future topics should add a researched rig when these concepts do not fit.


UPGRADE DIRECTIVE (owner, 22 November 2026, effective after episode 2 ships): raise transitions and sound design to the level of top-tier tech explainers (the Vox lineage: Johnny Harris, Fern, Cleo Abram). What their edits do that this pipeline must learn: transitions are motivated movement that connects ideas - whip pans that turn one subject into the next, match cuts on shape, size or position - never decoration; sound belongs to visible events with anticipation, contact and decay layers, and each scene has its own sonic signature. Build into the pipeline: (a) a transition vocabulary between shots - whip pan and match cut alongside hard cuts, picked to connect meanings; (b) per-scene SFX cues tied to 3D world events (server fans and alert chirps in server_room, street ambience in town, office room tone), not one generic whoosh per cut; (c) transition choice recorded per shot boundary in the episode plan so the whole-edit review (section 7) can judge them as motion, not stills.

### 4. Voice-first timeline

Each shot after the hook has a short, unique `anchor` phrase in the speech. Real word alignment maps the authored start to that phrase. `editorial.py` builds a monotone piecewise map; `audio_bed.sync_episode` uses that map for shots, keyframes, action durations, visual FX and sound cues. Approximate proportional captions cannot drive an anchored release.

Anchors are not magic: confirm the intended moment in the final video. Verify intra-shot events, which still use authored relative timing. A later wording or voice change invalidates the previous timing proof. The cache hash includes script, direction settings, voice, alignment path and model policy.

### 5. Caption rhythm

Default to editorial captions: dark ink, active word in restrained red, no rubbery every-word bounce, a stable lower-third block. Use short phrase pages, avoid mid-sentence flashes, and keep captions separate from diagram labels. Review real rendered text rather than assuming a word count guarantees good line breaks. Include silence and punctuation in phrase grouping. Captions must not cover the explanation or platform controls.

### 6. Sound edit

Narration is primary. Music supplies an emotional bed, not a constant wall. Sounds belong to visible events. Use separate layers for anticipation, contact/mechanism and decay; do not add a whoosh to every cut. Stereo movement must survive mono playback. Brief reduction of music can give a failure or punchline more weight than another loud impact.

The current procedural sounds are a cleared starting point, not a claim to equal bespoke recorded foley. Listen on headphones and a phone speaker. Keep voice, music and SFX stems and timing metadata so the mix can be revised without another voice generation. Retain the master and stems with the prep artifact, not only the combined track.


MUSIC RULE (owner, 22 November 2026): never reuse the same background music across episodes. Every episode ships with a fresh track. Because the channel publishes as brand/business accounts, tracks must be cleared for commercial use on each platform - TikTok Commercial Music Library, Meta Sound Collection for Instagram/Facebook, YouTube Audio Library or an equivalently licensed track. Commercial popular music is not usable directly by brand accounts. Per-episode selection and rights evidence follow PUBLISHING_SYSTEM.md. Pipeline note: `bgAudio` points an episode at a licensed track file; when it is unset, `build_music` generates a procedural bed from `musicMood` with a fixed seed, so two episodes sharing a mood currently ship the SAME bed, which violates this rule. The procedural fallback is a stopgap, not compliance: the licensed-track workflow (fresh track sourced per episode, rights-checked per platform) is the target for episode 3 onward. Episode 2 exception (owner, 22 November 2026): the rule arrived while the ep2 render was already running; ep2 ships with the procedural bed and a swap to a fresh trendy track is considered after the owner's review of the cut.

### 7. Whole-edit review

DEFECT GATE (standing, owner, 22 November 2026): nothing with a visible defect reaches the owner. Before any cut goes to him, review every shot in full-res frames (text occlusion by actors or props, clipped labels, off-screen subjects, caption collisions) plus the full watch-through below; the owner should never be the first to catch an issue. His standing instruction: "u shldnt need my input for all these" - only finished work gets shown.

First watch without sound: does it explain the change? Then listen without picture: does the narration feel directed? Then watch the complete combination, at phone size, without pausing. Review caption switches, cut timing, internal event timing, emotional progression and payoff. Inspect transitions as motion, not only stills. A pleasing screenshot is not completion.

Technical QA checks loudness, peaks, duration, black and freeze segments. They do not certify art direction, truth, performance or viewer understanding. A deliberately static explanatory hold may need a documented exception instead of useless motion. Never weaken an existing gate silently.

Future renders omit the bottom source-ledger footer strip (the small 'Simplified illustration / Sources in episode claim ledger' line) and the bottom red progress bar/circular-avatar decoration, per the owner's 22 November review. Do not apply this as a silent edit to already-published videos. Keep the claim ledger and caption/description sources. Retain meaningful in-scene uncertainty labels, such as the unverified internal-counter theory; removing decorative footer chrome does not remove the duty to distinguish theory from established fact.

### 8. Release and learning

PERFORMANCE TARGET (standing, owner, 22 November 2026): every episode is built to clear 10,000 views; views cannot be guaranteed, so the levers that can be - topic selection, hook strength, visual quality, packaging - are all optimized for that bar before the cut is shown. After publication, each episode's actual views are reviewed against the 10k bar by the posting/metrics automation, and the lessons (what over/under-performed and why) are written into the next episode's pre-production research. The bar stands until the owner raises it.

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

New episodes include a short branded end card after the completed story: Follow @techwhoknows. Keep the handle exact, preserve the payoff before the card, and avoid extra generic like/comment/share requests. Per the owner's 22 November instruction, the follow CTA must also be spoken in the voiceover, not only shown visually. Write one brief, natural follow line into the script, for example 'Follow TechWhoKnows for the next one,' and verify it is audible in the final mix. A specific next-story promise must be truthful and grounded in the actual content plan; do not invent an upcoming episode or date. Test an earlier voiced follow promise when it fits without delaying the hook or answer; do not automatically duplicate the ask at several points. New-episode creation supplies the end card and voiced CTA by default; the audio timeline reserves their actual duration. Record follower conversion and retention as outcomes to measure, never guarantees. This supersedes the earlier visual-only/no-extra-narration rule for future episodes, not the approved published master.

## Evidence media and brand assets

Use real screenshots or video excerpts when they supply evidence or context the illustration cannot. Preserve the original URL, author/account, publication date, capture time, exact excerpt and a rights/usage note in the episode asset ledger. A public X post is not automatically licensed for unrestricted reuse. Prefer permission, licensed media, official press assets or a limited, justified editorial excerpt. Do not bypass paywalls, remove watermarks or expose private messages. Attribute clearly on screen, distinguish a claim from a verified fact, and avoid crops or edits that change meaning. Do not invent a screenshot, quote, metric or engagement count. Keep text legible on a phone. Source media is optional per story, not decorative B-roll.

The end card uses the actual TechWhoKnows logo from the website brand asset, stored at `public/brand/twk-logo.svg`. Do not redraw or improvise the logo. Preserve its proportions and contrast. Website logo provenance is documented in `public/brand/README.md`. The current Boeing render does not add unrelated social footage.

## Cover design (viewer psychology, standing per owner 22 November 2026)

A cover is a value promise, not decoration. A viewer scrolling the feed gives it about two seconds and asks one question: what does watching this do for me. Every cover must answer it.

Rules:
- Headline is 3-5 words, concrete stakes or payoff for the viewer, not the topic. Say what the viewer learns or what changes for them ("What police know about you"), not a fact about the story ("Ninety thousand doors").
- Curiosity lines are allowed only when they still promise the value ("Is your name in it?" promises a personal check; a bare riddle does not).
- Readable at feed-thumbnail size: few words, large type, high contrast, one accent colour on the load-bearing word. Inspect the actual pixels at small size, not only at full resolution.
- Real licensed photography with the credit printed on the image, paper/ink/red palette, 1080x1920.
- Two-option shortlist per episode; the owner picks unless he delegates the choice.
- Honesty rules still apply: a value line must not overclaim an unconfirmed story (for an apparent breach, promise what the viewer will understand, not unverified impact).

Owner evidence for this system, 22 November 2026, on the first NCIC cover draft ("Ninety thousand doors."): "if im a viewer. i see the cover? im like ??? what value does it serve me." A clever topic line failed the two-second test; a viewer-stakes line passes it.

Feedback loop: cover performance is training data. For every published episode, record the cover variant shipped and its performance (CTR / swipe-past rate / retention where the platform exposes it) in `docs/COVER_PERFORMANCE.md`, fed by the posting/metrics automation. Pre-production for each new episode includes reading that log and carrying forward what worked; losing patterns get retired explicitly. The loop only works if the data is recorded honestly, including failures.

## Publishing package

Every episode also follows [PUBLISHING_SYSTEM.md](PUBLISHING_SYSTEM.md): platform-specific titles, captions and relevant hashtags; truthful hooks; per-platform music selection and rights; approved publishing manifests; destination and processing checks; and post-release measurement. These rules govern future releases. They do not mean an uploader or metrics monitor is already implemented.
