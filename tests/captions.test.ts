import { describe, expect, it } from "vitest";
import { groupCaptionPages, isEmphaticWord } from "../src/engine/Captions";
import type { CaptionWord } from "../src/engine/types";

const words = (list: string[], start = 0, step = 0.3): CaptionWord[] =>
  list.map((w, i) => ({ w, s: start + i * step, e: start + i * step + 0.25 }));

describe("groupCaptionPages", () => {
  it("groups into phrase pages of at most maxWords", () => {
    const pages = groupCaptionPages(words(["a", "b", "c", "d", "e", "f", "g"]), 3, 99);
    expect(pages.map((p) => p.words.length)).toEqual([3, 3, 1]);
  });

  it("breaks a page after sentence punctuation even below maxWords", () => {
    const pages = groupCaptionPages(words(["Wait.", "what", "happened?", "next", "line"]), 4, 99);
    expect(pages.map((p) => p.words.map((w) => w.w))).toEqual([
      ["Wait."],
      ["what", "happened?"],
      ["next", "line"],
    ]);
  });

  it("page timings span first word start to last word end", () => {
    const ws = words(["one", "two"], 1.0, 0.5);
    const [p] = groupCaptionPages(ws, 4, 99);
    expect(p.s).toBe(1.0);
    expect(p.e).toBe(1.75);
  });
});

describe("isEmphaticWord (semantic emphasis, not every-word bouncing)", () => {
  it("emphasizes the first word of a page", () => {
    expect(isEmphaticWord("quiet", 0)).toBe(true);
  });
  it("emphasizes sentence-final words", () => {
    expect(isEmphaticWord("gone.", 2)).toBe(true);
    expect(isEmphaticWord("gone", 2)).toBe(false);
  });
  it("emphasizes ALL-CAPS words of 2+ letters, not 'I'", () => {
    expect(isEmphaticWord("OVERFLOW", 1)).toBe(true);
    expect(isEmphaticWord("I", 1)).toBe(false);
  });
});
