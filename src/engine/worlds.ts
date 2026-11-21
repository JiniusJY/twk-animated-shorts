import * as THREE from "three";
import { twoTone, untone } from "./shade";
import {
  ctex,
  rep,
  rng,
  grassHD,
  cobbleHD,
  planksHD,
  beamHD,
  brick,
  stoneHD,
  facadeHD,
  roofHD,
  cloudHD,
} from "./paint";
import { LOOK, LightPreset } from "./lights";
import { NOINK } from "./ink";
import type { PropDef, WorldPreset, V3 } from "./types";

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

export function makeSky(_preset: LightPreset, mode: "day" | "golden"): THREE.Mesh {
  const look = LOOK[mode];
  const stops = look.sky.c.map((hex) => untone(hex));
  const elevs = look.sky.e;
  const skyGeo = new THREE.SphereGeometry(650, 36, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      c0: { value: stops[0] },
      c1: { value: stops[1] },
      c2: { value: stops[2] },
      c3: { value: stops[3] },
      c4: { value: stops[4] },
      e0: { value: elevs[0] },
      e1: { value: elevs[1] },
      e2: { value: elevs[2] },
      e3: { value: elevs[3] },
      e4: { value: elevs[4] },
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
  m.renderOrder = -1;
  m.layers.set(NOINK);
  m.frustumCulled = false;
  return m;
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  ry = 0,
  cast = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const LEAF_COLS = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
function leafMat(i: number) {
  const idx = ((i % LEAF_COLS.length) + LEAF_COLS.length) % LEAF_COLS.length;
  const tex = ctex(`leafHD_${idx}`, 256, 128, (g, r) => {
    const base = new THREE.Color(LEAF_COLS[idx]);
    const top = base.clone().offsetHSL(0.012, 0.03, 0.08);
    const bot = base.clone().offsetHSL(-0.015, 0.0, -0.08);
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "#" + top.getHexString());
    gr.addColorStop(0.42, "#" + base.getHexString());
    gr.addColorStop(1, "#" + bot.getHexString());
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 128);
    for (let k = 0; k < 42; k++) {
      const x = r() * 256;
      const y = 10 + r() * 108;
      const rad = 5 + r() * 9;
      const light = y < 64 ? r() < 0.7 : r() < 0.25;
      g.strokeStyle = light ? "rgba(225,255,170,0.22)" : "rgba(20,70,30,0.2)";
      g.lineWidth = 2.5;
      g.lineCap = "round";
      g.beginPath();
      g.arc(x, y + rad * 0.6, rad, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
  });
  return toonMat(`leafMat_${idx}`, { map: tex });
}

const LOBE_GEO = new THREE.SphereGeometry(1, 16, 12);
const TRUNK_GEO = new THREE.CylinderGeometry(0.55, 0.95, 1, 10);

function addCartoonTree(parent: THREE.Object3D, x: number, y: number, z: number, h: number, seed: number, cone = false) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  const r = rng(Math.abs(Math.floor(seed * 137)) + 11);
  const bark = toonMat("barkHD", { color: "#8f5d3b" });
  const leaf = leafMat(cone ? 4 : Math.floor(r() * 4));

  const th = (cone ? 0.25 : 0.44) * h;
  const tr = 0.055 * h;
  const trunk = new THREE.Mesh(TRUNK_GEO, bark);
  trunk.position.set(0, th * 0.5, 0);
  trunk.scale.set(tr, th, tr);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  grp.add(trunk);

  const putLobe = (px: number, py: number, pz: number, rad: number, sy = 0.88) => {
    const m = new THREE.Mesh(LOBE_GEO, leaf);
    m.position.set(px, py, pz);
    m.scale.set(rad, rad * sy, rad);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
  };

  if (cone) {
    putLobe(0, 0.34 * h, 0, 0.26 * h, 0.65);
    putLobe(0, 0.52 * h, 0, 0.21 * h, 0.68);
    putLobe(0, 0.68 * h, 0, 0.15 * h, 0.75);
    putLobe(0, 0.83 * h, 0, 0.09 * h, 1.0);
  } else {
    const cy = 0.62 * h;
    putLobe(0, cy, 0, 0.27 * h);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + r() * 0.3;
      const dist = 0.19 * h;
      putLobe(Math.cos(a) * dist, cy - 0.04 * h + (r() - 0.5) * 0.05 * h, Math.sin(a) * dist, (0.18 + r() * 0.04) * h);
    }
    putLobe(0, cy + 0.16 * h, 0, 0.18 * h);
  }
  parent.add(grp);
}

function addCartoonBush(parent: THREE.Object3D, x: number, y: number, z: number, h: number, seed: number) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  const leaf = leafMat(seed);
  const putLobe = (px: number, py: number, pz: number, rad: number) => {
    const m = new THREE.Mesh(LOBE_GEO, leaf);
    m.position.set(px, py, pz);
    m.scale.set(rad, rad * 0.85, rad);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
  };
  putLobe(0, 0.44 * h, 0, 0.48 * h);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + seed;
    putLobe(Math.cos(a) * 0.38 * h, 0.3 * h, Math.sin(a) * 0.38 * h, 0.34 * h);
  }
  parent.add(grp);
}

const HOUSE_STYLES = [
  { wall: "#ecdab2", shutter: "#3f6fb5", roof: "#d27a62", timber: false, brick: false },
  { wall: "#d8a95f", shutter: "#2f6a43", roof: "#b8644f", timber: false, brick: false },
  { wall: "#c47a5c", shutter: "#2f5f6a", roof: "#8f97a8", timber: false, brick: false },
  { wall: "#efdcb8", shutter: "#2f5f6a", roof: "#c9775a", timber: true, brick: false },
  { wall: "#ddbd78", shutter: "#5a3b2a", roof: "#d27a62", timber: false, brick: false },
  { wall: "#e3d2b8", shutter: "#2f6a43", roof: "#8f97a8", timber: false, brick: true },
];

function addGabledHouse(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  yaw: number,
  styleIdx: number
) {
  const st = HOUSE_STYLES[styleIdx % HOUSE_STYLES.length];
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  const frontMat = toonMat(`hFront_${styleIdx}_${w}_${h}`, {
    map: facadeHD(`hf_${styleIdx}_${w}_${h}`, w, h, { ...st, door: true }),
  });
  const sideMat = toonMat(`hSide_${styleIdx}_${d}_${h}`, {
    map: facadeHD(`hs_${styleIdx}_${d}_${h}`, d, h, st),
  });
  const roofM = toonMat(`hRoof_${st.roof}`, {
    map: rep(roofHD(st.roof, st.roof === "#8f97a8"), Math.max(1, Math.round(w / 4)), 2),
    side: THREE.DoubleSide,
  });
  const plinthM = toonMat("hPlinth", { map: stoneHD("plinthStone") });
  const trimM = toonMat("hTrim", { color: "#efe3c8" });
  const chimM = toonMat("hChim", { map: rep(brick(), 1, 2) });

  // Main body with painted facades on front/back/sides
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideMat, sideMat, trimM, plinthM, frontMat, sideMat]);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  grp.add(body);

  // Stone plinth & cornice relief
  addBox(grp, w + 0.18, 0.45, d + 0.18, 0, 0.225, 0, plinthM);
  addBox(grp, w + 0.24, 0.24, d + 0.24, 0, h - 0.12, 0, trimM);

  // Pitched roof slopes
  const rh = d * 0.38;
  const slopeLen = Math.hypot(d / 2 + 0.35, rh);
  const slopeAng = Math.atan2(rh, d / 2 + 0.35);
  for (const s of [-1, 1]) {
    const roofSlope = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.18, slopeLen), roofM);
    roofSlope.position.set(0, h + rh * 0.48 - 0.1, s * (d / 4 + 0.12));
    roofSlope.rotation.x = s * slopeAng;
    roofSlope.castShadow = true;
    roofSlope.receiveShadow = true;
    grp.add(roofSlope);
  }

  // Brick chimney + cap
  const cx = (w * 0.28) * (styleIdx % 2 === 0 ? 1 : -1);
  addBox(grp, 0.85, rh + 1.1, 0.85, cx, h + (rh + 1.1) * 0.45, -d * 0.2, chimM);
  addBox(grp, 1.02, 0.18, 1.02, cx, h + rh + 0.55, -d * 0.2, trimM);

  parent.add(grp);
}

function addLantern(parent: THREE.Object3D, x: number, y: number, z: number) {
  const poleM = toonMat("lanternPole", { color: "#2d313b" });
  const glowM = toonMat("lanternGlow", { color: "#ffe596", emissive: new THREE.Color("#ffb838"), emissiveIntensity: 0.7 });
  addBox(parent, 0.14, 2.7, 0.14, x, y + 1.35, z, poleM);
  addBox(parent, 0.42, 0.52, 0.42, x, y + 2.8, z, glowM);
  addBox(parent, 0.54, 0.14, 0.54, x, y + 3.1, z, poleM);
}

function addCloudsAndHills(parent: THREE.Object3D, mode: "day" | "golden", withHills = true) {
  const pal = LOOK[mode].cloud;
  for (let i = 0; i < 8; i++) {
    const tex = cloudHD(i % 4, pal);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      fog: false,
      color: new THREE.Color(1.05, 1.05, 1.05),
    });
    const a = (i / 8) * Math.PI * 1.4 - Math.PI * 0.7;
    const dist = 180 + (i % 3) * 35;
    const w = 48 + (i % 3) * 14;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), mat);
    m.position.set(Math.sin(a) * dist, 34 + (i % 3) * 6, -Math.cos(a) * dist);
    m.lookAt(0, 12, 0);
    m.layers.set(NOINK);
    parent.add(m);
  }

  if (withHills) {
    const hillGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const hCols = ["#78b257", "#6aa24e", "#8bbf63"];
    const hills: [number, number, number, number, number][] = [
      [-140, -170, 95, 24, 60],
      [20, -210, 120, 30, 70],
      [155, -160, 90, 22, 65],
      [-180, -70, 85, 20, 60],
      [180, -75, 85, 21, 60],
    ];
    hills.forEach(([hx, hz, sx, sy, sz], i) => {
      const m = new THREE.Mesh(hillGeo, toonMat(`hill_${i % 3}`, { color: hCols[i % 3] }));
      m.position.set(hx, -1.2, hz);
      m.scale.set(sx, sy, sz);
      m.receiveShadow = true;
      parent.add(m);
    });
  }
}

export function buildWorldEnvironment(preset: WorldPreset, mode: "day" | "golden"): THREE.Group {
  const g = new THREE.Group();
  const groundSize = 360;
  const grassTex = rep(grassHD(), 45, 45);
  const cobbleTex = rep(cobbleHD(), 24, 24);
  const plankTex = rep(planksHD(), 16, 16);
  const stoneTex = rep(stoneHD("worldStone"), 28, 28);

  if (preset === "tarmac") {
    addCloudsAndHills(g, mode, true);

    // Grass airfield surround + wide stone-paved apron
    const grassField = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      toonMat("airfieldGrass", { map: grassTex })
    );
    grassField.rotation.x = -Math.PI / 2;
    grassField.position.y = -0.02;
    grassField.receiveShadow = true;
    g.add(grassField);

    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 95),
      toonMat("tarmacApron", { map: stoneTex, color: "#8a929e" })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(0, 0, -14);
    apron.receiveShadow = true;
    g.add(apron);

    // Painted runway stripes placed behind z = -5.5 so they never intersect foreground actors' feet
    const stripeMat = toonMat("runwayStripe", { color: "#f3c746" });
    const whiteMat = toonMat("runwayWhite", { color: "#f4f1ea" });
    for (let x = -28; x <= 28; x += 8) {
      addBox(g, 3.8, 0.02, 0.55, x, 0.01, -5.2, stripeMat, 0, false);
      addBox(g, 4.2, 0.02, 0.7, x, 0.01, -13.5, whiteMat, 0, false);
    }

    // Storybook Airport Terminal building (left-rear) & Control Tower (right-rear)
    addGabledHouse(g, -18, 0, -24, 16, 9, 7.2, 0.15, 0);
    addGabledHouse(g, -3.5, 0, -27, 11, 8, 6.4, 0, 3);

    // Control Tower
    const towerBase = toonMat("towerWall", { map: facadeHD("ctrlTower", 6, 13, { wall: "#e8dac0", shutter: "#3f6fb5", brick: true }) });
    const towerCab = toonMat("towerCab", { color: "#6e88c9" });
    const towerRoof = toonMat("towerRoof", { color: "#c85a48" });
    addBox(g, 5.2, 13, 5.2, 15, 6.5, -24, towerBase);
    addBox(g, 6.4, 2.8, 6.4, 15, 14.2, -24, towerCab);
    addBox(g, 7.2, 0.7, 7.2, 15, 15.9, -24, towerRoof);

    // Windsock & trees flanking the apron
    const poleM = toonMat("wsPole", { color: "#d8dce3" });
    const sockM = toonMat("wsSock", { color: "#e86338" });
    addBox(g, 0.16, 4.5, 0.16, 9.5, 2.25, -11, poleM);
    const sock = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 10), sockM);
    sock.rotation.z = -Math.PI / 2.2;
    sock.position.set(10.3, 4.3, -11);
    g.add(sock);

    for (const [tx, tz, th, cone] of [
      [-29, -18, 8.5, false],
      [-25, -11, 7.2, true],
      [23, -18, 8.8, false],
      [26, -10, 7.5, true],
      [8, -28, 9.0, false],
    ] as const) {
      addCartoonTree(g, tx, 0, tz, th, tx * 13 + tz, cone);
    }
    addCartoonBush(g, -10.5, 0, -14, 1.35, 1);
    addCartoonBush(g, 11.5, 0, -14, 1.4, 2);
  } else if (preset === "office") {
    // 2015 Boeing Avionics Engineering Laboratory: warm plank floor, painted brick/timber walls, ceiling beams, test racks
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      toonMat("labFloor", { map: plankTex })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const backWallMat = toonMat("labBackWall", {
      map: facadeHD("labWallBack", 24, 8.4, { wall: "#ecdab2", shutter: "#3f6fb5", timber: true }),
    });
    const sideWallMat = toonMat("labSideWall", {
      map: facadeHD("labWallSide", 18, 8.4, { wall: "#e3d2b8", shutter: "#2f6a43", brick: true }),
    });
    const beamMat = toonMat("labBeam", { map: beamHD() });
    const plinthM = toonMat("labPlinth", { map: stoneHD("labPlinth") });

    addBox(g, 26, 9, 0.8, 0, 4.5, -10.5, backWallMat);
    addBox(g, 0.8, 9, 20, -13, 4.5, -1, sideWallMat);
    addBox(g, 0.8, 9, 20, 13, 4.5, -1, sideWallMat);
    addBox(g, 26.4, 0.55, 1.0, 0, 0.275, -10.4, plinthM);

    // Timber roof beams
    for (const z of [-8, -4, 0]) {
      addBox(g, 26, 0.45, 0.55, 0, 8.2, z, beamMat);
    }

    // Lab equipment benches & shelving along the back wall
    const benchWood = toonMat("benchWood", { map: beamHD(), color: "#c9925e" });
    const rackMetal = toonMat("rackMetal", { color: "#3d485c" });
    const screenGlow = toonMat("oscScreen", { color: "#68d89b" });
    for (const bx of [-7.2, 7.2]) {
      addBox(g, 5.2, 1.1, 1.8, bx, 0.55, -7.8, benchWood);
      addBox(g, 1.8, 1.3, 1.1, bx - 1.1, 1.75, -7.9, rackMetal);
      addBox(g, 1.3, 0.8, 0.08, bx - 1.1, 1.8, -7.32, screenGlow);
      addBox(g, 1.8, 1.3, 1.1, bx + 1.1, 1.75, -7.9, rackMetal);
      addBox(g, 1.3, 0.8, 0.08, bx + 1.1, 1.8, -7.32, screenGlow);
    }
    addCartoonBush(g, -10.8, 0, -7.5, 1.5, 2);
    addCartoonBush(g, 10.8, 0, -7.5, 1.5, 3);
  } else if (preset === "server_room") {
    // 32-Bit Clock & Avionics Control Vault
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      toonMat("vaultFloor", { map: stoneTex, color: "#788296" })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const wallMat = toonMat("vaultWall", {
      map: facadeHD("vaultBack", 24, 9, { wall: "#c8cfdc", shutter: "#35435c", brick: true }),
    });
    addBox(g, 28, 10, 0.8, 0, 5, -12.5, wallMat);

    const rackMat = toonMat("rackCabinet", { color: "#323b4d" });
    const trimMat = toonMat("rackFrame", { color: "#5c687d" });
    const ledGreen = toonMat("ledG", { color: "#52e696" });
    const ledAmber = toonMat("ledA", { color: "#ffb84d" });
    const ledCyan = toonMat("ledC", { color: "#5ce1e6" });

    for (const side of [-6.8, 6.8]) {
      for (let z = -10; z <= 2; z += 3.2) {
        addBox(g, 2.2, 5.2, 2.2, side, 2.6, z, rackMat);
        addBox(g, 2.32, 0.25, 2.32, side, 5.25, z, trimMat);
        const faceX = side - Math.sign(side) * 1.13;
        addBox(g, 0.08, 0.28, 1.5, faceX, 4.1, z, ledGreen);
        addBox(g, 0.08, 0.28, 1.5, faceX, 3.2, z, ledCyan);
        addBox(g, 0.08, 0.28, 1.5, faceX, 2.3, z, ledAmber);
      }
    }
    // Overhead cable bridge
    for (const z of [-9, -4.5, 0]) {
      addBox(g, 14.5, 0.35, 0.6, 0, 5.6, z, trimMat);
    }
  } else if (preset === "courtroom") {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      toonMat("courtFloor", { map: plankTex })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);

    const wallMat = toonMat("courtWall", {
      map: facadeHD("courtWallHD", 24, 9, { wall: "#ebd9b7", shutter: "#5a3b2a", timber: true }),
    });
    const woodMat = toonMat("courtWood", { map: beamHD(), color: "#8c5832" });
    addBox(g, 28, 10, 0.8, 0, 5, -12, wallMat);
    addBox(g, 9.5, 2.4, 2.8, 0, 1.2, -7.5, woodMat);
    addBox(g, 16, 1.2, 0.45, 0, 0.6, -2.2, woodMat);
  } else {
    // "town": Rich storybook village street with gabled houses, cobble road, trees, bushes, lanterns, and rolling hills
    addCloudsAndHills(g, mode, true);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      toonMat("townGrass", { map: grassTex })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    g.add(ground);

    // Cobblestone road running along X in the foreground/midground + stone kerbs
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 7.6),
      toonMat("townCobbleRoad", { map: rep(cobbleHD(), 24, 3) })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.015, 0.8);
    road.receiveShadow = true;
    g.add(road);

    const kerbMat = toonMat("townKerb", { map: stoneHD("kerbStone") });
    addBox(g, 120, 0.16, 0.45, 0, 0.08, -3.1, kerbMat);
    addBox(g, 120, 0.16, 0.45, 0, 0.08, 4.7, kerbMat);

    // Row of storybook gabled houses behind the street
    const houseConfigs: [number, number, number, number, number, number][] = [
      [-19, -11.5, 8.0, 7.5, 7.6, 0],
      [-10, -11.0, 8.6, 7.5, 8.4, 1],
      [-1.0, -11.4, 8.2, 7.5, 7.8, 3],
      [8.2, -11.0, 9.0, 7.5, 8.6, 2],
      [17.8, -11.5, 8.4, 7.5, 7.4, 4],
    ];
    for (const [hx, hz, hw, hd, hh, si] of houseConfigs) {
      addGabledHouse(g, hx, 0, hz, hw, hd, hh, 0, si);
    }

    // Trees, bushes & street lanterns along the pavement
    for (const [tx, tz, th] of [
      [-14.5, -5.8, 7.4],
      [-5.4, -5.6, 6.8],
      [3.8, -5.8, 7.2],
      [13.2, -5.5, 7.6],
    ] as const) {
      addCartoonTree(g, tx, 0, tz, th, tx * 19);
    }
    for (const lx of [-11, -2.5, 6.5, 15]) {
      addLantern(g, lx, 0, -3.5);
    }
    for (const [bx, bz, s] of [
      [-8.2, -4.5, 1],
      [1.2, -4.6, 2],
      [10.5, -4.4, 3],
    ] as const) {
      addCartoonBush(g, bx, 0, bz, 1.15, s);
    }
  }
  return g;
}

export function makeLabelTexture(key: string, label: string, sublabel: string, bg: string, fg: string): THREE.CanvasTexture {
  return ctex(`lblHD_${key}_${label}_${sublabel}_${bg}`, 1024, 512, (ctx) => {
    // Hand-painted sign card with rounded border, subtle warm vignette, and bold crisp lettering
    ctx.fillStyle = "#241726";
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(18, 18, 988, 476, 34);
    ctx.fill();

    // Inner decorative border
    ctx.strokeStyle = "rgba(36,23,38,0.22)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(38, 38, 948, 436, 22);
    ctx.stroke();

    // Corner rivets
    ctx.fillStyle = "#8a7f70";
    for (const [rx, ry] of [
      [62, 62],
      [962, 62],
      [62, 450],
      [962, 450],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#241726";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 104px system-ui, -apple-system, sans-serif";
    ctx.fillText(label.slice(0, 18), 512, sublabel ? 196 : 256, 880);
    if (sublabel) {
      ctx.fillStyle = "#c84638";
      ctx.font = "800 62px system-ui, -apple-system, sans-serif";
      ctx.fillText(sublabel.slice(0, 26), 512, 348, 880);
    }
  });
}

export function buildPropMesh(p: PropDef): { group: THREE.Group; setLabel: (l: string, s: string) => void } {
  const g = new THREE.Group();
  const baseCol = p.color ?? "#d9823b";
  const accentCol = p.accent ?? "#f8f1de";
  const mBase = toonMat(`prop_${p.id}_b`, { color: baseCol });
  const mDark = toonMat(`prop_${p.id}_d`, { color: "#2d323f" });
  const mTrim = toonMat(`prop_${p.id}_t`, { color: "#d8cfc0" });
  let faceMesh: THREE.Mesh | null = null;
  let lastTextKey = `${p.label ?? ""}|${p.sublabel ?? ""}`;

  const makeFaceMat = (l: string, s: string) =>
    toonMat(`faceHD_${p.id}_${l}_${s}`, {
      map: makeLabelTexture(p.id, l || " ", s, accentCol, "#241726"),
      color: "#ffffff",
    });

  if (p.kind === "plane") {
    // Detailed 3D Cartoon Boeing 787 Dreamliner (oriented along local Z, nose at +Z)
    const whiteM = toonMat("jet787White", { color: "#f6f5f0" });
    const blueM = toonMat("jet787Blue", { color: baseCol });
    const glassM = toonMat("jet787Glass", { color: "#3d4d7a" });
    const metalM = toonMat("jet787Metal", { color: "#8c96a6" });
    const darkM = toonMat("jet787Dark", { color: "#242730" });

    // Main fuselage barrel
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 11.5, 24), whiteM);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 2.35, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Blue airline cheatline stripe along fuselage sides
    addBox(g, 2.74, 0.36, 11.2, 0, 2.15, 0, blueM);

    // Rounded nose cone (+Z) & tapered tail cone (-Z)
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 18), whiteM);
    nose.scale.set(1, 0.95, 1.65);
    nose.position.set(0, 2.3, 5.75);
    nose.castShadow = true;
    g.add(nose);

    // Cockpit wrap-around window visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 1.2), glassM);
    visor.position.set(0, 2.78, 6.25);
    visor.rotation.x = 0.22;
    g.add(visor);

    // Row of cabin windows along both sides
    for (let wz = -4.2; wz <= 4.2; wz += 0.95) {
      addBox(g, 2.78, 0.28, 0.42, 0, 2.62, wz, glassM);
    }

    const tailCone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.35, 3.6, 20), whiteM);
    tailCone.rotation.x = Math.PI / 2;
    tailCone.position.set(0, 2.45, -7.5);
    tailCone.castShadow = true;
    g.add(tailCone);

    // Swept main wings + blue winglets
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.22, 2.4), whiteM);
      wing.position.set(s * 4.6, 2.0, -0.3);
      wing.rotation.y = -s * 0.22;
      wing.rotation.z = s * 0.06;
      wing.castShadow = true;
      wing.receiveShadow = true;
      g.add(wing);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.15, 1.4), blueM);
      tip.position.set(s * 8.35, 2.65, -1.1);
      tip.rotation.z = -s * 0.25;
      tip.castShadow = true;
      g.add(tip);
    }

    // 4 Under-wing turbofan engine pods / generators (2 per wing)
    for (const s of [-1, 1]) {
      for (const [ex, ez, sc] of [
        [3.1, 0.5, 1.0],
        [5.6, -0.1, 0.88],
      ] as const) {
        const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.62 * sc, 0.56 * sc, 2.1 * sc, 18), blueM);
        nac.rotation.x = Math.PI / 2;
        nac.position.set(s * ex, 1.25, ez);
        nac.castShadow = true;
        g.add(nac);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.65 * sc, 0.65 * sc, 0.25 * sc, 18), metalM);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(s * ex, 1.25, ez + 1.0 * sc);
        g.add(rim);

        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.52 * sc, 0.52 * sc, 0.28 * sc, 16), darkM);
        fan.rotation.x = Math.PI / 2;
        fan.position.set(s * ex, 1.25, ez + 1.02 * sc);
        g.add(fan);
      }
    }

    // Tall vertical tail fin & horizontal stabilizers
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.6, 2.8), blueM);
    fin.position.set(0, 4.4, -7.4);
    fin.rotation.x = -0.25;
    fin.castShadow = true;
    g.add(fin);

    const hStab = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 1.5), whiteM);
    hStab.position.set(0, 2.65, -7.8);
    hStab.castShadow = true;
    g.add(hStab);

    // Landing gear struts + twin wheels
    for (const [gx, gz] of [
      [0, 4.8],
      [-1.8, -0.5],
      [1.8, -0.5],
    ]) {
      addBox(g, 0.22, 1.1, 0.22, gx, 0.75, gz, metalM);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.48, 14), darkM);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(gx, 0.42, gz);
      wheel.castShadow = true;
      g.add(wheel);
    }
  } else if (p.kind === "car") {
    // Storybook vintage cartoon car + compact overhead odometer card (sized for 9:16 framing)
    const carRed = toonMat(`carBody_${p.id}`, { color: baseCol });
    const roofM = toonMat(`carRoof_${p.id}`, { color: "#e5ba6a" });
    const glassM = toonMat(`carGlass_${p.id}`, { color: "#6882bf" });
    const tyreM = toonMat("carTyre", { color: "#23252e" });
    const chromeM = toonMat("carChrome", { color: "#e6dfd3" });
    const lampM = toonMat("carLamp", { color: "#ffe47a" });

    // Lower chassis & fenders (compact 2.6m length so driver & kid stand beside it in 9:16)
    addBox(g, 2.55, 0.78, 1.45, 0, 0.66, 0, carRed);
    addBox(g, 2.72, 0.18, 1.55, 0, 0.36, 0, chromeM);

    // Upper cabin with inset windows
    addBox(g, 1.45, 0.68, 1.3, -0.1, 1.36, 0, roofM);
    addBox(g, 1.48, 0.42, 1.05, -0.1, 1.34, 0, glassM);
    addBox(g, 1.15, 0.42, 1.33, -0.1, 1.34, 0, glassM);

    // Headlights
    for (const sz of [-0.46, 0.46]) {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 14), lampM);
      hl.rotation.z = Math.PI / 2;
      hl.position.set(1.32, 0.74, sz);
      g.add(hl);
    }

    // 4 wheels with hubcaps
    for (const wx of [-0.82, 0.82]) {
      for (const wz of [-0.74, 0.74]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.26, 16), tyreM);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx, 0.35, wz);
        w.castShadow = true;
        g.add(w);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.29, 12), chromeM);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(wx, 0.35, wz);
        g.add(cap);
      }
    }

    // Compact roof odometer display board at y = 2.38m so characters standing in front/beside are never occluded
    if (p.label) {
      addBox(g, 1.56, 0.88, 0.14, 0, 2.38, 0, mDark);
      faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.76), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
      faceMesh.position.set(0, 2.38, 0.08);
      g.add(faceMesh);
      addBox(g, 0.14, 0.5, 0.14, 0, 1.82, 0, chromeM);
    }
  } else if (p.kind === "clock" || p.kind === "gcu") {
    // 3D Cartoon Avionics Generator Control Unit & 100Hz 32-Bit Clock Apparatus (9:16 compact width 1.55m)
    const brassM = toonMat("clockBrass", { color: "#d9a74a" });
    const caseM = toonMat(`clockCase_${p.id}`, { color: baseCol });
    const ledRed = toonMat("clockAlert", { color: "#e0483e" });
    const clockFaceM = toonMat("clockDialFace", {
      map: ctex("clockDialHD", 256, 256, (ctx) => {
        ctx.fillStyle = "#f7f1e1";
        ctx.strokeStyle = "#221f2e";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(128, 128, 114, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.lineCap = "round";
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          ctx.lineWidth = i % 3 === 0 ? 10 : 6;
          ctx.beginPath();
          ctx.moveTo(128 + 78 * Math.cos(a), 128 + 78 * Math.sin(a));
          ctx.lineTo(128 + 98 * Math.cos(a), 128 + 98 * Math.sin(a));
          ctx.stroke();
        }
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(128, 128);
        ctx.lineTo(128, 56);
        ctx.stroke();
        ctx.lineWidth = 9;
        ctx.strokeStyle = "#c84638";
        ctx.beginPath();
        ctx.moveTo(128, 128);
        ctx.lineTo(182, 148);
        ctx.stroke();
      }),
    });

    // Pedestal cabinet
    addBox(g, 1.52, 1.15, 0.85, 0, 0.575, 0, mDark);
    addBox(g, 1.64, 0.14, 0.95, 0, 1.18, 0, brassM);

    // Main instrument display housing at y = 1.85m
    addBox(g, 1.54, 1.05, 0.36, 0, 1.78, 0, caseM);
    addBox(g, 1.64, 1.14, 0.3, 0, 1.78, -0.02, brassM);

    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.88), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.78, 0.19);
    g.add(faceMesh);

    // Top analog clock dial with painted face & warning beacon
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 20), brassM);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(-0.38, 2.66, 0);
    dial.castShadow = true;
    g.add(dial);
    const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), clockFaceM);
    dialFace.position.set(-0.38, 2.66, 0.11);
    g.add(dialFace);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), ledRed);
    beacon.position.set(0.45, 2.52, 0);
    g.add(beacon);
  } else if (p.kind === "switch") {
    // Compact Cartoon "TURN IT OFF & ON AGAIN" Master Power Switch Box (1.3m wide)
    const redM = toonMat("switchRed", { color: "#d93b34" });
    const chromeM = toonMat("switchChrome", { color: "#dde2eb" });

    addBox(g, 1.32, 2.0, 0.7, 0, 1.0, 0, redM);
    addBox(g, 1.46, 0.18, 0.84, 0, 0.09, 0, mDark);

    if (p.label) {
      faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.72), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
      faceMesh.position.set(0, 1.42, 0.36);
      g.add(faceMesh);
    }

    // Giant throw lever on the right side
    addBox(g, 0.26, 0.35, 0.26, 0.72, 1.35, 0, mDark);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), chromeM);
    arm.position.set(0.86, 1.68, 0.2);
    arm.rotation.x = 0.45;
    g.add(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), redM);
    knob.position.set(0.86, 2.04, 0.36);
    knob.castShadow = true;
    g.add(knob);
  } else if (p.kind === "desk") {
    addBox(g, 2.4, 0.16, 1.2, 0, 0.95, 0, mBase);
    for (const lx of [-1.0, 1.0]) for (const lz of [-0.45, 0.45]) addBox(g, 0.14, 0.95, 0.14, lx, 0.475, lz, mDark);
  } else if (p.kind === "screen" || p.kind === "sign" || p.kind === "chart") {
    // Compact wooden signpost (1.48m wide) elevated to y = 1.85m so characters stand right beside it in 9:16
    const postM = toonMat("signWoodPost", { map: beamHD(), color: "#8a5a3a" });
    addBox(g, 1.48, 0.94, 0.14, 0, 1.82, 0, postM);
    addBox(g, 1.56, 1.02, 0.11, 0, 1.82, -0.02, mDark);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.82), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.82, 0.08);
    g.add(faceMesh);
    for (const px of [-0.48, 0.48]) {
      addBox(g, 0.14, 1.38, 0.14, px, 0.69, 0, postM);
    }
  } else if (p.kind === "book") {
    addBox(g, 1.6, 2.2, 0.42, 0, 1.1, 0, mBase);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.85), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 1.1, 0.22);
    g.add(faceMesh);
  } else if (p.kind === "server") {
    addBox(g, 1.8, 3.6, 1.5, 0, 1.8, 0, mDark);
    addBox(g, 1.9, 0.2, 1.6, 0, 3.65, 0, mTrim);
    faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.85), makeFaceMat(p.label ?? "", p.sublabel ?? ""));
    faceMesh.position.set(0, 2.55, 0.77);
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
  } else if (p.kind === "pile") {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 3.6, 10), mBase);
    cone.position.y = 1.8;
    cone.castShadow = true;
    cone.receiveShadow = true;
    g.add(cone);
  } else {
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
