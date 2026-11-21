/**
 * Phrase-sized word captions driven by the voice pipeline's word timings
 * (words.json), passed into the composition via props JSON. On by default
 * whenever caption words are present; disable per-episode with
 * captions.enabled=false. Pure function of frame: no transitions, no state.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionWord, CaptionsConfig } from "./types";

export interface CaptionPage {
  words: CaptionWord[];
  s: number;
  e: number;
}

const BREAK_AFTER = /[.!?…]$/;

/** Group words into phrase-sized pages: max words, max seconds, or a sentence end — whichever comes first. */
export function groupCaptionPages(words: CaptionWord[], maxWords = 4, maxDur = 1.7): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let cur: CaptionWord[] = [];
  let start = 0;
  const flush = (end: number) => {
    if (cur.length > 0) pages.push({ words: cur, s: start, e: end });
    cur = [];
  };
  for (const w of words) {
    if (cur.length === 0) start = w.s;
    cur.push(w);
    if (cur.length >= maxWords || w.e - start >= maxDur || BREAK_AFTER.test(w.w)) flush(w.e);
  }
  flush(cur.length > 0 ? cur[cur.length - 1].e : 0);
  // Extend each page to the next page's start so captions never blink out mid-sentence
  for (let i = 0; i < pages.length - 1; i++) pages[i].e = Math.max(pages[i].e, pages[i + 1].s);
  return pages;
}

/**
 * Semantic emphasis: color follows the spoken word, but only page-first,
 * sentence-final, and ALL-CAPS words (2+ letters) get the pop - not
 * every-word bouncing. Exported for tests.
 */
export function isEmphaticWord(word: string, indexInPage: number): boolean {
  return indexInPage === 0 || BREAK_AFTER.test(word) || (word.length > 1 && word === word.toUpperCase());
}

export const Captions: React.FC<{ words: CaptionWord[] | null; config?: CaptionsConfig }> = ({ words, config }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pages = useMemo(
    () => (words && words.length > 0 ? groupCaptionPages(words, config?.maxWordsPerPage ?? 4) : []),
    [words, config?.maxWordsPerPage]
  );
  if (config?.enabled === false || pages.length === 0) return null;

  const t = f / fps;
  const page = pages.find((p) => t >= p.s - 0.04 && t < p.e + 0.18);
  if (!page) return null;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        justifyContent: "flex-end",
        alignItems: "center",
        // Lower-third safe zone: clears TikTok/Reels/Shorts UI chrome (~17% from the bottom edge)
        paddingBottom: height * 0.17,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: width * 0.86,
          columnGap: 18,
          rowGap: 4,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.s - 0.03 && t < w.e + 0.1;
          const emphatic = isEmphaticWord(w.w, i);
          const age = f - w.s * fps;
          const pop = active && emphatic ? 1 + 0.16 * Math.max(0, 1 - age / 6) : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                fontWeight: 900,
                fontSize: 62,
                letterSpacing: 0.5,
                color: active ? "#ffd945" : "#ffffff",
                WebkitTextStroke: "2.5px #241726",
                textShadow: "0 4px 0 rgba(36,23,38,0.85), 0 8px 24px rgba(0,0,0,0.45)",
                transform: `scale(${pop})`,
                transformOrigin: "bottom center",
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
