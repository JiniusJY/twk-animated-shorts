// CLI: rhythm/mechanism/metadata lint for one episode.json.
// Warnings only - the publish-blocking gates are schema validation and qa_gate.py.
// Usage: npx tsx scripts/lint_episode.ts src/episodes/<slug>/episode.json
import { readFileSync } from "node:fs";
import { validateEpisode } from "../src/engine/schema";
import { lintEpisode } from "../src/engine/lint";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx scripts/lint_episode.ts <episode.json>");
  process.exit(2);
}
const spec = validateEpisode(JSON.parse(readFileSync(file, "utf8")), file);
const warnings = lintEpisode(spec);
if (warnings.length === 0) {
  console.log(`lint clean: ${file}`);
} else {
  for (const w of warnings) console.warn(`warn: ${w}`);
  console.log(`${warnings.length} warning(s) - review before publishing`);
}
