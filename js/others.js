// 同じ水槽で泳ぐほかの魚（メダカ・オイカワの群れ、ニジマス）
import * as THREE from 'three';
import { mulberry } from './world.js';

const SPECIES = {
  medaka: { name: 'メダカ', len: 3.2, top: '#8a7a52', side: '#c9c0a2', bot: '#efe9d8', fin: '#d8cfb4', h: 0.2, w: 0.11, spots: 0 },
  oikawa: { name: 'オイカワ', len: 11, top: '#3f5258', side: '#c3ccd2', bot: '#f2f4f2', fin: '#b9c3c4', h: 0.24, w: 0.1, spots: 0, band: '#9fb6d6' },
  trout: { name: 'ニジマス', len: 36, top: '#4b5a3c', side: '#aeb3a0', bot: '#efece2', fin: '#7f8466', h: 0.23, w: 0.12, spots: 1, band: '#d68b86' },
};

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// 黒い点の模様（ニジマス用）
const spotTex = (() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 256);
  const r = mulberry(5);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(20,20,15,${0.5 + r() * 0.4})`; g.beginPath(); g.arc(r() * 512, r() * 256, 1 + r() * 2.5, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
})();

// 魚の体（全長1、頭が +x）
function bodyGeo(sp) {
  const NS = 60, NR = 24, pos = [], col = [], uv = [], idx = [];
  const top = new THREE.Color(sp.top), side = new THREE.Color(sp.side), bot = new THREE.Color(sp.bot), band = sp.band ? new THREE.Color(sp.band) : null, c = new THREE.Color();
  for (let i = 0; i <= NS; i++) {
    const t = i / NS;
    // 頭は丸く、0.3で一番太く、尾の付け根で細い
    // 口先がとがり、背中の前あたりが一番高く、尾の付け根はきゅっと細い
    const prof = Math.sqrt(t) * Math.pow(1 - t * 0.97, 1.15) / 0.39;
    const H = sp.h * prof, W = sp.w * prof * (0.85 + 0.15 * (1 - t));
    for (let j = 0; j <= NR; j++) {
      const a = (j / NR) * Math.PI * 2 - Math.PI, s = Math.sin(a);
      pos.push(0.5 - t * 0.86, s * H * 0.5, Math.cos(a) * W * 0.5);
      uv.push(t, j / NR);
      if (s < 0) c.copy(bot).lerp(side, sm(-0.8, 0, s)); else c.copy(side).lerp(top, sm(0.1, 0.8, s));
      if (band) c.lerp(band, Math.exp(-((s - 0.0) ** 2) / 0.03) * 0.55 * sm(0.15, 0.3, t) * (1 - sm(0.75, 0.88, t)));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function finGeo(sp) {
  const shapes = [];
  const mk = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return new THREE.ShapeGeometry(s); };
  // 尾びれ（二又）
  shapes.push(mk([[-0.33, sp.h * 0.05], [-0.42, sp.h * 0.45], [-0.47, sp.h * 0.5], [-0.42, 0], [-0.47, -sp.h * 0.5], [-0.42, -sp.h * 0.45], [-0.33, -sp.h * 0.05]]));
  // 背びれ
  shapes.push(mk([[0.06, sp.h * 0.45], [0.0, sp.h * 0.8], [-0.1, sp.h * 0.36]]));
  // 尻びれ
  shapes.push(mk([[-0.1, -sp.h * 0.36], [-0.15, -sp.h * 0.6], [-0.24, -sp.h * 0.2]]));
  return shapes;
}

class OtherFish {
  constructor(sp, size, school) {
    this.sp = sp; this.size = size; this.school = school;
    this.u = { uPhase: { value: Math.random() * 6 }, uAmp: { value: 0.05 } };
    const bend = (m) => {
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, this.u);
        sh.vertexShader = 'uniform float uPhase; uniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float sB = clamp(0.5 - position.x, 0.0, 1.0);
          transformed.z += uAmp * (0.15 + sB * sB * 1.6) * sin(uPhase - sB * 7.0);`);
      };
      m.customProgramCacheKey = () => 'other';
      return m;
    };
    this.group = new THREE.Group();
    const bodyM = bend(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.35, map: sp.spots ? spotTex : null }));
    const finM = bend(new THREE.MeshStandardMaterial({ color: sp.fin, roughness: 0.6, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    const eyeM = bend(new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.1, metalness: 0.4 }));
    const body = new THREE.Mesh(OtherFish.geo(sp).body, bodyM); body.castShadow = size > 8;
    this.group.add(body);
    for (const f of OtherFish.geo(sp).fins) this.group.add(new THREE.Mesh(f, finM));
    for (const z of [-1, 1]) {
      const e = new THREE.Mesh(OtherFish.eyeGeo, eyeM);
      e.position.set(0.41, sp.h * 0.1, z * sp.w * 0.27);
      e.scale.set(sp.h * 0.055, sp.h * 0.055, sp.h * 0.03);
      this.group.add(e);
    }
    this.group.scale.setScalar(size);
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(1, 0, 0); this.phase = Math.random() * 6;
    this.wander = new THREE.Vector3(); this.wanderT = 0;
  }
  static geo(sp) {
    sp._geo ||= { body: bodyGeo(sp), fins: finGeo(sp) };
    return sp._geo;
  }
}
OtherFish.eyeGeo = new THREE.SphereGeometry(1, 10, 8);

export class Companions {
  constructor(scene) { this.scene = scene; this.fish = []; }
  build(T) {
    for (const f of this.fish) this.scene.remove(f.group);
    this.fish = [];
    this.T = T;
    if (T.w < 40) return; // ふ化盆には入れない
    const rnd = mulberry(T.w + 1);
    const small = T.w < 120 ? SPECIES.medaka : SPECIES.oikawa;
    const nSchool = T.w < 120 ? 14 : 18;
    const cx = (rnd() - 0.5) * T.w * 0.5, cz = (rnd() - 0.5) * T.d * 0.5;
    for (let i = 0; i < nSchool; i++) {
      const f = new OtherFish(small, small.len * (0.8 + rnd() * 0.4), true);
      f.pos.set(cx + (rnd() - 0.5) * small.len * 4, T.h * (0.45 + rnd() * 0.2), cz + (rnd() - 0.5) * small.len * 4);
      f.vel.set(rnd() - 0.5, 0, rnd() - 0.5).normalize().multiplyScalar(small.len);
      this.add(f);
    }
    if (T.w >= 170) {
      const n = T.w >= 700 ? 4 : T.w >= 300 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const sp = SPECIES.trout;
        const f = new OtherFish(sp, sp.len * (0.8 + rnd() * 0.35), false);
        f.pos.set((rnd() - 0.5) * T.w * 0.6, T.h * (0.35 + rnd() * 0.35), (rnd() - 0.5) * T.d * 0.6);
        f.vel.set(rnd() - 0.5, 0, rnd() - 0.5).normalize().multiplyScalar(sp.len * 0.5);
        this.add(f);
      }
    }
  }
  add(f) { f.group.userData.other = true; this.fish.push(f); this.scene.add(f.group); }
  // avoid: チョウザメの位置と大きさ（近づくとよける）
  update(dt, time, avoid, avoidR) {
    const T = this.T; if (!T) return;
    const acc = new THREE.Vector3(), tmp = new THREE.Vector3();
    for (const f of this.fish) {
      const L = f.size;
      acc.set(0, 0, 0);
      if (f.school) {
        // 群れ：近くの仲間に寄る・向きをそろえる・ぶつからない
        const center = new THREE.Vector3(), align = new THREE.Vector3(); let n = 0;
        for (const o of this.fish) {
          if (o === f || !o.school) continue;
          const d = o.pos.distanceTo(f.pos);
          if (d < L * 6) { center.add(o.pos); align.add(o.vel); n++; }
          if (d < L * 1.2) acc.add(tmp.copy(f.pos).sub(o.pos).multiplyScalar(3 / Math.max(d, 0.1)));
        }
        if (n) { center.divideScalar(n); acc.add(center.sub(f.pos).multiplyScalar(0.4)); acc.add(align.divideScalar(n).sub(f.vel).multiplyScalar(0.6)); }
      }
      // ゆっくり行き先を変える
      f.wanderT -= dt;
      if (f.wanderT <= 0) { f.wanderT = 3 + Math.random() * 5; f.wander.set((Math.random() - 0.5) * T.w * 0.7, T.h * (0.3 + Math.random() * 0.5), (Math.random() - 0.5) * T.d * 0.7); }
      acc.add(tmp.copy(f.wander).sub(f.pos).normalize().multiplyScalar(L * (f.school ? 0.6 : 0.5)));
      // 壁・底・水面をよける
      const m = L * 2;
      if (f.pos.x < -T.w / 2 + m) acc.x += L * 4; if (f.pos.x > T.w / 2 - m) acc.x -= L * 4;
      if (f.pos.z < -T.d / 2 + m) acc.z += L * 4; if (f.pos.z > T.d / 2 - m) acc.z -= L * 4;
      if (f.pos.y < L) acc.y += L * 4; if (f.pos.y > T.h - L) acc.y -= L * 4;
      // チョウザメをよける
      if (avoid) { const d = f.pos.distanceTo(avoid); if (d < avoidR + L * 2) acc.add(tmp.copy(f.pos).sub(avoid).normalize().multiplyScalar(L * 8)); }
      acc.y -= f.vel.y * 0.8; // 上下はおだやかに
      f.vel.addScaledVector(acc, dt);
      // 速さ：ときどきスッと速くなる
      const cruise = L * (f.school ? 1.6 : 0.8) * (1 + 0.5 * Math.max(0, Math.sin(time * 0.7 + f.phase)) ** 4);
      const sp = f.vel.length(); if (sp > 1e-4) f.vel.multiplyScalar(THREE.MathUtils.lerp(sp, cruise, Math.min(1, dt * 1.5)) / sp);
      f.pos.addScaledVector(f.vel, dt);
      // 向きと泳ぎ
      const yaw = Math.atan2(-f.vel.z, f.vel.x), pitch = Math.atan2(f.vel.y, Math.hypot(f.vel.x, f.vel.z));
      let dy = yaw - (f.yaw ?? yaw); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      f.yaw = (f.yaw ?? yaw) + dy * Math.min(1, dt * 6);
      f.group.position.copy(f.pos);
      f.group.rotation.set(0, f.yaw, THREE.MathUtils.clamp(pitch, -0.5, 0.5));
      const rel = f.vel.length() / L;
      f.u.uPhase.value += dt * (6 + rel * 6);
      f.u.uAmp.value = 0.04 + Math.min(0.04, rel * 0.02);
    }
  }
}
