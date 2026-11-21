# TWK Animated Shorts — Low-Token System Guide

Never read `references/` frames/sheets or rewrite `src/engine/` on normal episode runs.
The 3D cartoon look, ink outlines, DOF, colour grade, and bean-head character rigs live in `src/engine/`.

## One-Prompt Workflow (Minimum Tokens)

1. **Scout trending stories (0 LLM tokens):**
   ```bash
   python3 scripts/scout.py --top 8
   ```
   Pick one story with a paradox hook + physical/visual cause-and-effect + everyday analogy.

2. **Write the episode (`src/episodes/<slug>/episode.json`):**
   Follow `references/STYLE_BIBLE.md`:
   - 45–65 s (`~3.7 words/s`), voice starts immediately, zero intro/outro/CTA, English only. Captions are rendered by the engine and are ON by default (phrase pages, 2–6 words, semantic emphasis, lower-third safe zone); set `captions.enabled: false` only for a caption-free master.
   - Formula: **Paradox hook (sentence 1)** → **Concrete setting** → **3–4 escalating beats** → **"Wait, ...?" mystery** → **"You see," everyday analogy** → **Ironic payoff**.
   - Keep `episode.json` compact (~200–300 lines) with **12–15 varied shots across 3–4 distinct `shot.world` locations** (`office`, `town`, `server_room`, `tarmac`, `courtroom`) so the story travels across scenes (e.g. main setting → lab/vault → `"golden"` town everyday analogy → payoff) and never stays stuck in one room.
   - **9:16 Vertical Framing & Camera Rules**:
     - Keep `fovFrom === fovTo` (`38–42`) on normal shots (no repetitive zoom-ins!); vary between lateral tracking pans, reverse-angle cuts, reaction two-shots, and a final crane pull-out.
     - Stack composition vertically in 9:16: keep on-screen actors within `x ∈ [-0.7, +0.7]` at `z ∈ [0.15, 0.35]` and place scoped props (`prop.world`) behind them at `z ∈ [-1.6, -2.2]` so characters and props are never clipped by the left/right edges.
     - Use expressive character staging (`facing: -1|0|1`, `look: -1|0|1`, `side: true` profile walks, `mode: "sit"|"march"|"stand"`, `prop: "hammer"|"icecream"|"shako"`).
   - Register `<slug>` in `src/episodes/registry.ts` and append it to `src/episodes/history.json`.

3. **Run TypeScript check & push to GitHub Actions (0 local media stored):**
   ```bash
   npx tsc --noEmit
   git add src/episodes/<slug> src/episodes/registry.ts src/episodes/history.json
   git commit -m "feat(episode): <slug>"
   git push
   gh workflow run render.yml -f episode=<slug>
   ```
   GitHub Actions handles Fish Audio TTS, Groq Whisper word timings, procedural audio mix (`-15 LUFS`), Remotion 2K (`1440x2560`) cloud render, and publishes `final.mp4` to **GitHub Releases**.
