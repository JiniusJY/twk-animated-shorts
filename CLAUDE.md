# TWK Animated Shorts — Claude & Low-Token Guide

- **Never** commit `.env`, API keys (`BRIGHTDATA_API_KEY`, etc.), or scraped audio binaries — this repo is **PUBLIC**.
- **Never** read `references/frames/` or `references/sheets/` or rewrite `src/engine/` on normal episode runs.
- Shared 3D/2D engine lives in `src/engine/`. Every episode only adds `src/episodes/<slug>/episode.json` + registers it in `src/episodes/registry.ts` and `src/episodes/history.json`.
- Cloud render pipeline runs on GitHub Actions (`.github/workflows/render.yml`): Fish Audio (`FISH_API_KEY` + `FISH_VOICE_ID`) + Groq Whisper (`GROQ_API_KEY`) + procedural `-15 LUFS` mix + Remotion 2K render → GitHub Releases.
- Viral background audios scraped via `scripts/viral_audio_scraper.py` (Bright Data `mcp_serp`) are saved in Google Drive (`My Drive/Reel Studio/viral-audio/`), outside git.
