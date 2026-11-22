import { describe, expect, it } from "vitest";
import { makeBoard, cubicAt, ringRects, overlaps } from "../src/engine/devices/board";
import { dimTrack } from "../src/engine/devices/overlay";
import { kickEnvelope, shakeEnvelope } from "../src/engine/devices/motion";
import { activeHighlight } from "../src/engine/devices/objects";

// A tiny made-up board: proves the device works for any episode, not just ep2's data.
const toy = makeBoard<"a" | "b" | "c">({
  cards: { a: { x: 0, y: 0, w: 200, h: 100 }, b: { x: 600, y: 0, w: 200, h: 100 }, c: { x: 600, y: 500, w: 200, h: 100 } },
  enter: { a: 0, b: 30, c: 90 },
  links: [
    { id: "a-b", from: ["a", "right"], to: ["b", "left"], dur: 20, seed: 1, pulse: { delay: 5, period: 60, dur: 30 } },
    { id: "b-c", from: ["b", "bottom"], to: ["c", "top"], dur: 20, seed: 2 },
  ],
  shots: [
    { id: "one", at: 0, cards: ["a"] },
    { id: "two", at: 100, cards: ["b", "c"] },
  ],
  safe: { x: 70, y: 360, w: 940, h: 1020 },
});

describe("board device", () => {
  it("derives string endpoints from card edges, with pins outside the card", () => {
    const l = toy.linkById("a-b");
    expect(l.a).toEqual([200 + toy.PIN_GAP, 50]);
    expect(l.b).toEqual([600 - toy.PIN_GAP, 50]);
    expect(cubicAt(l.route, 0)).toEqual(l.a);
    expect(cubicAt(l.route, 1)).toEqual(l.b);
  });

  it("starts a string after both cards have entered, and pulses after it has drawn", () => {
    const l = toy.linkById("a-b");
    expect(l.start).toBe(30 + toy.LINK_LAG);
    expect(l.pulse!.start).toBe(l.start + 20 + 5);
    expect(toy.linkById("b-c").start).toBe(90 + toy.LINK_LAG);
  });

  it("holds the camera still within a shot and travels for exactly TRANS frames", () => {
    const held = toy.cameraAt(50);
    expect(toy.cameraAt(99)).toEqual(held);
    const moving = toy.cameraAt(100 + toy.TRANS / 2);
    expect(moving).not.toEqual(held);
    expect(toy.cameraAt(100 + toy.TRANS)).toEqual(toy.frameShot(toy.spec.shots[1]));
    expect(toy.cameraAt(500)).toEqual(toy.cameraAt(100 + toy.TRANS));
  });

  it("frames every shot's cards inside the safe box", () => {
    for (const s of toy.spec.shots) {
      const fr = toy.frameShot(s);
      for (const c of s.cards) {
        const r = toy.toScreen(toy.spec.cards[c], fr);
        expect(r.x).toBeGreaterThanOrEqual(toy.SAFE.x - 0.5);
        expect(r.x + r.w).toBeLessThanOrEqual(toy.SAFE.x + toy.SAFE.w + 0.5);
        expect(r.y).toBeGreaterThanOrEqual(toy.SAFE.y - 0.5);
        expect(r.y + r.h).toBeLessThanOrEqual(toy.SAFE.y + toy.SAFE.h + 0.5);
      }
    }
  });

  it("throws on an unknown link id", () => {
    expect(() => toy.linkById("nope")).toThrow();
  });

  it("places ring nodes without overlaps", () => {
    const rs = ringRects({ x: 0, y: 0 }, { r: 330, ry: 1.06, n: 18, bw: 92, bh: 60 });
    expect(rs).toHaveLength(18);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) expect(overlaps(rs[i], rs[j])).toBe(false);
  });
});

describe("motion and overlay helpers", () => {
  it("dimTrack ramps to each level and back to zero between windows", () => {
    const d = dimTrack([[10, 20, 30, 40, 0.6], [50, 55, 60, 65, 0.8]]);
    expect(d(0)).toBe(0);
    expect(d(25)).toBeCloseTo(0.6);
    expect(d(45)).toBe(0);
    expect(d(57)).toBeCloseTo(0.8);
    expect(d(99)).toBe(0);
    expect(dimTrack([])(10)).toBe(0);
  });

  it("kicks and shakes are zero before their frame and decay after", () => {
    const k = kickEnvelope([[100, 0.05]]);
    expect(k(99)).toBe(0);
    expect(k(102)).toBeGreaterThan(k(130));
    expect(k(200)).toBeLessThan(1e-6);
    const s = shakeEnvelope([10]);
    expect(s(9)).toBe(0);
    expect(s(40)).toBe(0);
  });

  it("activeHighlight picks the latest started highlight before the cutoff", () => {
    const hl = [{ i: 0, at: 10, label: "A" }, { i: 1, at: 20, label: "B" }];
    expect(activeHighlight(hl, 5, 100)).toBeNull();
    expect(activeHighlight(hl, 15, 100)!.label).toBe("A");
    expect(activeHighlight(hl, 25, 100)!.label).toBe("B");
    expect(activeHighlight(hl, 100, 100)).toBeNull();
  });
});

import { rampInOut } from "../src/engine/devices/transitions";

describe("transition helpers", () => {
  it("rampInOut runs 0 -> 1, is symmetric, and is fastest in the middle", () => {
    expect(rampInOut(0)).toBe(0);
    expect(rampInOut(1)).toBe(1);
    expect(rampInOut(0.5)).toBeCloseTo(0.5);
    expect(rampInOut(0.25) + rampInOut(0.75)).toBeCloseTo(1);
    const step = (t: number) => rampInOut(t + 0.01) - rampInOut(t);
    expect(step(0.495)).toBeGreaterThan(step(0.1) * 10);
  });

  it("whip-eased board camera lands on the same framing and reports zero velocity while held", () => {
    const spec = { ...toy.spec, ease: "whip" as const };
    const whip = makeBoard(spec);
    expect(whip.cameraAt(100 + whip.TRANS)).toEqual(toy.cameraAt(100 + toy.TRANS));
    expect(whip.cameraVelocity(60)).toEqual({ vx: 0, vy: 0 });
    expect(Math.abs(whip.cameraVelocity(100 + whip.TRANS / 2).vx)).toBeGreaterThan(Math.abs(toy.cameraVelocity(100 + toy.TRANS / 2).vx));
  });
});
