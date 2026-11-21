#!/usr/bin/env bash
set -euo pipefail

# Low-token orchestrator: passes scouted stories + viral audio catalog to Claude Code
# so Claude handles the heavy creative/JSON lifting, then pushes to GitHub Actions.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROMPT_EXTRA="${*:-Pick the #1 most viral visual tech/science paradox story from the scout list and create a complete 55-65s episode.}"
SCOUT_JSON="$(python3 scripts/scout.py --top 5 --json)"
DRIVE_CATALOG="$HOME/Library/CloudStorage/GoogleDrive-jinytngoh@gmail.com/My Drive/Reel Studio/viral-audio/catalog.json"
AUDIO_LIST="[]"
if [ -f "$DRIVE_CATALOG" ]; then
  AUDIO_LIST="$(cat "$DRIVE_CATALOG")"
fi

claude -p "You are working in $ROOT. Read AGENTS.md (briefly) and references/STYLE_BIBLE.md, then do ALL of the following without asking questions:
1. Choose the best story from SCOUT_CANDIDATES (or execute the user instruction: $PROMPT_EXTRA).
2. Create src/episodes/<slug>/episode.json (~150-220 lines) following STYLE_BIBLE.md (55-65s, paradox hook sentence 1, concrete setting, 3-4 escalating beats, 'Wait, ...?' mystery, 'You see,' everyday analogy, ironic twist; NO on-screen captions; world preset from office|town|server_room|tarmac|courtroom).
3. Register <slug> in src/episodes/registry.ts and append it to src/episodes/history.json.
4. Run: npx tsc --noEmit
5. Stage ONLY src/episodes/, src/episodes/registry.ts, src/episodes/history.json (NEVER stage .env or viral-audio files), commit, git push, and run: gh workflow run render.yml -f episode=<slug>

SCOUT_CANDIDATES:
$SCOUT_JSON

AVAILABLE_VIRAL_AUDIOS (for mood matching/reference):
$AUDIO_LIST" --allowedTools "Read,Write,Edit,Bash"
