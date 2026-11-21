import * as THREE from "three";
import { twoTone, untone } from "./shade";
import { ctex, grass, cobble, planks, brick, stone, cloudHD } from "./paint";
import { LOOK, LightPreset } from "./lights";
import { NOINK } from "./ink";
import type { PropDef, PropKeyframe, WorldPreset, V3 } from "./types";

const matCache = new Map<string, THREE.MeshLambertMaterial>();
function toonMat(key: string, params: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  let m = matCache.get(key);
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(params));
    matCache.set(key, m);
  }
  return m;
}

export function lerpV3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function evalPropAt(p: PropDef, f: number) {
  let pos: V3 = p.pos;
  let rotY = p.rotY ?? 0;
  let scale = p.scale ?? 1;
  let label = p.label ?? "";
  let sublabel = p.sublabel ?? "";

  if (p.keyframes && p.keyframes.length > 0) {
    const kfs = [...p.keyframes].sort((x, y) => x.f - y.f);
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
  }

  if (p.bob) pos = [pos[0], pos[1] + Math.sin(f * 0.08) * p.bob, pos[2]];
  if (p.spin) rotY += f * p.spin;
  return { pos, rotY, scale, label, sublabel };
}

export function makeSky(preset: LightPreset, mode: "day" | "golden"): THREE.Mesh {
  const look = LOOK[mode];
  const stops = look.sky.c.map((hex) => untone(hex));
  const elevs = look.sky.e;
  const skyGeo = new THREE.SphereGeometry(420, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      c0: { value: stops[0] }, c1: { value: stops[1] }, c2: { value: stops[2] }, c3: { value: stops[3] }, c4: { value: stops[4] },
      e0: { value: elevs[0] }, e1: { value: elevs[1] }, e2: { value: elevs[2] }, e3: { value: elevs[3] }, e4: { value: elevs[4] },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 c0,c1,c2,c3,c4;
      uniform float e0,e1,e2,e3,e4;
      void main(){
        float el = degrees(asin(clamp(vDir.y, -1.0, 1.0)));
        vec3 col = c0;
        col = mix(col, c1, smoothstep(e0, e1, el));
        col = mix(col, c2, smoothstep(e1, e2, el));
        col = mix(col, c3, smoothstep(e2, e3, el));
        col = mix(col, c4, smoothstep(e3, e4, el));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const m = new THREE.Mesh(skyGeo, mat);
  m.layers.set(NOINK);
  m.frustumCulled = false;
  return m;
}

function addBox(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addClouds(parent: THREE.Object3D, mode: "day" | "golden") {
  const tex = cloudHD(1, LOOK[mode].cloud);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, color: "#ffffff" });
  const coords: V3[] = [[-45, 36, -90], [20, 42, -110], [65, 34, -85], [-75, 38, -60], [50, 40, -140]];
  for (const [x, y, z] of coords) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), mat);
    c.position.set(x, y, z);
    c.layers.set(NOINK);
    parent.add(c);
  }
}

export function buildWorldEnvironment(preset: WorldPreset, mode: "day" | "golden"): THREE.Group {
  const g = new THREE.Group();
  const groundSize = 320;
  const grassTex = grass();
  grassTex.repeat.set(32, 32);
  const cobbleTex = cobble();
  cobbleTex.repeat.set(14, 14);
  const plankTex = planks();
  plankTex.repeat.set(10, 10);
  const brickTex = brick();
  brickTex.repeat.set(3, 2);
  const stoneTex = stone();
  stoneTex.repeat.set(4, 2);

  addClouds(g, mode);

  if (preset === "office") {
    // Stylized indoor/studio floor + bright backdrop walls + bookshelves/windows
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), toonMat("officeFloor", { map: plankTex, color: "#d6b07a" }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const wallMat = toonMat("officeWall", { color: "#e8dfc8" });
    const trimMat = toonMat("officeTrim", { color: "#5e6f8c" });
    const glassMat = toonMat("officeWindow", { color: "#7cc2f2" });
    addBox(g, 40, 14, 1, 0, 7, -14, wallMat);
    addBox(g, 1, 14, 30, -16, 7, 0, wallMat);
    addBox(g, 1, 14, 30, 16, 7, 0, wallMat);
    addBox(g, 40, 0.8, 1.2, 0, 0.4, -13.9, trimMat);
    addBox(g, 8, 5, 0.4, -6, 6.5, -13.4, glassMat);
    addBox(g, 8, 5, 0.4, 6, 6.5, -13.4, glassMat);
    // Plants & cabinets
    const leafMat = toonMat("leaf", { color: "#56a84c" });
    const potMat = toonMat("pot", { color: "#c26946" });
    for (const px of [-12, 12]) {
      addBox(g, 1.2, 1.3, 1.2, px, 0.65, -11, potMat);
      addBox(g, 1.8, 2.2, 1.8, px, 2.2, -11, leafMat);
    }
  } else if (preset === "server_room") {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), toonMat("srvFloor", { map: stoneTex, color: "#3d4656" }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const rackMat = toonMat("rack", { color: "#2d3544" });
    const ledGreen = toonMat("ledG", { color: "#45e088" });
    const ledBlue = toonMat("ledB", { color: "#48a8ff" });
    for (const side of [-7, 7]) {
      for (let z = -14; z <= 4; z += 4.5) {
        addBox(g, 2.4, 5.4, 2.4, side, 2.7, z, rackMat);
        addBox(g, 0.15, 0.3, 1.6, side - Math.sign(side) * 1.22, 3.8, z, ledGreen);
        addBox(g, 0.15, 0.3, 1.6, side - Math.sign(side) * 1.22, 2.6, z, ledBlue);
      }
    }
  } else if (preset === "tarmac") {
    const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), toonMat("tarmac", { map: stoneTex, color: "#686e78" }));
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.receiveShadow = true;
    g.add(tarmac);

    const stripeMat = toonMat("stripe", { color: "#f4c842" });
    for (let z = -60; z <= 40; z += 12) {
      addBox(g, 0.7, 0.05, 5, 0, 0.03, z, stripeMat);
    }
    const hangarMat = toonMat("hangar", { color: "#8e9bb0" });
    const roofMat = toonMat("hangarRoof", { color: "#b64e44" });
    addBox(g, 24, 9, 16, -24, 4.5, -24, hangarMat);
    addBox(g, 25, 1.4, 17, -24, 9.5, -24, roofMat);
  } else if (preset === "courtroom") {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), toonMat("courtFloor", { map: plankTex, color: "#9c6d44" }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const woodMat = toonMat("courtWood", { color: "#784c2b" });
    const wallMat = toonMat("courtWall", { color: "#dfd3ba" });
    addBox(g, 34, 14, 1, 0, 7, -15, wallMat);
    addBox(g, 10, 2.6, 3, 0, 1.3, -9, woodMat);
    addBox(g, 18, 1.6, 0.5, 0, 0.8, -1, woodMat);
  } else {
    // "town": colorful painted town square
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), toonMat("townGrass", { map: grassTex, color: "#80c258" }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    g.add(ground);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 140), toonMat("townRoad", { map: cobbleTex, color: "#bfb7a8" }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    g.add(road);

    const colors = ["#d98a5f", "#e6c37a", "#8eaad1", "#c77463"];
    const roofMat = toonMat("townRoof", { color: "#9e493b" });
    const treeLeaf = toonMat("townLeaf", { color: "#5aa846" });
    const trunkMat = toonMat("townTrunk", { color: "#7a5136" });
    let idx = 0;
    for (const side of [-11, 11]) {
      for (let z = -34; z <= 14; z += 12) {
        const hm = toonMat(`house${idx % 4}`, { map: brickTex, color: colors[idx % 4] });
        const h = 7 + (idx % 3) * 1.6;
        addBox(g, 7, h, 8, side, h / 2, z, hm);
        addBox(g, 7.6, 1.5, 8.6, side, h + 0.75, z, roofMat);
        idx++;
      }
    }
    for (let z = -28; z <= 10; z += 12) {
      addBox(g, 0.7, 2.6, 0.7, -6.2, 1.3, z, trunkMat);
      addBox(g, 2.8, 3.0, 2.8, -6.2, 3.8, z, treeLeaf);
      addBox(g, 0.7, 2.6, 0.7, 6.2, 1.3, z, trunkMat);
      addBox(g, 2.8, 3.0, 2.8, 6.2, 3.8, z, treeLeaf);
    }
  }
  return g;
}

export function makeLabelTexture(key: string, label: string, sublabel: string, bg: string, fg: string): THREE.CanvasTexture {
  return ctex(`lbl_${key}_${label}_${sublabel}_${bg}`, 512, 256, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "#241726";
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 242);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 54px sans-serif";
    ctx.fillText(label.slice(0, 18), 256, sublabel ? 96 : 128, 456);
    if (sublabel) {
      ctx.font = "700 32px sans-serif";
      ctx.fillText(sublabel.slice(0, 26), 256, 174, 456);
    }
  });
}

export function buildPropMesh(p: PropDef): { group: THREE.Group; setLabel: (l: string, s: string) => void } {
  const g = new THREE.Group();
  const baseCol = p.color ?? "#d9823b";
  const accentCol = p.accent ?? "#f4efe6";
  const mBase = toonMat(`prop_${p.id}_b`, { color: baseCol });
  const mDark = toonMat(`prop_${p.id}_d`, { color: "#363b48" });
  let faceMesh: THREE.Mesh | null = null;
  let lastTextKey = `${p.label ?? ""}|${p.sublabel ?? ""}`;

  const makeFaceMat = (l: string, s: string) =>
    toonMat(`face_${p.id}_${l}_${s}`, { map: makeLabelTexture(p.id, l || " ", s, accentCol, "#1c1821"), color: "#ffffff" });

  if (p.kind === "desk") {
    addBox(g, 3.2, 0.2, 1.6, 0, 1.0, 0, mBase);
    for (const lx of [-1.35, 1.35]) for (const lz of [-0.6, 0.6]) addBox(g, 0.16, 1.0, 0.16, lx, 0.5, lz, mDark);
  } else if (p.kind === "screen" || p.kind === "sign" || p.kind === "chart") {
    addBox(g, 3.4, 2.0, 0.22, 0, 1.4, 0, mDark);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.7), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.4, 0.12);
    g.add(faceMesh);
    addBox(g, 0.25, 0.7, 0.25, 0, 0.35, 0, mDark);
  } else if (p.kind === "book") {
    addBox(g, 1.6, 2.2, 0.42, 0, 1.1, 0, mBase);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.85), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.1, 0.22);
    g.add(faceMesh);
  } else if (p.kind === "server") {
    addBox(g, 1.8, 3.8, 1.6, 0, 1.9, 0, mDark);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 2.8, 0.81);
    g.add(faceMesh);
  } else if (p.kind === "coin") {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.28, 24), mBase);
    cyl.rotation.x = Math.PI / 2;
    cyl.position.y = 1.2;
    cyl.castShadow = true;
    g.add(cyl);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.2, 0.15);
    g.add(faceMesh);
  } else if (p.kind === "plane") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 10, 16), toonMat("planeBody", { color: "#f2f4f8" }));
    body.rotation.x = Math.PI / 2;
    body.position.y = 2.1;
    body.castShadow = true;
    g.add(body);
    addBox(g, 11.5, 0.25, 2.2, 0, 1.9, -0.4, mBase);
    addBox(g, 0.25, 2.4, 1.8, 0, 3.4, -4.4, mBase);
    addBox(g, 3.6, 0.2, 1.2, 0, 2.3, -4.4, mBase);
  } else if (p.kind === "pile") {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 3.6, 10), mBase);
    cone.position.y = 1.8;
    cone.castShadow = true;
    cone.receiveShadow = true;
    g.add(cone);
  } else {
    // box / crate
    addBox(g, 1.5, 1.5, 1.5, 0, 0.75, 0, mBase);
    if (p.label) {
      faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.7), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
      faceMesh.position.set(0, 0.85, 0.76);
      g.add(faceMesh);
    }
  }

  return {
    group: g,
    setLabel: (l: string, s: string) => {
      const k = `${l}|${s}`;
      if (faceMesh && k !== lastTextKey) {
        lastTextKey = k;
        faceMesh.material = makeFaceMat(l, s);
      }
    },
  };
}
