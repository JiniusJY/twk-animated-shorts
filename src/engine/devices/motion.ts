import React from "react";

/**
 * Shared motion helpers for devices. All are pure functions of the frame, so renders are
 * deterministic and any device can be scrubbed to any frame.
 */

/** Slow idle rotation (degrees) for a pinned card; seed by position so cards don't sway in sync. */
export const sway = (f: number, seed: number) => Math.sin((f + seed) / 55) * 0.35;
/** Slow idle vertical bob (px) for a pinned card. */
export const bob = (f: number, seed: number) => Math.sin((f + seed) / 67) * 2.5;

/** Spring presets used across the board devices. */
export const SPRINGS = {
  /** paper / photo card landing */
  card: {damping: 12, stiffness: 220, mass: 0.7},
  /** pin, chip, punch: fast, small overshoot */
  snap: {damping: 11, stiffness: 260, mass: 0.6},
  pin: {damping: 11, stiffness: 260, mass: 0.5},
} as const;

/**
 * Word-locked camera kicks: brief zoom impulses that decay in ~0.2s.
 * kicks = [frame, amount] pairs, frame taken from the word alignment. Returns a zoom multiplier offset.
 */
export const kickEnvelope = (kicks: [number, number][]) => (f: number) =>
  kicks.reduce((s, [t, a]) => (f >= t ? s + a * Math.exp(-(f - t) / 6) * Math.min(1, (f - t + 1) / 2) : s), 0);

/** Hard camera shakes (px offset) starting on the given frames, ~0.8s each. */
export const shakeEnvelope = (times: number[], amp = 14) => (f: number) =>
  times.reduce((s, t) => (f >= t && f < t + 24 ? s + amp * Math.sin((f - t) * 2.3) * Math.exp(-(f - t) / 5) : s), 0);

/**
 * Parallax plane style for a scene camera. k = depth factor (1 = main plane, <1 = background).
 * The camera is (zoom, camX, camY) where camX/camY is the world point at the screen origin.
 */
export const parallaxLayer = (w: number, h: number, cam: {zoom: number; x: number; y: number},
  k: number, blur = 0): React.CSSProperties => ({
  position: "absolute", left: 0, top: 0, width: w, height: h,
  transform: `scale(${1 + (cam.zoom - 1) * k}) translate(${-cam.x * k}px, ${-cam.y * k}px)`,
  transformOrigin: "0 0", filter: blur ? `blur(${blur}px)` : undefined,
});
