// 餌をあげる手（cm）。手首が原点、指先は下（-y）。手のひらは +z 向き
// 指は3つの節（付け根・中・先）。関節は少しふくらみ、指先は丸く、爪は手の甲側に薄く付く
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

const HAND_SCALE = 0.8; // 魚と並べた時に大きすぎないよう、少し小さめの手にする
const skin = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0, emissive: '#3a1408', emissiveIntensity: 0.18 });
const nailM = new THREE.MeshStandardMaterial({ color: '#f2d9d0', roughness: 0.18, metalness: 0.05 });
const sleeveM = new THREE.MeshStandardMaterial({ color: '#2b3442', roughness: 0.85 });

// 魚の体の中に入った手の部分は描かない（口の中に入っているように見せる）
// 魚の体を細長い楕円の筒として近似し、その中なら消す
export const handClip = { uFishInv: { value: new THREE.Matrix4() }, uClipOn: { value: 0 }, uSnoutC: { value: 0 }, uMouthX: { value: 0.32 }, uMouthR: { value: 0.05 } };
for (const m of [skin, nailM, sleeveM]) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, handClip);
    sh.vertexShader = 'varying vec3 vWorldH;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWorldH = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform mat4 uFishInv; uniform float uClipOn; uniform float uSnoutC; uniform float uMouthX; uniform float uMouthR; varying vec3 vWorldH;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      if (uClipOn > 0.5) {
        vec3 q = (uFishInv * vec4(vWorldH, 1.0)).xyz;
        // 口のまわり：口の中に入った指先は見せない
        vec3 dm = q - vec3(uMouthX, -0.03, 0.0);
        if (dot(dm, dm) < uMouthR * uMouthR) discard;
        // 反った鼻：鼻先ほど上にずれているので、そのぶん戻して比べる
        float sBh = clamp(0.5 - q.x, 0.0, 1.0);
        float hk = clamp((0.15 - sBh) / 0.15, 0.0, 1.0); hk *= hk;
        q.y -= uSnoutC * hk * 0.055;
        float f = clamp(1.0 - pow((q.x - 0.1) / 0.42, 2.0), 0.0, 1.0);
        float ry = 0.078 * sqrt(f) + 0.008, rz = 0.085 * sqrt(f) + 0.008;
        if (q.x > -0.35 && q.x < 0.5 && (q.y * q.y) / (ry * ry) + (q.z * q.z) / (rz * rz) < 1.0) discard;
      }`);
  };
  m.customProgramCacheKey = () => 'handclip';
}

const BASE = new THREE.Color('#e1a483'), PINK = new THREE.Color('#e48f7f'), PALE = new THREE.Color('#ebbca0');
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// 色を付けたジオメトリ
function tint(g, color) {
  const n = g.attributes.position.count, c = [];
  for (let i = 0; i < n; i++) c.push(color.r, color.g, color.b);
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  return g.index ? g.toNonIndexed() : g;
}
// 2点のあいだの丸い棒（太さは a→b で r0→r1）
function bone(a, b, r0, r1, color) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, 14, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return tint(g, color);
}
function ball(p, r, color, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.SphereGeometry(r, 16, 12); g.scale(sx, sy, sz); g.translate(p.x, p.y, p.z);
  return tint(g, color);
}
// 角の丸い箱（手のひら用）。手首側を少し細く、指の付け根側を少し厚く
function palmGeo(w, h, d, r) {
  const g = new THREE.BoxGeometry(w, h, d, 12, 14, 5);
  const p = g.attributes.position, v = V(0, 0, 0), c = V(0, 0, 0);
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c).normalize().multiplyScalar(r).add(c);
    const k = 0.5 - v.y / h; // 0=指側 1=手首側
    p.setXYZ(i, v.x * (0.86 + 0.14 * (1 - k)), v.y, v.z * (1 - 0.18 * Math.abs(v.x) / w) * (0.9 + 0.15 * (1 - k)));
  }
  g.computeVertexNormals();
  return tint(g, BASE);
}

export function makeHand() {
  const g = new THREE.Group();
  const parts = [], nails = [];
  parts.push(palmGeo(8.2, 9.4, 2.6, 1.15).translate(0, -5.0, 0));
  parts.push(ball(V(2.6, -4.4, 0.45), 1, BASE.clone().lerp(PALE, 0.4), 1.7, 2.8, 1.05)); // 親指の付け根のふくらみ
  parts.push(ball(V(-2.5, -5.6, 0.4), 1, BASE.clone().lerp(PALE, 0.3), 1.3, 2.5, 0.85)); // 小指側のふくらみ

  // 指：関節の点を通るなめらかな1本の形。先へ行くほど細く、関節が少しふくらむ
  const finger = (pts, r) => {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const SEG = 28, RAD = 14;
    const tube = new THREE.TubeGeometry(curve, SEG, 1, RAD, false);
    const p = tube.attributes.position, cp = V(0, 0, 0), col = [];
    const joints = pts.map((_, i) => i / (pts.length - 1)).slice(1, -1);
    for (let i = 0; i < p.count; i++) {
      const u = Math.floor(i / (RAD + 1)) / SEG;
      curve.getPoint(u, cp);
      let k = r * (1 - 0.24 * u);
      for (const j of joints) k += r * 0.07 * Math.exp(-(((u - j) / 0.05) ** 2)); // 関節
      const vx = p.getX(i) - cp.x, vy = p.getY(i) - cp.y, vz = p.getZ(i) - cp.z;
      p.setXYZ(i, cp.x + vx * k, cp.y + vy * k, cp.z + vz * k);
      let c = BASE.clone();
      for (const j of joints) c.lerp(PINK, 0.25 * Math.exp(-(((u - j) / 0.05) ** 2)));
      c.lerp(PINK, 0.4 * Math.max(0, (u - 0.85) / 0.15));
      col.push(c.r, c.g, c.b);
    }
    tube.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    tube.computeVertexNormals();
    parts.push(tube.toNonIndexed());
    const n = pts.length - 1, tip = pts[n], dir = curve.getTangent(1);
    const rt = r * 0.76;
    parts.push(ball(tip, rt, BASE.clone().lerp(PINK, 0.4))); // 丸い指先
    parts.push(ball(pts[0], r * 1.02, BASE));                 // 付け根を手のひらになじませる
    // 爪：指先の甲側に、薄く少し丸めた板
    const nail = new THREE.SphereGeometry(rt * 0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    nail.scale(0.85, 0.16, 1.35);
    nail.rotateX(-Math.PI / 2);
    nail.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir.clone().negate()));
    const mid = tip.clone().addScaledVector(dir, -rt * 0.9);
    nail.translate(mid.x, mid.y, mid.z - rt * 0.62);
    nails.push(nail);
  };
  // 人差し指と中指：のばして、先で餌をはさむ（少しだけ曲げる）
  finger([V(2.45, -9.5, 0), V(2.2, -12.7, 0.25), V(1.95, -14.9, 0.45), V(1.75, -16.6, 0.5)], 0.82);
  finger([V(0.8, -9.9, 0), V(0.9, -13.4, 0.25), V(1.0, -15.7, 0.45), V(1.1, -17.4, 0.5)], 0.85);
  // 薬指・小指：手のひら側へ軽くにぎる
  finger([V(-0.9, -9.7, 0.1), V(-0.95, -12.4, 1.0), V(-0.9, -13.3, 2.7), V(-0.8, -12.4, 3.8)], 0.8);
  finger([V(-2.55, -9.1, 0.1), V(-2.6, -11.2, 0.9), V(-2.45, -11.9, 2.3), V(-2.3, -11.2, 3.2)], 0.7);
  // 親指：手のひらの前に軽く添える
  finger([V(3.7, -3.6, 0.9), V(4.7, -6.2, 1.9), V(4.6, -8.1, 2.5)], 1.0);
  // 手首と腕（少しずつ太く）
  parts.push(bone(V(0, -1.2, 0), V(0, 10, 0), 2.75, 2.95, BASE));
  parts.push(bone(V(0, 10, 0), V(0, 24, 0), 2.95, 3.4, BASE));
  parts.push(ball(V(0, -1.2, 0), 2.75, BASE, 1.2, 0.8, 0.9));

  const arm = new THREE.Mesh(mergeGeometries(parts), skin);
  const nailMesh = new THREE.Mesh(mergeGeometries(nails.map(n => n.index ? n.toNonIndexed() : n)), nailM);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.2, 40, 24, 1, true), sleeveM);
  sleeve.position.y = 24 + 18;
  arm.castShadow = nailMesh.castShadow = sleeve.castShadow = true;
  const inner = new THREE.Group(); inner.add(arm, nailMesh, sleeve);
  inner.scale.setScalar(HAND_SCALE);
  g.add(inner);
  // 餌をはさむ場所（人差し指と中指の先のあいだ）。手の大きさに合わせる
  g.userData.tip = V(1.4, -17.3, 0.4).multiplyScalar(HAND_SCALE);
  g.userData.scale = HAND_SCALE;
  return g;
}
