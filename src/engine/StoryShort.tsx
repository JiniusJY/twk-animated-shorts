import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import {
  Pen,
  bodyFront,
  bodySide,
  fxBurst,
  fxStars,
  fxNote,
  fxPuff,
  fxRing,
  fxSplash,
  fxCreak,
  fxContact,
  fxShadow,
  OFFICER,
  RIFLEMAN,
  KID,
  PARENT,
  SKINS,
  townsfolk,
  soldier,
  Outfit,
  Expr,
  Prop as ToonProp,
} from "./toon";
import { buildWorldEnvironment, buildPropMesh, makeSky } from "./worlds";
import { prepareActor, evalActorAt, prepareProp, evalPropAt, lerpV3, type ActorState } from "./eval";
import { Captions } from "./Captions";
import { EndCard } from "./EndCard";
import { EditorialScene } from "./EditorialScene";
import { MechanismGraphic } from "./MechanismGraphic";
import { NcicScene } from "./NcicScene";
import type { EpisodeSpec, ShotDef, ActorDef, V3, WorldPreset, StoryShortProps } from "./types";

const OUTFIT_PRESETS: Record<string, Outfit> = {
  pilot: {
    jacket: "#263d66",
    pants: "#202b40",
    boots: "#1d1721",
    hat: "shako",
    belt: "#f1efe6",
    buttons: "#e8c45a",
    skin: SKINS[0],
  },
  engineer: {
    jacket: "#d96b38",
    pants: "#364152",
    boots: "#241726",
    hat: "cap",
    cap: "#356199",
    belt: "#f1efe6",
    buttons: "#e8c45a",
    skin: SKINS[1],
  },
  worker: {
    jacket: "#3a6ea5",
    pants: "#333b4a",
    boots: "#241726",
    hat: "hair",
    hair: "#4a3020",
    buttons: "#d9dde0",
    skin: SKINS[2],
  },
  boss: {
    ...OFFICER,
    jacket: "#2d3548",
    pants: "#232733",
    sash: "#c0353a",
    buttons: "#e8c45a",
    moustache: "#4a3020",
    build: "stout",
    skin: SKINS[0],
  },
  officer: OFFICER,
  soldier: RIFLEMAN,
  bot: {
    jacket: "#2d8bba",
    pants: "#394859",
    boots: "#241726",
    hat: "tophat",
    buttons: "#e8c45a",
    skin: "#e3ebf5",
  },
  kid: KID,
  parent: PARENT,
};

function resolveOutfit(a: ActorDef, idx: number): Outfit {
  const base = a.preset
    ? OUTFIT_PRESETS[a.preset] ?? (idx % 2 === 0 ? townsfolk(idx) : soldier(idx))
    : townsfolk(idx);
  return { ...base, ...(a.outfit ?? {}) };
}

const hh = (i: number, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const LID_FRAMES = [0.5, 1, 1, 0.5];
/** Natural 4-frame eyelid blink every 0.5-2.3s plus a blink across every expression change (cast.ts) */
function lidAt(f: number, idx: number, swapFrames: number[]): number {
  for (const sf of swapFrames) {
    const k = f - (sf - 1);
    if (k >= 0 && k < 4) return LID_FRAMES[k];
  }
  let s = Math.round(-60 * hh(idx, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID_FRAMES[k];
    s += Math.round(15 + 54 * hh(idx * 31 + n, 13));
  }
  return 0;
}

/** Quintic smootherstep from templates/bridge/story.ts */
function glide(u: number): number {
  const x = Math.max(0, Math.min(1, u));
  return x * x * x * (x * (6 * x - 15) + 10);
}

/** Whip-pan transition tuning: frames each side of the boundary, peak yaw, blur. */
export const WHIP_FRAMES = 7;
export const WHIP_DEG = 55;
export const DISSOLVE_FRAMES = 9;

/** Rotate the look vector around the camera position (yaw about +Y, degrees). */
function yawLook(pos: V3, look: V3, deg: number): V3 {
  const t = (deg * Math.PI) / 180;
  const dx = look[0] - pos[0];
  const dz = look[2] - pos[2];
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [pos[0] + dx * c + dz * s, look[1], pos[2] - dx * s + dz * c];
}

function evalShotCam(shot: ShotDef, f: number, whipYawDeg = 0) {
  const span = Math.max(1, shot.b - shot.a);
  const rawU = Math.max(0, Math.min(1, (f - shot.a) / span));
  const ease = shot.cam.ease ?? "smooth";
  const u = ease === "linear" ? rawU : ease === "out" ? 1 - (1 - rawU) ** 3 : glide(rawU);
  const pos = lerpV3(shot.cam.from, shot.cam.to, u);
  let look = lerpV3(shot.cam.lookFrom, shot.cam.lookTo, u);
  const fovFrom = shot.cam.fovFrom ?? 40;
  const fovTo = shot.cam.fovTo ?? fovFrom;
  const fov = fovFrom + (fovTo - fovFrom) * u;
  let roll = ((shot.cam.rollDeg ?? 0) * Math.PI) / 180;

  if (shot.kickAt) {
    for (const kf of shot.kickAt) {
      const n = f - kf;
      if (n >= 0 && n < 7) {
        const a = (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
        const d: V3 = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]];
        const L = Math.hypot(...d);
        const h = Math.hypot(d[0], d[2]) || 1;
        const m = (3.5 / 640) * Math.tan((fov * Math.PI) / 360) * L * a;
        look = [look[0] - (d[2] / h) * m, look[1] + 0.6 * m, look[2] + (d[0] / h) * m];
        roll += a * 0.006;
      }
    }
  }
  if (whipYawDeg !== 0) look = yawLook(pos, look, whipYawDeg);
  return { pos, look, fov, roll };
}

function findShot(shots: ShotDef[], f: number): ShotDef {
  for (const s of shots) {
    if (f >= s.a && f < s.b) return s;
  }
  return shots[shots.length - 1];
}

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.45,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const SU = 0.00216;
const BODY_GEO = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();
const CONTACT_GEO = (() => {
  const g = new THREE.PlaneGeometry(0.54, 0.42);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.022, 0);
  return g;
})();
const TAIL_GEO = (() => {
  const g = new THREE.PlaneGeometry(0.74, 1.65);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.018, 0.48);
  return g;
})();
const FX_GEO = new THREE.PlaneGeometry(1.5, 1.5);

// High-resolution character canvas (1080 x 1800 = 1.8x the 600 x 1000 design grid, matching templates/bridge/cast.ts)
const CHAR_W = 1080;
const CHAR_H = 1800;
const CHAR_SCALE = 1.8;

const SceneCore: React.FC<{ spec: EpisodeSpec; forceShot?: ShotDef; whipYawDeg?: number }> = ({ spec, forceShot, whipYawDeg }) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const { camera, scene, advance, gl } = useThree();
  const shot = forceShot ?? findShot(spec.shots, f);
  const activeWorld: WorldPreset = shot.world ?? spec.world;
  const preset: LightPreset = LIGHTS[shot.light];
  const look = LOOK[shot.light];

  // Lazily build & cache only the (world, light) preset active on the current shot so each shard starts in < 2s
  const worldCacheRef = useRef<Map<string, THREE.Group>>(new Map());
  const worldKey = `${activeWorld}_${shot.light}`;
  let worldEnv = worldCacheRef.current.get(worldKey);
  if (!worldEnv) {
    worldEnv = buildWorldEnvironment(activeWorld, shot.light);
    worldCacheRef.current.set(worldKey, worldEnv);
  }

  const skyDay = useMemo(() => makeSky(LIGHTS.day, "day"), []);
  const skyGolden = useMemo(() => makeSky(LIGHTS.golden, "golden"), []);

  const propEntries = useMemo(
    () => spec.props.map((p) => ({ def: p, prepared: prepareProp(p), built: buildPropMesh(p) })),
    [spec.props]
  );

  // Two-stage ground shadow textures from templates/bridge/cast.ts (generateMipmaps = false so grazing angles never wash out)
  const { contactMat, tailMat } = useMemo(() => {
    const cvC = document.createElement("canvas");
    cvC.width = 128;
    cvC.height = 128;
    fxContact(new Pen(cvC.getContext("2d")!), "#353754");
    const texC = new THREE.CanvasTexture(cvC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.generateMipmaps = false;
    texC.minFilter = THREE.LinearFilter;
    texC.needsUpdate = true;

    const cvT = document.createElement("canvas");
    cvT.width = 128;
    cvT.height = 256;
    fxShadow(new Pen(cvT.getContext("2d")!), "#6b709e");
    const texT = new THREE.CanvasTexture(cvT);
    texT.colorSpace = THREE.SRGBColorSpace;
    texT.generateMipmaps = false;
    texT.minFilter = THREE.LinearFilter;
    texT.needsUpdate = true;

    return { contactMat: blobMaterial(texC), tailMat: blobMaterial(texT) };
  }, []);

  // High-res character cards with cardShade + customDepthMaterial (matching templates/bridge/cast.ts Actor class)
  const actorCards = useMemo(() => {
    return spec.actors.map((a, idx) => {
      const cv = document.createElement("canvas");
      cv.width = CHAR_W;
      cv.height = CHAR_H;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const mat = cardShade(
        new THREE.MeshLambertMaterial({
          map: tex,
          alphaTest: 0.5,
          side: THREE.DoubleSide,
        })
      );
      mat.alphaToCoverage = false;
      const dmat = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        map: tex,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      });
      return {
        def: a,
        prepared: prepareActor(a),
        outfit: resolveOutfit(a, idx),
        cv,
        tex,
        mat,
        dmat,
        seed: ((idx * 5 + 3) % 7) + 1,
        lastSig: null as string | null,
      };
    });
  }, [spec.actors]);

  const fxCards = useMemo(() => {
    return (spec.fx ?? []).map((fx) => {
      const cv = document.createElement("canvas");
      cv.width = 500;
      cv.height = 500;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const isSoft = fx.kind === "puff";
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: isSoft,
        alphaTest: isSoft ? 0.02 : 0.5,
        depthWrite: !isSoft,
        side: THREE.DoubleSide,
      });
      mat.alphaToCoverage = false;
      return { def: fx, cv, tex, mat };
    });
  }, [spec.fx]);

  // Lighting rig matching templates/bridge/world.ts (HemisphereLight + warm DirectionalLight sun + cool fill light)
  const lights = useMemo(() => {
    const hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    const sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    const fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    return { hemi, sun, fill };
  }, []);

  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    }),
    [scene, camera]
  );

  // Sync camera, lighting, actors, props, and post-processing for frame f
  const camState = evalShotCam(shot, Math.min(f, shot.b - 1), whipYawDeg ?? 0);
  const persp = camera as THREE.PerspectiveCamera;
  persp.position.set(...camState.pos);
  persp.lookAt(...camState.look);
  persp.fov = camState.fov;
  persp.rotation.z += camState.roll;
  persp.updateProjectionMatrix();

  // Camera-relative sun & fill
  const fwd = new THREE.Vector3(...camState.look).sub(new THREE.Vector3(...camState.pos)).normalize();
  const camRight = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const baseYaw = Math.atan2(fwd.x, fwd.z);
  const az = ((shot.sunAz ?? preset.az) * Math.PI) / 180 + baseYaw;
  const el = ((shot.sunEl ?? preset.el) * Math.PI) / 180;
  const sunDir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el)
  ).normalize();

  const lookVec = new THREE.Vector3(...camState.look);
  lights.hemi.color.set(preset.sky);
  lights.hemi.groundColor.set(preset.ground);
  lights.hemi.intensity = preset.hemiI;
  lights.sun.color.set(preset.sunCol);
  lights.sun.intensity = preset.sunI;
  lights.sun.position.copy(lookVec.clone().addScaledVector(sunDir, 55));
  lights.sun.target.position.copy(lookVec);
  lights.sun.target.updateMatrixWorld();
  lights.sun.shadow.bias = preset.bias;
  lights.sun.shadow.normalBias = preset.normalBias;
  lights.fill.position.copy(lookVec.clone().addScaledVector(sunDir, -40).setY(25));
  lights.fill.target.position.copy(lookVec);
  lights.fill.target.updateMatrixWorld();

  // Update two-tone & card uniforms
  TONE.uLitCol.value.set(...preset.lit);
  TONE.uShadeCol.value.set(...preset.shade);
  TONE.uShadeLift.value.set(...preset.lift);
  TONE.uLambert.value = preset.lambert;
  TONE.uSideK.value = preset.sideK;
  TONE.uTerm.value = preset.term;
  TONE.uBounce.value.set(...look.bounce);
  TONE.uSat.value = look.sat;

  CHAR.uCharTint.value.set(...preset.charTint);
  CHAR.uCharShade.value = preset.charShade;
  CHAR.uGrad.value = preset.charGrad;
  CHAR.uBodyGrad.value = preset.bodyGrad;
  CHAR.uSideTint.value.set(...preset.sideTint);
  CARD_K.uPx.value = height / 1920;

  scene.fog = new THREE.Fog(untone(preset.fog), preset.fogNear, preset.fogFar);

  const fVec = new THREE.Vector3();
  persp.getWorldDirection(fVec);
  fx.lens.focus = Math.max(0.3, new THREE.Vector3(...camState.look).sub(persp.position).dot(fVec));
  fx.lens.cInf = shot.dof ?? 0;
  gradeFor(fx.grade, shot.light);

  // Evaluate every actor ONCE per frame (pre-sorted keyframes) and reuse for draw + placement
  const actorStates: ActorState[] = actorCards.map((ac) => evalActorAt(ac.prepared, f));

  // Redraw actor canvases at 1080x1800 resolution with dynamic 2D sun angle, blinks, side/front views, and props
  actorCards.forEach((ac, idx) => {
    if (ac.def.world && ac.def.world !== activeWorld) {
      ac.lastSig = null;
      return;
    }
    const st = actorStates[idx];
    // Determine if character is walking sideways relative to camera
    let useSide = st.side;
    let useMirror = st.mirror;
    if (!useSide && st.walk && (st.moveDir[0] !== 0 || st.moveDir[1] !== 0)) {
      const tx = camState.pos[0] - st.pos[0];
      const tz = camState.pos[2] - st.pos[2];
      const tl = Math.hypot(tx, tz) || 1;
      const c = Math.abs((tx * st.moveDir[0] + tz * st.moveDir[1]) / tl);
      if (c < 0.65) {
        useSide = true;
        useMirror = st.moveDir[0] * camRight.x + st.moveDir[1] * camRight.z < 0;
      }
    }

    // 2D sun light direction on the upright card in 45-deg steps (templates/bridge/cast.ts light2D)
    const sx = sunDir.dot(camRight) * (useSide && useMirror ? -1 : 1);
    const sy = -sunDir.y;
    const light = Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);

    const blink = st.expr !== "whistle" ? lidAt(f, idx + 1, ac.prepared.swapFrames) : 0;

    // Static actors skip the 1080x1800 redraw + texture upload unless a visual input changed.
    // Walking/talking/hammer actors animate every frame, so they always redraw.
    const dynamic = st.walk || st.talk || st.prop === "hammer";
    const sig = dynamic
      ? null
      : JSON.stringify([st.expr, blink, st.mode, useSide, useMirror, light, st.facing, st.look, st.lean, st.prop]);
    if (sig !== null && sig === ac.lastSig) return;
    ac.lastSig = sig;

    const ctx = ac.cv.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CHAR_W, CHAR_H);
    ctx.setTransform(CHAR_SCALE, 0, 0, CHAR_SCALE, 0, 0);

    const phase = st.walk ? ((f * 0.035 + idx * 0.17) % 1) : 0;
    const wave = st.talk && !st.prop ? Math.sin(f * 0.28 + idx * 1.3) * 0.65 : undefined;

    let toonProp: ToonProp = null;
    if (st.prop === "icecream") toonProp = "icecream";
    else if (st.prop === "shako") toonProp = "shako";
    else if (st.prop === "hammer") {
      // Smooth hammer strike cycle every 22 frames when talking/acting
      const cyc = (f % 24) / 24;
      const strike = cyc < 0.35 ? cyc / 0.35 : cyc < 0.55 ? 0 : 1;
      toonProp = ["hammer", strike];
    }

    const pen = new Pen(ctx);
    if (useSide) {
      bodySide(pen, ac.outfit, {
        mode: st.walk ? "march" : "stand",
        phase,
        expr: st.expr,
        blink,
        stomp: 1.0,
        stride: 0.9,
        light,
        seed: ac.seed,
      });
    } else {
      bodyFront(pen, ac.outfit, {
        mode: st.mode,
        phase,
        expr: st.expr,
        look: st.look,
        facing: st.facing,
        blink,
        tilt: st.lean,
        wave,
        prop: toonProp,
        light,
        seed: ac.seed,
      });
    }
    ac.tex.needsUpdate = true;
  });

  // Redraw active FX canvases at 500x500 resolution
  fxCards.forEach((fc) => {
    if (f < fc.def.a || f >= fc.def.b) return;
    const u = (f - fc.def.a) / Math.max(1, fc.def.b - fc.def.a);
    const ctx = fc.cv.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 500, 500);
    const pen = new Pen(ctx);
    if (fc.def.kind === "burst") {
      fxBurst(pen, u, fc.def.color ?? "#fff3b0");
    } else if (fc.def.kind === "stars") {
      ctx.setTransform(500 / 420, 0, 0, 500 / 420, 0, 120);
      fxStars(pen, (u * 2) % 1);
    } else if (fc.def.kind === "notes") {
      ctx.setTransform(2, 0, 0, 2, 40, 20);
      fxNote(pen, Math.floor(f / 6) % 2, fc.def.color ?? "#1f2a44");
    } else if (fc.def.kind === "puff") {
      ctx.setTransform(500 / 300, 0, 0, 500 / 300, 0, 0);
      fxPuff(pen, u);
    } else if (fc.def.kind === "ring") {
      ctx.setTransform(500 / 600, 0, 0, 500 / 600, 0, 0);
      fxRing(pen, u);
    } else if (fc.def.kind === "splash") {
      ctx.setTransform(500 / 800, 0, 0, 500 / 800, 0, 0);
      fxSplash(pen, u);
    } else if (fc.def.kind === "creak") {
      ctx.setTransform(500 / 300, 0, 0, 500 / 300, 0, 0);
      fxCreak(pen, u);
    }
    fc.tex.needsUpdate = true;
  });

  noInkFallback(scene);

  const composerRef = useRef<{ passes?: unknown[] } | null>(null);
  // Remotion throws a named timeout error if the composer never attaches — no more silently released unready frames
  const [readyHandle] = useState(() => delayRender("webgl-composer-ready", { timeoutInMilliseconds: 30000 }));
  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    const finish = () => {
      if (!cancelled) {
        cancelled = true;
        continueRender(readyHandle);
      }
    };
    const tick = () => {
      if (cancelled) return;
      const comp = composerRef.current;
      if (comp && Array.isArray(comp.passes) && comp.passes.length > 1) {
        advance(performance.now());
        gl.getContext().finish();
        rafId = requestAnimationFrame(finish);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [readyHandle, advance, gl]);

  useEffect(() => {
    return () => {
      fx.ink.dispose();
      fx.lens.dispose();
      fx.bloom.dispose();
      fx.tone.dispose();
      fx.grade.dispose();
    };
  }, [fx]);

  // Free per-episode GPU resources on unmount. Materials from the module-level
  // toonMat cache are shared across episodes and deliberately NOT disposed.
  useEffect(() => {
    return () => {
      for (const env of worldCacheRef.current.values()) {
        env.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.geometry) mesh.geometry.dispose();
        });
      }
      worldCacheRef.current.clear();
      for (const ac of actorCards) {
        ac.tex.dispose();
        ac.mat.dispose();
        ac.dmat.dispose();
      }
      for (const fc of fxCards) {
        fc.tex.dispose();
        fc.mat.dispose();
      }
      for (const sky of [skyDay, skyGolden]) {
        sky.geometry.dispose();
        (sky.material as THREE.Material).dispose();
      }
      contactMat.map?.dispose();
      contactMat.dispose();
      tailMat.map?.dispose();
      tailMat.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = useMemo(
    () => (
      <EffectComposer ref={composerRef as never} multisampling={0}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    ),
    [fx]
  );

  const skyMesh = shot.light === "golden" ? skyGolden : skyDay;
  const shadowRotY = Math.atan2(sunDir.x, sunDir.z);

  return (
    <>
      <primitive object={lights.hemi} />
      <primitive object={lights.sun} />
      <primitive object={lights.sun.target} />
      <primitive object={lights.fill} />
      <primitive object={lights.fill.target} />
      <primitive object={skyMesh} />
      <primitive object={worldEnv} />

      {propEntries.map(({ def, prepared, built }) => {
        if (def.world && def.world !== activeWorld) return null;
        const ps = evalPropAt(prepared, f);
        built.setLabel(ps.label, ps.sublabel);
        built.setAction(ps.actions);
        return (
          <primitive
            key={def.id}
            object={built.group}
            position={ps.pos}
            rotation={[0, ps.rotY, 0]}
            scale={[ps.scale, ps.scale, ps.scale]}
          />
        );
      })}

      {actorCards.map((ac, ai) => {
        if (ac.def.world && ac.def.world !== activeWorld) return null;
        const st = actorStates[ai];
        const yaw = Math.atan2(camState.pos[0] - st.pos[0], camState.pos[2] - st.pos[2]);
        const sc = ac.def.scale ?? 1;
        let mirrorX = st.mirror;
        if (!st.side && st.walk && (st.moveDir[0] !== 0 || st.moveDir[1] !== 0)) {
          const tx = camState.pos[0] - st.pos[0];
          const tz = camState.pos[2] - st.pos[2];
          const tl = Math.hypot(tx, tz) || 1;
          const c = Math.abs((tx * st.moveDir[0] + tz * st.moveDir[1]) / tl);
          if (c < 0.65) {
            mirrorX = st.moveDir[0] * camRight.x + st.moveDir[1] * camRight.z < 0;
          }
        }
        return (
          <group key={ac.def.id} position={st.pos}>
            {shot.light === "day" && (
              <mesh
                geometry={TAIL_GEO}
                material={tailMat}
                rotation={[0, shadowRotY, 0]}
                scale={[sc, 1, sc]}
                layers={NOINK}
                renderOrder={0.4}
              />
            )}
            <mesh
              geometry={CONTACT_GEO}
              material={contactMat}
              rotation={[0, shadowRotY, 0]}
              scale={[sc, 1, sc]}
              layers={NOINK}
              renderOrder={0.5}
            />
            <mesh
              geometry={BODY_GEO}
              material={ac.mat}
              customDepthMaterial={ac.dmat}
              rotation={[0, yaw, 0]}
              scale={[mirrorX ? -sc : sc, sc, sc]}
              receiveShadow
              castShadow={shot.light === "golden"}
              layers={NOINK}
              renderOrder={1}
              onBeforeRender={(renderer) => {
                const rt = renderer.getRenderTarget();
                CARD_K.uPx.value = (rt ? rt.height : renderer.domElement.height) / 1920;
              }}
            />
          </group>
        );
      })}

      {fxCards.map((fc, i) => {
        if (f < fc.def.a || f >= fc.def.b) return null;
        const yaw = Math.atan2(camState.pos[0] - fc.def.pos[0], camState.pos[2] - fc.def.pos[2]);
        const s = fc.def.scale ?? 1;
        return (
          <mesh
            key={`fx_${i}`}
            geometry={FX_GEO}
            material={fc.mat}
            position={fc.def.pos}
            rotation={[0, yaw, 0]}
            scale={[s, s, s]}
            layers={NOINK}
            renderOrder={2}
          />
        );
      })}

      {post}
    </>
  );
};

export const StoryShort: React.FC<StoryShortProps> = ({ spec, captions }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const endStart = spec.endCard ? spec.durationFrames - Math.round((spec.endCard.seconds ?? 2)*fps) : spec.durationFrames;
  if (spec.endCard && f >= endStart) return <EndCard start={endStart} handle={spec.endCard.handle} />;
  const shotIdx = spec.shots.findIndex((s) => f >= s.a && f < s.b);
  const shot = shotIdx >= 0 ? spec.shots[shotIdx] : spec.shots[spec.shots.length - 1];
  const prevShot = shotIdx > 0 ? spec.shots[shotIdx - 1] : undefined;
  const nextShot = shotIdx >= 0 ? spec.shots[shotIdx + 1] : undefined;

  // Transition vocabulary (CONTENT_SYSTEM camera-language rule):
  // whip = outgoing camera sweeps toward the exit side over the last WHIP_FRAMES,
  // incoming camera sweeps in from the opposite side; blur+scale sell the speed.
  // dissolve = incoming shot crossfades over the frozen outgoing shot.
  let whipYaw = 0;
  let whipMix = 0;
  if (nextShot?.transitionIn?.startsWith("whip") && f >= shot.b - WHIP_FRAMES) {
    const u = (f - (shot.b - WHIP_FRAMES) + 1) / WHIP_FRAMES;
    whipMix = u;
    whipYaw = (nextShot.transitionIn === "whip-left" ? -1 : 1) * WHIP_DEG * u;
  } else if (shot.transitionIn?.startsWith("whip") && f < shot.a + WHIP_FRAMES) {
    const u = 1 - (f - shot.a + 1) / WHIP_FRAMES;
    whipMix = u;
    whipYaw = (shot.transitionIn === "whip-left" ? 1 : -1) * WHIP_DEG * u;
  }
  const dissolve = shot.transitionIn === "dissolve" && shotIdx > 0 && f < shot.a + DISSOLVE_FRAMES;
  const inOpacity = dissolve ? Math.min(1, (f - shot.a + 1) / DISSOLVE_FRAMES) : 1;
  const motionStyle: React.CSSProperties = {
    opacity: inOpacity,
    ...(whipMix > 0
      ? { filter: `blur(${(whipMix * 14).toFixed(1)}px)`, transform: `scale(${(1 + whipMix * 0.07).toFixed(3)})` }
      : {}),
  };

  const flashOn = shot.flashAt !== undefined && f >= shot.flashAt && f < shot.flashAt + 4;
  const flashOpacity = flashOn ? 1 - (f - shot.flashAt!) / 4 : 0;
  const canvasProps = {
    width, height, shadows: true, dpr: 1,
    gl: { preserveDrawingBuffer: true, antialias: false, stencil: false, powerPreference: "high-performance" as const },
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {dissolve && prevShot && !prevShot.graphic && (
        <AbsoluteFill>
          <ThreeCanvas {...canvasProps}>
            <SceneCore spec={spec} forceShot={prevShot} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={motionStyle}>
        {!shot.graphic && <ThreeCanvas {...canvasProps}>
          <SceneCore spec={spec} whipYawDeg={shot.graphic ? 0 : whipYaw} />
        </ThreeCanvas>}
        {shot.graphic && (shot.graphic.startsWith("ncic-") ? <NcicScene shot={shot} /> : ["counter", "overflow", "power", "reset"].includes(shot.graphic) ? <MechanismGraphic shot={shot} /> : <EditorialScene shot={shot} />)}
      </AbsoluteFill>
      {flashOn && (
        <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity, pointerEvents: "none" }} />
      )}
      <Captions words={captions ?? null} config={spec.captions} />
    </AbsoluteFill>
  );
};
