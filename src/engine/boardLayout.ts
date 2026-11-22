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

/** Frame each card first appears (its entrance spring starts). Components read these. */
export const ENTER: Record<CardId, number> = {
  // anchored to the stats-omitted VO (run 45010023328); each card lands as its shot settles or on its word
  hook: 0, photo: 135, ncic: 338, cabinet: 412, drawerChip: 480, terminal: 676, chip1967: 724,
  dots: 768, office: 835, hub: 915, ap: 1100, second: 1420,
};
/** A string only starts drawing this long after BOTH of its cards have entered. */
export const LINK_LAG = 12;

export type LinkSpec = {
  id: string;
  from: [CardId, Side];
  to: [CardId, Side];
  dur: number; seed: number;
  /** pulses start `delay` frames after the string has finished drawing */
  pulse?: {delay: number; period: number; dur: number};
  /** handle lengths as fractions of the endpoint distance: [from, to]. A long "to" handle makes
   *  the string arrive straight along the target's edge normal (e.g. through a gap in the ring). */
  k?: [number, number];
};

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

export type Link = Omit<LinkSpec, "pulse"> & {start: number; route: Cubic; d: string; a: Pt; b: Pt;
  pulse?: {start: number; period: number; dur: number}};

export const buildLink = (s: LinkSpec): Link => {
  const a = anchor(...s.from), b = anchor(...s.to);
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ka, kb] = (s.k ?? [0.42, 0.42]).map((v) => v * dist);
  const [ax, ay] = NORMAL[s.from[1]], [bx, by] = NORMAL[s.to[1]];
  const route: Cubic = [a[0], a[1], a[0] + ax * ka, a[1] + ay * ka, b[0] + bx * kb, b[1] + by * kb, b[0], b[1]];
  const r = route.map((v) => Math.round(v));
  const d = `M${r[0]} ${r[1]} C ${r[2]} ${r[3]}, ${r[4]} ${r[5]}, ${r[6]} ${r[7]}`;
  const start = Math.max(ENTER[s.from[0]], ENTER[s.to[0]]) + LINK_LAG;
  const pulse = s.pulse ? {start: start + s.dur + s.pulse.delay, period: s.pulse.period, dur: s.pulse.dur} : undefined;
  return {...s, start, pulse, route, d, a, b};
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

// ---------------------------------------------------------------------------------------------
// Camera: one HELD shot per topic. A shot starts on the first spoken word of its topic, frames its
// cards (derived from the rects above) and holds dead still until the next topic begins; the only
// travel is a short eased transition that starts ON the next topic's first word. Word-locked
// emphasis kicks are added on top in the scene and decay within ~0.3s.
// ---------------------------------------------------------------------------------------------

/** On-screen box (1080x1920 frame) where framed cards must sit: below the headline, above captions. */
export const SAFE = {x: 70, y: 360, w: 940, h: 1020};
export const FOCUS = {x: SAFE.x + SAFE.w / 2, y: SAFE.y + SAFE.h / 2};
export const MAX_ZOOM = 1.35;
export const TRANS = 20;

export type Shot = {id: string; at: number; cards: CardId[]; also?: Rect[]; widen?: number};
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

export const unionRect = (rs: Rect[]): Rect => {
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

export type Framing = {cx: number; cy: number; zoom: number};
/** World point (cx, cy) is drawn at screen FOCUS, scaled by zoom. */
export const frameShot = (s: Shot): Framing => {
  const r = unionRect([...s.cards.map((c) => CARDS[c]), ...(s.also ?? [])]);
  const zoom = Math.min(SAFE.w / r.w, SAFE.h / r.h, MAX_ZOOM) / (s.widen ?? 1);
  return {cx: r.x + r.w / 2, cy: r.y + r.h / 2, zoom};
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const cameraAt = (f: number): Framing => {
  let i = 0;
  while (i + 1 < SHOTS.length && f >= SHOTS[i + 1].at) i++;
  const cur = frameShot(SHOTS[i]);
  if (i === 0) return cur;
  const prev = frameShot(SHOTS[i - 1]);
  const t = Math.min(1, (f - SHOTS[i].at) / TRANS);
  if (t >= 1) return cur;
  const e = ease(t);
  return {
    cx: prev.cx + (cur.cx - prev.cx) * e,
    cy: prev.cy + (cur.cy - prev.cy) * e,
    zoom: Math.exp(Math.log(prev.zoom) + (Math.log(cur.zoom) - Math.log(prev.zoom)) * e),
  };
};

/** Where a world rect lands on screen under a framing. */
export const toScreen = (r: Rect, c: Framing): Rect => ({
  x: FOCUS.x + (r.x - c.cx) * c.zoom, y: FOCUS.y + (r.y - c.cy) * c.zoom, w: r.w * c.zoom, h: r.h * c.zoom,
});
