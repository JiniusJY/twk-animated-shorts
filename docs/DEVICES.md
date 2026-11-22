# Device library

Reusable visual building blocks, extracted from shipped episodes. Code lives in `src/engine/devices/` (import from `./devices`). Tests are in `tests/devices.test.ts`.

The storyboard stage picks devices from this catalog first. Each row says which kind of sentence the device demonstrates, because the rule is visual-voiceover match (CONTENT_SYSTEM section 6): the device acts at the moment its sentence is spoken. A new episode should need one or two new devices at most. When it does, build them here with settings exposed, not inside the episode file, and add a row.

Ep2 (`src/engine/BoardEpisode.tsx`) is the reference episode. It's now only layout data and word timings wired to these devices, and it renders identically to the pre-extraction version (every frame compared, differences below 50 dB PSNR, the same as the renderer's own run-to-run noise).

## Catalog

### World and camera

| Device | Demonstrates | Notes |
|---|---|---|
| `makeBoard(spec)` | One continuous world where the story is a chain of connected evidence | Data in, geometry out: card rects, entrance frames, card-to-card strings, held shots. Strings, pins, string timing and camera framing are all derived. Pair every board with a layout test like `tests/boardLayout.test.ts`. |
| `cameraAt` (from `makeBoard`) | Held shot per topic | Still while the topic is spoken, eased travel of `trans` frames starting on the next topic's first word. Each shot counts as a visual beat. |
| `kickEnvelope`, `shakeEnvelope` | Emphasis on a key word | Brief zoom kick (decays in about 0.2s) or a hard shake. Frames come from the word alignment. Use sparingly: ep2 has 9 kicks and 1 shake in 67s. |
| `parallaxLayer` | Depth | Background plane at about 0.45x with blur, main plane at 1x. No idle drift. |

### Cards and text

| Device | Demonstrates | Notes |
|---|---|---|
| `PaperCard` | A fact, a name, a document | Spring landing plus idle sway. Optional stamp slam exists, but uncertainty stamps are off by rule. |
| `PhotoCard` | A real-world scene (licensed photo) | Slow Ken Burns push. Credit goes in CREDITS.md and the description. |
| `LineAssemble` | A report or claim being read out | Each line appears on its spoken word. Use for "X says Y" sentences. |
| `LetterReveal` | A name being spelled out as it's said | Characters fade in one after another. |
| `FlipRevealCard` | Hook: something hidden gets broken into, then named | Face-down card cracks, flips, letters land. |
| `Pin` | Something being attached to the board | Used by `StringNetwork`, usable alone. |

### Signals

| Device | Demonstrates | Notes |
|---|---|---|
| `StringNetwork` | Connections between things | Hand-drawn strings draw on, pins at both ends, optional network glow. |
| `QueryPulse` | Data or a request travelling ("a plate is run", "the answer comes back") | Repeats on a period. Reverse the route for a reply. Drawn metaphor, not system UI. |
| `Shockwave` | Alarm, breach, impact | Expanding rings on given frames. |

### Objects

| Device | Demonstrates | Notes |
|---|---|---|
| `DrawerGrid` + `CategoryChip` | A store of many categories, each named in turn | Drawers open in a stagger. Each named category lights its drawer and the chip names it. |
| `Terminal` | Always-on status, a count | Types a status line, optional counter that lands on supported wording ("90,000+"). Never a fake readout of the event itself. |
| `StatusDots` | Many things switching on / online | Lights switch on one after another. |
| `Strike` | Something that no longer applies ("business hours") | Two hand-drawn red strokes. |
| `Padlock` | A door that can't be locked, open access | Draws on, then the shackle swings open. Never show traffic passing through. |
| `NodeBox` + `ringRects` | Many parties connected to one hub | Small paper nodes with a building icon around a centre. |

### Overlay

| Device | Demonstrates | Notes |
|---|---|---|
| `PunchOverlay` | A number or question that must land ("24/7", "WHO GOT IN?") | Fixed overlay, outside the camera, one at a time. Supported wording only. |
| `dimTrack` + `SceneDim` | Focus on a punch or a dark moment | Windows of fade-in, hold, fade-out. |

## Building a new board episode

1. Copy `src/engine/boardLayout.ts` as the episode's layout: card rects, `ENTER` frames, `LINKS`, `SHOTS`. Take frames from the take's word alignment.
2. Copy `tests/boardLayout.test.ts` and point it at the new layout. It fails if a string or pin touches a card, or cards overlap.
3. Write the episode component like `BoardEpisode.tsx`: devices plus timings, nothing hand-drawn inline.
4. If a sentence has no matching device, build a new one in `src/engine/devices/` with its settings exposed, test it, and add a row here.

Not every story belongs on a case board. The board fits evidence-chain stories (breaches, investigations, systems). A story about a physical mechanism may need a different world. The signal, card, object and overlay devices work outside the board too.
