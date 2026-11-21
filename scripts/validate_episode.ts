// CLI: validate one episode.json against the engine schema (blocks on any error).
// Usage: npx tsx scripts/validate_episode.ts src/episodes/<slug>/episode.json
import { readFileSync } from "node:fs";
import { validateEpisode } from "../src/engine/schema";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx scripts/validate_episode.ts <episode.json>");
  process.exit(2);
}
try {
  const spec = validateEpisode(JSON.parse(readFileSync(file, "utf8")), file);
  console.log(
    `OK ${file}: ${spec.shots.length} shots, ${spec.actors.length} actors, ${spec.props.length} props, ` +
      `${spec.claim_ledger?.length ?? 0} claims, ${spec.beats?.length ?? 0} beats`,
  );
} catch (err) {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
}
