import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
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
  Pen, bodyFront, fxBurst, fxStars, fxNote, fxPuff, fxRing, fxSplash, fxContact,
  KID, PARENT, townsfolk, Outfit, Expr,
} from "./toon";
import { buildWorldEnvironment, buildPropMesh, evalPropAt, makeSky, lerpV3 } from "./worlds";
import type { EpisodeSpec, ShotDef, ActorDef, FxDef, V3 } from "./types";

const OUTFIT_PRESETS: Record<string, Outfit> = {
  worker: { jacket: "#3a6ea5", pants: "#2f3644", boots: "#241726", hat: "hair", hair: "#4a3020" },
  boss: { jacket: "#2c2f3a", pants: "#22242d", boots: "#1a141c", hat: "hair", hair: "#7b7d85", build: "stout" },
  engineer: { jacket: "#e07a38", pants: "#384459", boots: "#241726", hat: "cap", cap: "#3a6ea5" },
  pilot: { jacket: "#263b5e", pants: "#212b3d", boots: "#1d1721", hat: "cap", cap: "#f0c850" },
  bot: { jacket: "#00b4d8", pants: "#394859", boots: "#241726", hat: "cap", cap: "#241726", skin: "#dce6f2" },
  kid: KID,
  parent: PARENT,
};

function resolveOutfit(a: ActorDef, idx: number): Outfit {
  const base = a.preset ? OUTFIT_PRESETS[a.preset] ?? townsfolk(idx) : townsfolk(idx);
  return { ...base, ...(a.outfit ?? {}) };
}

function evalActor(a: ActorDef, f: number) {
  let pos: V3 = a.pos;
  let expr: Expr = a.expr ?? "neutral";
  let walk = a.walk ?? false;
  let talk = a.talk ?? false;
  let lean = a.lean ?? 0;

  if (a.keyframes && a.keyframes.length > 0) {
    const kfs = [...a.keyframes].sort((x, y) => x.f - y.f);
    for (let i = 0; i < kfs.length; i++) {
      const k = kfs[i];
      if (f >= k.f) {
        if (k.expr !== undefined) expr = k.expr;
        if (k.walk !== undefined) walk = k.walk;
        if (k.talk !== undefined) talk = k.talk;
        if (k.lean !== undefined) lean = k.lean;
      }
      const next = kfs[i + 1];
      if (next && f >= k.f && f < next.f) {
        const u = (f - k.f) / Math.max(1, next.f - k.f);
        const s = u * u * (3 - 2 * u);
        if (k.pos && next.pos) pos = lerpV3(k.pos, next.pos, s);
        else if (k.pos) pos = k.pos;
        break;
      } else if (!next && f >= k.f && k.pos) {
        pos = k.pos;
      }
    }
  }
  return { pos, expr, walk, talk, lean };
}

function evalShotCam(shot: ShotDef, f: number) {
  const span = Math.max(1, shot.b - shot.a);
  const rawU = Math.max(0, Math.min(1, (f - shot.a) / span));
  const ease = shot.cam.ease ?? "smooth";
  const u = ease === "linear" ? rawU : ease === "out" ? 1 - (1 - rawU) ** 3 : rawU * rawU * (3 - 2 * rawU);
  let pos = lerpV3(shot.cam.from, shot.cam.to, u);
  let look = lerpV3(shot.cam.lookFrom, shot.cam.lookTo, u);
  const fov = (shot.cam.fovFrom ?? 38) + ((shot.cam.fovTo ?? shot.cam.fovFrom ?? 38) - (shot.cam.fovFrom ?? 38)) * u;
  let roll = ((shot.cam.rollDeg ?? 0) * Math.PI) / 180;

  if (shot.kickAt) {
    for (const kf of shot.kickAt) {
      const dt = f - kf;
      if (dt >= 0 && dt < 8) {
        const decay = (1 - dt / 8) * (dt % 2 === 0 ? 1 : -1);
        pos = [pos[0] + decay * 0.16, pos[1] + decay * 0.1, pos[2]];
        roll += decay * 0.035;
      }
    }
  }
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
const BLOB_GEO = (() => {
  const g = new THREE.PlaneGeometry(1.4, 1.4);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.02, 0);
  return g;
})();
const FX_GEO = new THREE.PlaneGeometry(1.6, 1.6);

const SceneCore: React.FC<{ spec: EpisodeSpec }> = ({ spec }) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const { camera, scene } = useThree();
  const shot = findShot(spec.shots, f);
  const preset: LightPreset = LIGHTS[shot.light];
  const look = LOOK[shot.light];

  const envDay = useMemo(() => buildWorldEnvironment(spec.world, "day"), [spec.world]);
  const envGolden = useMemo(() => buildWorldEnvironment(spec.world, "golden"), [spec.world]);
  const skyDay = useMemo(() => makeSky(LIGHTS.day, "day"), []);
  const skyGolden = useMemo(() => makeSky(LIGHTS.golden, "golden"), []);

  const propEntries = useMemo(
    () => spec.props.map((p) => ({ def: p, built: buildPropMesh(p) })),
    [spec.props]
  );

  // Blob shadow texture
  const blobTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 128;
    fxContact(new Pen(cv.getContext("2d")!), "#524a52");
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const blobMat = useMemo(() => blobMaterial(blobTex), [blobTex]);

  // One reusable canvas + texture per actor
  const actorCards = useMemo(() => {
    return spec.actors.map((a, idx) => {
      const cv = document.createElement("canvas");
      cv.width = 300;
      cv.height = 500;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mat = cardShade(new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
      return { def: a, outfit: resolveOutfit(a, idx), cv, tex, mat, seed: idx + 1 };
    });
  }, [spec.actors]);

  const fxCards = useMemo(() => {
    return (spec.fx ?? []).map((fx) => {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 256;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      return { def: fx, cv, tex, mat };
    });
  }, [spec.fx]);

  const sunRef = useMemo(() => {
    const dl = new THREE.DirectionalLight("#ffffff", 2.8);
    dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024);
    dl.shadow.camera.near = 1;
    dl.shadow.camera.far = 140;
    dl.shadow.camera.left = -28;
    dl.shadow.camera.right = 28;
    dl.shadow.camera.top = 28;
    dl.shadow.camera.bottom = -28;
    return dl;
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
  const camState = evalShotCam(shot, f);
  const persp = camera as THREE.PerspectiveCamera;
  persp.position.set(...camState.pos);
  persp.lookAt(...camState.look);
  persp.fov = camState.fov;
  persp.rotation.z += camState.roll;
  persp.updateProjectionMatrix();

  // Camera-relative sun
  const fwd = new THREE.Vector3(...camState.look).sub(new THREE.Vector3(...camState.pos)).normalize();
  const baseYaw = Math.atan2(fwd.x, fwd.z);
  const az = ((shot.sunAz ?? preset.az) * Math.PI) / 180 + baseYaw;
  const el = ((shot.sunEl ?? preset.el) * Math.PI) / 180;
  const sunDir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el)
  );
  sunRef.position.copy(new THREE.Vector3(...camState.look).addScaledVector(sunDir, 55));
  sunRef.target.position.set(...camState.look);
  sunRef.target.updateMatrixWorld();
  sunRef.shadow.bias = preset.bias;
  sunRef.shadow.normalBias = preset.normalBias;

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
  fx.lens.cInf = shot.dof ?? 6;
  gradeFor(fx.grade, shot.light);

  // Redraw actor canvases for frame f
  actorCards.forEach((ac, idx) => {
    const st = evalActor(ac.def, f);
    const ctx = ac.cv.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ac.cv.width, ac.cv.height);
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    const blink = (f + idx * 17) % 68 < 4;
    const phase = st.walk ? ((f * 0.04) % 1) : 0;
    const wave = st.talk ? Math.sin(f * 0.35 + idx) * 0.35 : undefined;
    bodyFront(new Pen(ctx), ac.outfit, {
      mode: st.walk ? "march" : "stand",
      phase,
      expr: st.expr,
      blink,
      tilt: st.lean,
      wave,
      seed: ac.seed,
    });
    ac.tex.needsUpdate = true;
  });

  // Redraw active FX canvases
  fxCards.forEach((fc) => {
    if (f < fc.def.a || f >= fc.def.b) return;
    const u = (f - fc.def.a) / Math.max(1, fc.def.b - fc.def.a);
    const ctx = fc.cv.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 256, 256);
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    const pen = new Pen(ctx);
    if (fc.def.kind === "burst") fxBurst(pen, u, fc.def.color ?? "#fff3b0");
    else if (fc.def.kind === "stars") fxStars(pen, u);
    else if (fc.def.kind === "notes") fxNote(pen, Math.floor(f / 6) % 2, fc.def.color ?? "#1f2a44");
    else if (fc.def.kind === "puff") fxPuff(pen, u);
    else if (fc.def.kind === "ring") fxRing(pen, u);
    else if (fc.def.kind === "splash") fxSplash(pen, u);
    fc.tex.needsUpdate = true;
  });

  useEffect(() => {
    noInkFallback(scene);
    return () => {
      fx.ink.dispose();
      fx.lens.dispose();
    };
  }, [scene, fx]);

  const worldEnv = shot.light === "golden" ? envGolden : envDay;
  const skyMesh = shot.light === "golden" ? skyGolden : skyDay;

  return (
    <>
      <primitive object={sunRef} />
      <primitive object={sunRef.target} />
      <primitive object={skyMesh} />
      <primitive object={worldEnv} />

      {propEntries.map(({ def, built }) => {
        const ps = evalPropAt(def, f);
        built.setLabel(ps.label, ps.sublabel);
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

      {actorCards.map((ac) => {
        const st = evalActor(ac.def, f);
        const yaw = Math.atan2(camState.pos[0] - st.pos[0], camState.pos[2] - st.pos[2]);
        return (
          <group key={ac.def.id} position={st.pos}>
            <mesh geometry={BLOB_GEO} material={blobMat} layers={NOINK} renderOrder={0} />
            <mesh geometry={BODY_GEO} material={ac.mat} rotation={[0, yaw, 0]} layers={NOINK} renderOrder={1} />
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

      <EffectComposer multisampling={0}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    </>
  );
};

export const StoryShort: React.FC<{ spec: EpisodeSpec }> = ({ spec }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = findShot(spec.shots, f);
  const flashOn = shot.flashAt !== undefined && f >= shot.flashAt && f < shot.flashAt + 4;
  const flashOpacity = flashOn ? 1 - (f - shot.flashAt!) / 4 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows dpr={1}>
        <SceneCore spec={spec} />
      </ThreeCanvas>
      {flashOn && (
        <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity, pointerEvents: "none" }} />
      )}
    </AbsoluteFill>
  );
};
