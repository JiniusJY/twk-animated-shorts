import { describe, expect, it } from "vitest";
import { validateEpisode } from "../src/engine/schema";
import { evalActionsAt } from "../src/engine/eval";
import type { PropKeyframe } from "../src/engine/types";
import boeing from "../src/episodes/boeing-248-days/episode.json";

const minimal = {
  slug: "test-ep",
  title: "Test",
  fps: 30,
  durationFrames: 300,
  world: "office",
  musicMood: "playful",
  script: "A sufficiently long script for the schema to accept this episode.",
  sourceUrl: "https://example.com/source",
  shots: [
    {
      id: 0,
      a: 0,
      b: 300,
      world: "office",
      light: "day",
      cam: { from: [0, 1, 6], to: [0, 1, 6], lookFrom: [0, 1, 0], lookTo: [0, 1, 0] },
    },
  ],
  actors: [],
  props: [],
};

describe("validateEpisode", () => {
  it("accepts the real boeing episode with editorial metadata", () => {
    const spec = validateEpisode(boeing, "boeing");
    expect(spec.claim_ledger?.length).toBeGreaterThan(0);
    expect(spec.beats?.length).toBeGreaterThan(0);
  });

  it("requires a primary sourceUrl", () => {
    const bad = { ...minimal } as Record<string, unknown>;
    delete bad.sourceUrl;
    expect(() => validateEpisode(bad, "x")).toThrow(/sourceUrl/);
  });

  it("rejects unknown top-level fields", () => {
    expect(() => validateEpisode({ ...minimal, bogus: 1 }, "x")).toThrow(/bogus/);
  });

  it("rejects the retired actor rotY field", () => {
    const bad = {
      ...minimal,
      actors: [{ id: "a", kind: "bean", keyframes: [{ f: 0, rotY: 1 }] }],
    };
    expect(() => validateEpisode(bad, "x")).toThrow(/rotY/);
  });

  it("rejects unknown prop action types", () => {
    const bad = {
      ...minimal,
      props: [{ id: "p", kind: "clock", pos: [0, 0, -2], keyframes: [{ f: 0, action: { type: "explode" } }] }],
    };
    expect(() => validateEpisode(bad, "x")).toThrow(/action/);
  });

  it("rejects beat claim_ids missing from the claim_ledger", () => {
    const bad = {
      ...minimal,
      claim_ledger: [{ id: "c1", source_url: "https://example.com/a", attribution: "supports x" }],
      beats: [{ shot: 0, claim_ids: ["nope"] }],
    };
    expect(() => validateEpisode(bad, "x")).toThrow(/nope/);
  });

  it("rejects misordered actor keyframes", () => {
    const bad = {
      ...minimal,
      actors: [{ id: "a", kind: "bean", keyframes: [{ f: 10 }, { f: 5 }] }],
    };
    expect(() => validateEpisode(bad, "x")).toThrow(/keyframes/);
  });

  it("allows tied prop keyframes (stacked action types on one beat)", () => {
    const ok = {
      ...minimal,
      props: [
        {
          id: "p",
          kind: "clock",
          pos: [0, 0, -2],
          keyframes: [
            { f: 10, action: { type: "counterValue", value: 5, dur: 1 } },
            { f: 10, action: { type: "beaconIntensity", value: 1, dur: 1 } },
          ],
        },
      ],
    };
    expect(() => validateEpisode(ok, "x")).not.toThrow();
  });
});

describe("evalActionsAt", () => {
  it("snaps a counter with dur=1 and animates linearly otherwise", () => {
    const kfs: PropKeyframe[] = [
      { f: 10, action: { type: "counterValue", value: 100, dur: 1 } },
      { f: 20, action: { type: "counterValue", value: 200, dur: 20 } },
    ];
    expect(evalActionsAt(kfs, 10).counterValue).toBe(100);
    expect(evalActionsAt(kfs, 30).counterValue).toBeCloseTo(150);
    expect(evalActionsAt(kfs, 40).counterValue).toBeCloseTo(200);
  });

  it("resolves boolean generatorState without animation", () => {
    const kfs: PropKeyframe[] = [
      { f: 5, action: { type: "generatorState", on: true } },
      { f: 50, action: { type: "generatorState", on: false } },
    ];
    expect(evalActionsAt(kfs, 0).generatorState).toBeUndefined();
    expect(evalActionsAt(kfs, 49).generatorState).toBe(true);
    expect(evalActionsAt(kfs, 50).generatorState).toBe(false);
  });

  it("integrates wheelRotation speed into an absolute angle, seek-stable", () => {
    const kfs: PropKeyframe[] = [
      { f: 10, action: { type: "wheelRotation", speed: 0.1 } },
      { f: 20, action: { type: "wheelRotation", speed: 0.0 } },
    ];
    expect(evalActionsAt(kfs, 20).wheelAngle).toBeCloseTo(1.0);
    expect(evalActionsAt(kfs, 100).wheelAngle).toBeCloseTo(1.0); // holds after speed 0
    expect(evalActionsAt(kfs, 15).wheelAngle).toBeCloseTo(0.5);
  });

  it("smooths leverAngle and holds the final value", () => {
    const kfs: PropKeyframe[] = [{ f: 0, action: { type: "leverAngle", value: -75, dur: 12 } }];
    const mid = evalActionsAt(kfs, 6).leverAngle!;
    expect(mid).toBeLessThan(0);
    expect(mid).toBeGreaterThan(-75);
    expect(evalActionsAt(kfs, 12).leverAngle).toBeCloseTo(-75);
    expect(evalActionsAt(kfs, 500).leverAngle).toBeCloseTo(-75);
  });

  it("handles stacked actions on the same frame", () => {
    const kfs: PropKeyframe[] = [
      { f: 10, action: { type: "counterValue", value: 42, dur: 1 } },
      { f: 10, action: { type: "generatorState", on: false } },
      { f: 10, action: { type: "beaconIntensity", value: 1, dur: 6 } },
    ];
    const r = evalActionsAt(kfs, 13);
    expect(r.counterValue).toBe(42);
    expect(r.generatorState).toBe(false);
    expect(r.beaconIntensity).toBeCloseTo(0.5);
  });
});
