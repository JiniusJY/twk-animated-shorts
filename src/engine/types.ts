import type { Expr, Outfit } from "./toon";

export type V3 = [number, number, number];
export type LightMode = "day" | "golden";
export type WorldPreset = "office" | "town" | "server_room" | "tarmac" | "courtroom" | "federal";
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
  | "crate"
  | "car"
  | "clock"
  | "gcu"
  | "switch";

/**
 * Typed story actions: things a prop DOES, not just where it is.
 * Carried on a PropKeyframe at frame f. Numeric actions animate from the
 * previously resolved value of the same type to `value` over `dur` frames
 * (default dur = 1, i.e. a snap). States without `dur` hold until the next
 * action of the same type. All evaluation is frame-pure and deterministic.
 */
export type PropAction =
  | { type: "leverAngle"; value: number; dur?: number } // degrees at the hinge
  | { type: "counterValue"; value: number; dur?: number } // integer display value
  | { type: "generatorState"; on: boolean } // GCU output / LED state (holds)
  | { type: "beaconIntensity"; value: number; dur?: number } // 0..1 warning beacon
  | { type: "clockHands"; value: number; dur?: number } // minutes shown on the analog dial
  | { type: "wheelRotation"; speed: number }; // rad/frame, holds until next wheelRotation

export interface PropKeyframe {
  f: number;
  pos?: V3;
  rotY?: number;
  scale?: number;
  label?: string;
  sublabel?: string;
  action?: PropAction;
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
  world?: WorldPreset;
  keyframes?: PropKeyframe[];
}

export type ActorMode = "march" | "stroll" | "stand" | "sit" | "fall";
export type ActorPropKind = "icecream" | "shako" | "hammer" | null;

export interface ActorKeyframe {
  f: number;
  pos?: V3;
  expr?: Expr;
  walk?: boolean;
  talk?: boolean;
  lean?: number;
  facing?: -1 | 0 | 1;
  look?: -1 | 0 | 1;
  mode?: ActorMode;
  side?: boolean;
  mirror?: boolean;
  prop?: ActorPropKind;
}

export interface ActorDef {
  id: string;
  preset?: "worker" | "boss" | "engineer" | "pilot" | "bot" | "kid" | "parent" | "officer" | "soldier";
  outfit?: Partial<Outfit>;
  pos: V3;
  scale?: number;
  expr?: Expr;
  walk?: boolean;
  talk?: boolean;
  lean?: number;
  facing?: -1 | 0 | 1;
  look?: -1 | 0 | 1;
  mode?: ActorMode;
  side?: boolean;
  mirror?: boolean;
  prop?: ActorPropKind;
  /** When set, the actor exists only while the active shot uses this world. */
  world?: WorldPreset;
  keyframes?: ActorKeyframe[];
}

export interface FxDef {
  kind: "burst" | "stars" | "notes" | "puff" | "ring" | "splash" | "creak";
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

/** Camera move classes (CONTENT_SYSTEM camera-language rule). Declared per shot;
 * lint fails two adjacent shots with the same class. */
export type CamMove = "static" | "truck" | "push" | "pull" | "crane" | "pan";

/** Shot-boundary transition, declared on the INCOMING shot. "cut" = hard cut (default).
 * whip-left/right sweeps the outgoing camera toward that side and sweeps the incoming
 * camera in from the opposite side; "dissolve" crossfades DISSOLVE_FRAMES frames. */
export type TransitionIn = "cut" | "whip-left" | "whip-right" | "dissolve";

export interface ShotDef {
  id: number;
  a: number;
  b: number;
  /** Storyboard contract: what this shot is FOR (question / mechanism / payoff...). */
  purpose?: string;
  /** Spoken phrase that starts this shot, matched to real aligned words. */
  anchor?: string;
  /** Declared camera move class; lint enforces adjacency variety. */
  move?: CamMove;
  /** How this shot arrives from the previous one. Default "cut". */
  transitionIn?: TransitionIn;
  graphic?:
    | "counter" | "overflow" | "power" | "reset" | "hook" | "lab" | "stakes"
    | "question" | "clock" | "storage" | "odometer" | "directive" | "payoff"
    | "ncic-hook" | "ncic-stop" | "ncic-files" | "ncic-records" | "ncic-clock"
    | "ncic-doors" | "ncic-breach" | "ncic-pattern" | "ncic-payoff"
    | "ncic-id";
  world?: WorldPreset;
  light: LightMode;
  dof?: number;
  flashAt?: number;
  kickAt?: number[];
  sunAz?: number;
  sunEl?: number;
  cam: CamPath;
}

/** One sourced claim behind what the narration says. */
export interface ClaimEntry {
  id: string;
  source_url: string;
  source_date?: string;
  accessed_at?: string;
  /** What the source actually supports vs what is inferred or illustrative. */
  attribution: string;
  limits?: string;
  /** Where in the source the supporting passage lives (section, timestamp, page). */
  passage?: string;
  /** The exact proposed on-screen/spoken wording this claim backs. */
  wording?: string;
}

/** Editorial metadata: why this story, for whom, and what each claim rests on. */
export interface TopicCard {
  trend_timestamp?: string;
  audience_question: string;
  why_now?: string;
}

export interface CreativeBrief {
  question: string;
  answer: string;
  proof?: string;
  caveat?: string;
  sharing_reason?: string;
}

export interface BeatClaims {
  /** Shot id this beat maps to. */
  shot: number;
  claim_ids: string[];
}

export interface CueDef {
  t: number;
  kind: "whoosh" | "pop" | "cash" | "boom" | "snap" | "flash" | "chime" | "tick" | "riser" | "powerdown" | "startup" | "relay";
  gain?: number;
  pan?: number; // -1 left to +1 right, equal-power stereo
}

/** Word timing from the voice pipeline (seconds), passed to the renderer via props JSON. */
export interface CaptionWord {
  w: string;
  s: number;
  e: number;
}

export interface CaptionsConfig {
  /** Default true when caption words are present. Set false to render without captions. */
  enabled?: boolean;
  theme?: "classic" | "editorial";
  /** Max words per caption page (default 4). */
  maxWordsPerPage?: number;
}

export interface EpisodeSpec {
  /** Visual spine: "world" = 3D toon world (default), "editorial" = 2D motion graphics (owner ruling 22 Nov 2026: 3D read as slop for NCIC; full editorial chosen). */
  style?: "world" | "editorial";
  slug: string;
  title: string;
  fps: number;
  durationFrames: number;
  world: WorldPreset;
  musicMood: MusicMood;
  script: string;
  /** Primary source backing the episode's factual claims. Required by schema validation. */
  sourceUrl?: string;
  endCard?: { handle: string; seconds?: number };
  shots: ShotDef[];
  actors: ActorDef[];
  props: PropDef[];
  fx?: FxDef[];
  cues?: CueDef[];
  captions?: CaptionsConfig;
  /** Optional composition override: renders a registered hand-authored composition (e.g. "board")
   *  under this episode's slug instead of the StoryShort engine. Default (unset) = StoryShort. */
  composition?: string;
  /** Frame count for the override composition; defaults to durationFrames. */
  compositionFrames?: number;
  topic_card?: TopicCard;
  creative_brief?: CreativeBrief;
  /** Every load-bearing factual claim, with the source that supports it and its limits. */
  claim_ledger?: ClaimEntry[];
  beats?: BeatClaims[];
  alternate_hook?: string;
  /** Optional voice direction: Fish Audio expressiveness controls + S2 [bracket] emotion cues in the script. */
  voice?: {
    temperature?: number; // 0..1, higher = more varied/expressive (Fish default 0.7)
    topP?: number; // 0..1 nucleus sampling (Fish default 0.7)
    speed?: number; // prosody speed multiplier, 0.5..2.0
    /** Default S2 delivery cue for the whole episode, e.g. "curious", "emphatic", "whispering". */
    direction?: string;
    beats?: { before: string; direction: string }[];
  };
}

/** Props accepted by the StoryShort composition: the episode spec plus optional caption words.
 * (type alias, not interface: Remotion's Composition needs an implicit index signature) */
export type StoryShortProps = {
  spec: EpisodeSpec;
  captions?: CaptionWord[] | null;
  /** True when words.json came from the proportional fallback, not real word alignment. */
  captionsApproximate?: boolean;
};
