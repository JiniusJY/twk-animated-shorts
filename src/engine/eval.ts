/**
 * Frame-pure, pre-sorted timeline evaluators.
 *
 * Previously evalActor re-sorted keyframes on every call and ran twice per
 * actor per frame (once for the canvas redraw, once for placement). Now each
 * actor/prop is prepared once (keyframes sorted a single time) and evaluated
 * once per frame, with identical results for direct seeks and sequential
 * rendering — shard boundaries can never diverge.
 */
import type {
  ActorDef,
  ActorKeyframe,
  ActorMode,
  ActorPropKind,
  PropAction,
  PropDef,
  PropKeyframe,
  V3,
} from "./types";
import type { Expr } from "./toon";

export function lerpV3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export interface ActorState {
  pos: V3;
  expr: Expr;
  walk: boolean;
  talk: boolean;
  lean: number;
  facing: -1 | 0 | 1;
  look: -1 | 0 | 1;
  mode: ActorMode;
  side: boolean;
  mirror: boolean;
  prop: ActorPropKind;
  moveDir: [number, number];
}

export interface PreparedActor {
  def: ActorDef;
  kfs: ActorKeyframe[];
  swapFrames: number[];
}

export function prepareActor(def: ActorDef): PreparedActor {
  const kfs = [...(def.keyframes ?? [])].sort((x, y) => x.f - y.f);
  const swapFrames = kfs.filter((k) => k.expr !== undefined && k.f > 0).map((k) => k.f);
  return { def, kfs, swapFrames };
}

export function evalActorAt(p: PreparedActor, f: number): ActorState {
  const a = p.def;
  let pos: V3 = a.pos;
  let expr: Expr = a.expr ?? "neutral";
  let walk = a.walk ?? false;
  let talk = a.talk ?? false;
  let lean = a.lean ?? 0;
  let facing: -1 | 0 | 1 = a.facing ?? 0;
  let look: -1 | 0 | 1 = a.look ?? 0;
  let mode: ActorMode | undefined = a.mode;
  let side = a.side ?? false;
  let mirror = a.mirror ?? false;
  let prop: ActorPropKind = a.prop ?? null;
  let moveDir: [number, number] = [0, 0];

  const kfs = p.kfs;
  for (let i = 0; i < kfs.length; i++) {
    const k = kfs[i];
    if (f >= k.f) {
      if (k.pos) pos = k.pos;
      if (k.expr !== undefined) expr = k.expr;
      if (k.walk !== undefined) walk = k.walk;
      if (k.talk !== undefined) talk = k.talk;
      if (k.lean !== undefined) lean = k.lean;
      if (k.facing !== undefined) facing = k.facing;
      if (k.look !== undefined) look = k.look;
      if (k.mode !== undefined) mode = k.mode;
      if (k.side !== undefined) side = k.side;
      if (k.mirror !== undefined) mirror = k.mirror;
      if (k.prop !== undefined) prop = k.prop;
    }
    const next = kfs[i + 1];
    if (next && f >= k.f && f < next.f) {
      // Only interpolate position when the character is actively walking so actors never slide like ghosts
      if (k.pos && next.pos && k.walk) {
        const u = (f - k.f) / Math.max(1, next.f - k.f);
        const s = u * u * (3 - 2 * u);
        pos = lerpV3(k.pos, next.pos, s);
        const dx = next.pos[0] - k.pos[0];
        const dz = next.pos[2] - k.pos[2];
        const len = Math.hypot(dx, dz);
        if (len > 0.05) moveDir = [dx / len, dz / len];
      }
      break;
    }
  }

  const resolvedMode: ActorMode = mode ?? (walk ? "march" : "stand");
  return { pos, expr, walk, talk, lean, facing, look, mode: resolvedMode, side, mirror, prop, moveDir };
}

export interface ResolvedActions {
  leverAngle?: number;
  counterValue?: number;
  generatorState?: boolean;
  beaconIntensity?: number;
  clockHands?: number;
  wheelAngle?: number; // accumulated radians from wheelRotation speed segments
}

export interface PropState {
  pos: V3;
  rotY: number;
  scale: number;
  label: string;
  sublabel: string;
  actions: ResolvedActions;
}

export interface PreparedProp {
  def: PropDef;
  kfs: PropKeyframe[];
}

export function prepareProp(def: PropDef): PreparedProp {
  return { def, kfs: [...(def.keyframes ?? [])].sort((x, y) => x.f - y.f) };
}

const smooth = (u: number) => u * u * (3 - 2 * u);

/**
 * Resolve typed story actions at frame f. Numeric actions animate from the
 * previously resolved value of the same type to the keyframe's `value` over
 * `dur` frames (dur=1 snaps). wheelRotation speed holds per segment and
 * integrates to an absolute angle in closed form, so direct seeks match
 * sequential playback exactly.
 */
export function evalActionsAt(kfs: PropKeyframe[], f: number): ResolvedActions {
  const out: ResolvedActions = {};
  let wheelAngle = 0;
  let wheelSpeed = 0;
  let wheelFrom = 0;
  for (const k of kfs) {
    if (k.f > f) break;
    const a = k.action;
    if (!a) continue;
    if (a.type === "wheelRotation") {
      wheelAngle += wheelSpeed * Math.max(0, k.f - wheelFrom);
      wheelSpeed = a.speed;
      wheelFrom = k.f;
      continue;
    }
    if (a.type === "generatorState") {
      out.generatorState = a.on;
      continue;
    }
    const dur = a.dur ?? 1;
    const u = Math.max(0, Math.min(1, (f - k.f) / dur + (dur === 1 ? 1 : 0)));
    switch (a.type) {
      case "leverAngle":
        out.leverAngle = (out.leverAngle ?? 0) + (a.value - (out.leverAngle ?? 0)) * smooth(u);
        break;
      case "counterValue":
        out.counterValue = (out.counterValue ?? 0) + (a.value - (out.counterValue ?? 0)) * u;
        break;
      case "beaconIntensity":
        out.beaconIntensity = (out.beaconIntensity ?? 0) + (a.value - (out.beaconIntensity ?? 0)) * smooth(u);
        break;
      case "clockHands":
        out.clockHands = (out.clockHands ?? 0) + (a.value - (out.clockHands ?? 0)) * u;
        break;
    }
  }
  wheelAngle += wheelSpeed * Math.max(0, f - wheelFrom);
  if (wheelSpeed !== 0 || wheelAngle !== 0) out.wheelAngle = wheelAngle;
  return out;
}

export function evalPropAt(p: PreparedProp, f: number): PropState {
  const def = p.def;
  let pos: V3 = def.pos;
  let rotY = def.rotY ?? 0;
  let scale = def.scale ?? 1;
  let label = def.label ?? "";
  let sublabel = def.sublabel ?? "";

  const kfs = p.kfs;
  for (let i = 0; i < kfs.length; i++) {
    const k = kfs[i];
    if (f >= k.f) {
      if (k.label !== undefined) label = k.label;
      if (k.sublabel !== undefined) sublabel = k.sublabel;
    }
    const next = kfs[i + 1];
    if (next && f >= k.f && f < next.f) {
      const u = (f - k.f) / Math.max(1, next.f - k.f);
      const s = u * u * (3 - 2 * u);
      if (k.pos && next.pos) pos = lerpV3(k.pos, next.pos, s);
      else if (k.pos) pos = k.pos;
      if (k.rotY !== undefined && next.rotY !== undefined) rotY = k.rotY + (next.rotY - k.rotY) * s;
      else if (k.rotY !== undefined) rotY = k.rotY;
      if (k.scale !== undefined && next.scale !== undefined) scale = k.scale + (next.scale - k.scale) * s;
      else if (k.scale !== undefined) scale = k.scale;
      break;
    } else if (!next && f >= k.f) {
      if (k.pos) pos = k.pos;
      if (k.rotY !== undefined) rotY = k.rotY;
      if (k.scale !== undefined) scale = k.scale;
    }
  }

  if (def.bob) pos = [pos[0], pos[1] + Math.sin(f * 0.08) * def.bob, pos[2]];
  if (def.spin) rotY += f * def.spin;
  return { pos, rotY, scale, label, sublabel, actions: evalActionsAt(kfs, f) };
}
