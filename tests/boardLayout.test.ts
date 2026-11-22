import { describe, expect, it } from "vitest";
import { BUILT_LINKS, CARDS, ENTER, H, LINK_LAG, SAFE, SHOTS, TRANS, W, cameraAt, cubicAt, frameShot, inside, obstacles, overlaps, ringBoxes, toScreen } from "../src/engine/boardLayout";

// Strings/pins must clear every card by this much (stroke half-width + sway/rotation slack).
const CLEAR = 8;

describe("ep2 board layout", () => {
  it("no two cards overlap, and no card overlaps the agency ring", () => {
    const all = obstacles();
    const bad: string[] = [];
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++)
        if (overlaps(all[i].r, all[j].r)) bad.push(`${all[i].name} x ${all[j].name}`);
    expect(bad).toEqual([]);
  });

  it("every card is on the board", () => {
    for (const [name, r] of Object.entries(CARDS)) {
      expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H, name).toBe(true);
    }
  });

  it("pins sit on the board, outside every card", () => {
    const bad: string[] = [];
    for (const l of BUILT_LINKS)
      for (const p of [l.a, l.b])
        for (const o of obstacles())
          if (inside(p, o.r, 11 + CLEAR)) bad.push(`${l.id} pin in ${o.name}`);
    expect(bad).toEqual([]);
  });

  it("no string passes over any card or agency box", () => {
    const bad = new Set<string>();
    for (const l of BUILT_LINKS)
      for (let i = 0; i <= 200; i++) {
        const p = cubicAt(l.route, i / 200);
        for (const o of obstacles()) if (inside(p, o.r, CLEAR)) bad.add(`${l.id} over ${o.name}`);
      }
    expect([...bad]).toEqual([]);
  });

  it("the ring has the expected agency count", () => {
    expect(ringBoxes()).toHaveLength(18);
  });
});


describe("ep2 board timing + camera", () => {
  it("a string never starts before both of its cards are on screen", () => {
    for (const l of BUILT_LINKS) {
      expect(l.start, l.id).toBeGreaterThanOrEqual(Math.max(ENTER[l.from[0]], ENTER[l.to[0]]) + LINK_LAG);
      if (l.pulse) expect(l.pulse.start, l.id).toBeGreaterThanOrEqual(l.start + l.dur);
    }
  });

  it("the camera holds perfectly still for the rest of each topic after its transition", () => {
    for (let i = 0; i < SHOTS.length; i++) {
      const s = SHOTS[i], end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : 2046;
      const hold = frameShot(s);
      for (let f = s.at + (i ? TRANS : 0); f < end; f++) expect(cameraAt(f), `${s.id}@${f}`).toEqual(hold);
    }
  });

  it("the camera never leaves a topic before the next topic's first word", () => {
    for (let i = 1; i < SHOTS.length; i++) {
      expect(cameraAt(SHOTS[i].at - 1)).toEqual(frameShot(SHOTS[i - 1]));
    }
  });

  it("every shot's cards sit fully inside the on-screen safe box while held", () => {
    const bad: string[] = [];
    for (const s of SHOTS) {
      const c = frameShot(s);
      for (const id of s.cards) {
        const r = toScreen(CARDS[id], c);
        if (r.x < SAFE.x - 1 || r.y < SAFE.y - 1 || r.x + r.w > SAFE.x + SAFE.w + 1 || r.y + r.h > SAFE.y + SAFE.h + 1)
          bad.push(`${s.id}:${id}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
