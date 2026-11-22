/**
 * Runtime validation for episode JSON.
 *
 * `tsc --noEmit` does NOT validate episode data: registry.ts previously used
 * `as unknown as EpisodeSpec`, so malformed generated JSON passed the build
 * and failed (or silently misrendered) inside a paid cloud render. Every
 * episode now goes through validateEpisode() at import time and in CI before
 * any paid voice synthesis runs.
 */
import type {
  EpisodeSpec,
  ShotDef,
  ActorDef,
  PropDef,
  FxDef,
  CueDef,
  CaptionsConfig,
} from "./types";

const WORLDS = ["office", "town", "server_room", "tarmac", "courtroom", "federal"];
const MOODS = ["march", "playful", "tense", "mystery"];
const LIGHTS = ["day", "golden"];
const PROP_KINDS = [
  "desk", "screen", "book", "box", "server", "coin", "plane", "pile",
  "sign", "chart", "crate", "car", "clock", "gcu", "switch",
];
const ACTOR_PRESETS = ["worker", "boss", "engineer", "pilot", "bot", "kid", "parent", "officer", "soldier"];
const ACTOR_MODES = ["march", "stroll", "stand", "sit", "fall"];
const ACTOR_PROPS = ["icecream", "shako", "hammer", null];
const EXPRS = [
  "neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief",
  "relief_open", "dazed", "pained", "smile", "smile_closed", "lick",
];
const FX_KINDS = ["burst", "stars", "notes", "puff", "ring", "splash", "creak"];
const CUE_KINDS = ["whoosh", "pop", "cash", "boom", "snap", "flash", "chime", "tick", "riser", "powerdown", "startup", "relay"];
const EASES = ["smooth", "out", "linear"];
const ACTION_TYPES = ["leverAngle", "counterValue", "generatorState", "beaconIntensity", "clockHands", "wheelRotation"];

/** Fields the engine deliberately does not implement. Rejected loudly so generated episodes never silently ask for them. */
const UNSUPPORTED: Record<string, string> = {
  xfade: "shot.xfade is declared nowhere in the renderer anymore; use a hard cut plus a cue, or implement crossfade in StoryShort first",
  rotY: "actor rotY is not implemented (actor cards always face the camera); use `facing`, `side` or `mirror` instead",
};

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStr = (v: unknown): v is string => typeof v === "string";
const isV3 = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every(isNum);

function checkKeys(o: Obj, allowed: string[], where: string, errs: string[]) {
  for (const k of Object.keys(o)) {
    if (UNSUPPORTED[k] && !allowed.includes(k)) {
      errs.push(`${where}: unsupported field "${k}" — ${UNSUPPORTED[k]}`);
    } else if (!allowed.includes(k)) {
      errs.push(`${where}: unknown field "${k}" (allowed: ${allowed.join(", ")})`);
    }
  }
}

function validateShot(s: Obj, i: number, dur: number, errs: string[]): ShotDef | null {
  const where = `shots[${i}]`;
  checkKeys(s, ["id", "a", "b", "world", "light", "dof", "flashAt", "kickAt", "sunAz", "sunEl", "cam", "purpose", "anchor", "graphic"], where, errs);
  if (s.anchor !== undefined && (!isStr(s.anchor) || !s.anchor.trim())) errs.push(`${where}.anchor: must be a nonempty phrase`);
  if (s.graphic !== undefined && !["counter", "overflow", "power", "reset", "hook", "lab", "stakes", "question", "clock", "storage", "odometer", "directive", "payoff", "ncic-hook", "ncic-stop", "ncic-files", "ncic-records", "ncic-clock", "ncic-doors", "ncic-breach", "ncic-pattern", "ncic-payoff"].includes(s.graphic as string)) errs.push(`${where}.graphic: invalid graphic`);
  if (s.purpose !== undefined && !isStr(s.purpose)) errs.push(`${where}.purpose: must be a string`);
  if (!isInt(s.id)) errs.push(`${where}.id: must be an integer`);
  if (!isInt(s.a) || !isInt(s.b)) {
    errs.push(`${where}: a and b must be integer frames`);
    return null;
  }
  if (s.a < 0) errs.push(`${where}.a: must be >= 0`);
  if (s.b <= s.a) errs.push(`${where}: b (${s.b}) must be > a (${s.a})`);
  if (s.b > dur) errs.push(`${where}.b: ${s.b} exceeds durationFrames ${dur}`);
  if (s.world !== undefined && !WORLDS.includes(s.world as string))
    errs.push(`${where}.world: invalid world "${String(s.world)}"`);
  if (!LIGHTS.includes(s.light as string)) errs.push(`${where}.light: must be one of ${LIGHTS.join(", ")}`);
  if (s.dof !== undefined && !isNum(s.dof)) errs.push(`${where}.dof: must be a number`);
  if (s.flashAt !== undefined && (!isInt(s.flashAt) || s.flashAt < s.a || s.flashAt > s.b))
    errs.push(`${where}.flashAt: must be a frame within [a, b]`);
  if (s.kickAt !== undefined) {
    if (!Array.isArray(s.kickAt) || !s.kickAt.every(isInt)) errs.push(`${where}.kickAt: must be integer frames`);
    else for (const k of s.kickAt) if (k < s.a || k > s.b) errs.push(`${where}.kickAt: ${k} outside [a, b]`);
  }
  if (s.sunAz !== undefined && !isNum(s.sunAz)) errs.push(`${where}.sunAz: must be a number`);
  if (s.sunEl !== undefined && !isNum(s.sunEl)) errs.push(`${where}.sunEl: must be a number`);
  if (!isObj(s.cam)) {
    errs.push(`${where}.cam: required`);
    return null;
  }
  const cam = s.cam;
  checkKeys(cam, ["from", "to", "lookFrom", "lookTo", "fovFrom", "fovTo", "rollDeg", "ease"], `${where}.cam`, errs);
  for (const k of ["from", "to", "lookFrom", "lookTo"] as const)
    if (!isV3(cam[k])) errs.push(`${where}.cam.${k}: must be [x, y, z] numbers`);
  for (const k of ["fovFrom", "fovTo", "rollDeg"] as const)
    if (cam[k] !== undefined && !isNum(cam[k])) errs.push(`${where}.cam.${k}: must be a number`);
  if (cam.ease !== undefined && !EASES.includes(cam.ease as string))
    errs.push(`${where}.cam.ease: must be one of ${EASES.join(", ")}`);
  return s as unknown as ShotDef;
}

function validateKeyframes(
  kfs: unknown,
  kind: "actor" | "prop",
  owner: string,
  dur: number,
  errs: string[]
) {
  if (kfs === undefined) return;
  const allowed =
    kind === "actor"
      ? ["f", "pos", "expr", "walk", "talk", "lean", "facing", "look", "mode", "side", "mirror", "prop"]
      : ["f", "pos", "rotY", "scale", "label", "sublabel", "action"];
  if (!Array.isArray(kfs)) {
    errs.push(`${owner}.keyframes: must be an array`);
    return;
  }
  let prevF = -1;
  kfs.forEach((k, i) => {
    const where = `${owner}.keyframes[${i}]`;
    if (!isObj(k)) {
      errs.push(`${where}: must be an object`);
      return;
    }
    checkKeys(k, allowed, where, errs);
    if (!isInt(k.f) || k.f < 0) errs.push(`${where}.f: must be a non-negative integer frame`);
    else {
      if (k.f > dur) errs.push(`${where}.f: ${k.f} exceeds durationFrames ${dur}`);
      const tieOk = kind === "prop"; // props may stack different action types on the same beat
      if (tieOk ? k.f < prevF : k.f <= prevF)
        errs.push(`${where}.f: keyframes must be ordered by ${tieOk ? "non-decreasing" : "strictly increasing"} f (got ${k.f} after ${prevF})`);
      prevF = k.f;
    }
    if (k.pos !== undefined && !isV3(k.pos)) errs.push(`${where}.pos: must be [x, y, z]`);
    if (kind === "actor") {
      if (k.expr !== undefined && !EXPRS.includes(k.expr as string)) errs.push(`${where}.expr: invalid expression "${String(k.expr)}"`);
      for (const b of ["walk", "talk", "side", "mirror"] as const)
        if (k[b] !== undefined && !isBool(k[b])) errs.push(`${where}.${b}: must be boolean`);
      if (k.lean !== undefined && !isNum(k.lean)) errs.push(`${where}.lean: must be a number`);
      for (const t of ["facing", "look"] as const)
        if (k[t] !== undefined && ![-1, 0, 1].includes(k[t] as number)) errs.push(`${where}.${t}: must be -1, 0 or 1`);
      if (k.mode !== undefined && !ACTOR_MODES.includes(k.mode as string)) errs.push(`${where}.mode: invalid mode "${String(k.mode)}"`);
      if (k.prop !== undefined && !ACTOR_PROPS.includes(k.prop as string | null))
        errs.push(`${where}.prop: must be icecream, shako, hammer or null`);
    } else {
      if (k.rotY !== undefined && !isNum(k.rotY)) errs.push(`${where}.rotY: must be a number`);
      if (k.scale !== undefined && (!isNum(k.scale) || k.scale <= 0)) errs.push(`${where}.scale: must be > 0`);
      if (k.label !== undefined && !isStr(k.label)) errs.push(`${where}.label: must be a string`);
      if (k.sublabel !== undefined && !isStr(k.sublabel)) errs.push(`${where}.sublabel: must be a string`);
      if (k.action !== undefined) validateAction(k.action, `${where}.action`, errs);
    }
  });
}

function validateAction(a: unknown, where: string, errs: string[]) {
  if (!isObj(a)) {
    errs.push(`${where}: must be an object`);
    return;
  }
  checkKeys(a, ["type", "value", "dur", "on", "speed"], where, errs);
  if (!ACTION_TYPES.includes(a.type as string)) {
    errs.push(`${where}.type: must be one of ${ACTION_TYPES.join(", ")}`);
    return;
  }
  if (a.dur !== undefined && (!isInt(a.dur) || a.dur < 1)) errs.push(`${where}.dur: must be an integer >= 1`);
  switch (a.type) {
    case "leverAngle":
    case "clockHands":
      if (!isNum(a.value)) errs.push(`${where}.value: must be a number`);
      break;
    case "counterValue":
      if (!isNum(a.value)) errs.push(`${where}.value: must be a number (use exact integers; decimals render rounded)`);
      break;
    case "beaconIntensity":
      if (!isNum(a.value) || a.value < 0 || a.value > 1) errs.push(`${where}.value: must be 0..1`);
      break;
    case "generatorState":
      if (!isBool(a.on)) errs.push(`${where}.on: must be boolean`);
      break;
    case "wheelRotation":
      if (!isNum(a.speed)) errs.push(`${where}.speed: must be a number (rad/frame)`);
      break;
  }
}

function validateActor(a: Obj, i: number, dur: number, errs: string[]): ActorDef | null {
  const where = `actors[${i}]`;
  checkKeys(a, ["id", "preset", "outfit", "pos", "scale", "expr", "walk", "talk", "lean", "facing", "look", "mode", "side", "mirror", "prop", "world", "keyframes"], where, errs);
  if (!isStr(a.id) || !a.id) errs.push(`${where}.id: required non-empty string`);
  if (a.preset !== undefined && !ACTOR_PRESETS.includes(a.preset as string))
    errs.push(`${where}.preset: invalid preset "${String(a.preset)}"`);
  if (!isV3(a.pos)) errs.push(`${where}.pos: must be [x, y, z]`);
  if (a.world !== undefined && !WORLDS.includes(a.world as string))
    errs.push(`${where}.world: invalid world "${String(a.world)}"`);
  validateKeyframes(a.keyframes, "actor", where, dur, errs);
  return a as unknown as ActorDef;
}

function validateProp(p: Obj, i: number, dur: number, errs: string[]): PropDef | null {
  const where = `props[${i}]`;
  checkKeys(p, ["id", "kind", "pos", "rotY", "scale", "color", "accent", "label", "sublabel", "bob", "spin", "world", "keyframes"], where, errs);
  if (!isStr(p.id) || !p.id) errs.push(`${where}.id: required non-empty string`);
  if (!PROP_KINDS.includes(p.kind as string)) errs.push(`${where}.kind: invalid kind "${String(p.kind)}"`);
  if (!isV3(p.pos)) errs.push(`${where}.pos: must be [x, y, z]`);
  if (p.world !== undefined && !WORLDS.includes(p.world as string))
    errs.push(`${where}.world: invalid world "${String(p.world)}"`);
  if (p.color !== undefined && !isStr(p.color)) errs.push(`${where}.color: must be a css color string`);
  validateKeyframes(p.keyframes, "prop", where, dur, errs);
  return p as unknown as PropDef;
}

function validateFx(fx: Obj, i: number, dur: number, errs: string[]): FxDef | null {
  const where = `fx[${i}]`;
  checkKeys(fx, ["kind", "pos", "a", "b", "scale", "color"], where, errs);
  if (!FX_KINDS.includes(fx.kind as string)) errs.push(`${where}.kind: invalid kind "${String(fx.kind)}"`);
  if (!isV3(fx.pos)) errs.push(`${where}.pos: must be [x, y, z]`);
  if (!isInt(fx.a) || !isInt(fx.b)) errs.push(`${where}: a and b must be integer frames`);
  else {
    if (fx.a < 0 || fx.b > dur) errs.push(`${where}: frame range [${fx.a}, ${fx.b}] outside [0, ${dur}]`);
    if (fx.b <= fx.a) errs.push(`${where}: b must be > a`);
  }
  return fx as unknown as FxDef;
}

function validateCue(c: Obj, i: number, durSec: number, errs: string[]): CueDef | null {
  const where = `cues[${i}]`;
  checkKeys(c, ["t", "kind", "gain", "pan"], where, errs);
  if (!isNum(c.t)) errs.push(`${where}.t: must be a time in SECONDS (not frames)`);
  else if (c.t < 0 || c.t > durSec + 0.5)
    errs.push(`${where}.t: ${c.t}s outside episode duration ${durSec.toFixed(2)}s — cues are seconds, not frames`);
  if (!CUE_KINDS.includes(c.kind as string)) errs.push(`${where}.kind: invalid cue kind "${String(c.kind)}"`);
  if (c.pan !== undefined && (!isNum(c.pan) || Math.abs(c.pan) > 1)) errs.push(`${where}.pan: must be -1..1`);
  if (c.gain !== undefined && (!isNum(c.gain) || c.gain < 0 || c.gain > 1))
    errs.push(`${where}.gain: must be 0..1`);
  return c as unknown as CueDef;
}

function validateCaptions(c: unknown, errs: string[]): CaptionsConfig | undefined {
  if (c === undefined) return undefined;
  if (!isObj(c)) {
    errs.push("captions: must be an object");
    return undefined;
  }
  checkKeys(c, ["enabled", "maxWordsPerPage", "theme"], "captions", errs);
  if (c.theme !== undefined && !["classic", "editorial"].includes(c.theme as string)) errs.push("captions.theme invalid");
  if (c.enabled !== undefined && !isBool(c.enabled)) errs.push("captions.enabled: must be boolean");
  if (c.maxWordsPerPage !== undefined && (!isInt(c.maxWordsPerPage) || c.maxWordsPerPage < 1 || c.maxWordsPerPage > 8))
    errs.push("captions.maxWordsPerPage: must be an integer 1..8");
  return c as unknown as CaptionsConfig;
}

/**
 * Validate a raw parsed episode JSON object. Throws Error listing every
 * problem found; returns the spec (unchanged, now typed) when valid.
 */
export function validateEpisode(raw: unknown, source: string): EpisodeSpec {
  const errs: string[] = [];
  if (!isObj(raw)) throw new Error(`${source}: episode is not an object`);
  checkKeys(raw, ["slug", "title", "fps", "durationFrames", "world", "musicMood", "script", "sourceUrl", "shots", "actors", "props", "fx", "cues", "captions", "voice", "bgAudio", "topic_card", "creative_brief", "claim_ledger", "beats", "alternate_hook", "endCard"], source, errs);

  if (!isStr(raw.slug) || !/^[a-z0-9][a-z0-9-]*$/.test(raw.slug))
    errs.push(`${source}.slug: required, lowercase letters/digits/hyphens`);
  if (!isStr(raw.title) || !raw.title) errs.push(`${source}.title: required`);
  if (!isInt(raw.fps) || raw.fps < 1 || raw.fps > 120) errs.push(`${source}.fps: must be an integer 1..120`);
  if (raw.endCard !== undefined) {
    if (!isObj(raw.endCard)) errs.push("endCard must be an object");
    else {
      checkKeys(raw.endCard, ["handle", "seconds"], "endCard", errs);
      if (!isStr(raw.endCard.handle) || !/^@[a-zA-Z0-9_.]{1,40}$/.test(raw.endCard.handle)) errs.push("endCard.handle invalid");
      if (raw.endCard.seconds !== undefined && (!isNum(raw.endCard.seconds) || raw.endCard.seconds < 1 || raw.endCard.seconds > 4)) errs.push("endCard.seconds must be 1..4");
    }
  }
  const fps = isInt(raw.fps) ? raw.fps : 30;
  if (!isInt(raw.durationFrames) || raw.durationFrames < fps * 5)
    errs.push(`${source}.durationFrames: must be an integer of at least 5 seconds (${fps * 5})`);
  const dur = isInt(raw.durationFrames) ? raw.durationFrames : 0;
  if (!WORLDS.includes(raw.world as string)) errs.push(`${source}.world: must be one of ${WORLDS.join(", ")}`);
  if (!MOODS.includes(raw.musicMood as string)) errs.push(`${source}.musicMood: must be one of ${MOODS.join(", ")}`);
  if (!isStr(raw.script) || raw.script.trim().length < 20)
    errs.push(`${source}.script: required, at least 20 characters`);
  if (!isStr(raw.sourceUrl) || !/^https?:\/\//.test(raw.sourceUrl))
    errs.push(`${source}.sourceUrl: required — every episode must link the primary source backing its factual claims`);
  if (isObj(raw.voice)) {
    checkKeys(raw.voice, ["temperature", "topP", "speed", "direction", "beats"], `${source}.voice`, errs);
    if (raw.voice.direction !== undefined && !isStr(raw.voice.direction)) errs.push(`${source}.voice.direction: must be a string (Fish S2 cue word)`);
    if (raw.voice.beats !== undefined) {
      if (!Array.isArray(raw.voice.beats)) errs.push("voice.beats must be an array");
      else raw.voice.beats.forEach((b, i) => {
        if (!isObj(b)) { errs.push(`voice.beats[${i}] must be an object`); return; }
        checkKeys(b, ["before", "direction"], `voice.beats[${i}]`, errs);
        if (!isStr(b.before) || !b.before.trim() || !isStr(raw.script) || raw.script.split(b.before).length !== 2) errs.push(`voice.beats[${i}].before must match once in script`);
        if (!isStr(b.direction) || !/^[a-zA-Z ,.-]{2,120}$/.test(b.direction)) errs.push(`voice.beats[${i}].direction invalid`);
      });
    }
    const v = raw.voice;
    if (v.temperature !== undefined && (!isNum(v.temperature) || v.temperature < 0 || v.temperature > 1))
      errs.push(`${source}.voice.temperature: must be 0..1`);
    if (v.topP !== undefined && (!isNum(v.topP) || v.topP < 0 || v.topP > 1))
      errs.push(`${source}.voice.topP: must be 0..1`);
    if (v.speed !== undefined && (!isNum(v.speed) || v.speed < 0.5 || v.speed > 2))
      errs.push(`${source}.voice.speed: must be 0.5..2.0`);
  } else if (raw.voice !== undefined) {
    errs.push(`${source}.voice: must be an object`);
  }

  const shotsIn = Array.isArray(raw.shots) ? raw.shots : [];
  if (!Array.isArray(raw.shots) || raw.shots.length === 0) errs.push(`${source}.shots: required, non-empty array`);
  const shots = shotsIn.map((s, i) => (isObj(s) ? validateShot(s, i, dur, errs) : (errs.push(`shots[${i}]: must be an object`), null)));

  // Shot coverage: contiguous, ordered, no gaps/overlaps, covering [0, durationFrames]
  const okShots = shots.filter((s): s is ShotDef => s !== null);
  const ids = new Set<number>();
  for (const s of okShots) {
    if (ids.has(s.id)) errs.push(`${source}: duplicate shot id ${s.id}`);
    ids.add(s.id);
  }
  const sorted = [...okShots].sort((x, y) => x.a - y.a);
  if (sorted.length > 0 && dur > 0) {
    if (sorted[0].a !== 0) errs.push(`${source}: first shot must start at frame 0 (starts at ${sorted[0].a})`);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].a !== sorted[i - 1].b)
        errs.push(`${source}: shot gap/overlap between shot ${sorted[i - 1].id} (ends ${sorted[i - 1].b}) and shot ${sorted[i].id} (starts ${sorted[i].a})`);
    }
    if (sorted[sorted.length - 1].b !== dur)
      errs.push(`${source}: last shot must end at durationFrames ${dur} (ends ${sorted[sorted.length - 1].b})`);
  }

  const actorsIn = Array.isArray(raw.actors) ? raw.actors : [];
  if (!Array.isArray(raw.actors)) errs.push(`${source}.actors: must be an array`);
  const actors = actorsIn.map((a, i) => (isObj(a) ? validateActor(a, i, dur, errs) : (errs.push(`actors[${i}]: must be an object`), null)));
  const actorIds = new Set<string>();
  for (const a of actors) {
    if (!a) continue;
    if (actorIds.has(a.id)) errs.push(`${source}: duplicate actor id "${a.id}"`);
    actorIds.add(a.id);
  }

  const propsIn = Array.isArray(raw.props) ? raw.props : [];
  if (!Array.isArray(raw.props)) errs.push(`${source}.props: must be an array`);
  const props = propsIn.map((p, i) => (isObj(p) ? validateProp(p, i, dur, errs) : (errs.push(`props[${i}]: must be an object`), null)));
  const propIds = new Set<string>();
  for (const p of props) {
    if (!p) continue;
    if (propIds.has(p.id)) errs.push(`${source}: duplicate prop id "${p.id}"`);
    propIds.add(p.id);
  }

  const fx = (Array.isArray(raw.fx) ? raw.fx : []).map((f, i) =>
    isObj(f) ? validateFx(f, i, dur, errs) : (errs.push(`fx[${i}]: must be an object`), null)
  );
  if (raw.fx !== undefined && !Array.isArray(raw.fx)) errs.push(`${source}.fx: must be an array`);

  const durSec = dur / fps;
  const cues = (Array.isArray(raw.cues) ? raw.cues : []).map((c, i) =>
    isObj(c) ? validateCue(c, i, durSec, errs) : (errs.push(`cues[${i}]: must be an object`), null)
  );
  if (raw.cues !== undefined && !Array.isArray(raw.cues)) errs.push(`${source}.cues: must be an array`);

  validateCaptions(raw.captions, errs);

  // Editorial metadata (playbook: claim ledger + topic card + creative brief + per-beat claims)
  const claimIds = new Set<string>();
  if (raw.claim_ledger !== undefined) {
    if (!Array.isArray(raw.claim_ledger)) errs.push(`${source}.claim_ledger: must be an array`);
    else (raw.claim_ledger as unknown[]).forEach((c, i) => {
      const where = `${source}.claim_ledger[${i}]`;
      if (!isObj(c)) { errs.push(`${where}: must be an object`); return; }
      checkKeys(c, ["id", "source_url", "source_date", "accessed_at", "attribution", "limits", "passage", "wording"], where, errs);
      if (!isStr(c.id) || !c.id) errs.push(`${where}.id: required`);
      else claimIds.add(c.id);
      if (!isStr(c.source_url) || !/^https?:\/\//.test(c.source_url)) errs.push(`${where}.source_url: required http(s) URL`);
      if (!isStr(c.attribution) || !c.attribution) errs.push(`${where}.attribution: required — state what the source actually supports`);
    });
  }
  if (raw.topic_card !== undefined) {
    const where = `${source}.topic_card`;
    if (!isObj(raw.topic_card)) errs.push(`${where}: must be an object`);
    else {
      checkKeys(raw.topic_card, ["trend_timestamp", "audience_question", "why_now"], where, errs);
      if (!isStr(raw.topic_card.audience_question) || !raw.topic_card.audience_question)
        errs.push(`${where}.audience_question: required`);
    }
  }
  if (raw.creative_brief !== undefined) {
    const where = `${source}.creative_brief`;
    if (!isObj(raw.creative_brief)) errs.push(`${where}: must be an object`);
    else {
      checkKeys(raw.creative_brief, ["question", "answer", "proof", "caveat", "sharing_reason"], where, errs);
      if (!isStr(raw.creative_brief.question)) errs.push(`${where}.question: required`);
      if (!isStr(raw.creative_brief.answer)) errs.push(`${where}.answer: required`);
    }
  }
  if (raw.alternate_hook !== undefined && !isStr(raw.alternate_hook)) errs.push(`${source}.alternate_hook: must be a string`);
  if (raw.beats !== undefined) {
    if (!Array.isArray(raw.beats)) errs.push(`${source}.beats: must be an array`);
    else (raw.beats as unknown[]).forEach((b, i) => {
      const where = `${source}.beats[${i}]`;
      if (!isObj(b)) { errs.push(`${where}: must be an object`); return; }
      checkKeys(b, ["shot", "claim_ids"], where, errs);
      if (!isInt(b.shot)) errs.push(`${where}.shot: must be a shot id (integer)`);
      else if (!ids.has(b.shot)) errs.push(`${where}.shot: no shot with id ${b.shot}`);
      if (!Array.isArray(b.claim_ids)) errs.push(`${where}.claim_ids: must be an array`);
      else for (const cid of b.claim_ids) {
        if (!isStr(cid)) errs.push(`${where}.claim_ids: entries must be strings`);
        else if (claimIds.size > 0 && !claimIds.has(cid)) errs.push(`${where}: claim_id "${cid}" not in claim_ledger`);
      }
    });
  }

  if (errs.length > 0) {
    throw new Error(`Invalid episode "${source}":\n  - ${errs.join("\n  - ")}`);
  }
  return raw as unknown as EpisodeSpec;
}
