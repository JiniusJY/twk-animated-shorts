// CLI: structural + rhythm/mechanism/metadata lint for one episode.json.
// Structural errors (lintEpisodeErrors) block the render; editorial warnings do not.
// The other publish-blocking gates are schema validation and qa_gate.py.
// Usage: npx tsx scripts/lint_episode.ts src/episodes/<slug>/episode.json
import { readFileSync } from "node:fs";
import { validateEpisode } from "../src/engine/schema";
import { lintEpisode, lintEpisodeErrors } from "../src/engine/lint";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx scripts/lint_episode.ts <episode.json>");
  process.exit(2);
}
const spec = validateEpisode(JSON.parse(readFileSync(file, "utf8")), file);
const errors = lintEpisodeErrors(spec);
const warnings = lintEpisode(spec);
for (const e of errors) console.error(`error: ${e}`);
for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length > 0) {
  console.error(`${errors.length} hard lint error(s) - render blocked`);
  process.exit(1);
}
if (warnings.length === 0) {
  console.log(`lint clean: ${file}`);
} else {
  console.log(`${warnings.length} warning(s) - review before publishing`);
}
