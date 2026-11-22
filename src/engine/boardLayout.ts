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

export type Rect = {x: number; y: number; w: number; h: number};
export type Side = "left" | "right" | "top" | "bottom";
export type Cubic = [number, number, number, number, number, number, number, number];
export type Pt = [number, number];

export const W = 6600, H = 1920;

// Card rects (world px, border-box). Components MUST render from these values.
export const CARDS = {
  hook:     {x: 460,  y: 880, w: 300, h: 380},
  photo:    {x: 1260, y: 420, w: 480, h: 332},
  ncic:     {x: 1500, y: 880, w: 520, h: 200},
  cabinet:  {x: 2260, y: 400, w: 760, h: 370},
  terminal: {x: 3170, y: 320, w: 660, h: 360},
  chip1967: {x: 3880, y: 560, w: 300, h: 130},
  office:   {x: 3150, y: 780, w: 300, h: 120},
  dots:     {x: 3220, y: 1000, w: 524, h: 64},
  hub:      {x: 4320, y: 830, w: 260, h: 260},
  ap:       {x: 4960, y: 400, w: 640, h: 210},
  second:   {x: 5840, y: 700, w: 600, h: 260},
  drawerChip: {x: 2300, y: 870, w: 640, h: 86},
} satisfies Record<string, Rect>;
export type CardId = keyof typeof CARDS;

export const HUB = {x: CARDS.hub.x + CARDS.hub.w / 2, y: CARDS.hub.y + CARDS.hub.h / 2};

// Agency ring around the hub - obstacles too (strings must thread the gaps between boxes).
export const RING = {r: 330, ry: 1.06, n: 18, bw: 92, bh: 60};
export const ringBoxes = (): Rect[] => Array.from({length: RING.n}, (_, i) => {
  const a = (i / RING.n) * Math.PI * 2 - Math.PI / 2;
  return {x: HUB.x + Math.cos(a) * RING.r - RING.bw / 2, y: HUB.y + Math.sin(a) * RING.r * RING.ry - RING.bh / 2, w: RING.bw, h: RING.bh};
});

/** Pins sit this far outside the card edge (pin radius 11 + clearance for sway/rotation). */
export const PIN_GAP = 26;

const NORMAL: Record<Side, Pt> = {left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1]};

export const anchor = (id: CardId, side: Side): Pt => {
  const r = CARDS[id];
  const [nx, ny] = NORMAL[side];
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const ex = side === "left" ? r.x : side === "right" ? r.x + r.w : cx;
  const ey = side === "top" ? r.y : side === "bottom" ? r.y + r.h : cy;
  return [ex + nx * PIN_GAP, ey + ny * PIN_GAP];
};

export type LinkSpec = {
  id: string;
  from: [CardId, Side];
  to: [CardId, Side];
  start: number; dur: number; seed: number;
  pulse?: {start: number; period: number; dur: number};
  /** handle lengths as fractions of the endpoint distance: [from, to]. A long "to" handle makes
   *  the string arrive straight along the target's edge normal (e.g. through a gap in the ring). */
  k?: [number, number];
};

// The chain the story walks. Each string joins neighbours only.
export const LINKS: LinkSpec[] = [
  {id: "hook-ncic",      from: ["hook", "right"],     to: ["ncic", "left"],     start: 15,   dur: 55, seed: 40},
  {id: "photo-ncic",     from: ["photo", "bottom"],   to: ["ncic", "top"],      start: 250,  dur: 30, seed: 80,
    pulse: {start: 335, period: 65, dur: 30}},
  {id: "ncic-cabinet",   from: ["ncic", "right"],     to: ["cabinet", "left"],  start: 400,  dur: 35, seed: 81,
    pulse: {start: 445, period: 80, dur: 34}},
  {id: "cabinet-term",   from: ["cabinet", "right"],  to: ["terminal", "left"], start: 748,  dur: 25, seed: 82,
    pulse: {start: 785, period: 55, dur: 22}},
  {id: "term-hub",       from: ["terminal", "bottom"], to: ["hub", "left"],     start: 960,  dur: 40, seed: 41,
    pulse: {start: 1030, period: 58, dur: 44}, k: [0.3, 0.7]},
  {id: "hub-ap",         from: ["hub", "right"],      to: ["ap", "bottom"],     start: 1132, dur: 35, seed: 83, k: [0.8, 0.3]},
  {id: "ap-second",      from: ["ap", "right"],       to: ["second", "top"],    start: 1440, dur: 24, seed: 84},
];

export type Link = LinkSpec & {route: Cubic; d: string; a: Pt; b: Pt};

export const buildLink = (s: LinkSpec): Link => {
  const a = anchor(...s.from), b = anchor(...s.to);
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ka, kb] = (s.k ?? [0.42, 0.42]).map((v) => v * dist);
  const [ax, ay] = NORMAL[s.from[1]], [bx, by] = NORMAL[s.to[1]];
  const route: Cubic = [a[0], a[1], a[0] + ax * ka, a[1] + ay * ka, b[0] + bx * kb, b[1] + by * kb, b[0], b[1]];
  const r = route.map((v) => Math.round(v));
  const d = `M${r[0]} ${r[1]} C ${r[2]} ${r[3]}, ${r[4]} ${r[5]}, ${r[6]} ${r[7]}`;
  return {...s, route, d, a, b};
};

export const BUILT_LINKS: Link[] = LINKS.map(buildLink);
export const linkById = (id: string): Link => {
  const l = BUILT_LINKS.find((x) => x.id === id);
  if (!l) throw new Error(`unknown board link ${id}`);
  return l;
};

export const cubicAt = (c: Cubic, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
    u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7],
  ];
};
export const reverseCubic = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];

/** Everything a string or pin must stay clear of. */
export const obstacles = (): {name: string; r: Rect}[] => [
  ...Object.entries(CARDS).map(([name, r]) => ({name, r})),
  ...ringBoxes().map((r, i) => ({name: `agency${i}`, r})),
];

export const inside = ([x, y]: Pt, r: Rect, pad = 0) =>
  x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
