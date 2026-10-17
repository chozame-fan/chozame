import * as THREE from 'three';
import { Fish, lookFor, makeTraits } from './fish.js';
import { Tank, makeEgg, makeFood, makeEmbryo } from './world.js';
import { Companions } from './others.js';
import { makeHand, handClip } from './hand.js';
import { WaterAudio } from './audio.js';
import {
  HATCH_DAYS, expectedLength, weightOf, fmtWeight, fmtLength, fmtAge, tankFor,
  FOODS, foodById, canEat, bestFood, ZUKAN, SOURCES, TANKS,
} from './data.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// ?test を付けると別のセーブ（確認用）を使う
const SAVE_KEY = new URLSearchParams(location.search).has('test') ? 'chozame-ikusei-test' : 'chozame-ikusei-v1';
// 1秒あたりに進むゲーム内の日数
const SPEEDS = [
  { d: 0, label: '一時停止' }, { d: 1 / 60, label: '1日＝1分' }, { d: 1 / 10, label: '1日＝10秒' },
  { d: 1 / 2, label: '1日＝2秒' }, { d: 2.5, label: '1日＝0.4秒' },
];

// ---------------- セーブ ----------------
// 個性（生まれつき）をまだ持っていない子に付ける
function ensureTraits(st) {
  if (!st.traits || st.traits.spotDark === undefined) { let h = st.created | 0; for (const ch of st.name) h = (h * 31 + ch.charCodeAt(0)) | 0; st.traits = makeTraits(Math.abs(h) + 1); }
  return st.traits;
}
function newState(name) {
  return {
    v: 1, name, sex: Math.random() < 0.5 ? 'オス' : 'メス', sexKnown: false,
    age: -HATCH_DAYS, dev: -HATCH_DAYS, satiety: 70, water: 100, health: 100, temp: 17, qual: 1,
    zukan: {}, foods: {}, speed: 2, autofeed: false, tank: 'incubator', created: Date.now(),
  };
}
// セーブ：最大3匹。R.list に1匹ずつの状態、S は今見ている子
const MAX_FISH = 3;
let R = null, S = null;
try { R = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { R = null; }
if (R && !R.list) R = { v: 2, active: 0, speed: R.speed ?? 2, list: [R] }; // 1匹だけの古いセーブを読みかえる
if (R) { R.active = Math.min(R.active || 0, R.list.length - 1); S = R.list[R.active]; }
let resetting = false;
function save() { try { if (R && !resetting) localStorage.setItem(SAVE_KEY, JSON.stringify(R)); } catch (e) { console.warn(e); } }
setInterval(save, 5000);
addEventListener('beforeunload', save);

// ---------------- 3D ----------------
const renderer = new THREE.WebGLRenderer({ canvas: $('#c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.75 : 2)); // スマホは少し軽く
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const waterCol = new THREE.Color(0x1d5f72);
scene.background = waterCol; scene.fog = new THREE.FogExp2(waterCol, 0.01);
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
scene.add(new THREE.HemisphereLight(0xd8f2ff, 0xb3ab96, 1.6));
const bounce = new THREE.DirectionalLight(0xfff2dc, 0.7); bounce.position.set(0.2, -1, 0.3); scene.add(bounce); // 砂からの照り返し
const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

const tank = new Tank(scene);
const others = new Companions(scene);
const audio = new WaterAudio();
const fish = new Fish(); scene.add(fish.group);
const egg = makeEgg(); scene.add(egg);
let embryo = null, embryoK = -1;

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------------- 魚の動き ----------------
const F = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, speed: 0, phase: 0, target: new THREE.Vector3(), wanderT: 0, turn: 0, eatT: 0 };
const foods = [];
const len = () => expectedLength(Math.max(0, S.dev));
let T = null;

function applyTank(announce) {
  const want = tankFor(len());
  if (T && T.id === want.id) return;
  const first = !T, bigger = T && TANKS.indexOf(want) > TANKS.indexOf(T);
  T = want; S.tank = T.id;
  tank.build(T);
  others.build(T);
  for (const f of foods.splice(0)) scene.remove(f.mesh);
  if (first || !announce) { F.pos.set(0, Math.min(T.h * 0.3, 3), 0); }
  else { F.pos.set(0, T.h * 0.3, 0); toast(`🏠 ${T.name}にお引っ越し！`); if (bigger) offerNewFish(S, T); }
  egg.position.set(0, 0.16, 0);
  F.wanderT = 0;
}

function bounds() {
  const L = len(), m = Math.max(L * 0.55, 0.4);
  return { x: T.w / 2 - m, z: T.d / 2 - Math.max(L * 0.3, 0.4), y0: L * 0.075 + 0.05, y1: T.h - L * 0.1 - 0.2 };
}
function pickWander() {
  const b = bounds(), L = len();
  const yolkStage = S.dev < 9;
  // 水槽の長い方向に、反対側へ向かう（大きくゆったり行き来する）
  F.target.set(-Math.sign(F.pos.x || 1) * (0.35 + Math.random() * 0.65) * b.x, 0, (Math.random() * 2 - 1) * b.z);
  F.target.y = yolkStage ? b.y0 + Math.random() * (b.y1 - b.y0) : b.y0 + Math.random() * Math.min(T.h * 0.2, L * 0.45);
  if (cam.view === 'belly') F.target.y = Math.min(b.y1, F.target.y + T.h * 0.35); // お腹を見せるため少し上を泳ぐ
  // 小さいうちは近くをうろうろ
  if (L < 6) { F.target.x = clamp(F.pos.x + (Math.random() * 2 - 1) * L * 6, -b.x, b.x); F.target.z = clamp(F.pos.z + (Math.random() * 2 - 1) * L * 6, -b.z, b.z); }
  F.wanderT = 4 + Math.random() * 6;
}

// 体が回る中心（頭から少し後ろ）。真ん中で回すと頭と尾が逆に振れて硬く見える
const PIVOT = 0.2;
function mouthPos() {
  const L = len();
  const fw = new THREE.Vector3(Math.cos(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), -Math.sin(F.yaw) * Math.cos(F.pitch));
  return F.pos.clone().addScaledVector(fw, L * (0.34 - PIVOT)).add(new THREE.Vector3(0, -L * 0.05, 0));
}

// 泳ぎ方の種類：ゆっくり・ふつう・急に速く・水面を見上げる
const MODES = {
  rest: { v: 0.12, t: [4, 8], amp: 0.6 },
  cruise: { v: 0.45, t: [5, 10], amp: 1 },
  burst: { v: 1.9, t: [1, 2.2], amp: 1.8 },
  lookup: { v: 0.35, t: [3, 4.5], amp: 0.9 },
};
function setMode(m) {
  const L = len(), b = bounds();
  F.mode = m; const r = MODES[m].t; F.modeT = r[0] + Math.random() * (r[1] - r[0]);
  if (m === 'burst') { // 遠くへ一気に
    F.target.set((Math.random() * 2 - 1) * b.x, b.y0 + Math.random() * Math.min(T.h * 0.4, L), (Math.random() * 2 - 1) * b.z);
  } else if (m === 'lookup') { // 水面に向かって顔を上げる
    F.target.set(clamp(F.pos.x + Math.cos(F.yaw) * L * 0.8, -b.x, b.x), b.y1, clamp(F.pos.z - Math.sin(F.yaw) * L * 0.8, -b.z, b.z));
  } else pickWander();
  if (m === 'rest') F.target.y = b.y0;
}
function nextMode() {
  const r = Math.random(), L = len();
  const canLook = T.h > L * 0.9;
  const P = S.traits || {}, act = P.active ?? 1, cur = P.curious ?? 1;
  // 元気な子はよく急に泳ぎ、のんびりな子はよく休む。好奇心が強い子はよく水面を見上げる
  const pRest = 0.3 / act, pBurst = 0.14 * act, pLook = 0.14 * cur;
  const pCruise = Math.max(0.1, 1 - pRest - pBurst - pLook);
  const x = r * (pRest + pCruise + pBurst + pLook);
  setMode(x < pRest ? 'rest' : x < pRest + pCruise ? 'cruise' : x < pRest + pCruise + pBurst ? 'burst' : canLook ? 'lookup' : 'cruise');
  // ときどきくるっと体をひねって、お腹や背中を見せる
  if (Math.random() < 0.3 && F.mode !== 'rest') { F.rollTarget = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.6); F.rollT = 1.2 + Math.random(); }
}

// ---------------- 手から餌：指パク／腕ガブ ----------------
const YUBI_MIN = 12, GABU_MIN = 70; // 全長(cm)
const HF = { active: false, phase: '', t: 0, gabu: false, hand: null, food: null, base: new THREE.Vector3(), tip: new THREE.Vector3(), target: new THREE.Vector3(), depth: 0 };
const HF_FOOD = { mesh: { position: new THREE.Vector3() }, edible: true, settled: false, hand: true };
function handFeed() {
  const L = len();
  if (HF.active) return;
  if (S.dev < 12 || L < YUBI_MIN) { toast(`まだ口が小さいので、手からは食べられない（全長${YUBI_MIN}cmくらいから）`); return; }
  HF.gabu = L >= GABU_MIN;
  const f = bestFood(S.dev, L) || foodById.krill;
  HF.hand = makeHand();
  HF.food = makeFood(f); HF.food.scale.multiplyScalar(f.size < 1 ? 2 : 1); HF.food.userData.f = f;
  HF.food.position.copy(HF.hand.userData.tip); HF.hand.add(HF.food);
  // 魚の少し前、水面から手を入れる
  const fw = new THREE.Vector3(Math.cos(F.yaw), 0, -Math.sin(F.yaw));
  // 水草は壁ぎわにあるので、手は水槽の真ん中寄りに入れる
  const mx = Math.max(14, T.w * 0.22), mz = Math.max(14, T.d * 0.3);
  HF.base.set(clamp(F.pos.x + fw.x * L * 1.3, -T.w / 2 + mx, T.w / 2 - mx), 0, clamp(F.pos.z + fw.z * L * 1.3, -T.d / 2 + mz, T.d / 2 - mz));
  HF.depth = HF.gabu ? Math.min(T.h * 0.45, 28) : Math.min(T.h * 0.4, 14); // 指先が水面からどれだけ沈むか
  HF.active = true; HF.phase = 'enter'; HF.t = 0; HF.splashed = false;
  scene.add(HF.hand);
  $('#food-sheet').classList.remove('open');
  toast(HF.gabu ? '💪 腕を水に入れて、餌を差し出した…' : '🤚 人差し指と中指で餌をはさんで、水に入れた…');
}
function handTipWorld(out) { return HF.hand.localToWorld(out.copy(HF.hand.userData.tip)); }
function updateHand(dt) {
  if (!HF.active) { handClip.uClipOn.value = 0; return; }
  fish.group.updateMatrixWorld(); handClip.uFishInv.value.copy(fish.group.matrixWorld).invert();
  handClip.uClipOn.value = HF.phase === 'bite' || (HF.phase === 'leave' && HF.t < 0.6) ? 1 : 0;
  { const L = len(), juv = 1 - Math.min(1, Math.max(0, (L - 30) / 60));
    handClip.uMouthX.value = 0.5 - (0.15 + 0.04 * juv); handClip.uSnoutC.value = fish.u.uSnout.value;
    handClip.uMouthR.value = HF.gabu ? 0.07 : 0.05 + 0.02 * F.mouth; }
  HF.t += dt;
  const h = HF.hand, tipY = T.h - HF.depth;
  const hs = h.userData.scale || 1, restY = tipY - h.userData.tip.y; // 指先が tipY に来る手首の高さ
  // 手のひらをカメラに向ける
  h.rotation.y = Math.atan2(camera.position.x - h.position.x, camera.position.z - h.position.z) - 0.95; // 親指側から斜めに見える向き（指の形が分かる）
  if (HF.phase === 'enter') {
    const k = Math.min(1, HF.t / 1.4), e = 1 - (1 - k) ** 3;
    h.position.set(HF.base.x, restY + 40 * (1 - e), HF.base.z);
    if (!HF.splashed && h.position.y + h.userData.tip.y < T.h) { HF.splashed = true; audio.splash(HF.gabu); }
    if (k >= 1) { HF.phase = 'wait'; HF.t = 0; }
  } else if (HF.phase === 'wait') {
    h.position.set(HF.base.x + Math.sin(HF.t * 1.3) * 0.6, restY + Math.sin(HF.t * 2.1) * 0.5, HF.base.z);
    if (HF.t > 18) { HF.phase = 'leave'; HF.t = 0; toast('今はお腹がいっぱいみたい'); }
  } else if (HF.phase === 'bite') {
    // 吸いつかれて少し引っぱられる。腕ガブは左右にゆさぶられる
    const tug = HF.gabu ? 3 + Math.sin(HF.t * 2) * 1.5 : 1.2 + Math.sin(HF.t * 3) * 0.6;
    const shake = HF.gabu ? Math.sin(HF.t * 7) * 1.4 : Math.sin(HF.t * 9) * 0.3;
    h.position.set(HF.base.x + shake, restY - tug, HF.base.z);
    h.rotation.z = shake * 0.02;
    if (HF.t > (HF.gabu ? 4 : 5)) { HF.phase = 'leave'; HF.t = 0; F.mode = null; setMode(HF.gabu ? 'burst' : 'cruise'); }
  } else if (HF.phase === 'leave') {
    const k = Math.min(1, HF.t / 1.2);
    h.position.y += dt * 45 * k;
    if (HF.t > 1.6) { scene.remove(h); HF.active = false; HF.phase = ''; }
  }
  // 魚が狙う場所：指パクは指先、腕ガブは手のひらのまん中（手ごとくわえる）
  handTipWorld(HF.tip);
  HF.target.copy(HF.tip); HF.target.y += HF.gabu ? 17 * (HF.hand.userData.scale || 1) : 0.5; // 腕ガブは手首まで、指パクは指先2cmほど
}
function biteHand() {
  HF.phase = 'bite'; HF.t = 0; F.holdPos = null;
  // 手がカメラから見て右か左かで、ひねる向きを決める
  F.yawSign = Math.sign(Math.sin(F.yaw - cam.az)) || 1;
  if (HF.food) { HF.hand.remove(HF.food); const f = HF.food.userData.f; HF.food = null; S.satiety = Math.min(110, S.satiety + (HF.gabu ? 45 : 30) * f.quality); unlockFood(f.id); }
  audio.slurp(HF.gabu);
  const id = HF.gabu ? 'udegabu' : 'yubipaku';
  toast(HF.gabu ? '💥 腕ガブ！ 手ごとくわえられた！' : '😆 指パク！ 指ごとチュポッと吸いこまれた！', true);
  unlockEvent(id);
}

function updateFish(dt) {
  const L = len();
  if (F.freeze) { fish.setSwim(F.phase, 0.015, 0, 0); fish.setMouth(F.mouth || 0); fish.setExpr(F.snout || 0, F.snoutZ || 0, F.barbX || 0, F.barbZ || 0); fish.group.position.copy(F.pos); fish.group.rotation.set(F.roll || 0, F.yaw, F.pitch); fish.group.scale.setScalar(L); return; }
  const b = bounds();
  const yolkStage = S.dev < 9;
  const weak = S.health < 30;
  const now = performance.now() / 1000;
  // 狙う餌をさがす（沈んでいる途中の餌も、上に向かって取りに行く）
  let food = null, best = 1e9;
  if (!yolkStage) {
    const mp = mouthPos();
    for (const f of foods) {
      if (!f.edible) continue;
      const dd = f.mesh.position.distanceTo(mp) + (f.settled ? 0 : L * 0.3);
      if (dd < best) { best = dd; food = f; }
    }
  }
  if (HF.active && HF.phase === 'wait' && !yolkStage) {
    HF_FOOD.mesh.position.copy(HF.target);
    food = HF_FOOD; best = mouthPos().distanceTo(HF.target);
  }
  // 指・腕をくわえている間：口を手に合わせて止まる
  if (HF.active && HF.phase === 'bite') return holdHand(dt, L);
  if (!F.mode) setMode('cruise');
  if (food) F.target.copy(food.mesh.position).add(new THREE.Vector3(0, L * 0.05, 0));
  else if (!yolkStage) {
    F.modeT -= dt;
    if (F.modeT <= 0 || (F.mode !== 'lookup' && F.pos.distanceTo(F.target) < L * 0.6 + 0.3)) {
      if (F.modeT <= 0) nextMode(); else if (F.mode === 'burst') setMode('cruise'); else pickWander();
    }
  } else { F.wanderT -= dt; if (F.wanderT <= 0 || F.pos.distanceTo(F.target) < L * 0.8 + 0.3) pickWander(); }

  const to = F.target.clone().sub(F.pos);
  const horiz = Math.hypot(to.x, to.z);
  const wantYaw = Math.atan2(-to.z, to.x);
  let dy = wantYaw - F.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  const burst = !food && F.mode === 'burst';
  const turnMax = (yolkStage ? 3 : burst ? 2.2 : food === HF_FOOD ? 2.2 : food ? 1.4 : 0.8) / (1 + L / 120);
  const yawRateT = clamp(dy * 2.0, -turnMax, turnMax);
  F.yawV = (F.yawV || 0) + (yawRateT - (F.yawV || 0)) * Math.min(1, dt * (burst ? 4 : 2.2));
  const yawRate = F.yawV;
  F.yaw += yawRate * dt;
  // 上を向く・下を向く（餌や水面に向かう時は大きく傾ける）
  const pmax = food || F.mode === 'lookup' ? 1.0 : 0.55;
  let wantPitch = clamp(Math.atan2(to.y, Math.max(horiz, L * 0.35)), -pmax, pmax);
  if (!food && F.mode === 'lookup' && F.pos.y > b.y1 - L * 0.5) wantPitch = 0.75; // 水面で顔を上げたまま
  F.pitchV = (F.pitchV || 0) + ((wantPitch - F.pitch) * 1.6 - (F.pitchV || 0)) * Math.min(1, dt * 2.5);
  F.pitch += F.pitchV * dt;

  // 速さ：モードごとに変える。急発進は一気に加速
  let vWant;
  if (yolkStage) vWant = L * (0.6 + 0.9 * Math.abs(Math.sin(now * 1.1)));
  else if (food) vWant = Math.min(L * 1.1, 80) * (best < L * 0.8 ? 0.45 : 1);
  else vWant = Math.min(L * MODES[F.mode].v * (0.85 + 0.3 * Math.sin(now * 0.7 + 1)), F.mode === 'burst' ? 140 : 50);
  if (weak) vWant *= 0.4;
  vWant = Math.max(vWant, 0.15);
  F.speed += (vWant - F.speed) * Math.min(1, dt * (burst ? 2.5 : 0.9));
  const fw = new THREE.Vector3(Math.cos(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), -Math.sin(F.yaw) * Math.cos(F.pitch));
  F.pos.addScaledVector(fw, F.speed * dt);
  const ox = F.pos.x, oz = F.pos.z;
  F.pos.x = clamp(F.pos.x, -b.x, b.x); F.pos.z = clamp(F.pos.z, -b.z, b.z); F.pos.y = clamp(F.pos.y, b.y0, b.y1);
  if (ox !== F.pos.x || oz !== F.pos.z) { if (F.mode === 'burst') setMode('cruise'); else pickWander(); }

  // 体のひねり：曲がる時に少し傾く＋ときどき大きくひねる
  F.rollT = (F.rollT || 0) - dt;
  const rollWant = (F.rollT > 0 ? F.rollTarget : 0) + clamp(-yawRate * 0.25, -0.5, 0.5);
  F.roll = (F.roll || 0) + (rollWant - (F.roll || 0)) * Math.min(1, dt * 2.5);

  const rel0 = F.speed / L;
  // 口パク：餌が近い・水面を見上げている時はパクパク、食べた直後はモグモグ
  let mouthWant = 0;
  if (food && best < L * 0.9) mouthWant = 0.5 + 0.5 * Math.sin(now * 5.5);
  if (!food && F.mode === 'lookup' && F.pos.y > b.y1 - L * 0.8) mouthWant = 0.5 + 0.5 * Math.sin(now * 4.5);
  if (F.eatT > 0) mouthWant = 0.5 - 0.5 * Math.cos((1.8 - F.eatT) * 7);
  if (yolkStage || S.dev < 12) mouthWant = 0;
  F.mouth = (F.mouth || 0) + (Math.max(0, mouthWant) - (F.mouth || 0)) * Math.min(1, dt * 7);
  fish.setMouth(F.mouth);

  // 鼻（口先）の表情：餌のにおいをかぐ時は反ってヒクヒク、水面では上に反る、底では砂をさぐる
  let snoutWant = 0.08 * Math.sin(now * 0.6) + 0.06 * Math.sin(now * 1.7 + 2);
  if (food && best < L * 1.6) snoutWant = 0.55 + 0.3 * Math.sin(now * 3.2);
  else if (!food && F.mode === 'lookup') snoutWant = 0.85 + 0.15 * Math.sin(now * 2);
  else if (!food && F.mode === 'rest') snoutWant = -0.15 + 0.35 * Math.max(0, Math.sin(now * 1.3)) ** 3; // 底をつつく
  else if (!food && F.mode === 'burst') snoutWant = -0.2;
  if (F.eatT > 0) snoutWant = 0.35 + 0.35 * Math.sin((1.8 - F.eatT) * 7); // モグモグに合わせて鼻も動く
  // ときどきピクッと鼻を反らす
  F.twitchT = (F.twitchT ?? 3) - dt;
  if (F.twitchT < 0) { F.twitchT = 2 + Math.random() * 5; F.twitch = 0.7 + Math.random() * 0.5; }
  F.twitch = (F.twitch || 0) * Math.exp(-dt * 5);
  snoutWant += F.twitch;
  // ときどき大きく、くいっと反らす（少しの間そのまま）
  F.bigT = (F.bigT ?? 4) - dt;
  if (F.bigT < 0) { F.bigT = (5 + Math.random() * 6) / (S.traits?.curious ?? 1); F.bigHold = 0.8 + Math.random() * 0.9; }
  if ((F.bigHold || 0) > 0) { F.bigHold -= dt; snoutWant = Math.max(snoutWant, 1.6 + 0.2 * Math.sin(now * 3)); }
  F.snout = (F.snout || 0) + (snoutWant - (F.snout || 0)) * Math.min(1, dt * 4);
  // ヒクヒク：鼻先を小刻みに速く動かす。3〜6回続けて少し休む。餌が近い時はもっとよくヒクヒクする
  F.sniffT = (F.sniffT ?? 1) - dt;
  if (F.sniffT < 0) { F.sniffN = 3 + Math.floor(Math.random() * 4); F.sniffPh = 0; F.sniffT = ((food ? 1.5 : 3) + Math.random() * (food ? 1.5 : 3)) / (S.traits?.sniffy ?? 1); }
  let sniff = 0;
  if ((F.sniffN || 0) > 0) {
    F.sniffPh += dt * 2; // 1秒に2回くらい、ゆっくり
    sniff = 0.45 * (0.5 - 0.5 * Math.cos(F.sniffPh * Math.PI * 2)) * (food ? 1.3 : 1);
    if (F.sniffPh >= F.sniffN) F.sniffN = 0;
  }
  const snoutZ = clamp(-F.turn * 4, -0.6, 0.6) + 0.12 * Math.sin(now * 0.9);
  // ヒゲ：速く泳ぐと後ろになびき、止まるとふわふわゆれる
  const barbX = -Math.min(0.7, rel0 * 0.55) + 0.12 * Math.sin(now * 2.6) + (food && best < L ? 0.25 : 0);
  const barbZ = 0.18 * Math.sin(now * 2.1 + 1) + clamp(-F.turn * 3, -0.4, 0.4);
  fish.setExpr(yolkStage ? 0 : F.snout + sniff, yolkStage ? 0 : snoutZ + sniff * 0.15 * Math.sin(now * 2), barbX + sniff * 0.3, barbZ);

  // 食べる
  if (food) {
    const mp = mouthPos(), fp = food.mesh.position;
    if (food === HF_FOOD) { if (mp.distanceTo(fp) < Math.max(L * 0.45, 4)) biteHand(); } // 近くまで来たら、口を合わせながら吸いつく
    else if (Math.hypot(mp.x - fp.x, mp.z - fp.z) < Math.max(L * 0.14, 0.3) && Math.abs(mp.y - fp.y) < Math.max(L * 0.14, 0.4)) eat(food);
  }

  // 体の曲がり・尾の振り幅・リズムは、すべてゆっくり変える
  F.turn += (-yawRate * 0.3 - F.turn) * Math.min(1, dt * 2);
  const rel = F.speed / L;
  F.relS = (F.relS ?? rel) + (rel - (F.relS ?? rel)) * Math.min(1, dt * 1.5);
  F.phase += dt * ((yolkStage ? 10 : 2.3) + F.relS * (yolkStage ? 14 : 5.5));
  const ampT = (yolkStage ? 0.06 : 0.022 * (food ? 1 : MODES[F.mode].amp)) + Math.min(0.035, F.relS * 0.03);
  F.ampS = (F.ampS ?? ampT) + (ampT - (F.ampS ?? ampT)) * Math.min(1, dt * 1.2);
  F.eatT -= dt;
  // 胸ビレ：ゆっくり泳ぐ時ほど大きくあおぐ
  F.flapPh = (F.flapPh || 0) + dt * (1.4 + F.relS);
  const flap = (yolkStage ? 0.1 : 0.12 + 0.35 * Math.max(0, 1 - F.relS * 1.5)) * Math.sin(F.flapPh) - clamp(F.pitchV * 0.4, -0.3, 0.3);
  fish.setSwim(F.phase, F.ampS, F.turn, flap);
  fish.group.position.copy(F.pos).addScaledVector(fw, -PIVOT * L);
  fish.group.rotation.order = 'YZX';
  fish.group.rotation.set(F.roll, F.yaw, F.pitch);
  fish.group.scale.setScalar(L);
}

function holdHand(dt, L) {
  const now = performance.now() / 1000, t = HF.t;
  // 体をひねって口（お腹側）を上の手に向ける。腕ガブはほぼ仰向け、指パクは横向きくらい
  // 腕ガブ：頭を水面に向けて立て、腕を体の奥までくわえこむ（首をふる）。指パク：頭を上げて指先に吸いつく
  // 指パクは体を裏返さず、頭を少し上げて鼻だけぐっと反らせ、下の口で指先を吸う
  const rollT = HF.gabu ? Math.sin(now * 6) * 0.35 : 0;
  const pitchT = HF.gabu ? 1.5 : 0.5;
  F.roll = (F.roll || 0) + (rollT - (F.roll || 0)) * Math.min(1, dt * 3.5);
  F.pitch += (pitchT - F.pitch) * Math.min(1, dt * 3);
  // 口の場所が手（腕ガブは手首の近くまで）に重なるように体を動かす
  const juv = 1 - Math.min(1, Math.max(0, (L - 30) / 60));
  const mouthLocal = new THREE.Vector3(0.5 - (0.15 + 0.04 * juv), HF.gabu ? 0 : -0.04, 0);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(F.roll, F.yaw, F.pitch, 'YZX'));
  const groupWant = HF.target.clone().sub(mouthLocal.multiplyScalar(L).applyQuaternion(q));
  F.holdPos = (F.holdPos || fish.group.position.clone()).lerp(groupWant, Math.min(1, dt * 5));
  const fw = new THREE.Vector3(Math.cos(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), -Math.sin(F.yaw) * Math.cos(F.pitch));
  F.pos.copy(F.holdPos).addScaledVector(fw, PIVOT * L);
  F.speed = 0; F.yawV = 0;
  // 口：最初に大きく開けて吸いこみ、あとはくわえたままモグモグ
  const m = t < 0.3 ? 1.2 : HF.gabu ? 1.1 + 0.1 * Math.sin(t * 5) : 0.55 + 0.18 * Math.sin(t * 4.5);
  F.mouth += (m - F.mouth) * Math.min(1, dt * 10);
  fish.setMouth(F.mouth);
  const snoutT = HF.gabu ? 0.4 : 1.7 + 0.25 * Math.sin(t * 4.5); // 指パク中は鼻を大きく反らせ、モグモグに合わせて動く
  F.snout = (F.snout || 0) + (snoutT - (F.snout || 0)) * Math.min(1, dt * 5);
  fish.setExpr(F.snout, 0, HF.gabu ? 0.4 : 0.8, Math.sin(now * 3) * 0.2);
  F.phase += dt * (HF.gabu ? 6 : 4);
  F.turn *= 0.9;
  fish.setSwim(F.phase, HF.gabu ? 0.045 : 0.025, F.turn, 0.25 * Math.sin(now * 2));
  fish.group.position.copy(F.holdPos);
  fish.group.rotation.order = 'YZX';
  fish.group.rotation.set(F.roll, F.yaw, F.pitch);
  fish.group.scale.setScalar(L);
}

// ---------------- 餌 ----------------
function feed(id, quiet) {
  const f = foodById[id];
  if (S.dev < 0) { toast('🥚 卵の時期は餌はいりません。水温を16〜19℃に保ってね'); return; }
  const L = len();
  const ok = canEat(f, S.dev, L);
  if (!quiet) {
    if (!ok) {
      if (S.dev < 8) toast('まだ卵黄（お腹の栄養の袋）で育つ時期。口がまだ使えないので食べません');
      else if (id === 'float') { toast('🤔 口が下向きなので、水面に浮く餌はほとんど食べられない…'); unlockFood('float'); }
      else if (L < f.minL || S.dev < f.minD) toast(`まだ体が小さくて${f.name}は食べられないみたい`);
      else toast(`体が大きくなって、${f.name}では小さすぎて見向きもしない`);
    }
  }
  const n = Math.max(3, Math.round(f.count * (L > 60 ? 0.6 : 1)));
  const spread = Math.max(L * 0.9, 1.5);
  for (let i = 0; i < n; i++) {
    const m = makeFood(f);
    const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
    m.position.set(clamp(F.pos.x + Math.cos(a) * r, -T.w / 2 + 1, T.w / 2 - 1), T.h - 0.1 - Math.random() * T.h * 0.05, clamp(F.pos.z + Math.sin(a) * r, -T.d / 2 + 1, T.d / 2 - 1));
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    scene.add(m);
    foods.push({ f, mesh: m, settled: f.sink === 0, rot: 0, edible: ok, fill: 70 / n, ph: Math.random() * 6 });
  }
  S.water -= 0.5;
}
function eat(fd) {
  scene.remove(fd.mesh); foods.splice(foods.indexOf(fd), 1);
  S.satiety = Math.min(110, S.satiety + fd.fill * fd.f.quality);
  S.qual += (fd.f.quality - S.qual) * 0.15;
  F.eatT = 1.8;
  unlockFood(fd.f.id);
}
function unlockFood(id) {
  if (S.foods[id]) return;
  S.foods[id] = { age: S.age, len: len() };
  const f = foodById[id];
  toast(id === 'float' ? '📗 えさ図鑑に「浮くエサ」の注意を記録' : `📗 えさ図鑑に「${f.name}」を追加！`);
  save();
}
function updateFoods(dt, gdt) {
  const sinkK = Math.max(1, T.h / 30);
  const camD = camera.position.distanceTo(camTarget);
  for (const fd of [...foods]) {
    const m = fd.mesh, f = fd.f;
    // 遠くからでも見えるように少しだけ大きく
    const vis = Math.max(1, (camD * 0.004) / f.size);
    m.scale.copy(m.userData.base).multiplyScalar(Math.min(vis, 4));
    if (!fd.settled) {
      m.position.y -= f.sink * sinkK * dt;
      if (f.swim) { m.position.x += Math.sin(performance.now() / 300 + fd.ph) * dt * 0.3; m.position.y += Math.sin(performance.now() / 200 + fd.ph) * dt * 0.2; }
      m.rotation.y += dt * 0.5;
      const floorY = f.size * 0.25;
      if (m.position.y <= floorY) { m.position.y = floorY; fd.settled = true; }
    } else {
      if (f.wiggle || f.swim) m.rotation.y += Math.sin(performance.now() / 250 + fd.ph) * dt * 2;
      if (f.sink === 0) m.position.y = T.h - 0.1 + Math.sin(performance.now() / 700 + fd.ph) * 0.05;
      fd.rot += gdt;
      if (fd.rot > 0.25) { // 食べ残しは腐って水が汚れる
        scene.remove(m); foods.splice(foods.indexOf(fd), 1);
        S.water -= 30 * fd.fill / 70;
      }
    }
  }
}

// ---------------- 時間を進める ----------------
function tempFactor() {
  const t = S.temp;
  const [lo, hi] = S.dev < 9 ? [16, 19] : [18, 22];
  if (t < lo) return Math.max(0.15, 1 - (lo - t) * 0.12);
  if (t > hi) return Math.max(0, 1 - (t - hi) * 0.18);
  return 1;
}
function sim(gdt, bg = false) {
  if (S.dev < 0) {
    const rate = clamp((S.temp - 6) / 11, 0.3, 1.5);
    S.dev += gdt * rate; S.age = S.dev;
    if (S.temp > 21 || S.temp < 11) S.health -= gdt * 20; else S.health += gdt * 20;
    if (S.dev >= 0) { S.dev = 0; S.age = 0; if (bg) toast(`🐣 ${S.name}がふ化した！`); else hatch(); }
  } else {
    S.age += gdt;
    const L = len();
    const feeding = S.dev >= 9;
    if (feeding) S.satiety -= gdt * (L < 20 ? 36 : 26);
    else S.satiety = 80;
    S.satiety = clamp(S.satiety, 0, 110);
    S.water -= gdt * (1.5 + Math.min(2.5, L / 50));
    if (S.autofeed && S.water < 55) { S.water += 40; if (!bg) for (const f of foods.filter(f => f.settled)) { scene.remove(f.mesh); foods.splice(foods.indexOf(f), 1); } }
    let foodF = 1;
    if (feeding) foodF = S.satiety > 45 ? Math.min(1.1, S.qual) : S.satiety > 20 ? 0.6 : S.satiety > 0 ? 0.3 : 0;
    const waterF = S.water > 60 ? 1 : S.water > 30 ? 0.7 : 0.35;
    const healthF = S.health < 30 ? 0.3 : 1;
    S.dev += gdt * tempFactor() * foodF * waterF * healthF;
    let dh = 12;
    if (feeding && S.satiety <= 0) dh = -25;
    if (S.water < 35) dh = Math.min(dh, -(35 - S.water) * 0.8);
    if (S.temp > 26 || S.temp < 6) dh = -30;
    S.health += gdt * dh;
    // 自動給餌
    if (S.autofeed && feeding && S.satiety < 40 && (bg || !foods.some(f => f.edible))) {
      const bf = bestFood(S.dev, L);
      if (bf) {
        if (bg || R.speed >= 3) { S.satiety += 55 * bf.quality; S.qual += (bf.quality - S.qual) * 0.3; S.water -= 1; unlockFood(bf.id); }
        else feed(bf.id, true);
      }
    }
  }
  S.water = clamp(S.water, 0, 100); S.health = clamp(S.health, 0, 100);
  checkZukan(bg);
  // ほかの子の引っ越し
  if (bg) { const want = tankFor(len()); if (want.id !== S.tank) { const bigger = TANKS.indexOf(want) > TANKS.findIndex(t => t.id === S.tank); S.tank = want.id; if (bigger) { toast(`🏠 ${S.name}が${want.name}にお引っ越し！`); offerNewFish(S, want); } } }
}
// 全員の時間を進める（見ていない子も育つ）
function simAll(gdt) {
  const me = S;
  for (const st of R.list) { if (st === me) continue; S = st; sim(gdt, true); }
  S = me; sim(gdt, false);
}
function hatch() {
  egg.visible = false;
  F.pos.set(egg.position.x, 0.6, egg.position.z);
  toast('🐣 ふ化した！ お腹の黄色い袋が「卵黄のう」。しばらくはこの栄養で育つよ');
}

// ---------------- 図鑑 ----------------
let pendingSnaps = [], pendingMainSnaps = [];
function unlockEvent(id) {
  if (S.zukan[id]) return;
  const z = ZUKAN.find(z => z.id === id);
  S.zukan[id] = { age: S.age, dev: S.dev, len: len(), img: null };
  pendingMainSnaps.push(id);
  toast(`📘 図鑑に「${z.title}」が追加された！`, true);
  save();
}
function checkZukan(bg = false) {
  for (const z of ZUKAN) {
    if (S.zukan[z.id] || z.event) continue;
    const t = z.at >= 365 ? S.age : S.dev;
    if (t >= z.at - 1e-6) {
      S.zukan[z.id] = { age: S.age, dev: S.dev, len: len(), img: null };
      if (bg) (S.snapLater ||= []).push(z.id); else pendingSnaps.push(z.id); // 見ていない子の写真は、次に見た時に撮る
      if (z.id === 'y3') { S.sexKnown = true; }
      toast(`📘 ${R.list.length > 1 ? S.name + 'の' : ''}図鑑に「${z.title}」が追加された！`, true);
      save();
    }
  }
}
// 図鑑用の写真：魚を横から撮る専用カメラ
const snapCam = new THREE.PerspectiveCamera(32, 1.5, 0.01, 5000);
function takeSnap() {
  const L = len();
  let tgt, d, side;
  if (S.dev < 0) { tgt = egg.position.clone(); d = 0.9; side = new THREE.Vector3(0.6, 0.45, 0.8).normalize(); }
  else { tgt = F.pos.clone(); d = L * 1.9 + 0.5; side = new THREE.Vector3(Math.sin(F.yaw - 0.35), 0.18, Math.cos(F.yaw - 0.35)).normalize(); }
  snapCam.position.copy(tgt).addScaledVector(side, d);
  snapCam.position.y = Math.max(snapCam.position.y, 0.2);
  snapCam.near = d * 0.02; snapCam.far = d * 80 + 2000; snapCam.aspect = innerWidth / innerHeight; snapCam.updateProjectionMatrix();
  snapCam.lookAt(tgt);
  const fd = scene.fog.density; scene.fog.density = 0.12 / d;
  renderer.render(scene, snapCam);
  scene.fog.density = fd;
  const c = document.createElement('canvas'); c.width = 360; c.height = 240;
  const src = renderer.domElement, sw = src.width, sh = src.height;
  const r = Math.min(sw / 360, sh / 240) * 0.9;
  c.getContext('2d').drawImage(src, (sw - 360 * r) / 2, (sh - 240 * r) / 2, 360 * r, 240 * r, 0, 0, 360, 240);
  renderer.render(scene, camera);
  return c.toDataURL('image/jpeg', 0.8);
}

// ---------------- カメラ ----------------
const camTarget = new THREE.Vector3();
const cam = { az: 0.6, el: 0.28, zoom: 1, mode: 'follow', dist: 3, view: 'free', lastTouch: -99 };
// 見る角度（魚の向きに合わせて回り込む）
const VIEWS = [
  { id: 'free', label: '👀 自由' }, { id: 'side', label: '👀 横から' }, { id: 'top', label: '👀 背中' },
  { id: 'belly', label: '👀 お腹' }, { id: 'face', label: '👀 顔' },
];
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
{
  let drag = null; const pts = new Map(); let pinch0 = 0, zoom0 = 1;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = cam.zoom; } });
  el.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); cam.zoom = clamp(zoom0 * pinch0 / d, 0.35, 5); return; }
    if (!drag) return;
    cam.az -= (e.clientX - drag[0]) * 0.006; cam.el = clamp(cam.el + (e.clientY - drag[1]) * 0.005, -0.7, 1.45); drag = [e.clientX, e.clientY]; cam.lastTouch = performance.now() / 1000;
  });
  const up = (e) => { pts.delete(e.pointerId); if (!pts.size) drag = null; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); cam.zoom = clamp(cam.zoom * Math.exp(e.deltaY * 0.001), 0.35, 5); }, { passive: false });
}
function updateCamera(dt) {
  const L = len();
  let want, d;
  if (S.dev < 0) { want = egg.position; d = 1.1; }
  else if (cam.mode === 'tank') { want = new THREE.Vector3(0, T.h * 0.3, 0); d = Math.max(T.w, T.d) * 0.95; }
  else { want = F.pos; d = Math.max(L * 2.4, 2.2); }
  // 角度の自動調整：選んだ角度、または餌を食べに行く時は顔が見える角度へ
  let faceFocus = false;
  if (S.dev >= 0 && cam.mode === 'follow') {
    let tAz = null, tEl = null;
    const v = cam.view;
    if (v === 'side') { tAz = F.yaw; tEl = 0.1; }
    else if (v === 'top') { tAz = F.yaw + 0.3; tEl = 1.25; }
    else if (v === 'belly') { tAz = F.yaw + 0.4; tEl = -0.55; }
    else if (v === 'face') { tAz = F.yaw + Math.PI / 2 - 0.55; tEl = -0.28; faceFocus = true; }
    else if (performance.now() / 1000 - cam.lastTouch > 3 && HF.active && HF.phase !== 'enter') { tAz = F.yaw + Math.PI / 2 - (HF.gabu ? 1.35 : 1.05); tEl = HF.gabu ? -0.3 : 0.05; d *= HF.gabu ? 0.95 : 0.9; faceFocus = 'hand'; }
    else if (performance.now() / 1000 - cam.lastTouch > 3 && foods.some(f => f.edible) && S.dev >= 9) { tAz = F.yaw + Math.PI / 2 - 0.8; tEl = -0.32; d *= 0.6; faceFocus = true; }
    if (tAz !== null) {
      const k = Math.min(1, dt * 3);
      cam.az += angDiff(tAz, cam.az) * k; cam.el += (tEl - cam.el) * k;
    }
  }
  // 顔を見る時は、体の真ん中ではなく頭（口のあたり）を画面の中心に
  if (faceFocus === 'hand') want = HF.target.clone().add(new THREE.Vector3(0, HF.gabu ? -len() * 0.15 : -2, 0));
  else if (faceFocus) want = mouthPos();
  d *= cam.zoom;
  camTarget.lerp(want, Math.min(1, dt * 3));
  cam.dist += (d - cam.dist) * Math.min(1, dt * 2.5);
  const D = cam.dist;
  camera.position.set(camTarget.x + Math.cos(cam.el) * Math.sin(cam.az) * D, camTarget.y + Math.sin(cam.el) * D, camTarget.z + Math.cos(cam.el) * Math.cos(cam.az) * D);
  // カメラは水の中から出ない（水槽の外から見ると床が浮いた板に見えるため）
  {
    const m = T.w >= 45 ? Math.max(0.4, T.h * 0.18 * 0.95) : 0.4; // 岩の壁の出っぱりより内側
    camera.position.x = clamp(camera.position.x, -T.w / 2 + m, T.w / 2 - m);
    camera.position.z = clamp(camera.position.z, -T.d / 2 + m, T.d / 2 - m);
    camera.position.y = clamp(camera.position.y, Math.max(0.15, T.w / 300), T.h - 0.3);
  }
  camera.lookAt(camTarget);
  camera.near = D * 0.01; camera.far = D * 60 + Math.max(T.w, T.d) * 3; camera.updateProjectionMatrix();
  scene.fog.density = 0.16 / Math.max(D, 0.5);
  sun.position.copy(camTarget).add(new THREE.Vector3(0.25, 1, 0.15).multiplyScalar(D * 2.5));
  sun.target.position.copy(camTarget);
  const sc = sun.shadow.camera; const r = D * 1.3;
  sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = D * 0.5; sc.far = D * 5; sc.updateProjectionMatrix();
  // ものさし
  const pxPerCm = (innerHeight / 2) / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * D);
  const nice = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  const n = nice.find(v => v * pxPerCm >= 70) || 500;
  $('#ruler-bar').style.width = `${n * pxPerCm}px`;
  $('#ruler-label').textContent = n < 1 ? `${n * 10}mm` : n < 100 ? `${n}cm` : `${n / 100}m`;
}

// ---------------- 画面（UI） ----------------
let toastQ = [], toastBusy = false;
function toast(msg, big) {
  toastQ.push([msg, big]);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const it = toastQ.shift(); if (!it) { toastBusy = false; return; }
  toastBusy = true;
  const el = document.createElement('div'); el.className = 'toast' + (it[1] ? ' big' : ''); el.textContent = it[0];
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => { el.remove(); }, 3700);
  setTimeout(nextToast, 900);
}

function stageName() {
  if (S.dev < 0) return '受精卵';
  if (S.dev < 9) return '仔魚（卵黄で成長中）';
  if (S.dev < 27) return '仔魚';
  if (len() < 16.5) return '稚魚';
  if (S.age < 1095) return '若魚';
  if (S.age < 2555) return '成長中';
  return 'おとな';
}
function bubbleText() {
  if (S.dev < 0) return S.temp > 20 ? '（水があたたかすぎるかも…）' : S.dev > -HATCH_DAYS * 0.45 ? '（卵の中で何か動いた！）' : '（静かに育っている）';
  if (S.health < 30) return 'ぐったり… 水と餌と水温を見直して';
  if (S.dev < 9) return S.dev > 7 ? 'そろそろお腹の袋がなくなりそう' : '卵黄の栄養で育ち中';
  if (S.satiety < 20) return 'お腹すいた…！';
  if (S.water < 45) return '水がにごってきた…';
  if (tempFactor() < 0.8) return S.temp < 18 ? '水が冷たくて元気が出ない' : '水があたたかすぎる…';
  if (S.satiety > 90) return 'お腹いっぱい';
  return ['ヒゲで底をさぐっている', 'ゆったり泳いでいる', '砂の上をすべるように泳ぐ'][Math.floor(performance.now() / 6000) % 3];
}
function meter(id, v) { const el = $(id); el.style.width = `${clamp(v, 0, 100)}%`; el.style.background = v < 25 ? '#ff6b6b' : v < 50 ? '#ffc04d' : '#5fd3a0'; }
// 性格をひとことで
function traitText(t) {
  const w = [];
  w.push(t.active > 1.15 ? '元気いっぱい' : t.active < 0.8 ? 'のんびり屋' : 'おだやか');
  if (t.curious > 1.2) w.push('好奇心おうせい');
  if (t.sniffy > 1.2) w.push('においに敏感');
  if (t.snout > 1.07) w.push('口先すらり'); else if (t.snout < 0.93) w.push('丸い口先');
  const sp = { round: '丸い斑点', long: '細長い斑点', cluster: '点のかたまり模様', fine: 'こまかい斑点' }[t.spotShape];
  return '性格：' + w.join('・') + ' ／ ' + sp;
}
function updateHUD() {
  const L = len();
  $('#name').textContent = S.name;
  $('#btn-hand').textContent = len() >= GABU_MIN ? '💪 腕ガブ' : '🤚 指パク';
  $('#btn-hand').style.opacity = S.dev >= 12 && len() >= YUBI_MIN ? 1 : 0.5;
  $('#trait').textContent = traitText(ensureTraits(S));
  $('#stage').textContent = stageName();
  $('#age').textContent = fmtAge(S.age);
  $('#len').textContent = S.dev < 0 ? '直径 3.2mm' : fmtLength(L);
  $('#wt').textContent = S.dev < 0 ? '' : fmtWeight(weightOf(L));
  $('#sex').textContent = S.sexKnown ? (S.sex === 'メス' ? '♀ メス' : '♂ オス') : '性別 ？';
  meter('#m-sat', S.dev < 9 ? 100 : S.satiety); meter('#m-water', S.water); meter('#m-health', S.health);
  $('#sat-label').textContent = S.dev < 9 ? '卵黄' : 'おなか';
  $('#temp-val').textContent = `${S.temp}℃`;
  $('#temp-ok').textContent = S.dev < 9 ? '適温 16〜19℃' : '適温 18〜22℃';
  $('#temp-ok').className = tempFactor() < 1 ? 'warn' : '';
  $('#bubble').textContent = bubbleText();
  $('#tank-name').textContent = T.name;
  const lag = S.dev >= 9 ? expectedLength(S.age) : 0;
  $('#pace').textContent = S.dev >= 9 && lag > L * 1.05 ? `標準より少し小さめ（標準 ${fmtLength(lag)}）` : '';
}

function buildFoodMenu() {
  const box = $('#food-list'); box.innerHTML = '';
  const hb = document.createElement('button'); hb.className = 'food hand-feed'; hb.id = 'hand-feed';
  hb.onclick = () => handFeed();
  box.appendChild(hb);
  for (const f of FOODS) {
    const b = document.createElement('button'); b.className = 'food';
    b.innerHTML = `<span class="ic">${f.icon}</span><span>${f.name}</span>`;
    b.onclick = () => { feed(f.id); $('#food-sheet').classList.remove('open'); };
    box.appendChild(b);
  }
}
function refreshFoodMenu() {
  const L = len();
  const hb = $('#hand-feed');
  hb.innerHTML = L >= GABU_MIN ? '<span class="ic">💪</span><span>腕を入れてあげる（腕ガブ）</span>' : `<span class="ic">🤚</span><span>指ではさんであげる（指パク）${L < YUBI_MIN ? `<small>全長${YUBI_MIN}cmから</small>` : ''}</span>`;
  hb.classList.toggle('good', S.dev >= 12 && L >= YUBI_MIN);
  document.querySelectorAll('#food-list .food:not(.hand-feed)').forEach((b, i) => {
    const f = FOODS[i];
    b.classList.toggle('good', S.dev >= 0 && canEat(f, S.dev, L));
  });
}

function setSpeed(i) {
  R.speed = i;
  document.querySelectorAll('#speed button').forEach((b, k) => b.classList.toggle('on', k === i));
  $('#speed-label').textContent = SPEEDS[i].label;
  if (i >= 3 && !S.autofeed && S.dev >= 0 && !starting) toast('⏩ 速くする時は「おまかせ」をONにすると安心');
}

// 図鑑
function openZukan(tab = 'grow') {
  $('#zukan h2').textContent = R.list.length > 1 ? `📘 ${S.name}の図鑑` : '📘 チョウザメ図鑑';
  $('#zukan').classList.add('open');
  document.querySelectorAll('#zukan .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const body = $('#zukan-body'); body.innerHTML = '';
  const got = (tab === 'grow' ? ZUKAN.filter(z => S.zukan[z.id]).length + '/' + ZUKAN.length : tab === 'food' ? Object.keys(S.foods).length + '/' + FOODS.length : '');
  $('#zukan-count').textContent = got ? `${got} 発見` : '';
  if (tab === 'grow') {
    for (const z of ZUKAN) {
      const r = S.zukan[z.id];
      const card = document.createElement('div'); card.className = 'card' + (r ? '' : ' locked');
      card.innerHTML = r
        ? `<div class="ph">${r.img ? `<img src="${r.img}" alt="">` : '<div class="noimg">📷</div>'}</div><div class="ti">${z.title}</div><div class="me">${fmtAge(r.age)}・${r.age < 0 ? '直径3.2mm' : fmtLength(r.len)}</div>`
        : `<div class="ph"><div class="noimg">？</div></div><div class="ti">？？？</div><div class="me">${z.hint}</div>`;
      if (r) card.onclick = () => showDetail(z.title, r.img, `<p>${z.text}</p><p class="mine">🐟 ${S.name}の記録：${fmtAge(r.age)}・${r.age < 0 ? '直径3.2mm' : '全長 ' + fmtLength(r.len) + '・' + fmtWeight(weightOf(r.len))}</p>${z.id === 'y3' ? `<p class="mine">検査の結果：<b>${S.sex}</b>でした</p>` : ''}`);
      body.appendChild(card);
    }
  } else if (tab === 'food') {
    for (const f of FOODS) {
      const r = S.foods[f.id];
      const card = document.createElement('div'); card.className = 'card food-card' + (r ? '' : ' locked');
      card.innerHTML = r ? `<div class="ph"><div class="noimg big">${f.icon}</div></div><div class="ti">${f.name}</div><div class="me">${f.id === 'float' ? '⚠ 食べにくい' : '初めて食べた：' + fmtAge(r.age)}</div>`
        : `<div class="ph"><div class="noimg">？</div></div><div class="ti">？？？</div><div class="me">まだ食べていない</div>`;
      if (r) card.onclick = () => showDetail(f.name, null, `<p>${f.zukan}</p><p class="mine">食べられる目安：${f.id === 'float' ? 'ほぼ食べない' : `全長 ${f.minL}cm〜${f.maxL > 900 ? '' : f.maxL + 'cm'}`}</p>`);
      body.appendChild(card);
    }
  } else {
    body.innerHTML = `<div class="src"><p>このゲームの数字は、シベリアチョウザメを中心に下の資料を参考にした<b>目安</b>です。チョウザメは種類・水温・飼い方で育ち方が大きく変わります。成長の数字（1歳〜10歳の全長）は養殖の一般的な目安をもとにゲーム用に決めたものです。</p><ul>${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('')}</ul></div>
      <div class="src move">
        <h3>セーブの引っ越し（Mac ⇄ スマホ）</h3>
        <p>セーブは開いている機械ごとに別々です。こちらで「書き出す」→ 出てきた文字をコピー → 引っ越し先の「読み込む」に貼り付けると、同じ子たちの続きから遊べます。</p>
        <div class="row"><button id="exp-photo">書き出す（写真つき）</button><button id="exp-lite">書き出す（写真なし・軽い）</button></div>
        <textarea id="save-code" placeholder="ここに書き出した文字が出ます／引っ越し元の文字を貼り付けます"></textarea>
        <div class="row"><button id="save-copy">コピー</button><button id="save-load">読み込む</button></div>
        <p id="save-msg"></p>
      </div>
      <div class="src"><button id="btn-reset">最初からやり直す（全部の子・新しい卵）</button><p id="reset-msg"></p></div>`;
  }
}
function showDetail(title, img, html) {
  $('#detail').classList.add('open');
  $('#detail-title').textContent = title;
  $('#detail-img').innerHTML = img ? `<img src="${img}" alt="">` : '';
  $('#detail-text').innerHTML = html;
}

// ---------------- はじまり ----------------
function wireUI() {
  // 水の音：画面を触った後でないと鳴らせないので、ボタンで始める
  const sndOn = () => { try { return localStorage.getItem('chozame-sound') !== '0'; } catch { return true; } };
  const setSnd = (on) => { if (on) audio.start(); else audio.stop(); $('#snd').textContent = on ? '🔊 水の音 ON' : '🔇 水の音 OFF'; $('#snd').classList.toggle('on', on); try { localStorage.setItem('chozame-sound', on ? '1' : '0'); } catch {} };
  $('#snd').textContent = '🔇 水の音 OFF';
  $('#btn-hand').onclick = () => handFeed();
  $('#snd').onclick = (e) => { e.stopPropagation(); setSnd(!audio.on); };
  const first = (e) => { removeEventListener('pointerdown', first); if (e.target.id !== 'snd' && sndOn() && !audio.on) setSnd(true); };
  addEventListener('pointerdown', first);
  // 情報欄をたたむ（スマホで魚を大きく見たい時）
  const setFold = (on) => { $('#hud').classList.toggle('mini', on); $('#fold').textContent = on ? '▼' : '▲'; try { localStorage.setItem('chozame-fold', on ? '1' : ''); } catch {} };
  $('#hud-top').onclick = () => setFold(!$('#hud').classList.contains('mini'));
  try { if (localStorage.getItem('chozame-fold')) setFold(true); } catch {}
  buildFoodMenu();
  $('#btn-food').onclick = () => { refreshFoodMenu(); $('#food-sheet').classList.toggle('open'); };
  $('#food-close').onclick = () => $('#food-sheet').classList.remove('open');
  $('#btn-water').onclick = () => { S.water = Math.min(100, S.water + 45); for (const f of foods.filter(f => f.settled)) { scene.remove(f.mesh); foods.splice(foods.indexOf(f), 1); } toast('💧 水を半分入れかえた。食べ残しも取りのぞいた'); };
  $('#btn-zukan').onclick = () => openZukan('grow');
  $('#zukan-close').onclick = () => $('#zukan').classList.remove('open');
  document.querySelectorAll('#zukan .tabs button').forEach(b => b.onclick = () => openZukan(b.dataset.tab));
  $('#detail-close').onclick = () => $('#detail').classList.remove('open');
  document.querySelectorAll('#speed button').forEach((b, i) => b.onclick = () => setSpeed(i));
  $('#auto').onchange = (e) => { S.autofeed = e.target.checked; toast(S.autofeed ? '🍽 おまかせ ON：成長に合った餌と水かえを自動でします' : 'おまかせ OFF：自分で餌と水かえをしよう'); };
  $('#temp').oninput = (e) => { S.temp = +e.target.value; };
  $('#btn-view').onclick = () => {
    const i = (VIEWS.findIndex(v => v.id === cam.view) + 1) % VIEWS.length;
    cam.view = VIEWS[i].id; cam.mode = 'follow'; $('#btn-cam').innerHTML = '🎥<span class="lbl"> 追いかけ</span>';
    $('#btn-view').innerHTML = VIEWS[i].label.replace('👀 ', '👀<span class="lbl"> ') + '</span>';
    toast(VIEWS[i].label.replace('👀 ', '見る角度：'));
  };
  $('#btn-cam').onclick = () => { cam.mode = cam.mode === 'follow' ? 'tank' : 'follow'; cam.zoom = 1; $('#btn-cam').innerHTML = cam.mode === 'follow' ? '🎥<span class="lbl"> 追いかけ</span>' : '🎥<span class="lbl"> 水槽全体</span>'; toast(cam.mode === 'follow' ? 'カメラ：追いかけ' : 'カメラ：水槽全体'); };
  // やり直し：確認の小窓は使えない場所もあるので、2回押して決める
  let resetArm = 0;
  document.body.addEventListener('click', (e) => {
    const id = e.target.id;
    if (id === 'btn-reset') {
      if (Date.now() - resetArm < 5000) { resetting = true; try { localStorage.removeItem(SAVE_KEY); } catch {} location.reload(); return; }
      resetArm = Date.now(); e.target.textContent = 'もう一度押すと全部消えます（5秒以内）';
      setTimeout(() => { if (e.target.isConnected) e.target.textContent = '最初からやり直す（全部の子・新しい卵）'; }, 5000);
    }
    // セーブの引っ越し
    if (id === 'exp-photo' || id === 'exp-lite') {
      save();
      const data = JSON.parse(JSON.stringify(R));
      if (id === 'exp-lite') for (const st of data.list) for (const z of Object.values(st.zukan)) z.img = null;
      const code = 'CZ1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      $('#save-code').value = code;
      $('#save-msg').textContent = `書き出しました（${Math.round(code.length / 1024)}KB）。「コピー」を押して、引っ越し先に貼り付けてください。`;
    }
    if (id === 'save-copy') {
      const t = $('#save-code'); t.select();
      navigator.clipboard?.writeText(t.value).then(() => { $('#save-msg').textContent = 'コピーしました'; }).catch(() => { $('#save-msg').textContent = '文字を選んだ状態にしました。長押しでコピーしてください'; });
    }
    if (id === 'save-load') {
      try {
        const txt = $('#save-code').value.trim();
        if (!txt.startsWith('CZ1:')) throw new Error();
        const data = JSON.parse(decodeURIComponent(escape(atob(txt.slice(4)))));
        if (!data.list?.length) throw new Error();
        if (e.target.dataset.arm !== '1') { e.target.dataset.arm = '1'; e.target.textContent = 'もう一度押すと上書きします'; $('#save-msg').textContent = `${data.list.map(s => s.name).join('・')} を読み込みます。今のセーブは消えます。`; return; }
        R = data; S = R.list[R.active || 0]; save(); resetting = true; location.reload();
      } catch { $('#save-msg').textContent = '読み込めませんでした。「CZ1:」で始まる文字をまるごと貼り付けてください。'; }
    }
  });
}

let starting = false;
function start() {
  starting = true;
  wireUI();
  $('#auto').checked = S.autofeed; $('#temp').value = S.temp;
  setSpeed(R.speed);
  fish.setTraits(ensureTraits(S));
  applyTank(false);
  egg.visible = S.dev < 0;
  if (S.dev >= 0) F.pos.set(0, T.h * 0.3, 0);
  pickWander();
  $('#hud').hidden = false; $('#bottom').hidden = false;
  checkZukan();
  if (S.dev < 0 && Object.keys(S.zukan).length <= 1) toast('🥚 チョウザメの受精卵。ふ化まで約130時間（17℃のとき）');
  renderTabs();
  starting = false;
}

// ---------------- 何匹も育てる ----------------
// 引っ越しの時、あいた水槽でもう1匹育てるか聞く
function offerNewFish(st, newTank) {
  if (R.list.length >= MAX_FISH || !$('#newfish').hidden) return;
  $('#newfish-text').innerHTML = `${st.name}が<b>${newTank.name}</b>へ引っ越して、前の水槽があいたよ。<br>もう1匹、卵から育てる？（最大${MAX_FISH}匹・あと${MAX_FISH - R.list.length}匹）`;
  $('#newfish-name').value = '';
  $('#newfish').hidden = false;
}
function addFish(name) {
  const ns = newState(name);
  ns.temp = 17; ns.autofeed = S.autofeed;
  R.list.push(ns); save();
  switchTo(R.list.length - 1);
  toast(`🥚 ${name}の卵を受け取った！ 上の名前ボタンで見る子を切りかえられるよ`);
}
// 見る子を切りかえる
function switchTo(i) {
  if (i === R.active && S === R.list[i]) return;
  if (pendingSnaps.length) { (S.snapLater ||= []).push(...pendingSnaps); pendingSnaps = []; }
  R.active = i; S = R.list[i];
  for (const f of foods.splice(0)) scene.remove(f.mesh);
  T = null; fish.key = ''; F.mode = null; F.yawV = 0; F.speed = 0;
  if (embryo) { egg.remove(embryo); embryo = null; } embryoK = -1;
  fish.setTraits(ensureTraits(S));
  applyTank(false);
  egg.visible = S.dev < 0;
  if (S.dev >= 0) F.pos.set(0, T.h * 0.3, 0);
  pickWander();
  $('#auto').checked = S.autofeed; $('#temp').value = S.temp;
  if (S.snapLater?.length) { pendingSnaps = S.snapLater; S.snapLater = []; }
  renderTabs(); updateHUD(); save();
}
function careIcon(st) {
  if (st.health < 40) return '⚠️';
  if (st.dev >= 9 && st.satiety < 25) return '🍽';
  if (st.water < 45) return '💧';
  return '';
}
let tabsKey = '';
function renderTabs() {
  const box = $('#tabs');
  if (R.list.length < 2) { box.hidden = true; return; }
  const short = (st) => st.dev < 0 ? '卵' : st.age < 365 ? `${Math.floor(st.age)}日` : `${Math.floor(st.age / 365)}歳`;
  const items = R.list.map((st, i) => [i === R.active, st.name, short(st), careIcon(st)]);
  const key = JSON.stringify(items);
  if (key === tabsKey) return; tabsKey = key;
  box.hidden = false; box.innerHTML = '';
  items.forEach(([on, name, age, icon], i) => {
    const b = document.createElement('button'); b.className = 'tab' + (on ? ' on' : '');
    b.innerHTML = `<span class="tn">${name}</span><span class="ta">${age}</span>${icon ? `<span class="ti">${icon}</span>` : ''}`;
    b.onclick = () => switchTo(i);
    box.appendChild(b);
  });
}

$('#newfish-go').onclick = () => { $('#newfish').hidden = true; addFish(($('#newfish-name').value || ['チョウ子', 'チョウ吉', 'チョウ美'][R.list.length % 3]).slice(0, 12)); };
$('#newfish-no').onclick = () => { $('#newfish').hidden = true; toast('また次の引っ越しの時に聞くね'); };
if (!S) {
  $('#intro').hidden = false;
  $('#intro-go').onclick = () => {
    S = newState(($('#intro-name').value || 'チョウ太').slice(0, 12));
    R = { v: 2, active: 0, speed: 2, list: [S] };
    $('#intro').hidden = true; save(); start();
  };
} else start();

// ---------------- ループ ----------------
let last = performance.now(), time = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  frame(dt);
  requestAnimationFrame(loop);
}
function frame(dt) {
  time += dt;
  if (S && T) {
    const paused = document.getElementById('zukan').classList.contains('open') || !document.getElementById('newfish').hidden;
    let gdt = paused ? 0 : dt * SPEEDS[R.speed].d;
    while (gdt > 0) { const s = Math.min(gdt, 0.05); simAll(s); gdt -= s; }
    applyTank(true);
    fish.build(lookFor(S.dev, len()));
    fish.group.visible = S.dev >= 0;
    if (S.dev < 0) {
      const p = (S.dev + HATCH_DAYS) / HATCH_DAYS;
      const e = egg.userData;
      const k = Math.max(0, (p - 0.3) / 0.7);
      const kq = Math.round(k * 20) / 20;
      if (kq !== embryoK) { if (embryo) egg.remove(embryo); embryoK = kq; embryo = kq > 0 ? makeEmbryo(kq) : null; if (embryo) { embryo.rotation.x = -1.0; egg.add(embryo); } }
      if (embryo) embryo.rotation.y = 0.4 + (p > 0.6 && Math.sin(time * 1.3) > 0.9 ? Math.sin(time * 40) * 0.12 : 0);
      e.yolk.scale.setScalar(1 - 0.12 * k);
      egg.rotation.y = Math.sin(time * 0.2) * 0.2;
    }
    updateHand(dt);
    updateFish(dt);
    updateFoods(dt, paused ? 0 : dt * SPEEDS[R.speed].d);
    tank.update(dt, time, camera, camTarget);
    others.update(dt, time, S.dev >= 0 ? F.pos : egg.position, Math.max(len() * 0.6, 1));
    updateCamera(dt);
    if ((time * 4 | 0) !== ((time - dt) * 4 | 0)) { updateHUD(); renderTabs(); }
  }
  renderer.render(scene, camera);
  if (pendingMainSnaps.length && S) { // 指パクなどは、今の画面をそのまま写真に
    const c = document.createElement('canvas'); c.width = 360; c.height = 240;
    const src = renderer.domElement, r = Math.min(src.width / 360, src.height / 240) * 0.75;
    c.getContext('2d').drawImage(src, (src.width - 360 * r) / 2, (src.height - 240 * r) / 2, 360 * r, 240 * r, 0, 0, 360, 240);
    const img = c.toDataURL('image/jpeg', 0.8);
    for (const id of pendingMainSnaps) if (S.zukan[id]) S.zukan[id].img = img;
    pendingMainSnaps = []; save();
  }
  if (pendingSnaps.length && S) { // 図鑑の写真は描いた直後に撮る
    const img = takeSnap();
    for (const id of pendingSnaps) if (S.zukan[id]) S.zukan[id].img = img;
    pendingSnaps = []; save();
  }
}
requestAnimationFrame(loop);

// 確認用
window.__cz = { HF, handFeed, audio, get S() { return S; }, get R() { return R; }, switchTo, addFish, offerNewFish, reset() { resetting = true; localStorage.removeItem(SAVE_KEY); location.reload(); }, F, foods, feed, sim, camera, cam, camTarget, others, fish, frame, updateHUD, setDev(d) { S.dev = d; S.age = d; } };

// アプリとして使えるように（ホーム画面に追加・オフライン）
if ('serviceWorker' in navigator && isSecureContext && !new URLSearchParams(location.search).has('test')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
