// 水槽・底砂・光のゆらぎ・泡・卵・餌の見た目
import * as THREE from 'three';
import { mergeGeometries as mergeGeos } from 'three/addons/BufferGeometryUtils.js';

function canvasTex(size, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// なめらかなノイズ（岩や壁のでこぼこ用）
function hash3(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash3(xi + i, yi + j, zi + k);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
function fbm(x, y, z, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.1; a *= 0.5; } return s; }

// 底砂（1枚 = 実寸10cm 四方）：一粒ずつ影とつやを描く。でこぼこ用の白黒画像も同時に作る
const gravelBump = document.createElement('canvas');
const gravelTex = canvasTex(1024, (g, S) => {
  gravelBump.width = gravelBump.height = S;
  const b = gravelBump.getContext('2d');
  g.fillStyle = '#5d5447'; g.fillRect(0, 0, S, S);
  b.fillStyle = '#202020'; b.fillRect(0, 0, S, S);
  const rnd = mulberry(7);
  for (let i = 0; i < 14000; i++) {
    const x = rnd() * S, y = rnd() * S, r = 2.5 + rnd() * rnd() * 11, ry = r * (0.6 + rnd() * 0.4), rot = rnd() * 3;
    const hue = 22 + rnd() * 22, sat = 6 + rnd() * 16, lit = 26 + rnd() * 40;
    // 影
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.3, r, ry, rot, 0, 7); g.fill();
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, `hsl(${hue},${sat}%,${lit + 18}%)`); gr.addColorStop(0.7, `hsl(${hue},${sat}%,${lit}%)`); gr.addColorStop(1, `hsl(${hue},${sat}%,${lit - 12}%)`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, ry, rot, 0, 7); g.fill();
    const gb = b.createRadialGradient(x, y, 0, x, y, r);
    gb.addColorStop(0, '#fff'); gb.addColorStop(1, '#303030');
    b.fillStyle = gb; b.beginPath(); b.ellipse(x, y, r, ry, rot, 0, 7); b.fill();
  }
});
const gravelBumpTex = new THREE.CanvasTexture(gravelBump); gravelBumpTex.wrapS = gravelBumpTex.wrapT = THREE.RepeatWrapping;

// 光の柱（水面から差し込む光）
const shaftTex = canvasTex(128, (g, S) => {
  const gr = g.createLinearGradient(0, 0, 0, S);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  const side = g.createLinearGradient(0, 0, S, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.3, 'rgba(0,0,0,0)'); side.addColorStop(0.7, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, S, S);
}, false);
// 水中のちり（やわらかい丸）
const dotTex = canvasTex(64, (g, S) => {
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
}, false);

// なめらかな川石（でこぼこ＋色むら＋上側に少しコケ）
function makeRock(r, seed) {
  const geo = new THREE.SphereGeometry(1, 72, 54);
  const p = geo.attributes.position, col = [], c = new THREE.Color();
  const base = new THREE.Color().setHSL(0.08 + (seed % 7) * 0.008, 0.1, 0.16 + (seed % 5) * 0.025);
  const moss = new THREE.Color('#4d5a32');
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm(x * 1.3 + seed, y * 1.3, z * 1.3 - seed, 4);
    const fine = fbm(x * 6 + seed, y * 6, z * 6, 2);
    const k = 1 + 0.28 * n + 0.035 * fine;
    x *= k; z *= k * 0.9; y = y * k * 0.6; if (y < -0.18) y = -0.18 + (y + 0.18) * 0.15;
    p.setXYZ(i, x * r, y * r, z * r);
    c.copy(base).multiplyScalar(0.8 + 0.35 * fbm(x * 3 - seed, y * 3, z * 3, 3) + 0.15 * fine);
    if (y > 0.15) c.lerp(moss, Math.min(0.45, (y - 0.15) * 1.2 * (0.5 + 0.5 * noise3(x * 4, y * 4, z * 4 + seed))));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// 奥と横の岩の壁（水族館の擬岩のような背景）。内側だけ見える
function makeRockWall(width, height, seed, scale) {
  const seg = 140;
  const geo = new THREE.PlaneGeometry(width, height, seg, Math.round(seg * height / width) + 8);
  const p = geo.attributes.position, col = [], c = new THREE.Color();
  const base = new THREE.Color('#4a5550'), dark = new THREE.Color('#22302e');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const n = fbm(x / scale + seed, y / scale, seed, 5);
    const ledge = Math.abs(Math.sin(y / scale * 2.1 + n * 2)) ** 6; // 段になった岩のふち
    p.setZ(i, (n * 0.6 + ledge * 0.25) * scale);
    c.copy(dark).lerp(base, Math.min(1, Math.max(0, 0.55 + n * 0.9 + ledge * 0.3)));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// 光のゆらぎ（コースティクス）
const causticTex = canvasTex(256, (g, S) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const rnd = mulberry(3);
  const pts = []; for (let i = 0; i < 24; i++) pts.push([rnd() * S, rnd() * S]);
  const img = g.getImageData(0, 0, S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let d1 = 1e9, d2 = 1e9;
    for (const [px, py] of pts) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const dx = x - px - ox, dy = y - py - oy, d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    const e = Math.sqrt(d2) - Math.sqrt(d1);
    const v = Math.max(0, 1 - e / 5) ** 2 * 255;
    const i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
// 水面の模様（ゆらぎをぼかしたもの）
const surfaceTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.filter = 'blur(6px)';
  g.drawImage(causticTex.image, 0, 0); g.globalAlpha = 0.6; g.drawImage(causticTex.image, 3, 5);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();


export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class Tank {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); scene.add(this.group);
    this.bubbles = [];
    this.uTime = { value: 0 };
  }
  build(T) {
    this.T = T;
    const g = this.group;
    g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    while (g.children.length) g.remove(g.children[0]);
    const { w, d, h } = T;
    const rnd = mulberry(w);
    const big = w >= 45;
    // 底：小石の模様＋でこぼこ
    const gs = w < 30 ? 4 : w < 100 ? 10 : w < 400 ? 25 : 60;
    const ft = gravelTex.clone(); ft.needsUpdate = true; ft.repeat.set(w * 1.6 / gs, d * 1.6 / gs);
    const fb = gravelBumpTex.clone(); fb.needsUpdate = true; fb.repeat.copy(ft.repeat);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, d * 1.6), new THREE.MeshStandardMaterial({ map: ft, bumpMap: fb, bumpScale: 2, roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    // 立体の小石（ばらばらの大きさ・色）
    const pebSize = Math.max(0.1, w / 260);
    const pebN = big ? 3200 : 900;
    const pebGeo = new THREE.SphereGeometry(1, 12, 9);
    const peb = new THREE.InstancedMesh(pebGeo, new THREE.MeshStandardMaterial({ roughness: 0.75 }), pebN);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pc = new THREE.Color();
    for (let i = 0; i < pebN; i++) {
      // 壁ぎわに多め
      let x = (rnd() * 2 - 1) * w / 2, z = (rnd() * 2 - 1) * d / 2;
      if (rnd() < 0.5) { if (rnd() < 0.5) z = (rnd() < 0.5 ? -1 : 1) * d / 2 * (0.75 + rnd() * 0.25); else x = (rnd() < 0.5 ? -1 : 1) * w / 2 * (0.8 + rnd() * 0.2); }
      const sz = pebSize * (0.35 + rnd() * rnd() * 1.8);
      e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e);
      mtx.compose(new THREE.Vector3(x, sz * 0.25, z), q, new THREE.Vector3(sz, sz * (0.45 + rnd() * 0.3), sz * (0.7 + rnd() * 0.3)));
      peb.setMatrixAt(i, mtx);
      pc.setHSL(0.07 + rnd() * 0.05, 0.1 + rnd() * 0.14, 0.14 + rnd() * rnd() * 0.3);
      peb.setColorAt(i, pc);
    }
    peb.receiveShadow = true; g.add(peb);
    // ゆらぎの光
    this.caus = [];
    for (let i = 0; i < 2; i++) {
      const t = causticTex.clone(); t.needsUpdate = true;
      const cell = Math.max(3, Math.min(40, w / 12));
      t.repeat.set(w * 1.6 / cell * (1 + i * 0.37), d * 1.6 / cell * (1 + i * 0.37));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, d * 1.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = pebSize * 0.5 + i * 0.01; g.add(m); this.caus.push(t);
    }
    // 遠くの背景（深い水の色）
    const wallM = new THREE.MeshBasicMaterial({ color: 0x163f4c, side: THREE.BackSide, fog: true });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w * 1.6, h * 1.2, d * 1.6), wallM);
    walls.position.y = h * 0.6 - 0.02; g.add(walls);
    // 岩の壁：奥・左・右（中から見た時だけ見える）
    if (big) {
      const rockWallM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
      const sc = Math.max(4, h * 0.18);
      const back = new THREE.Mesh(makeRockWall(w, h * 1.1, 3, sc), rockWallM);
      back.position.set(0, h * 0.55, -d / 2 - sc * 0.3); back.receiveShadow = true; g.add(back);
      const front = new THREE.Mesh(makeRockWall(w, h * 1.1, 11, sc), rockWallM);
      front.rotation.y = Math.PI; front.position.set(0, h * 0.55, d / 2 + sc * 0.3); front.receiveShadow = true; g.add(front);
      for (const sgn of [-1, 1]) {
        const side = new THREE.Mesh(makeRockWall(d, h * 1.1, 7 + sgn, sc), rockWallM);
        side.rotation.y = -sgn * Math.PI / 2; side.position.set(sgn * (w / 2 + sc * 0.3), h * 0.55, 0); side.receiveShadow = true; g.add(side);
      }
    }
    // ガラスのふち（うっすら）
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0x9fd6e8, transparent: true, opacity: 0.12 }));
    edges.position.y = h / 2; g.add(edges);
    // 水面：下から見るとゆらゆら光る
    this.surfTex = surfaceTex.clone(); this.surfTex.needsUpdate = true;
    this.surfTex.repeat.set(3, 3 * d / w);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, d * 1.6), new THREE.MeshBasicMaterial({ color: 0xcff6ff, map: this.surfTex, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    surf.rotation.x = Math.PI / 2; surf.position.y = h; g.add(surf);
    // 石
    const rockBump = gravelBumpTex.clone(); rockBump.needsUpdate = true; rockBump.repeat.set(2, 1);
    const rockM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, bumpMap: rockBump, bumpScale: 1.5 });
    for (let i = 0; i < (w < 30 ? 2 : 7); i++) {
      const r = (0.03 + rnd() * 0.06) * Math.min(w, d) * (w < 30 ? 0.5 : 1);
      const m = new THREE.Mesh(makeRock(r, Math.floor(rnd() * 100)), rockM);
      const side = rnd() < 0.5 ? -1 : 1;
      m.position.set((rnd() - 0.5) * w * 0.85, r * 0.12, side * d * (0.3 + rnd() * 0.15));
      m.rotation.y = rnd() * 6;
      m.castShadow = m.receiveShadow = true; g.add(m);
    }
    // 水草（奥の角でゆれる細長い葉）
    if (big) {
      const leafM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide });
      leafM.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = this.uTime;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float k = uv.y * uv.y;
          vec4 wp = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          transformed.x += sin(uTime * 0.9 + wp.x * 0.05 + uv.y * 2.0) * k * 0.12 * ${(h * 0.6).toFixed(2)};
          transformed.z += cos(uTime * 0.7 + wp.z * 0.05 + uv.y * 1.5) * k * 0.08 * ${(h * 0.6).toFixed(2)};`);
      };
      leafM.customProgramCacheKey = () => 'leaf' + h;
      // 水草の場所：奥の壁ぞい・左右の壁ぞい・手前の角（真ん中はチョウザメが泳げるよう空ける）
      const spots = [];
      for (let i = 0; i < 9; i++) spots.push([-0.46 + i * 0.115 + (rnd() - 0.5) * 0.05, -0.42 + rnd() * 0.06, 0.7 + rnd() * 0.5]);
      for (const sx of [-0.45, 0.45]) for (let i = 0; i < 3; i++) spots.push([sx + (rnd() - 0.5) * 0.04, -0.2 + i * 0.25, 0.5 + rnd() * 0.4]);
      spots.push([-0.42, 0.4, 0.35], [0.42, 0.42, 0.4], [0.3, 0.4, 0.3]);
      for (const [sx, sz, tall] of spots) {
        const leaves = [];
        const n = 14 + Math.floor(rnd() * 12);
        for (let i = 0; i < n; i++) {
          const H = h * tall * (0.6 + rnd() * 0.5), W = Math.max(0.3, h * 0.012) * (0.7 + rnd() * 0.6);
          const lg = new THREE.PlaneGeometry(W, H, 1, 14);
          // 葉の先を細く、少し曲げる
          const lp = lg.attributes.position; const bendK = (rnd() - 0.5) * 0.5;
          for (let k = 0; k < lp.count; k++) { const t = (lp.getY(k) + H / 2) / H; lp.setX(k, lp.getX(k) * (1 - t * 0.8)); lp.setZ(k, bendK * t * t * H * 0.3); lp.setY(k, t * H); }
          lg.computeVertexNormals();
          lg.rotateY(rnd() * 6);
          lg.translate((rnd() - 0.5) * h * 0.18, 0, (rnd() - 0.5) * h * 0.12);
          // 葉ごとに少し色を変える
          const lc = new THREE.Color().setHSL(0.23 + rnd() * 0.07, 0.45 + rnd() * 0.2, 0.22 + rnd() * 0.14), cols = [];
          for (let k = 0; k < lp.count; k++) { const t = lp.getY(k) / H; cols.push(lc.r * (0.6 + 0.5 * t), lc.g * (0.6 + 0.5 * t), lc.b * (0.6 + 0.5 * t)); }
          lg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
          leaves.push(lg);
        }
        const merged = new THREE.Mesh(mergeGeos(leaves), leafM);
        merged.position.set(sx * w, 0, sz * d);
        merged.castShadow = true; merged.userData.plant = true; g.add(merged);
      }
      // ふさふさした茎の水草（オオカナダモのような）
      for (let c = 0; c < 6; c++) {
        const parts = [];
        const bx = (rnd() - 0.5) * w * 0.85, bz = -d * (0.25 + rnd() * 0.18) * (rnd() < 0.3 ? -1 : 1);
        for (let st = 0; st < 5; st++) {
          const H = h * (0.3 + rnd() * 0.35), ox = (rnd() - 0.5) * h * 0.08, oz = (rnd() - 0.5) * h * 0.08;
          const lw = Math.max(0.25, h * 0.03);
          for (let y = 0; y < H; y += lw * 0.55) {
            for (let k = 0; k < 4; k++) {
              const lf = new THREE.PlaneGeometry(lw * 0.22, lw * 0.75, 1, 2);
              lf.translate(0, lw * 0.37, 0); lf.rotateX((rnd() - 0.5) * 0.6); lf.rotateZ(0.7 + rnd() * 0.6); lf.rotateY(k * Math.PI / 2 + rnd() * 6.28);
              lf.translate(ox, y, oz);
              const lc = new THREE.Color().setHSL(0.25 + rnd() * 0.05, 0.5, 0.12 + 0.1 * (y / H) + rnd() * 0.04), cols = [];
              for (let q = 0; q < lf.attributes.position.count; q++) cols.push(lc.r, lc.g, lc.b);
              lf.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
              lf.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(lf.attributes.position.count).fill(0).flatMap(() => [0, y / H]), 2));
              parts.push(lf);
            }
          }
        }
        const bush = new THREE.Mesh(mergeGeos(parts), leafM);
        bush.position.set(bx, 0, bz); bush.userData.plant = true; g.add(bush);
      }
    }
    // 光の柱
    this.shafts = [];
    const shaftM = new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xd8f6ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    for (let i = 0; i < (w < 30 ? 3 : 7); i++) {
      const sw = h * (0.12 + rnd() * 0.2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, h * 1.15), shaftM.clone());
      m.position.set((rnd() - 0.5) * w * 0.9, h * 0.45, (rnd() - 0.5) * d * 0.8);
      m.rotation.z = 0.18 + rnd() * 0.12;
      m.userData = { ph: rnd() * 6, base: 0.04 + rnd() * 0.05 };
      g.add(m); this.shafts.push(m);
    }
    // 水中のちり
    const N = 700, pp = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pp[i] = rnd();
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    this.dust = new THREE.Points(pg, new THREE.PointsMaterial({ map: dotTex, color: 0xe6f6ee, size: 1, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true }));
    this.dust.frustumCulled = false; this.dustSeed = pp.slice(); g.add(this.dust);
    // 泡（エアストーン）
    const bg = new THREE.SphereGeometry(1, 14, 10);
    const bm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 0, transparent: true, opacity: 0.45, clearcoat: 1 });
    this.bubbles = [];
    this.stone = new THREE.Vector3(-w * 0.42, 0, -d * 0.38);
    for (let i = 0; i < 50; i++) {
      const b = new THREE.Mesh(bg, bm);
      const s = Math.min(0.6, Math.max(0.05, h * 0.006)) * (0.4 + rnd() * 1.1);
      b.scale.setScalar(s);
      b.userData = { y: rnd() * h, sp: h * (0.16 + rnd() * 0.12), ph: rnd() * 6, s };
      g.add(b); this.bubbles.push(b);
    }
  }
  update(dt, time, camera, target) {
    const { w, d, h } = this.T;
    this.uTime.value = time;
    this.caus[0].offset.set(time * 0.013 + Math.sin(time * 0.3) * 0.02, time * 0.009);
    this.caus[1].offset.set(-time * 0.011, time * 0.014 + Math.cos(time * 0.25) * 0.02);
    this.surfTex.offset.set(time * 0.02, -time * 0.015);
    for (const b of this.bubbles) {
      const u = b.userData;
      u.y += u.sp * dt; if (u.y > h) u.y = 0;
      const wob = 1 + 0.12 * Math.sin(time * 14 + u.ph);
      b.scale.set(u.s * wob, u.s / wob, u.s * wob);
      b.position.set(this.stone.x + Math.sin(time * 3 + u.ph) * h * 0.012, u.y, this.stone.z + Math.cos(time * 2.3 + u.ph) * h * 0.012);
    }
    // 光の柱：カメラの方を向いて、ゆっくり明るさが変わる
    for (const m of this.shafts) {
      m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
      m.material.opacity = m.userData.base * (0.6 + 0.4 * Math.sin(time * 0.4 + m.userData.ph));
    }
    // ちり：カメラの近くの箱の中をゆっくり漂う
    if (target) {
      const D = camera.position.distanceTo(target), box = D * 1.6;
      const a = this.dust.geometry.attributes.position, sd = this.dustSeed;
      for (let i = 0; i < a.count; i++) {
        const ox = sd[i * 3] + time * 0.004 * (0.5 + sd[i * 3 + 1]), oy = sd[i * 3 + 1] + time * 0.002, oz = sd[i * 3 + 2] + Math.sin(time * 0.2 + i) * 0.01;
        let x = target.x + ((ox % 1) - 0.5) * box, y = target.y + ((oy % 1) - 0.5) * box, z = target.z + ((oz % 1 + 1) % 1 - 0.5) * box;
        a.setXYZ(i, x, Math.min(h, Math.max(0, y)), z);
      }
      a.needsUpdate = true;
      this.dust.material.size = D * 0.012;
    }
  }
}

// 受精卵（直径3.2mm）
export function makeEgg() {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 40, 28), new THREE.MeshPhysicalMaterial({ color: 0xc8b8a0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.38, depthWrite: false }));
  const yolkTex = canvasTex(256, (c, S) => {
    const gr = c.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, '#2a2420'); gr.addColorStop(0.45, '#3b3128'); gr.addColorStop(0.55, '#7d6a4d'); gr.addColorStop(1, '#a08a64');
    c.fillStyle = gr; c.fillRect(0, 0, S, S);
  }, false);
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.125, 32, 24), new THREE.MeshStandardMaterial({ map: yolkTex, roughness: 0.6 }));
  yolk.rotation.z = 0.6;
  g.add(shell, yolk);
  g.userData = { shell, yolk };
  return g;
}

// 餌の形
const foodGeo = {
  dot: new THREE.SphereGeometry(0.5, 10, 8),
  flake: (() => { const s = new THREE.CircleGeometry(0.5, 6); s.rotateX(-Math.PI / 2); return s; })(),
  worm: (() => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.2, 0.06, 0.08), new THREE.Vector3(0.15, -0.03, -0.06), new THREE.Vector3(0.5, 0.04, 0.03)]); return new THREE.TubeGeometry(c, 16, 0.5, 6, false); })(),
  shrimp: (() => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.5, 0.05, 0), new THREE.Vector3(0.1, 0.12, 0), new THREE.Vector3(-0.3, 0.02, 0), new THREE.Vector3(-0.45, -0.12, 0)]); const g = new THREE.TubeGeometry(c, 12, 0.11, 8, false); return g; })(),
  shell: (() => { const g = new THREE.SphereGeometry(0.5, 14, 10); g.scale(1, 0.55, 0.85); return g; })(),
  fish: (() => { const g = new THREE.SphereGeometry(0.5, 16, 8); g.scale(1, 0.18, 0.09); return g; })(),
};
export function makeFood(f) {
  const mat = new THREE.MeshStandardMaterial({ color: f.color, roughness: f.shape === 'fish' ? 0.25 : 0.55, metalness: f.shape === 'fish' ? 0.5 : 0 });
  const m = new THREE.Mesh(foodGeo[f.shape], mat);
  if (f.shape === 'worm') m.scale.set(f.size, f.thin * 2, f.thin * 2);
  else if (f.shape === 'shrimp' || f.shape === 'fish') m.scale.setScalar(f.size);
  else m.scale.setScalar(f.size);
  m.userData.base = m.scale.clone();
  m.castShadow = f.size > 1;
  return m;
}

// 卵の中の胚：卵黄の表面に巻きつく細長い体（k=0..1 で育つ）
const embryoMat = new THREE.MeshStandardMaterial({ color: 0xcbbfa8, roughness: 0.45, transparent: true, opacity: 0.95 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
export function makeEmbryo(k) {
  const g = new THREE.Group();
  const R = 0.128, arc = (0.5 + 1.25 * k) * Math.PI, N = 40;
  const pts = [];
  for (let i = 0; i <= N; i++) { const a = -arc / 2 + arc * (i / N); pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.15, Math.sin(a) * R)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, 60, 1, 10, false);
  // 頭を太く、尾を細く
  const p = tube.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const seg = Math.floor(i / 11) / 60; const t = 1 - seg; // t=1 が頭
    const r = (0.012 + 0.03 * Math.pow(t, 1.4)) * (0.5 + 0.5 * k);
    curve.getPoint(seg, c);
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).sub(c).normalize().multiplyScalar(r);
    p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
  }
  tube.computeVertexNormals();
  g.add(new THREE.Mesh(tube, embryoMat));
  if (k > 0.35) {
    const head = curve.getPoint(0.97), tan = curve.getTangent(0.97);
    const side = new THREE.Vector3().crossVectors(tan, head.clone().normalize()).normalize();
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.009 * (0.6 + 0.4 * k), 10, 8), eyeMat);
      e.position.copy(head).addScaledVector(side, s * 0.014).addScaledVector(head.clone().normalize(), 0.012);
      g.add(e);
    }
  }
  return g;
}
