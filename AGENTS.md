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
   - 45–65 s (`~3.7 words/s`), voice starts immediately, zero intro/outro/CTA, English only, no on-screen captions.
   - Formula: **Paradox hook (sentence 1)** → **Concrete setting** → **3–4 escalating beats** → **"Wait, ...?" mystery** → **"You see," everyday analogy** → **Ironic payoff**.
   - Keep `episode.json` compact (~150–250 lines) using an existing `world` preset (`office`, `town`, `server_room`, `tarmac`, `courtroom`), `actors`, `props` (with keyframed labels), `fx`, `shots`, and `cues`.
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
