/**
 * Board layout: the single source of truth for where every card sits on the ep2 case board,
 * and the strings that connect them.
 *
 * Root cause this fixes: strings used to be hand-typed world coordinates with no relation to
 * the cards. Whenever a card moved or changed size, its strings were left dangling, ran into
 * empty board, or cut across other cards. Now:
 *   - every card has ONE rect here (border-box: the rect is the card's real painted size);
 *   - strings are declared card-to-card by edge, and their geometry is derived from the rects;
 *   - pins sit on the board just outside the card edge, never on the card;
 *   - tests/boardLayout.test.ts fails if any string or pin touches a card, or cards overlap.
 * Move a card here and its strings follow.
 */

import {makeBoard, ringRects, type Rect, type LinkSpec as GenericLinkSpec, type Shot as GenericShot} from "./devices/board";
export {cubicAt, reverseCubic, inside, overlaps, unionRect} from "./devices/board";
export type {Rect, Side, Cubic, Pt, Link, Framing} from "./devices/board";

export const W = 6600, H = 1920;

// Card rects (world px, border-box). Components MUST render from these values.
export const CARDS = {
  hook:     {x: 460,  y: 880, w: 300, h: 380},
  photo:    {x: 1260, y: 420, w: 480, h: 332},
  ncic:     {x: 1500, y: 880, w: 520, h: 200},
  cabinet:  {x: 2260, y: 400, w: 760, h: 210},
  terminal: {x: 3170, y: 320, w: 660, h: 360},
  chip1967: {x: 3560, y: 720, w: 300, h: 130},
  office:   {x: 3150, y: 780, w: 300, h: 120},
  dots:     {x: 3220, y: 1000, w: 524, h: 64},
  hub:      {x: 4320, y: 830, w: 260, h: 260},
  ap:       {x: 4960, y: 400, w: 640, h: 210},
  second:   {x: 5840, y: 700, w: 600, h: 260},
  drawerChip: {x: 2300, y: 660, w: 640, h: 86},
} satisfies Record<string, Rect>;
export type CardId = keyof typeof CARDS;

export const HUB = {x: CARDS.hub.x + CARDS.hub.w / 2, y: CARDS.hub.y + CARDS.hub.h / 2};

// Agency ring around the hub - obstacles too (strings must thread the gaps between boxes).
export const RING = {r: 330, ry: 1.06, n: 18, bw: 92, bh: 60};
export const ringBoxes = (): Rect[] => ringRects(HUB, RING);

/** Pins sit this far outside the card edge (pin radius 11 + clearance for sway/rotation). */
export const PIN_GAP = 26;


/** Frame each card first appears (its entrance spring starts). Components read these. */
export const ENTER: Record<CardId, number> = {
  // anchored to the stats-omitted VO (run 45010023328); each card lands as its shot settles or on its word
  hook: 0, photo: 135, ncic: 338, cabinet: 412, drawerChip: 480, terminal: 676, chip1967: 724,
  dots: 768, office: 835, hub: 915, ap: 1100, second: 1420,
};
/** A string only starts drawing this long after BOTH of its cards have entered. */
export const LINK_LAG = 12;

export type LinkSpec = GenericLinkSpec<CardId>;

// The chain the story walks. Each string joins neighbours only. Timing is DERIVED from ENTER.
export const LINKS: LinkSpec[] = [
  {id: "hook-ncic",    from: ["hook", "right"],      to: ["ncic", "left"],     dur: 40, seed: 40},
  {id: "photo-ncic",   from: ["photo", "bottom"],    to: ["ncic", "top"],      dur: 24, seed: 80,
    pulse: {delay: 4, period: 65, dur: 30}},
  {id: "ncic-cabinet", from: ["ncic", "right"],      to: ["cabinet", "left"],  dur: 30, seed: 81,
    pulse: {delay: 6, period: 80, dur: 34}},
  {id: "cabinet-term", from: ["cabinet", "right"],   to: ["terminal", "left"], dur: 22, seed: 82,
    pulse: {delay: 6, period: 55, dur: 22}},
  {id: "term-hub",     from: ["terminal", "bottom"], to: ["hub", "left"],      dur: 40, seed: 41,
    pulse: {delay: 30, period: 58, dur: 44}, k: [0.3, 0.7]},
  {id: "hub-ap",       from: ["hub", "right"],       to: ["ap", "bottom"],     dur: 32, seed: 83, k: [0.8, 0.3]},
  {id: "ap-second",    from: ["ap", "right"],        to: ["second", "top"],    dur: 24, seed: 84},
];


// ---------------------------------------------------------------------------------------------
// Camera: one HELD shot per topic. A shot starts on the first spoken word of its topic, frames its
// cards (derived from the rects above) and holds dead still until the next topic begins; the only
// travel is a short eased transition that starts ON the next topic's first word. Word-locked
// emphasis kicks are added on top in the scene and decay within ~0.3s.
// ---------------------------------------------------------------------------------------------

/** On-screen box (1080x1920 frame) where framed cards must sit: below the headline, above captions. */
export const SAFE = {x: 70, y: 360, w: 940, h: 1020};
export const MAX_ZOOM = 1.35;
export const TRANS = 20;

export type Shot = GenericShot<CardId>;
export const SHOTS: Shot[] = [
  {id: "hook",     at: 0,    cards: ["hook"]},
  {id: "stop",     at: 105,  cards: ["photo"]},                                     // "When a police officer..."
  {id: "system",   at: 216,  cards: ["photo", "ncic"]},                             // "the answer routinely comes from..."
  {id: "cabinet",  at: 392,  cards: ["cabinet", "drawerChip"]},                     // "Think of it as a filing cabinet..."
  {id: "alwayson", at: 671,  cards: ["terminal", "chip1967", "office", "dots"]},    // "And it never closes..."
  {id: "weakness", at: 895,  cards: ["hub"], also: ringBoxes()},                    // "That's the weakness..."
  {id: "breach",   at: 1094, cards: ["ap"], also: [{x: CARDS.ap.x, y: CARDS.ap.y + CARDS.ap.h, w: CARDS.ap.w, h: 320}]}, // room for the question punches
  {id: "second",   at: 1354, cards: ["second"]},                                    // "And it's the second time..."
  {id: "stakes",   at: 1624, cards: ["photo", "ncic"]},                             // "Remember, every line..."
  {id: "alarm",    at: 1753, cards: ["photo", "ncic"], widen: 1.3},                 // "That's why even a possible breach..."
];

// Everything below is derived by the board device (src/engine/devices/board.ts).
export const BOARD = makeBoard<CardId>({
  cards: CARDS, enter: ENTER, links: LINKS, shots: SHOTS, safe: SAFE,
  maxZoom: MAX_ZOOM, trans: TRANS, pinGap: PIN_GAP, linkLag: LINK_LAG,
  extraObstacles: ringBoxes().map((r, i) => ({name: `agency${i}`, r})),
});

export const anchor = BOARD.anchor;
export const buildLink = BOARD.buildLink;
export const BUILT_LINKS = BOARD.links;
export const linkById = BOARD.linkById;
/** Everything a string or pin must stay clear of. */
export const obstacles = BOARD.obstacles;
export const FOCUS = BOARD.FOCUS;
export const frameShot = BOARD.frameShot;
export const cameraAt = BOARD.cameraAt;
export const toScreen = BOARD.toScreen;
