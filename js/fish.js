// チョウザメの3Dモデルをコードで組み立てる（全長=1、頭が +x）
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a + (b - a) * k;

// [t, 幅, 高さ, 中心の上下]  t=0 が口先、1 が尾の先
const ADULT = [[0, 0, 0, -.004], [.012, .028, .010, -.004], [.05, .046, .018, -.004], [.12, .060, .030, -.002], [.18, .070, .046, .004], [.25, .077, .060, .006], [.35, .080, .066, .006], [.48, .066, .058, .004], [.62, .048, .042, .004], [.74, .030, .028, .006], [.82, .019, .020, .010], [.90, .010, .012, .026], [1, .002, .003, .05]];
// 若魚：口先が長くとがる
const JUV = [[0, 0, 0, -.002], [.02, .008, .005, -.002], [.06, .018, .009, -.003], [.12, .036, .018, -.002], [.18, .054, .036, .003], [.25, .064, .052, .005], [.35, .068, .058, .006], [.48, .060, .052, .004], [.62, .044, .040, .004], [.74, .028, .027, .006], [.82, .018, .019, .010], [.90, .010, .012, .026], [1, .002, .003, .05]];
// ふ化直後の仔魚：頭が丸く、しっぽが長い
const LARVA = [[0, 0, 0, 0], [.02, .030, .028, 0], [.06, .050, .048, 0], [.12, .060, .058, 0], [.2, .062, .062, -.004], [.3, .056, .056, -.004], [.42, .044, .046, -.002], [.55, .032, .036, 0], [.7, .022, .026, 0], [.85, .013, .016, 0], [1, .002, .003, 0]];

function sample(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = (t - a[0]) / (b[0] - a[0]);
      const s = k * k * (3 - 2 * k) * 0.5 + k * 0.5;
      return [mix(a[1], b[1], s), mix(a[2], b[2], s), mix(a[3], b[3], s)];
    }
  }
  const l = keys[keys.length - 1]; return [l[1], l[2], l[3]];
}

// 成長段階から見た目のパラメータを決める
export function lookFor(d, L) {
  return {
    len: Math.round(L / 5) * 5,
    larva: 1 - sm(9, 27, d),
    yolk: d < 0 ? 1 : 1 - sm(0, 9.5, d),
    barbel: sm(1, 5, d),
    scuteD: sm(20, 59, d),
    scuteLV: sm(35, 91, d),
    juv: 1 - sm(30, 90, L),
    pigment: sm(6, 30, d),
  };
}

// 皮ふのザラザラ（小さな粒）
const skinBump = (() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 1024, 256);
  let a = 9; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 26000; i++) { const v = 90 + r() * 120 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(r() * 1024, r() * 256, 0.6 + r() * 1.6, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1);
  return t;
})();

// 角をなめらかにする（両端は固定）
function chaikin(v, closed = false, n = 3) {
  for (let k = 0; k < n; k++) {
    const o = [v[0]];
    for (let i = 0; i < v.length - 1; i++) {
      const a = v[i], b = v[i + 1];
      o.push(a.clone().lerp(b, 0.25), a.clone().lerp(b, 0.75));
    }
    o.push(v[v.length - 1]); v = o;
  }
  return v;
}

// 1匹ずつの個性（生まれつき）。seed から毎回同じ値が出る
export function makeTraits(seed) {
  let a = (seed | 0) || 1; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 5; i++) r();
  const shapes = ['round', 'long', 'cluster', 'fine'];
  return {
    seed: Math.floor(r() * 1e6),
    hue: (r() - 0.5) * 0.11,        // 色み：オリーブ寄り〜茶色寄り〜灰色寄り
    sat: 0.5 + r() * 0.95,          // 色の濃さ
    light: 0.78 + r() * 0.45,       // 明るさ
    spotDark: 0.6 + r() * 0.8,      // 斑点の濃さ
    belly: (r() - 0.5) * 0.5,       // お腹の白い部分の広さ
    scuteLight: r(),                // 骨板の白さ
    iris: r(),                      // 目のふち：金色〜銀色
    spotN: 0.5 + r() * 1.2,         // 斑点の数
    spotS: 0.6 + r() * 0.9,         // 斑点の大きさ
    spotShape: shapes[Math.floor(r() * shapes.length)],
    snout: 0.88 + r() * 0.26,       // 口先の長さ（大きいほど長くとがる）
    plump: 0.92 + r() * 0.16,       // 体の太さ
    eye: 0.85 + r() * 0.35,         // 目の大きさ
    barbel: 0.8 + r() * 0.45,       // ヒゲの長さ
    finYellow: r(),                 // ヒレのふちの黄色み
    scute: 0.8 + r() * 0.45,        // 骨板の大きさ
    // 性格（動きのくせ）
    active: 0.6 + r() * 0.8,        // 元気さ：急に泳ぐ回数・速さ
    curious: 0.5 + r() * 1.0,       // 好奇心：水面を見上げる・鼻を反らす回数
    sniffy: 0.5 + r() * 1.0,        // 鼻をヒクヒクさせる回数
  };
}
export const DEFAULT_TRAITS = { seed: 77, hue: 0, sat: 1, light: 1, spotDark: 1, belly: 0, scuteLight: 0.6, iris: 0.2, spotN: 1, spotS: 1, spotShape: 'round', snout: 1, plump: 1, eye: 1, barbel: 1, finYellow: 0.6, scute: 1, active: 1, curious: 1, sniffy: 1 };

// 皮ふの斑点の模様（1匹ずつ違う）。u=体の前後、v=体のまわり
const spotCache = new Map();
function skinSpotsFor(tr) {
  const key = `${tr.seed}|${tr.spotN.toFixed(2)}|${tr.spotS.toFixed(2)}|${tr.spotShape}|${(tr.spotDark ?? 1).toFixed(2)}`;
  if (spotCache.has(key)) return spotCache.get(key);
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 2048, 1024);
  let a = tr.seed % 2147483646 + 1; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const dk = tr.spotDark ?? 1;
  const dot = (x, y, rx, ry, rot, alpha) => {
    alpha = Math.min(0.95, alpha * dk);
    const v = (70 + r() * 70) / Math.max(0.7, dk) | 0;
    g.fillStyle = `rgba(${v},${v - 6},${v - 14},${alpha})`;
    g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill();
  };
  const n = Math.round(2600 * tr.spotN * (tr.spotShape === 'fine' ? 2.2 : tr.spotShape === 'cluster' ? 0.35 : 1));
  for (let i = 0; i < n; i++) {
    const x = r() * 2048, y = r() * 1024, rad = (1.5 + r() * r() * 7) * tr.spotS;
    if (tr.spotShape === 'long') dot(x, y, rad * (2 + r() * 1.5), rad * 0.7, (r() - 0.5) * 0.4, 0.35 + r() * 0.35); // 前後に細長い
    else if (tr.spotShape === 'cluster') { for (let k = 0; k < 6; k++) dot(x + (r() - 0.5) * rad * 6, y + (r() - 0.5) * rad * 4, rad * 0.75, rad * 0.65, r() * 3, 0.5 + r() * 0.4); } // 小さな点のかたまり
    else if (tr.spotShape === 'fine') dot(x, y, rad * 0.6, rad * 0.55, r() * 3, 0.45 + r() * 0.35); // こまかい点
    else dot(x, y, rad * (1 + r() * 0.6), rad, r() * 3, 0.35 + r() * 0.4); // 丸い点
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
  spotCache.set(key, t);
  return t;
}

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

export class Fish {
  constructor() {
    this.group = new THREE.Group();
    this.u = { uPhase: { value: 0 }, uAmp: { value: 0.03 }, uTurn: { value: 0 }, uSnout: { value: 0 }, uSnoutZ: { value: 0 }, uFlap: { value: 0 } };
    // ヒゲのゆれ
    this.ub = { uBarbX: { value: 0 }, uBarbZ: { value: 0 }, uBarbY: { value: 0 }, uBarbLen: { value: 0.04 } };
    const bend = (m, offX = 0, barbel = false, fin = false) => {
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, this.u, { uOff: { value: offX } }, barbel ? this.ub : {});
        sh.vertexShader = 'uniform float uPhase; uniform float uAmp; uniform float uTurn; uniform float uOff; uniform float uSnout; uniform float uSnoutZ; uniform float uFlap;\n'
          + (barbel ? 'uniform float uBarbX; uniform float uBarbZ; uniform float uBarbY; uniform float uBarbLen;\n' : '')
          + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          ${barbel ? `{ // ヒゲ：付け根は動かず、先ほど大きくゆれる
            float bd = clamp((uBarbY - position.y) / uBarbLen, 0.0, 1.0); bd *= bd;
            transformed.x += uBarbX * bd * uBarbLen; transformed.z += uBarbZ * bd * uBarbLen; }` : ''}
          ${fin ? '// 胸ビレ・腹ビレ：ゆっくりあおぐ\n          transformed.y += max(abs(position.z) - 0.03, 0.0) * uFlap;' : ''}
          float sB = clamp(0.5 - position.x - uOff, 0.0, 1.0);
          // 頭から尾へ、長くゆったり伝わる波（頭はほとんど動かず、後ろほど大きく）
          float envB = 0.04 + 0.3 * sB + 1.15 * sB * sB;
          float waveB = sin(uPhase - sB * 5.0) + 0.15 * sin(2.0 * uPhase - sB * 10.0 + 0.8);
          transformed.z += uAmp * envB * waveB + uTurn * sB * sB;
          // 口先（鼻）はやわらかく、上に反ったり左右に振れたりする
          float hk = clamp((0.15 - sB) / 0.15, 0.0, 1.0); hk *= hk;
          transformed.y += uSnout * hk * 0.055;
          transformed.z += uSnoutZ * hk * 0.035;`);
      };
      m.customProgramCacheKey = () => 'fishbend' + (barbel ? 'B' : '') + (fin ? 'F' : '') + offX;
      return m;
    };
    this.mBody = bend(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, transparent: false, bumpMap: skinBump, bumpScale: 1.2, map: skinSpotsFor(DEFAULT_TRAITS) }));
    this.tr = DEFAULT_TRAITS;
    // 口は体の皮ふの一部：口の場所の皮ふがくぼんで丸く広がる（別の部品にしないので体からはがれない）
    this.um = { uMouth: { value: 0 }, uMC: { value: new THREE.Vector3() }, uPit: { value: 0 }, uSpread: { value: 0 }, uLip: { value: 0 } };
    const bodyBend = this.mBody.onBeforeCompile;
    this.mBody.onBeforeCompile = (sh) => {
      bodyBend(sh);
      Object.assign(sh.uniforms, this.um);
      sh.vertexShader = `uniform float uMouth; uniform vec3 uMC; uniform float uPit; uniform float uSpread; uniform float uLip;
        attribute vec3 aMouth; varying vec3 vMouth;\n` + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vMouth = aMouth;
          {
            vec2 dM = transformed.xz - uMC.xz; float lM = max(length(dM), 1e-5);
            transformed.xz += (dM / lM) * uMouth * (aMouth.y + aMouth.x * 0.7) * uSpread;
            transformed.y += uMouth * (aMouth.x * uPit - aMouth.y * uLip);
          }`);
      sh.fragmentShader = 'uniform float uMouth; varying vec3 vMouth;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        {
          float darkM = clamp(smoothstep(0.12, 0.55, vMouth.x) * uMouth * 1.3 + vMouth.z * (1.0 - uMouth) * 0.85, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.025, 0.022), darkM * 0.96);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.8, 0.7), vMouth.y * uMouth * 0.7);
        }`);
    };
    this.mFin = bend(new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0x111008, roughness: 0.6, transparent: true, opacity: 0.95, side: THREE.DoubleSide }), 0, false, true);
    this.mScute = bend(new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.45, metalness: 0.05 }));
    this.mScute2 = bend(new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 }));
    this.mEye = bend(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.3 }));
    this.mIris = bend(new THREE.MeshStandardMaterial({ color: '#a88a45', roughness: 0.3, metalness: 0.4 }));
    this.mYolk = bend(new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.35 }));
    this.mBarbel = bend(new THREE.MeshStandardMaterial({ color: '#efe9da', roughness: 0.5 }), 0, true);
    this.depth = bend(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
    this.meshes = [];
    this.key = '';
  }

  // 個性を変える（見る子を切りかえた時）
  setTraits(tr) {
    this.tr = { ...DEFAULT_TRAITS, ...(tr || {}) };
    this.mBody.map = skinSpotsFor(this.tr); this.mBody.needsUpdate = true;
    this.key = '';
  }

  // 見た目パラメータが変わった時だけ作り直す
  build(look) {
    const q = (v) => Math.round(v * 40) / 40;
    const key = Object.values(look).map(q).join(',') + '|' + this.tr.seed;
    if (key === this.key) return;
    this.key = key;
    for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); }
    this.meshes = [];
    const L = look;
    const TR = this.tr, grown = 1 - L.larva;
    const prof = (t) => {
      const a = sample(ADULT, t), j = sample(JUV, t), l = sample(LARVA, t);
      const r = [0, 1, 2].map(i => mix(mix(a[i], j[i], L.juv), l[i], L.larva));
      // 個性：口先の長さ（長い子は先が細くとがる）と体の太さ
      const sn = t < 0.13 ? 1 + (1 - TR.snout) * 1.6 * (1 - t / 0.13) * grown : 1;
      const pl = 1 + (TR.plump - 1) * sm(0.1, 0.25, t) * (1 - sm(0.6, 0.8, t)) * grown;
      return { w: Math.max(0, r[0] * sn * pl), h: Math.max(0, r[1] * sn * pl), yc: r[2] };
    };
    this.prof = prof;
    const add = (geo, mat, shadow = false) => {
      const m = new THREE.Mesh(geo, mat);
      if (shadow) { m.castShadow = true; m.customDepthMaterial = this.depth; }
      this.group.add(m); this.meshes.push(m);
    };

    // --- 胴体 ---
    const NS = 220, NR = 64;
    const pos = [], col = [], idx = [], uv = [], mo = [];
    // 口の位置（腹側、口先から16%のところ）と大きさ
    const TM = 0.16, pM = prof(TM), rT = 0.021, rZ = pM.w * 0.68, mouthOn = L.larva < 0.8 ? 1 : 0;
    const ridge = (a) => {
      // 骨板の列のところを少し盛り上げて五角形っぽくする
      const rows = [Math.PI / 2, 0.22, Math.PI - 0.22, -0.62, -Math.PI + 0.62];
      let r = 0; for (const c of rows) { let da = Math.abs(a - c); da = Math.min(da, Math.PI * 2 - da); r += Math.exp(-(da * da) / 0.02); }
      return r;
    };
    const ridgeK = 0.03 * (1 - L.larva) * Math.max(L.scuteD, L.scuteLV * 0.8);
    // 色
    // 実物の写真から：若魚は背中がオリーブがかった茶色・横が黄土色・腹がクリーム色。
    // 大きな成魚は灰色がかった明るい色に黒い点、口の下が黄色っぽい
    const pick = (ad, ju, la) => new THREE.Color(ad).lerp(new THREE.Color(ju), L.juv).lerp(new THREE.Color(la), 1 - L.pigment);
    // 個性の色み＋年をとるほど色が落ち着く（彩度が下がり、少し明るく灰色がかる）
    const calm = sm(60, 150, L.len || 0);
    const tint = (c, k = 1) => {
      const hsl = {}; c.getHSL(hsl);
      const sat = hsl.s * (1 + (TR.sat - 1) * k * grown) * (1 - 0.35 * calm);
      const lit = Math.min(0.95, hsl.l * (1 + (TR.light - 1) * k * grown) * (1 + 0.12 * calm));
      return c.setHSL(hsl.h + TR.hue * k * grown, Math.min(1, sat), lit);
    };
    const top = tint(pick('#7a7562', '#4a4128', '#9b9384'));
    const side = tint(pick('#a39d84', '#8a7c4c', '#b9b0a0'));
    const bot = tint(pick('#efe6c9', '#e4dcc2', '#ddd5c5'), 0.3);
    const chin = new THREE.Color('#e6c95e');
    const adult = (1 - L.juv) * (1 - L.larva);
    const c = new THREE.Color();
    for (let i = 0; i <= NS; i++) {
      const t = Math.pow(i / NS, 1.15);
      const p = prof(t);
      for (let j = 0; j <= NR; j++) {
        const a = (j / NR) * Math.PI * 2 - Math.PI; // -π..π
        const s = Math.sin(a), co = Math.cos(a);
        const rr = 1 + ridgeK * ridge(a);
        const y = s > 0 ? p.h * s : -p.h * mix(0.85, 0.7, 1 - L.larva) * Math.pow(Math.abs(s), mix(0.6, 1, L.larva));
        pos.push(0.5 - t, p.yc + y * rr, p.w * co * rr); uv.push(t, j / NR);
        { // 口のくぼみ(x)・くちびる(y)・閉じた時の切れ目(z)
          const under = sm(0.1, -0.7, s) * mouthOn;
          const dt = (t - TM) / rT, dz = (p.w * co) / rZ, r = Math.hypot(dt, dz);
          mo.push(Math.exp(-r * r * 1.6) * under, Math.exp(-((r - 1.05) ** 2) / 0.07) * under, Math.exp(-((dt * 3) ** 2)) * (1 - sm(0.7, 1.05, Math.abs(dz))) * under);
        }
        // 色：背中が暗く、腹が白い。細かいまだら
        const k = sm(-0.35, 0.5, s);
        const bs = s - TR.belly * grown; if (bs < -0.1) c.copy(bot).lerp(side, sm(-0.75, -0.1, bs)); else c.copy(side).lerp(top, sm(0.1, 0.92, bs));
        // あごの下の黄色み
        if (t < 0.26 && s < 0.1) c.lerp(chin, Math.min(1, 1.3 * (1 - t / 0.26)) * sm(0.1, -0.6, s) * (0.35 + 0.65 * adult) * (1 - L.larva));
        const n = hash(i * 0.7, j * 1.3);
        const spot = n > 0.86 ? -0.10 : n < 0.1 ? 0.05 : 0;
                const plate = t < 0.2 && s > 0.2 ? (hash(Math.floor(i / 3), Math.floor(j / 3)) - 0.5) * 0.25 * (1 - L.larva) : 0; // 頭の骨の板
        const mel = (1 - L.pigment) * (hash(i * 3.1, j * 0.9) > 0.92 && s > -0.3 ? -0.35 : 0); // 仔魚の黒い点
        const f = 1 + (spot + mel) * (0.4 + k) + plate;
        col.push(c.r * f, c.g * f, c.b * f);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
      const a = i * (NR + 1) + j, b = a + NR + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const body = new THREE.BufferGeometry();
    body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    body.setAttribute('aMouth', new THREE.Float32BufferAttribute(mo, 3));
    this.um.uMC.value.set(0.5 - TM, pM.yc - pM.h * 0.7, 0); this.um.uPit.value = pM.h * 0.9; this.um.uSpread.value = rZ * 0.6; this.um.uLip.value = pM.h * 0.18;
    body.setIndex(idx); body.computeVertexNormals();
    add(body, this.mBody, true);

    const surf = (t, a, out = 0) => {
      const p = prof(t), s = Math.sin(a), co = Math.cos(a);
      const y = s > 0 ? p.h * s : -p.h * 0.75 * Math.pow(Math.abs(s), 0.6);
      return new THREE.Vector3(0.5 - t, p.yc + y * (1 + out), p.w * co * (1 + out));
    };

    // --- ヒレ ---
    const fins = [];
    const finTop = (pts) => { // [t, 上への高さ]
      const sh = new THREE.Shape();
      const v = pts.map(([t, dy]) => { const p = prof(t); return new THREE.Vector2(0.5 - t, p.yc + p.h * 0.95 + dy); });
      chaikin(v).forEach((q, i) => i ? sh.lineTo(q.x, q.y) : sh.moveTo(q.x, q.y));
      return finColor(new THREE.ShapeGeometry(sh), (x, y) => { const p = prof(0.5 - x); return (y - (p.yc + p.h * 0.95)) / hMax(pts); });
    };
    const hMax = (pts) => Math.max(0.005, ...pts.map(q => q[1]));
    const fIn = tint(pick('#5a574a', '#2e2a1e', '#ddd6c8')), fEdge = tint(pick('#d9b75c', '#8f8456', '#e6dfd2').lerp(new THREE.Color('#9a968a'), (1 - TR.finYellow) * 0.6 * grown));
    const finColor = (g, edgeOf) => {
      const p = g.attributes.position, col = [], cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const e = Math.min(1, Math.max(0, edgeOf(p.getX(i), p.getY(i)))); cc.copy(fIn).lerp(fEdge, Math.pow(e, 1.6)); col.push(cc.r, cc.g, cc.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    };
    const finBot = (pts) => {
      const sh = new THREE.Shape();
      const v = pts.map(([t, dy]) => { const p = prof(t); return new THREE.Vector2(0.5 - t, p.yc - p.h * 0.7 - dy); });
      chaikin(v).forEach((q, i) => i ? sh.lineTo(q.x, q.y) : sh.moveTo(q.x, q.y));
      return finColor(new THREE.ShapeGeometry(sh), (x, y) => { const p = prof(0.5 - x); return ((p.yc - p.h * 0.7) - y) / hMax(pts); });
    };
    const A = 1 - L.larva;
    if (A > 0.02) {
      fins.push(finTop([[.64, -.01], [.665, .04 * A], [.69, .055 * A], [.76, .012 * A], [.79, -.01]])); // 背ビレ
      fins.push(finBot([[.68, -.01], [.71, .045 * A], [.75, .04 * A], [.79, -.01]])); // 尻ビレ
      fins.push(finBot([[.80, -.005], [.86, .07 * A], [.90, .065 * A], [.97, .0], [1, -.045]])); // 尾ビレ下葉
      fins.push(finTop([[.84, -.005], [.92, .018 * A], [1, -.005]])); // 尾の上の膜
      // 腹ビレ（左右）
      for (const sgn of [-1, 1]) {
        const g = finBot([[.56, -.005], [.585, .04 * A], [.62, .028 * A], [.63, -.005]]);
        const p = prof(.59); g.translate(0, -(p.yc - p.h * 0.7), 0); g.rotateX(-sgn * 0.7); g.translate(0, p.yc - p.h * 0.6, sgn * p.w * 0.55);
        fins.push(g);
      }
    }
    if (L.larva > 0.02) { // 仔魚のヒレの膜（背中から尾まで一続き）
      const H = L.larva;
      const pts = []; for (let t = 0.32; t <= 1.001; t += 0.04) pts.push([t, (t < 0.4 ? (t - 0.32) / 0.08 : 1) * 0.035 * H * (t > 0.9 ? (1 - t) * 10 * 0.6 + 0.4 : 1)]);
      pts.push([1, 0]);
      const ptsB = []; for (let t = 0.48; t <= 1.001; t += 0.04) ptsB.push([t, (t < 0.56 ? (t - 0.48) / 0.08 : 1) * 0.03 * H]);
      ptsB.push([1, 0]);
      fins.push(finTop([[0.32, -0.005], ...pts]));
      fins.push(finBot([[0.48, -0.005], ...ptsB]));
    }
    // 胸ビレ（横に張り出す）
    for (const sgn of [-1, 1]) {
      const sz = mix(1, 0.35, L.larva);
      const sh = new THREE.Shape();
      chaikin([[0, 0], [-0.02, 0.06], [-0.045, 0.09], [-0.066, 0.08], [-0.06, 0.03], [-0.05, 0]].map(([x, y]) => new THREE.Vector2(x * sz, y * sz)), true).forEach((q, i) => i ? sh.lineTo(q.x, q.y) : sh.moveTo(q.x, q.y));
      const g = finColor(new THREE.ShapeGeometry(sh), (x, y) => Math.hypot(x, y) / (0.095 * sz));
      // shape の (x, y) → (x, 0, z) 平面に
      g.rotateX(sgn * Math.PI / 2);
      g.rotateX(sgn * 0.35); // 少し下向き
      const p = prof(0.22);
      g.translate(0.5 - 0.22, p.yc - p.h * 0.55, sgn * p.w * 0.85);
      fins.push(g);
    }
    this.mFin.opacity = mix(0.95, 0.4, L.larva);
    add(mergeGeometries(fins.map(g => g.index ? g.toNonIndexed() : g)), this.mFin);

    // --- 骨板（5列） ---
    const scutes = [], scutesLV = [];
    const cone = (t, a, size, sharp, list = scutes) => {
      const g = new THREE.ConeGeometry(size, size * sharp, 4);
      g.rotateY(Math.PI / 4); g.scale(1.7, 1, 1); g.translate(0, size * sharp * 0.35, 0);
      const p = surf(t, a, -0.04);
      const s = Math.sin(a), co = Math.cos(a);
      const n = new THREE.Vector3(0, s > 0 ? s : s * 0.8, co).normalize();
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n));
      g.translate(p.x, p.y, p.z);
      list.push(g.toNonIndexed());
    };
    const sharp = mix(0.55, 1.5, L.juv);
    if (L.scuteD > 0.02 && L.larva < 0.9) {
      for (let i = 0; i < 12; i++) { const t = mix(0.17, 0.64, i / 11); cone(t, Math.PI / 2, prof(t).w * 0.2 * L.scuteD * TR.scute, sharp); }
    }
    if (L.scuteLV > 0.02 && L.larva < 0.9) {
      for (const a of [0.22, Math.PI - 0.22]) for (let i = 0; i < 38; i++) { const t = mix(0.2, 0.82, i / 37); cone(t, a, prof(t).w * 0.058 * L.scuteLV, sharp * 0.45, scutesLV); }
      for (const a of [-0.62, -Math.PI + 0.62]) for (let i = 0; i < 9; i++) { const t = mix(0.27, 0.56, i / 8); cone(t, a, prof(t).w * 0.07 * L.scuteLV, sharp * 0.4, scutesLV); }
    }
    if (scutes.length) {
      this.mScute.color.set('#6e6a58').lerp(new THREE.Color('#e0d6b4'), Math.min(1, L.juv * (0.5 + TR.scuteLight) + (1 - L.juv) * TR.scuteLight * 0.35));
      add(mergeGeometries(scutes), this.mScute, true);
    }
    if (scutesLV.length) {
      this.mScute2.color.set('#b3ab92').lerp(new THREE.Color('#cfc49e'), L.juv);
      add(mergeGeometries(scutesLV), this.mScute2);
    }

    // --- 目・口 ---
    const eyes = [];
    const er = mix(0.0085 * TR.eye, 0.02, L.larva);
    const iris = [];
    for (const sgn of [-1, 1]) {
      const p = prof(0.115);
      const g = new THREE.SphereGeometry(er * 0.6, 12, 8); g.scale(1, 1, 0.45);
      g.translate(0.5 - 0.115, p.yc + p.h * 0.35, sgn * (p.w * 0.86 + er * 0.24));
      eyes.push(g);
      const r = new THREE.SphereGeometry(er, 14, 10); r.scale(1, 0.9, 0.32);
      r.translate(0.5 - 0.115, p.yc + p.h * 0.35, sgn * p.w * 0.86);
      iris.push(r);
    }
    add(mergeGeometries(eyes), this.mEye);
    this.mIris.color.set('#a88a45').lerp(new THREE.Color('#b9bcbf'), TR.iris ?? 0.2); // 目のふち：金色〜銀色
    if (L.larva < 0.7) add(mergeGeometries(iris), this.mIris);
    // --- ヒゲ（4本） ---
    if (L.barbel > 0.02) {
      const bars = [];
      const tb = mix(0.085, 0.07, L.larva);
      const p = prof(tb);
      const len = 0.042 * L.barbel * mix(TR.barbel, 0.6, L.larva);
      for (const z of [-0.6, -0.2, 0.2, 0.6]) {
        const zz = z * p.w * 0.9;
        const start = new THREE.Vector3(0.5 - tb, p.yc - p.h * 0.55, zz);
        const curve = new THREE.CatmullRomCurve3([
          start, start.clone().add(new THREE.Vector3(-len * 0.15, -len * 0.55, z * len * 0.15)),
          start.clone().add(new THREE.Vector3(-len * 0.45, -len * 0.95, z * len * 0.25)),
        ]);
        const tg = new THREE.TubeGeometry(curve, 8, 0.0019 * mix(1, 0.7, L.larva), 6, false);
        // 先に向かって細く
        const tp = tg.attributes.position, cp = new THREE.Vector3();
        for (let i = 0; i < tp.count; i++) { const u = Math.floor(i / 7) / 8; curve.getPoint(u, cp); const k = 1 - 0.65 * u; tp.setXYZ(i, cp.x + (tp.getX(i) - cp.x) * k, cp.y + (tp.getY(i) - cp.y) * k, cp.z + (tp.getZ(i) - cp.z) * k); }
        bars.push(tg.toNonIndexed());
      }
      add(mergeGeometries(bars), this.mBarbel);
      this.ub.uBarbY.value = p.yc - p.h * 0.55; this.ub.uBarbLen.value = len;
    }

    // --- 卵黄のう ---
    if (L.yolk > 0.02) {
      const g = new THREE.SphereGeometry(1, 24, 16);
      const y = L.yolk;
      g.scale(0.17 * (0.5 + 0.5 * y), 0.065 * y + 0.01, 0.06 * y + 0.01);
      const p = prof(0.3);
      g.translate(0.5 - 0.3, p.yc - p.h * 0.45 - 0.025 * y, 0);
      add(g, this.mYolk);
    }
  }

  // 口の開け閉め（0=閉じて細い切れ目 1=丸く大きく開く）
  setMouth(o) { this.mouthOpen = o; this.um.uMouth.value = o; }

  // 表情：鼻の反り(上+/下-)・鼻の左右・ヒゲの前後(後ろ-)・ヒゲの左右
  setExpr(snout, snoutZ, barbX, barbZ) {
    this.u.uSnout.value = snout; this.u.uSnoutZ.value = snoutZ;
    this.ub.uBarbX.value = barbX; this.ub.uBarbZ.value = barbZ;
  }

  setSwim(phase, amp, turn, flap = 0) {
    this.u.uPhase.value = phase; this.u.uAmp.value = amp; this.u.uTurn.value = turn; this.u.uFlap.value = flap;
  }
}
