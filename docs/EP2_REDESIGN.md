# EP2 v3 redesign — evidence from reference footage + scene plan

Status: design agreed with self from direct reference study 2026-11-22; implementation next.
Publication of ep2 remains HELD until the rebuilt cut passes full-motion review (parent + owner).

## Reference studied

scroll.engineer — "Your Apple Watch can read your heartbeat" (TikTok 7695160547297217806,
1.9M views, 84s, 720x1280). Studied via 19 frame captures across the full runtime in the
cloud browser (YouTube/yt-dlp download was bot-walled; the YouTube "@scroll.engineer"
channel is an impostor fan account — the real one is on TikTok/Instagram).

### Observed grammar (what "their level" actually is)

1. **One continuous physical world.** The whole video lives in one place (wrist + watch +
   runner). Scenes are different SCALES of that world, not different backdrops.
2. **Scale-jump rhythm every ~4-6s.** context (runner at dusk) -> product beauty shot ->
   cross-section (skin) -> micro (capillaries) -> data (waveform rising out of the skin).
   Mechanism shots alternate with "so what" context shots. No shot outstays one idea.
3. **The mechanism IS the visual.** VO says "green LEDs are flashing" -> macro of the
   sensor array flashing at that moment. "pushes more blood through" -> capillary swells.
   Nothing decorative; every shot demonstrates the sentence being spoken.
4. **Anchored info chips.** Small dark chips ("GREEN LED", "LIGHT SENSOR", "BEAT TO BEAT")
   pinned to the object with a leader dot, appearing as the words land. Low text density;
   the scene carries the explanation, chips only name parts.
5. **Inline honesty tags.** "Magnified illustration", "Recreated", "Swelling exaggerated",
   "Exaggerated" — small, unobtrusive, always present when the visual is an approximation.
   (Matches our existing guardrail culture; keep ours and adopt the placement discipline.)
6. **Data viz emerges from the scene.** The beat-to-beat waveform rises out of the skin
   plane with marker pins; it is not a pasted chart card.
7. **Karaoke captions** 1-4 words, current word highlighted, bottom-center. (We have this.)
8. **Dark cinematic grade, one glow accent color** carries the "signal".
9. **Motion is purposeful**: camera always traveling toward the next reveal, or the
   mechanism itself animating. No idle drift, no parked frames — but also no motion for
   motion's sake.

### The gap in ep2 v2 (honest)

Our board scenes DESCRIBE (cards with text stating facts); reference scenes DEMONSTRATE
(the mechanism acting while the sentence lands). Our worst spans are description parked
on screen: the second-breach card sits ~4s with nothing happening; the opening string
travels with no origin or destination; the three UNKNOWN questions are static cards.

## Redesign principle for v3: the board becomes a living system

Keep the approved case-board world, but make it DEMONSTRATE the story. New primary
device: **query pulses** — light pulses that travel along the red strings. A query is
the atomic action of this story (a plate is run, an agency checks a record, an intruder
pulls data). Pulses turn narration into mechanism without any simulated system UI
(drawn metaphor only — guardrail-safe).

### Scene-by-scene against the shipped VO (68.2s, times from words.json)

- **HOOK 0-3.4s** "Someone may have just broken into one of the most sensitive databases
  in America." Open already moving: camera low on the board, a string leads from
  off-frame INTO the pinned NCIC card; the card flips face-up as the sentence lands.
  String has origin and destination. No more draw-from-nowhere.
- **SYSTEM 3.4-15.7s** traffic stop. The photo pins in; a pulse leaves the photo and
  travels the string to the NCIC card, which lights and stamps its name out letter by
  letter as "National Crime Information Center" is spoken (10.3s). The pulse IS
  "the answer routinely comes from one FBI system."
- **DRAWERS 13-24.4s.** Camera dives toward the cabinet; drawers fly open in staggered
  waves as "21 drawers" lands; record counters (12M, 10M) tick up as faint pulses keep
  arriving. Numbers punch large in the fixed safe overlay at 20.2s and 22.4s, synced to
  the VO, over a dimmed scene (reference-style emphasis, overlay-safe).
- **ALWAYS-ON 24.4-29.6s.** Terminal types ONLINE 24/7/365; pulses from agency nodes
  arrive CONTINUOUSLY (that is what "never closes" looks like); "since January 1967"
  chip; office-hours card crossed out.
- **WEAKNESS 30-37.5s.** Pull back to the hub; 18 agency nodes with pulses flowing;
  "90,000+" punches in overlay; the drawn padlock hangs open and pulses pass THROUGH it
  unimpeded — "a door the FBI can't lock" demonstrated, not stated.
- **BREACH 37.5-47s.** AP card slams; headline assembles line by line on the spoken
  words; then a FOREIGN pulse — a string entering from OFF the board edge, wrong color
  temp or moving against the flow — touches the hub. The three questions hit as big
  word-synced overlay punches (WHO GOT IN / HOW / ANYTHING TAKEN, each with the spoken
  words at 43.1s+) with UNKNOWN stamps slamming. Not parked cards.
- **SECOND 47-56.8s.** Second card + CLAIMED stamp slam on "claimed" (48.9s); a crack
  creeps across that corner of the board; caption chip "a claim, not proof". No dead
  dwell — crack spreads continuously while spoken.
- **STAKES 56.8-61.7s.** Fast pull back along the strings to the traffic-stop photo;
  a final pulse arrives at the photo as "every line can put a real person in handcuffs"
  lands; the string network glows once.
- **OUT 61.7-68.2s.** End card.

### What changes vs v2

- Every beat gets a mechanism animation locked to its spoken sentence (pulses, drawer
  waves, crack spread) — description replaced by demonstration where possible.
- Overlay number/question punches replace some on-card text (less reading from cards).
- Opening string has clear origin/destination; foreign-pulse device makes the breach
  VISIBLE instead of only labeled.
- Camera moves only with purpose (travel to next reveal); purposeful holds allowed when
  the mechanism is animating. No idle bobbing-as-fix.
- Keep: all honesty labels (APPARENT BREACH / UNKNOWN / CLAIMED / single-source),
  90,000+ imprecision, photo credit, captions, shipped VO, music route, board aesthetic.

### Verification plan (before parent review)

1. Full-motion frame QC: contact strips every 0.5s, checked for text occlusion,
   parked frames outside mechanism holds, caption sync.
2. Freeze diagnostic (ffmpeg freezedetect) as a check, not a score.
3. Audio re-sync of SFX to corrected visual timings; loudness chain unchanged
   (-15.0 LUFS, TP-safe export variants).
4. Gemini advisory as one input; parent reviews the actual cut in motion before the
   owner sees it.

### Reusable editorial decisions (feed the content-system outcome)

- Mechanism-on-words: every explanatory sentence gets its demonstrating visual at the
  moment it is spoken. (This is THE reference rule.)
- Scale-jump rhythm: alternate context and mechanism shots; one idea per shot.
- Anchored chips name parts; scenes explain; cards are for provenance (sources,
  claims, credits), not exposition.
- Approximation tags stay inline wherever a visual is a metaphor.
