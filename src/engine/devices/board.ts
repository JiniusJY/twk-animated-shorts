/**
 * Case-board geometry device (extracted from ep2, docs/DEVICES.md).
 *
 * A board is plain data: card rects, the frame each card enters, card-to-card strings and a list
 * of held camera shots. makeBoard() derives everything else from that data, so an episode only
 * declares WHERE things are and WHEN they arrive:
 *   - string geometry comes from the card rects (move a card, its strings follow);
 *   - pins sit just outside the card edge, never on it;
 *   - string timing comes from the entrances of both cards;
 *   - the camera holds one framing per topic and travels only on the next topic's first word.
 * Pair every board with a layout test (see tests/boardLayout.test.ts) so no string, pin or card
 * can overlap another card.
 */

export type Rect = {x: number; y: number; w: number; h: number};
export type Side = "left" | "right" | "top" | "bottom";
export type Cubic = [number, number, number, number, number, number, number, number];
export type Pt = [number, number];

export type LinkSpec<C extends string = string> = {
  id: string;
  from: [C, Side];
  to: [C, Side];
  dur: number; seed: number;
  /** pulses start `delay` frames after the string has finished drawing */
  pulse?: {delay: number; period: number; dur: number};
  /** handle lengths as fractions of the endpoint distance: [from, to]. A long "to" handle makes
   *  the string arrive straight along the target's edge normal (e.g. through a gap in a ring). */
  k?: [number, number];
};

export type Link<C extends string = string> = Omit<LinkSpec<C>, "pulse"> & {start: number; route: Cubic; d: string; a: Pt; b: Pt;
  pulse?: {start: number; period: number; dur: number}};

export type Shot<C extends string = string> = {id: string; at: number; cards: C[]; also?: Rect[]; widen?: number};
export type Framing = {cx: number; cy: number; zoom: number};

export type BoardSpec<C extends string> = {
  cards: Record<C, Rect>;
  /** frame each card first appears (its entrance spring starts) */
  enter: Record<C, number>;
  links: LinkSpec<C>[];
  shots: Shot<C>[];
  /** on-screen box (1080x1920 frame) where framed cards must sit */
  safe: Rect;
  maxZoom?: number;
  /** camera travel frames between held shots */
  trans?: number;
  /** pins sit this far outside the card edge */
  pinGap?: number;
  /** a string starts drawing this long after BOTH of its cards have entered */
  linkLag?: number;
  /** extra rects strings and pins must avoid (e.g. a ring of nodes) */
  extraObstacles?: {name: string; r: Rect}[];
};

const NORMAL: Record<Side, Pt> = {left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1]};

export const cubicAt = (c: Cubic, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
    u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7],
  ];
};
export const reverseCubic = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];

export const inside = ([x, y]: Pt, r: Rect, pad = 0) =>
  x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const unionRect = (rs: Rect[]): Rect => {
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

export const center = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

/** Rects of n nodes evenly spaced on an ellipse around a centre (first node at 12 o'clock). */
export const ringRects = (c: {x: number; y: number}, ring: {r: number; ry: number; n: number; bw: number; bh: number}): Rect[] =>
  Array.from({length: ring.n}, (_, i) => {
    const a = (i / ring.n) * Math.PI * 2 - Math.PI / 2;
    return {x: c.x + Math.cos(a) * ring.r - ring.bw / 2, y: c.y + Math.sin(a) * ring.r * ring.ry - ring.bh / 2, w: ring.bw, h: ring.bh};
  });

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const makeBoard = <C extends string>(spec: BoardSpec<C>) => {
  const PIN_GAP = spec.pinGap ?? 26;
  const LINK_LAG = spec.linkLag ?? 12;
  const MAX_ZOOM = spec.maxZoom ?? 1.35;
  const TRANS = spec.trans ?? 20;
  const SAFE = spec.safe;
  const FOCUS = {x: SAFE.x + SAFE.w / 2, y: SAFE.y + SAFE.h / 2};

  const anchor = (id: C, side: Side): Pt => {
    const r = spec.cards[id];
    const [nx, ny] = NORMAL[side];
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const ex = side === "left" ? r.x : side === "right" ? r.x + r.w : cx;
    const ey = side === "top" ? r.y : side === "bottom" ? r.y + r.h : cy;
    return [ex + nx * PIN_GAP, ey + ny * PIN_GAP];
  };

  const buildLink = (s: LinkSpec<C>): Link<C> => {
    const a = anchor(...s.from), b = anchor(...s.to);
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [ka, kb] = (s.k ?? [0.42, 0.42]).map((v) => v * dist);
    const [ax, ay] = NORMAL[s.from[1]], [bx, by] = NORMAL[s.to[1]];
    const route: Cubic = [a[0], a[1], a[0] + ax * ka, a[1] + ay * ka, b[0] + bx * kb, b[1] + by * kb, b[0], b[1]];
    const r = route.map((v) => Math.round(v));
    const d = `M${r[0]} ${r[1]} C ${r[2]} ${r[3]}, ${r[4]} ${r[5]}, ${r[6]} ${r[7]}`;
    const start = Math.max(spec.enter[s.from[0]], spec.enter[s.to[0]]) + LINK_LAG;
    const pulse = s.pulse ? {start: start + s.dur + s.pulse.delay, period: s.pulse.period, dur: s.pulse.dur} : undefined;
    return {...s, start, pulse, route, d, a, b};
  };

  const links = spec.links.map(buildLink);
  const linkById = (id: string): Link<C> => {
    const l = links.find((x) => x.id === id);
    if (!l) throw new Error(`unknown board link ${id}`);
    return l;
  };

  const obstacles = (): {name: string; r: Rect}[] => [
    ...(Object.entries(spec.cards) as [string, Rect][]).map(([name, r]) => ({name, r})),
    ...(spec.extraObstacles ?? []),
  ];

  /** World point (cx, cy) is drawn at screen FOCUS, scaled by zoom. */
  const frameShot = (s: Shot<C>): Framing => {
    const r = unionRect([...s.cards.map((c) => spec.cards[c]), ...(s.also ?? [])]);
    const zoom = Math.min(SAFE.w / r.w, SAFE.h / r.h, MAX_ZOOM) / (s.widen ?? 1);
    return {cx: r.x + r.w / 2, cy: r.y + r.h / 2, zoom};
  };

  /** Held-shot camera: still while a topic is spoken, eased travel starting on the next topic's first word. */
  const cameraAt = (f: number): Framing => {
    const shots = spec.shots;
    let i = 0;
    while (i + 1 < shots.length && f >= shots[i + 1].at) i++;
    const cur = frameShot(shots[i]);
    if (i === 0) return cur;
    const prev = frameShot(shots[i - 1]);
    const t = Math.min(1, (f - shots[i].at) / TRANS);
    if (t >= 1) return cur;
    const e = easeInOutCubic(t);
    return {
      cx: prev.cx + (cur.cx - prev.cx) * e,
      cy: prev.cy + (cur.cy - prev.cy) * e,
      zoom: Math.exp(Math.log(prev.zoom) + (Math.log(cur.zoom) - Math.log(prev.zoom)) * e),
    };
  };

  /** Where a world rect lands on screen under a framing. */
  const toScreen = (r: Rect, c: Framing): Rect => ({
    x: FOCUS.x + (r.x - c.cx) * c.zoom, y: FOCUS.y + (r.y - c.cy) * c.zoom, w: r.w * c.zoom, h: r.h * c.zoom,
  });

  return {spec, PIN_GAP, LINK_LAG, MAX_ZOOM, TRANS, SAFE, FOCUS, anchor, buildLink, links, linkById, obstacles, frameShot, cameraAt, toScreen};
};

export type Board<C extends string> = ReturnType<typeof makeBoard<C>>;
