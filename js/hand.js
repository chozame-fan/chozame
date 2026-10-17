// 餌をあげる手（実寸 cm）。手首が原点、指先は下（-y）。手のひらは +z 向き
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

const skin = new THREE.MeshStandardMaterial({ color: '#e2a585', roughness: 0.5, metalness: 0, emissive: '#3a1408', emissiveIntensity: 0.25 });
const nailM = new THREE.MeshStandardMaterial({ color: '#f1d3c6', roughness: 0.3 });
const sleeveM = new THREE.MeshStandardMaterial({ color: '#2b3442', roughness: 0.85 });

// 2つの点のあいだに丸い棒（指の1節）を置く
function seg(a, b, r) {
  const len = a.distanceTo(b);
  const g = new THREE.CapsuleGeometry(r, len, 6, 12);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyQuaternion(q); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// 角の丸い箱（手のひら用）。手首側を少し細く
function roundedBox(w, h, d, r) {
  const g = new THREE.BoxGeometry(w, h, d, 10, 12, 4);
  const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c).normalize().multiplyScalar(r).add(c);
    const taper = 0.84 + 0.16 * (0.5 - v.y / h); // 上（手首側）が細い
    p.setXYZ(i, v.x * taper, v.y, v.z * (1 - 0.15 * Math.abs(v.x) / w));
  }
  g.computeVertexNormals();
  return g;
}

export function makeHand() {
  const g = new THREE.Group();
  const parts = [], nails = [];
  // 手のひら
  const palm = roundedBox(8.4, 9.6, 2.7, 1.2); palm.translate(0, -5.0, 0);
  parts.push(palm);
  // 親指の付け根のふくらみ
  const mound = new THREE.SphereGeometry(1, 16, 12); mound.scale(1.9, 3.0, 1.4); mound.translate(2.7, -4.6, 0.9);
  parts.push(mound);
  // 指：付け根→第2関節→指先。人差し指と中指はまっすぐ下に伸ばし、先で餌をはさむ
  const finger = (pts, r) => {
    for (let i = 0; i < pts.length - 1; i++) parts.push(seg(pts[i], pts[i + 1], r * (1 - i * 0.08)));
    const tip = pts[pts.length - 1], prev = pts[pts.length - 2];
    const n = new THREE.SphereGeometry(r * 0.8, 10, 8); n.scale(0.9, 1.3, 0.35);
    const dir = tip.clone().sub(prev).normalize();
    n.translate(tip.x - dir.x * r * 0.9, tip.y - dir.y * r * 0.9, tip.z - r * 0.75); // 爪は手の甲側
    nails.push(n);
  };
  finger([V(2.5, -9.6, 0), V(2.1, -13.6, 0.1), V(1.75, -17.1, 0.2)], 0.85);   // 人差し指
  finger([V(0.8, -10.1, 0), V(0.95, -14.3, 0.1), V(1.05, -17.9, 0.2)], 0.88); // 中指
  finger([V(-0.95, -9.8, 0.1), V(-1.0, -12.6, 1.4), V(-0.9, -12.0, 3.0)], 0.82);  // 薬指（曲げる）
  finger([V(-2.6, -9.2, 0.1), V(-2.6, -11.4, 1.3), V(-2.4, -10.9, 2.6)], 0.72);   // 小指（曲げる）
  finger([V(3.9, -3.5, 0.6), V(5.1, -6.4, 1.6), V(4.6, -8.8, 2.3)], 1.0);      // 親指
  // 手首と腕
  parts.push(seg(V(0, -1, 0), V(0, 24, 0), 2.9));
  const arm = new THREE.Mesh(mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p)), skin);
  const nailMesh = new THREE.Mesh(mergeGeometries(nails), nailM);
  // そで
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.1, 40, 24, 1, true), sleeveM);
  sleeve.position.y = 24 + 18;
  arm.castShadow = nailMesh.castShadow = sleeve.castShadow = true;
  g.add(arm, nailMesh, sleeve);
  // 餌をはさむ場所（人差し指と中指の先のあいだ）
  g.userData.tip = V(1.4, -17.3, 0.3);
  return g;
}
