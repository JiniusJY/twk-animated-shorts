import { describe, expect, it } from "vitest";
import { BUILT_LINKS, CARDS, H, W, cubicAt, inside, obstacles, overlaps, ringBoxes } from "../src/engine/boardLayout";

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
