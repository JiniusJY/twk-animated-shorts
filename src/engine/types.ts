import type { Expr, Outfit } from "./toon";

export type V3 = [number, number, number];
export type LightMode = "day" | "golden";
export type WorldPreset = "office" | "town" | "server_room" | "tarmac" | "courtroom";
export type MusicMood = "march" | "playful" | "tense" | "mystery";

export type PropKind =
  | "desk"
  | "screen"
  | "book"
  | "box"
  | "server"
  | "coin"
  | "plane"
  | "pile"
  | "sign"
  | "chart"
  | "crate";

export interface PropKeyframe {
  f: number;
  pos?: V3;
  rotY?: number;
  scale?: number;
  label?: string;
  sublabel?: string;
}

export interface PropDef {
  id: string;
  kind: PropKind;
  pos: V3;
  rotY?: number;
  scale?: number;
  color?: string;
  accent?: string;
  label?: string;
  sublabel?: string;
  bob?: number;
  spin?: number;
  keyframes?: PropKeyframe[];
}

export interface ActorKeyframe {
  f: number;
  pos?: V3;
  rotY?: number;
  expr?: Expr;
  walk?: boolean;
  talk?: boolean;
  lean?: number;
}

export interface ActorDef {
  id: string;
  preset?: "worker" | "boss" | "engineer" | "pilot" | "bot" | "kid" | "parent";
  outfit?: Partial<Outfit>;
  pos: V3;
  rotY?: number;
  expr?: Expr;
  walk?: boolean;
  talk?: boolean;
  lean?: number;
  keyframes?: ActorKeyframe[];
}

export interface FxDef {
  kind: "burst" | "stars" | "notes" | "puff" | "ring" | "splash";
  pos: V3;
  a: number;
  b: number;
  scale?: number;
  color?: string;
}

export interface CamPath {
  from: V3;
  to: V3;
  lookFrom: V3;
  lookTo: V3;
  fovFrom?: number;
  fovTo?: number;
  rollDeg?: number;
  ease?: "smooth" | "out" | "linear";
}

export interface ShotDef {
  id: number;
  a: number;
  b: number;
  light: LightMode;
  dof?: number;
  xfade?: number;
  flashAt?: number;
  kickAt?: number[];
  sunAz?: number;
  sunEl?: number;
  cam: CamPath;
}

export interface CueDef {
  t: number;
  kind: "whoosh" | "pop" | "cash" | "boom" | "snap" | "flash" | "chime" | "tick";
  gain?: number;
}

export interface EpisodeSpec {
  slug: string;
  title: string;
  fps: number;
  durationFrames: number;
  world: WorldPreset;
  musicMood: MusicMood;
  script: string;
  sourceUrl?: string;
  shots: ShotDef[];
  actors: ActorDef[];
  props: PropDef[];
  fx?: FxDef[];
  cues?: CueDef[];
}
