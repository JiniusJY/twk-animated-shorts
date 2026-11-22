/**
 * Editorial lint: warnings, never hard failures. Schema validation BLOCKS a bad
 * episode; lint flags episodes that are technically valid but editorially weak:
 * decorative-only staging, dead air, pacing off, missing claim ledger.
 */
import type { EpisodeSpec } from "./types";

/**
 * Hard structural failures. Unlike lint warnings, these BLOCK the render in CI
 * (lint_episode.ts exits non-zero). Owner ruling, 22 November 2026.
 */
export function lintEpisodeErrors(spec: EpisodeSpec): string[] {
  const errors: string[] = [];

  // An episode where every shot carries a graphic never renders the 3D world:
  // no actors, no camera moves, no toon environments. That is the regression
  // the owner rejected on the NCIC episode ("overall visual degraded from ep 1").
  if (spec.shots.length > 0 && spec.shots.every((s) => s.graphic)) {
    errors.push(
      "all-2D episode: every shot has a graphic, so the 3D world never renders. Story beats must play in the 3D world (actors + camera moves); 2D editorial cards are for data beats only."
    );
  }

  return errors;
}

export function lintEpisode(spec: EpisodeSpec): string[] {
  const warnings: string[] = [];
  const fps = spec.fps;
  const dur = spec.durationFrames;

  // 1. Mechanism check: at least one typed prop action somewhere
  const hasActions = spec.props.some((p) => (p.keyframes ?? []).some((k) => k.action));
  if (!hasActions) {
    warnings.push(
      "no typed prop actions anywhere — the episode is decorative-only; make a prop ENACT the mechanism (counterValue, leverAngle, generatorState, ...) instead of only relabeling it"
    );
  }

  // 2. Rhythm: flag any >4s window with no informational state change
  const events = new Set<number>();
  for (const s of spec.shots) {
    events.add(s.a);
    if (s.flashAt !== undefined) events.add(s.flashAt);
    for (const k of s.kickAt ?? []) events.add(k);
  }
  for (const a of spec.actors) for (const k of a.keyframes ?? []) events.add(k.f);
  for (const p of spec.props) for (const k of p.keyframes ?? []) events.add(k.f);
  for (const fx of spec.fx ?? []) events.add(fx.a);
  const cueFrames = (spec.cues ?? []).map((c) => Math.round(c.t * fps));
  const sorted = [...events, 0, dur].sort((a, b) => a - b);
  const maxGapFrames = Math.round(4 * fps);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    const cueInGap = cueFrames.some((c) => c > sorted[i - 1] && c <= sorted[i]);
    if (gap > maxGapFrames && !cueInGap) {
      warnings.push(
        `dead air: ${(gap / fps).toFixed(1)}s without any visual state change around frame ${sorted[i - 1]}-${sorted[i]} (${(sorted[i - 1] / fps).toFixed(1)}s) — add a beat or mark a deliberate hold`
      );
    }
  }

  // 3. Pacing: words per second
  const words = spec.script.trim().split(/\s+/).length;
  const wps = words / (dur / fps);
  if (wps < 2.2 || wps > 4.6) {
    warnings.push(`pacing: ${wps.toFixed(1)} words/s (target ~3.7); duration or script may need adjusting`);
  }

  // 4. Editorial metadata
  if (!spec.claim_ledger || spec.claim_ledger.length === 0) {
    warnings.push("no claim_ledger — list each load-bearing factual claim with its source and limits");
  }
  if (!spec.topic_card) warnings.push("no topic_card — record the audience question and why this story now");

  return warnings;
}
