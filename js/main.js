import * as THREE from 'three';
import { Fish, lookFor, makeTraits } from './fish.js';
import { Tank, makeEgg, makeFood, makeEmbryo } from './world.js';
import { Companions } from './others.js';
import { WaterAudio } from './audio.js';
import { playRelease } from './release.js';
import { playMemoryMovie } from './movie.js';
import {
  HATCH_DAYS, expectedLength, weightOf, fmtWeight, fmtLength, fmtAge, tankFor,
  FOODS, foodById, canEat, bestFood, ZUKAN, SOURCES, TANKS, sexName,
} from './data.js';
import { tr, EN, LANG, setLang, applyStatic } from './i18n.js';
applyStatic();

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// ?test を付けると別のセーブ（確認用）を使う
const SAVE_KEY = new URLSearchParams(location.search).has('test') ? 'chozame-ikusei-test' : 'chozame-ikusei-v1';
// ---------------- 応援の合言葉 ----------------
// 育てるのは10歳までずっと無料。合言葉で増えるのは、結果を変えない「物語カードの飾り」だけ
const PRICE = tr('500円', '500 yen');
const BUY_URL = ''; // 合言葉を売るページ（BOOTH）ができたら、ここにURLを入れる
const LIC_KEY = 'chozame-license';
// 合言葉そのものは書かず、合言葉から作った「指紋」だけを置く（合言葉を変える時は、ここに足していく）
const LIC_HASH = ['13f596e36bb99b4ad4f954a6a9488fda0f2bee781ccb84bac6ad397b1c123fbb'];
// ---------------- ベータ版のお知らせ ----------------
const OFFICIAL_URL = 'https://chozame-fan.github.io/chozame/';
const UPDATED = '11/3';
const BETA = tr(`β版・毎日なおしています（${UPDATED} 更新）`, `Beta — improved every day (updated ${UPDATED})`);
const NEWS = [ // 新しい順。直したら上に足す
  ['11/3', tr('English に切りかえられるように（図鑑・お知らせ・物語カードも）', 'You can now play in English (book, news and story cards too)')],
  ['11/3', tr('育てるのは10歳までずっと無料に。合言葉は物語カードの飾りだけ', 'Raising is now free all the way to age 10. Codes only add story-card decorations')],
  ['11/3', tr('その子だけの「物語カード」（短いお話＋写真を画像で保存・共有）', 'A story card for each fish (a short story + photo to save or share)')],
  ['11/3', tr('お知らせ・遊び方のきまり（配信・動画OK）・直してほしいことの入口', 'News, play rules (streaming and videos OK) and a place to send requests')],
  ['10/17', tr('海への放流と、図鑑がうまった時の思い出ムービー', 'Releasing to the sea, and a memory movie when the book is complete')],
  ['10/17', tr('指でなでる・なかよし度', 'Petting with your finger, and the bond meter')],
  ['10/17', tr('3匹まで同時に育てられるように', 'Raise up to 3 fish at once')],
];
const SEP = tr('・', ' · ');
const TAG = tr('#チョウザメ育成', '#SturgeonKeeper');
const GAME = tr('チョウザメ育成', 'Sturgeon Keeper');
// 1秒あたりに進むゲーム内の日数
const SPEEDS = [
  { d: 0, label: tr('一時停止', 'Paused') }, { d: 1 / 60, label: tr('1日＝1分', '1 day = 1 min') }, { d: 1 / 10, label: tr('1日＝10秒', '1 day = 10 s') },
  { d: 1 / 2, label: tr('1日＝2秒', '1 day = 2 s') }, { d: 2.5, label: tr('1日＝0.4秒', '1 day = 0.4 s') },
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
const licensed = () => { if (R?.lic) return true; try { return localStorage.getItem(LIC_KEY) === '1'; } catch { return false; } };
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
const RELEASE_MIN = 60; // 全長(cm)：これより大きくなったら海へ放流できる
let releasing = false, moviePlaying = false;
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
  else { F.pos.set(0, T.h * 0.3, 0); toast(tr(`🏠 ${T.name}にお引っ越し！`, `🏠 Moved to the ${T.name}!`)); if (bigger) offerNewFish(S, T); }
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
  const turnMax = (yolkStage ? 3 : burst ? 2.2 : food ? 1.4 : 0.8) / (1 + L / 120);
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
  if (pet.t > 0) vWant *= 0.15; // なでられている間は、じっとしている
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
  pet.t = Math.max(0, pet.t - dt);
  const happy = pet.t > 0 ? Math.min(1, pet.t) : 0;
  F.roll = (F.roll || 0) + (rollWant + happy * 0.35 * Math.sin(now * 4) - (F.roll || 0)) * Math.min(1, dt * 2.5); // うれしくて体をゆらす

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
  if (happy) snoutWant = Math.max(snoutWant, 0.5 + 0.3 * Math.sin(now * 5)); // 鼻を上げてごきげん
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
    if (Math.hypot(mp.x - fp.x, mp.z - fp.z) < Math.max(L * 0.14, 0.3) && Math.abs(mp.y - fp.y) < Math.max(L * 0.14, 0.4)) eat(food);
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

// ---------------- 餌 ----------------
function feed(id, quiet) {
  const f = foodById[id];
  if (S.dev < 0) { toast(tr('🥚 卵の時期は餌はいりません。水温を16〜19℃に保ってね', '🥚 Eggs don\'t need food. Keep the water at 16–19°C')); return; }
  const L = len();
  const ok = canEat(f, S.dev, L);
  if (!quiet) {
    if (!ok) {
      if (S.dev < 8) toast(tr('まだ卵黄（お腹の栄養の袋）で育つ時期。口がまだ使えないので食べません', 'Still living on its yolk sac — it can\'t use its mouth yet'));
      else if (id === 'float') { toast(tr('🤔 口が下向きなので、水面に浮く餌はほとんど食べられない…', '🤔 Its mouth faces down, so it can hardly eat floating food…')); unlockFood('float'); }
      else if (L < f.minL || S.dev < f.minD) toast(tr(`まだ体が小さくて${f.name}は食べられないみたい`, `Still too small to eat ${f.name.toLowerCase()}`));
      else toast(tr(`体が大きくなって、${f.name}では小さすぎて見向きもしない`, `Too big now — ${f.name.toLowerCase()} are too small to bother with`));
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
  toast(id === 'float' ? tr('📗 えさ図鑑に「浮くエサ」の注意を記録', '📗 Food book: note about floating food added') : tr(`📗 えさ図鑑に「${f.name}」を追加！`, `📗 Added "${f.name}" to the food book!`));
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
    if (S.dev >= 0) { S.dev = 0; S.age = 0; if (bg) toast(tr(`🐣 ${S.name}がふ化した！`, `🐣 ${S.name} hatched!`)); else hatch(); }
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
    S.aff = Math.max(0, (S.aff || 0) - gdt * 1.5);
    if (dh > 0) dh *= 1 + (S.aff || 0) / 100; // なかよしだと元気が回復しやすい
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
  if (bg) { const want = tankFor(len()); if (want.id !== S.tank) { const bigger = TANKS.indexOf(want) > TANKS.findIndex(t => t.id === S.tank); S.tank = want.id; if (bigger) { toast(tr(`🏠 ${S.name}が${want.name}にお引っ越し！`, `🏠 ${S.name} moved to the ${want.name}!`)); offerNewFish(S, want); } } }
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
  toast(tr('🐣 ふ化した！ お腹の黄色い袋が「卵黄のう」。しばらくはこの栄養で育つよ', '🐣 Hatched! The yellow bag on the belly is the yolk sac — it lives on that for a while'));
}

// ---------------- 図鑑 ----------------
let pendingSnaps = [];
function checkZukan(bg = false) {
  for (const z of ZUKAN) {
    if (S.zukan[z.id] || z.event) continue;
    const t = z.at >= 365 ? S.age : S.dev;
    if (t >= z.at - 1e-6) {
      S.zukan[z.id] = { age: S.age, dev: S.dev, len: len(), img: null };
      if (bg) (S.snapLater ||= []).push(z.id); else pendingSnaps.push(z.id); // 見ていない子の写真は、次に見た時に撮る
      if (z.id === 'y3') { S.sexKnown = true; }
      toast(tr(`📘 ${R.list.length > 1 ? S.name + 'の' : ''}図鑑に「${z.title}」が追加された！`, `📘 "${z.title}" added to ${R.list.length > 1 ? S.name + '\'s' : 'the'} book!`), true);
      save();
      if (!bg && zukanDone(S) && !S.movieSeen) setTimeout(offerMovie, 1800); // 写真を撮ってからすすめる
    }
  }
}
// 図鑑用の写真：魚を横から撮る専用カメラ
const snapCam = new THREE.PerspectiveCamera(32, 1.5, 0.01, 5000);
function takeSnap() {
  const L = len();
  let tgt, d, side;
  if (S.dev < 0) { tgt = egg.position.clone(); d = 0.9; side = new THREE.Vector3(0.6, 0.45, 0.8).normalize(); }
  else {
    const fw = new THREE.Vector3(Math.cos(F.yaw), 0, -Math.sin(F.yaw));
    tgt = F.pos.clone().addScaledVector(fw, L * 0.05); // 頭寄りを真ん中に
    d = L * 1.35 + 0.5;
    side = new THREE.Vector3(Math.sin(F.yaw - 0.55), 0.16, Math.cos(F.yaw - 0.55)).normalize(); // 顔の斜め前
  }
  snapCam.position.copy(tgt).addScaledVector(side, d);
  snapCam.position.y = Math.max(snapCam.position.y, 0.2);
  snapCam.near = d * 0.02; snapCam.far = d * 80 + 2000; snapCam.aspect = innerWidth / innerHeight; snapCam.updateProjectionMatrix();
  snapCam.lookAt(tgt);
  const fd = scene.fog.density; scene.fog.density = 0.12 / d;
  const hidden = [];
  scene.traverse(o => { if (o.visible && (o.userData.plant || o.userData.other)) { o.visible = false; hidden.push(o); } });
  renderer.render(scene, snapCam);
  hidden.forEach(o => { o.visible = true; });
  scene.fog.density = fd;
  // 図鑑の写真（思い出ムービーでも大きく映すので、少し細かめに）
  const c = document.createElement('canvas'); c.width = 540; c.height = 360;
  const src = renderer.domElement, sw = src.width, sh = src.height;
  const r = Math.min(sw / 540, sh / 360) * 0.9;
  c.getContext('2d').drawImage(src, (sw - 540 * r) / 2, (sh - 360 * r) / 2, 540 * r, 360 * r, 0, 0, 540, 360);
  renderer.render(scene, camera);
  return c.toDataURL('image/jpeg', 0.74);
}

// ---------------- カメラ ----------------
const camTarget = new THREE.Vector3();
const cam = { az: 0.6, el: 0.28, zoom: 1, mode: 'follow', dist: 3, view: 'free', lastTouch: -99 };
// 見る角度（魚の向きに合わせて回り込む）
const VIEWS = [
  { id: 'free', label: tr('👀 自由', '👀 Free') }, { id: 'side', label: tr('👀 横から', '👀 Side') }, { id: 'top', label: tr('👀 背中', '👀 Back') },
  { id: 'belly', label: tr('👀 お腹', '👀 Belly') }, { id: 'face', label: tr('👀 顔', '👀 Face') },
];
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
{
  let drag = null; const pts = new Map(); let pinch0 = 0, zoom0 = 1;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY];
    if (pts.size === 1 && hitFish(e.clientX, e.clientY)) { pet.on = true; pet.last = [e.clientX, e.clientY]; drag = null; } try { el.setPointerCapture(e.pointerId); } catch {} if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = cam.zoom; } });
  el.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); cam.zoom = clamp(zoom0 * pinch0 / d, 0.35, 5); return; }
    if (pet.on) { petMove(e.clientX, e.clientY); return; }
    if (!drag) return;
    cam.az -= (e.clientX - drag[0]) * 0.006; cam.el = clamp(cam.el + (e.clientY - drag[1]) * 0.005, -0.7, 1.45); drag = [e.clientX, e.clientY]; cam.lastTouch = performance.now() / 1000;
  });
  const up = (e) => { pts.delete(e.pointerId); if (!pts.size) { drag = null; pet.on = false; } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); cam.zoom = clamp(cam.zoom * Math.exp(e.deltaY * 0.001), 0.35, 5); }, { passive: false });
}
// ---------------- なでる ----------------
const pet = { on: false, last: null, dist: 0, heartDist: 0, t: 0, todayGain: 0, day: -1 };
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hitFish(x, y) {
  if (!S || S.dev < 0 || releasing || !fish.group.visible) return false;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  fish.group.updateMatrixWorld();
  return ray.intersectObject(fish.group, true).length > 0;
}
function petMove(x, y) {
  const d = Math.hypot(x - pet.last[0], y - pet.last[1]); pet.last = [x, y];
  if (d < 1) return;
  if (!hitFish(x, y)) return; // 魚からはずれたら、なでていない
  pet.t = 1.6; pet.dist += d; pet.heartDist += d;
  if (pet.heartDist > 55) { pet.heartDist = 0; spawnHeart(x, y); audio.chime?.(); }
  // なでた分だけ、なかよし度と元気が上がる（1日に上がる量には上限）
  const day = Math.floor(S.age);
  if (day !== pet.day) { pet.day = day; pet.todayGain = 0; }
  if (pet.dist > 120) {
    pet.dist = 0;
    if (pet.todayGain < 12) { pet.todayGain += 1; S.aff = Math.min(100, (S.aff || 0) + 1); }
    S.health = Math.min(100, S.health + 1.5);
    if (Math.random() < 0.08) toast(EN ? ['😊 ' + S.name + ' looks happy!', '💕 That feels nice', '✨ ' + S.name + ' perked up'][Math.floor(Math.random() * 3)] : ['😊 ' + S.name + 'が、うれしそう！', '💕 なでなで、気持ちいいね', '✨ ' + S.name + 'が元気になった'][Math.floor(Math.random() * 3)]);
  }
}
function spawnHeart(x, y) {
  const h = document.createElement('div'); h.className = 'heart';
  h.textContent = ['💗', '💕', '💖', '❤️'][Math.floor(Math.random() * 4)];
  h.style.left = `${x + (Math.random() - 0.5) * 30}px`; h.style.top = `${y - 10}px`;
  h.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1300);
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
    else if (performance.now() / 1000 - cam.lastTouch > 3 && foods.some(f => f.edible) && S.dev >= 9) { tAz = F.yaw + Math.PI / 2 - 0.8; tEl = -0.32; d *= 0.6; faceFocus = true; }
    if (tAz !== null) {
      const k = Math.min(1, dt * 3);
      cam.az += angDiff(tAz, cam.az) * k; cam.el += (tEl - cam.el) * k;
    }
  }
  // 顔を見る時は、体の真ん中ではなく頭（口のあたり）を画面の中心に
  if (faceFocus) want = mouthPos();
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
  if (S.dev < 0) return tr('受精卵', 'Egg');
  if (S.dev < 9) return tr('仔魚（卵黄で成長中）', 'Larva (on yolk)');
  if (S.dev < 27) return tr('仔魚', 'Larva');
  if (len() < 16.5) return tr('稚魚', 'Fry');
  if (S.age < 1095) return tr('若魚', 'Juvenile');
  if (S.age < 2555) return tr('成長中', 'Growing');
  return tr('おとな', 'Adult');
}
function bubbleText() {
  if (S.dev < 0) return S.temp > 20 ? tr('（水があたたかすぎるかも…）', '(The water may be too warm…)') : S.dev > -HATCH_DAYS * 0.45 ? tr('（卵の中で何か動いた！）', '(Something moved inside the egg!)') : tr('（静かに育っている）', '(Growing quietly)');
  if (S.health < 30) return tr('ぐったり… 水と餌と水温を見直して', 'Very tired… check the water, food and temperature');
  if (S.dev < 9) return S.dev > 7 ? tr('そろそろお腹の袋がなくなりそう', 'The yolk sac is almost gone') : tr('卵黄の栄養で育ち中', 'Growing on its yolk');
  if (S.satiety < 20) return tr('お腹すいた…！', 'Hungry…!');
  if (S.water < 45) return tr('水がにごってきた…', 'The water is getting cloudy…');
  if (tempFactor() < 0.8) return S.temp < 18 ? tr('水が冷たくて元気が出ない', 'Too cold to feel lively') : tr('水があたたかすぎる…', 'The water is too warm…');
  if (S.satiety > 90) return tr('お腹いっぱい', 'Full');
  return (EN ? ['Feeling the bottom with its barbels', 'Swimming calmly', 'Gliding over the sand'] : ['ヒゲで底をさぐっている', 'ゆったり泳いでいる', '砂の上をすべるように泳ぐ'])[Math.floor(performance.now() / 6000) % 3];
}
function meter(id, v) { const el = $(id); el.style.width = `${clamp(v, 0, 100)}%`; el.style.background = v < 25 ? '#ff6b6b' : v < 50 ? '#ffc04d' : '#5fd3a0'; }
// 性格をひとことで
const personality = (t) => t.active > 1.15 ? tr('元気いっぱい', 'lively') : t.active < 0.8 ? tr('のんびり屋', 'laid-back') : tr('おだやか', 'gentle');
const SPOT = EN ? { round: 'round spots', long: 'long spots', cluster: 'clustered dots', fine: 'fine spots' } : { round: '丸い斑点', long: '細長い斑点', cluster: '点のかたまり模様', fine: 'こまかい斑点' };
function traitText(t) {
  const w = [];
  w.push(personality(t));
  if (t.curious > 1.2) w.push(tr('好奇心おうせい', 'curious'));
  if (t.sniffy > 1.2) w.push(tr('においに敏感', 'keen nose'));
  if (t.snout > 1.07) w.push(tr('口先すらり', 'slim snout')); else if (t.snout < 0.93) w.push(tr('丸い口先', 'round snout'));
  return tr('性格：', 'Personality: ') + w.join(tr('・', ' · ')) + ' ／ ' + SPOT[t.spotShape];
}
function updateHUD() {
  const L = len();
  $('#name').textContent = S.name;
  $('#btn-release').hidden = !(S.dev >= 0 && len() >= RELEASE_MIN);
  $('#trait').textContent = traitText(ensureTraits(S));
  $('#stage').textContent = stageName();
  $('#age').textContent = fmtAge(S.age);
  $('#len').textContent = S.dev < 0 ? tr('直径 3.2mm', '3.2 mm across') : fmtLength(L);
  $('#wt').textContent = S.dev < 0 ? '' : fmtWeight(weightOf(L));
  $('#sex').textContent = S.sexKnown ? (S.sex === 'メス' ? '♀ ' : '♂ ') + sexName(S.sex) : tr('性別 ？', 'Sex ?');
  meter('#m-sat', S.dev < 9 ? 100 : S.satiety); meter('#m-water', S.water); meter('#m-health', S.health);
  { const el = $('#m-aff'); el.style.width = `${clamp(S.aff || 0, 0, 100)}%`; el.style.background = '#ff8fb3'; }
  $('#sat-label').textContent = S.dev < 9 ? tr('卵黄', 'Yolk') : tr('おなか', 'Food');
  $('#temp-val').textContent = `${S.temp}℃`;
  $('#temp-ok').textContent = tr('適温 ', 'Best ') + (S.dev < 9 ? '16〜19℃' : '18〜22℃');
  $('#temp-ok').className = tempFactor() < 1 ? 'warn' : '';
  $('#bubble').textContent = bubbleText();
  $('#tank-name').textContent = T.name;
  $('#beta').textContent = BETA;
  const lag = S.dev >= 9 ? expectedLength(S.age) : 0;
  $('#pace').textContent = S.dev >= 9 && lag > L * 1.05 ? tr(`標準より少し小さめ（標準 ${fmtLength(lag)}）`, `A bit small (typical: ${fmtLength(lag)})`) : '';
}

function buildFoodMenu() {
  const box = $('#food-list'); box.innerHTML = '';
  for (const f of FOODS) {
    const b = document.createElement('button'); b.className = 'food';
    b.innerHTML = `<span class="ic">${f.icon}</span><span>${f.name}</span>`;
    b.onclick = () => { feed(f.id); $('#food-sheet').classList.remove('open'); };
    box.appendChild(b);
  }
}
function refreshFoodMenu() {
  const L = len();
  document.querySelectorAll('#food-list .food').forEach((b, i) => {
    const f = FOODS[i];
    b.classList.toggle('good', S.dev >= 0 && canEat(f, S.dev, L));
  });
}

function setSpeed(i) {
  R.speed = i;
  document.querySelectorAll('#speed button').forEach((b, k) => b.classList.toggle('on', k === i));
  $('#speed-label').textContent = SPEEDS[i].label;
  if (i >= 3 && !S.autofeed && S.dev >= 0 && !starting) toast(tr('⏩ 速くする時は「おまかせ」をONにすると安心', '⏩ When going fast, turn on "Auto" to be safe'));
}

// 図鑑
function openZukan(tab = 'grow') {
  $('#zukan h2').textContent = R.list.length > 1 ? tr(`📘 ${S.name}の図鑑`, `📘 ${S.name}'s book`) : tr('📘 チョウザメ図鑑', '📘 Sturgeon Book');
  $('#zukan').classList.add('open');
  document.querySelectorAll('#zukan .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const body = $('#zukan-body'); body.innerHTML = '';
  const got = (tab === 'grow' ? ZUKAN.filter(z => S.zukan[z.id]).length + '/' + ZUKAN.length : tab === 'food' ? Object.keys(S.foods).length + '/' + FOODS.length : '');
  $('#zukan-count').textContent = got ? tr(`${got} 発見`, `${got} found`) : '';
  if (tab === 'grow') {
    { const b = document.createElement('button'); b.className = 'story-btn'; b.textContent = tr(`🖼 ${S.name}の物語カードを作る`, `🖼 Make ${S.name}'s story card`); b.onclick = () => showStoryCard(); body.appendChild(b); }
    if (zukanDone(S)) { const b = document.createElement('button'); b.className = 'movie-btn'; b.textContent = tr(`🎬 ${S.name}の思い出ムービーを見る`, `🎬 Watch ${S.name}'s memory movie`); b.onclick = () => startMovie(); body.appendChild(b); }
    for (const z of ZUKAN) {
      const r = S.zukan[z.id];
      const card = document.createElement('div'); card.className = 'card' + (r ? '' : ' locked');
      card.innerHTML = r
        ? `<div class="ph">${r.img ? `<img src="${r.img}" alt="">` : '<div class="noimg">📷</div>'}</div><div class="ti">${z.title}</div><div class="me">${fmtAge(r.age)}${SEP}${r.age < 0 ? tr('直径3.2mm', '3.2 mm') : fmtLength(r.len)}</div>`
        : `<div class="ph"><div class="noimg">？</div></div><div class="ti">？？？</div><div class="me">${z.hint}</div>`;
      if (r) card.onclick = () => showDetail(z.title, r.img, `<p>${z.text}</p><p class="mine">🐟 ${tr(`${S.name}の記録：`, `${S.name}'s record: `)}${fmtAge(r.age)}${SEP}${r.age < 0 ? tr('直径3.2mm', '3.2 mm across') : tr('全長 ', 'length ') + fmtLength(r.len) + SEP + fmtWeight(weightOf(r.len))}</p>${z.id === 'y3' ? `<p class="mine">${tr(`検査の結果：<b>${S.sex}</b>でした`, `The check says: <b>${sexName(S.sex)}</b>`)}</p>` : ''}`);
      body.appendChild(card);
    }
  } else if (tab === 'food') {
    for (const f of FOODS) {
      const r = S.foods[f.id];
      const card = document.createElement('div'); card.className = 'card food-card' + (r ? '' : ' locked');
      card.innerHTML = r ? `<div class="ph"><div class="noimg big">${f.icon}</div></div><div class="ti">${f.name}</div><div class="me">${f.id === 'float' ? tr('⚠ 食べにくい', '⚠ hard to eat') : tr('初めて食べた：', 'First eaten: ') + fmtAge(r.age)}</div>`
        : `<div class="ph"><div class="noimg">？</div></div><div class="ti">？？？</div><div class="me">${tr('まだ食べていない', 'not eaten yet')}</div>`;
      if (r) card.onclick = () => showDetail(f.name, null, `<p>${f.zukan}</p><p class="mine">${tr('食べられる目安：', 'Can eat at: ')}${f.id === 'float' ? tr('ほぼ食べない', 'hardly ever') : `${tr('全長 ', 'length ')}${f.minL}cm〜${f.maxL > 900 ? '' : f.maxL + 'cm'}`}</p>`);
      body.appendChild(card);
    }
  } else if (tab === 'memory') {
    const list = R.released || [];
    if (!list.length) body.innerHTML = `<div class="src"><p>${tr(`まだ放流した子はいません。全長${RELEASE_MIN}cmを過ぎると、情報欄の「🌊 海へ放流する」から海へ送り出せます。`, `No fish released yet. Once a fish is over ${RELEASE_MIN} cm, use "🌊 Release to the sea" in the info panel.`)}</p></div>`;
    for (const r of [...list].reverse()) {
      const card = document.createElement('div'); card.className = 'card';
      const d = new Date(r.date);
      card.innerHTML = `<div class="ph">${r.img ? `<img src="${r.img}" alt="">` : '<div class="noimg">🌊</div>'}</div><div class="ti">${r.name}</div><div class="me">${fmtAge(r.age)}${SEP}${fmtLength(r.len)}<br>${tr(`${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 放流`, `released ${fmtDate(d)}`)}</div>`;
      card.onclick = () => showDetail(tr(`${r.name}の思い出`, `Memories of ${r.name}`), r.img, `<p>${tr(`${fmtAge(r.age)}・全長 ${fmtLength(r.len)}${SEP}${fmtWeight(r.w)}${r.sex ? `・${r.sex}` : ''}で、海へ放流しました。`, `Released to the sea at ${fmtAge(r.age)}, ${fmtLength(r.len)}, ${fmtWeight(r.w)}${r.sex ? `, ${sexName(r.sex)}` : ''}.`)}</p><p class="mine">${tr(`図鑑の記録 ${r.zukan} 個。大きく育ってね。元気でね！`, `${r.zukan} book entries. Grow up big. Take care!`)}</p>${r.story ? `<button class="story-btn" data-rel="${list.indexOf(r)}">${tr('🖼 物語カードを作る', '🖼 Make a story card')}</button>` : ''}`);
      body.appendChild(card);
    }
  } else if (tab === 'news') {
    const url = OFFICIAL_URL.replace('https://', '').replace(/\/$/, '');
    body.innerHTML = EN ? `<div class="src"><h3>${BETA}</h3><p>This game is still being built. I keep improving it little by little, listening to players.</p>
        <h3>Recent changes</h3><ul class="news">${NEWS.map(([d, t]) => `<li><span class="d">${d}</span>${t}</li>`).join('')}</ul></div>
      <div class="src move"><h3>Requests and ideas</h3><p>Tell me what you noticed. Pressing the button opens an X (Twitter) post with ${TAG} (GitHub users can also post <a href="https://github.com/chozame-fan/chozame/issues/new" target="_blank" rel="noopener">here</a>).</p>
        <textarea id="fb-text" maxlength="200" placeholder="e.g. The feed button is hard to tap / I want to know male or female sooner"></textarea>
        <div class="row"><button id="fb-x">Send on X</button></div></div>
      <div class="src move"><h3>Play rules (streaming, videos, screenshots OK)</h3><ul>
        <li>Streams, let's plays, videos and screenshots of this game are <b>free to make without asking</b> — monetized channels and TV are fine too.</li>
        <li>Putting the official URL in your description makes the maker happy.</li>
        <li>The only official URL is <b>${url}</b>. This game never asks for an ID or password.</li></ul></div>`
      : `<div class="src"><h3>${BETA}</h3><p>このゲームはまだ作っている途中です。遊んだ人の声を聞きながら、少しずつ直しています。</p>
        <h3>最近なおしたこと</h3><ul class="news">${NEWS.map(([d, t]) => `<li><span class="d">${d}</span>${t}</li>`).join('')}</ul></div>
      <div class="src move"><h3>直してほしいこと・こうしてほしいこと</h3><p>気づいたことを書いて送ってください。Xに「${TAG}」を付けて投稿する画面が開きます（GitHubを使っている人は<a href="https://github.com/chozame-fan/chozame/issues/new" target="_blank" rel="noopener">こちら</a>からでもOK）。</p>
        <textarea id="fb-text" maxlength="200" placeholder="例：餌のボタンが押しにくい／オスメスが分かるのをもっと早く"></textarea>
        <div class="row"><button id="fb-x">Xで送る</button></div></div>
      <div class="src move"><h3>遊び方のきまり（配信・動画・スクショOK）</h3><ul>
        <li>このゲームの配信・実況・動画・スクショは、<b>許可なしで自由にどうぞ</b>。収益化しているチャンネルやテレビでもOKです。</li>
        <li>説明欄に公式URLを入れてもらえると、作っている人がよろこびます。</li>
        <li>公式のURLは <b>${url}</b> の1つだけです。このゲームがIDやパスワードを聞くことはありません。</li></ul></div>`;
  } else {
    const langRow = `<div class="src lang-row"><h3>言語 / Language</h3><div class="row"><button data-lang="ja" class="${EN ? '' : 'on'}">日本語</button><button data-lang="en" class="${EN ? 'on' : ''}">English</button></div></div>`;
    body.innerHTML = langRow + (EN ? `<div class="src"><p>The numbers in this game are <b>rough guides</b> based on the sources below, mainly about Siberian sturgeon. How sturgeon grow changes a lot with species, water temperature and care. The growth numbers (length at age 1–10) were set for the game from common farming guides.</p><ul>${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('')}</ul></div>
      <div class="src move">
        <h3>Move your save (computer ⇄ phone)</h3>
        <p>Each device has its own save. Press "Export" here → copy the text → paste it into "Import" on the other device to keep playing with the same fish.</p>
        <div class="row"><button id="exp-photo">Export (with photos)</button><button id="exp-lite">Export (no photos, light)</button></div>
        <textarea id="save-code" placeholder="Exported text appears here / paste text from the other device"></textarea>
        <div class="row"><button id="save-copy">Copy</button><button id="save-load">Import</button></div>
        <p id="save-msg"></p>
      </div>
      <div class="src"><h3>Supporter code</h3><p>Raising your fish is free all the way to age 10. A supporter code (${PRICE}) only adds story-card decorations (Sakura, Snow, Gold) — your fish grow the same either way.<br>${licensed() ? '✅ Code entered. All decorations are unlocked. Thank you!' : '<button id="set-key">🔑 Enter a code</button>'}</p></div>
      <div class="src"><button id="btn-reset">Start over (all fish, new egg)</button><p id="reset-msg"></p></div>`
    : `<div class="src"><p>このゲームの数字は、シベリアチョウザメを中心に下の資料を参考にした<b>目安</b>です。チョウザメは種類・水温・飼い方で育ち方が大きく変わります。成長の数字（1歳〜10歳の全長）は養殖の一般的な目安をもとにゲーム用に決めたものです。</p><ul>${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('')}</ul></div>
      <div class="src move">
        <h3>セーブの引っ越し（Mac ⇄ スマホ）</h3>
        <p>セーブは開いている機械ごとに別々です。こちらで「書き出す」→ 出てきた文字をコピー → 引っ越し先の「読み込む」に貼り付けると、同じ子たちの続きから遊べます。</p>
        <div class="row"><button id="exp-photo">書き出す（写真つき）</button><button id="exp-lite">書き出す（写真なし・軽い）</button></div>
        <textarea id="save-code" placeholder="ここに書き出した文字が出ます／引っ越し元の文字を貼り付けます"></textarea>
        <div class="row"><button id="save-copy">コピー</button><button id="save-load">読み込む</button></div>
        <p id="save-msg"></p>
      </div>
      <div class="src"><h3>応援の合言葉</h3><p>育てるのは10歳まで、ずっと無料です。合言葉（${PRICE}）で増えるのは物語カードの飾り（さくら・雪・金）だけで、育ち方は変わりません。<br>${licensed() ? '✅ 合言葉は入力ずみです。飾りが全部使えます。ありがとう！' : '<button id="set-key">🔑 合言葉を入れる</button>'}</p></div>
      <div class="src"><button id="btn-reset">最初からやり直す（全部の子・新しい卵）</button><p id="reset-msg"></p></div>`);
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
  $('#movie-yes').onclick = () => startMovie();
  $('#lock-ok').onclick = enterCode;
  $('#lock-code').onkeydown = (e) => { if (e.key === 'Enter') enterCode(); };
  $('#lock-close').onclick = () => { $('#lock').hidden = true; toast(tr('図鑑の「参考にした資料」から、いつでも入れられます', 'You can enter it any time in Book → Sources & settings')); };
  $('#lock-buy').onclick = () => { if (BUY_URL) open(BUY_URL, '_blank', 'noopener'); else $('#lock-msg').textContent = tr('販売ページは準備中です。もう少しお待ちください', 'The shop page is not ready yet. Please wait a little'); };
  $('#movie-no').onclick = () => { $('#movie-ask').hidden = true; toast(tr('図鑑の「成長の記録」から、いつでも見られるよ', 'You can watch it any time in Book → Growth')); };
  $('#btn-release').onclick = (e) => { e.stopPropagation(); askRelease(); };
  $('#release-yes').onclick = () => startRelease();
  $('#release-no').onclick = () => { $('#release-ask').hidden = true; };
  $('#release-new').onclick = () => afterRelease($('#release-new-name').value || (EN ? ['Stella', 'Rocky', 'Pearl', 'Barbel'] : ['チョウ子', 'チョウ吉', 'チョウ美', 'チョウ丸'])[(R.released?.length || 0) % 4]);
  $('#release-close').onclick = () => afterRelease(null);
  // 水の音：画面を触った後でないと鳴らせないので、ボタンで始める
  const sndOn = () => { try { return localStorage.getItem('chozame-sound') !== '0'; } catch { return true; } };
  const setSnd = (on) => { if (on) audio.start(); else audio.stop(); $('#snd').textContent = on ? tr('🔊 水の音 ON', '🔊 Sound ON') : tr('🔇 水の音 OFF', '🔇 Sound OFF'); $('#snd').classList.toggle('on', on); try { localStorage.setItem('chozame-sound', on ? '1' : '0'); } catch {} };
  $('#snd').textContent = tr('🔇 水の音 OFF', '🔇 Sound OFF');
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
  $('#btn-water').onclick = () => { S.water = Math.min(100, S.water + 45); for (const f of foods.filter(f => f.settled)) { scene.remove(f.mesh); foods.splice(foods.indexOf(f), 1); } toast(tr('💧 水を半分入れかえた。食べ残しも取りのぞいた', '💧 Changed half the water and removed leftovers')); };
  $('#btn-zukan').onclick = () => openZukan('grow');
  $('#zukan-close').onclick = () => $('#zukan').classList.remove('open');
  document.querySelectorAll('#zukan .tabs button').forEach(b => b.onclick = () => openZukan(b.dataset.tab));
  $('#detail-close').onclick = () => $('#detail').classList.remove('open');
  document.querySelectorAll('#speed button').forEach((b, i) => b.onclick = () => setSpeed(i));
  $('#auto').onchange = (e) => { S.autofeed = e.target.checked; toast(S.autofeed ? tr('🍽 おまかせ ON：成長に合った餌と水かえを自動でします', '🍽 Auto ON: the right food and water changes, automatically') : tr('おまかせ OFF：自分で餌と水かえをしよう', 'Auto OFF: feed and change the water yourself')); };
  $('#temp').oninput = (e) => { S.temp = +e.target.value; };
  $('#btn-view').onclick = () => {
    const i = (VIEWS.findIndex(v => v.id === cam.view) + 1) % VIEWS.length;
    cam.view = VIEWS[i].id; cam.mode = 'follow'; $('#btn-cam').innerHTML = `🎥<span class="lbl"> ${tr('追いかけ', 'Follow')}</span>`;
    $('#btn-view').innerHTML = VIEWS[i].label.replace('👀 ', '👀<span class="lbl"> ') + '</span>';
    toast(VIEWS[i].label.replace('👀 ', tr('見る角度：', 'View: ')));
  };
  $('#btn-cam').onclick = () => { cam.mode = cam.mode === 'follow' ? 'tank' : 'follow'; cam.zoom = 1; $('#btn-cam').innerHTML = `🎥<span class="lbl"> ${cam.mode === 'follow' ? tr('追いかけ', 'Follow') : tr('水槽全体', 'Tank')}</span>`; toast(cam.mode === 'follow' ? tr('カメラ：追いかけ', 'Camera: follow') : tr('カメラ：水槽全体', 'Camera: whole tank')); };
  // やり直し：確認の小窓は使えない場所もあるので、2回押して決める
  let resetArm = 0;
  document.body.addEventListener('click', (e) => {
    const id = e.target.id;
    if (id === 'set-key') { $('#zukan').classList.remove('open'); showLock(); }
    if (id === 'card-share') shareCard();
    if (id === 'card-save') saveCard();
    if (id === 'card-x') openX(lastCard.text);
    const deco = e.target.dataset?.deco;
    if (deco) pickDeco(deco);
    const lang = e.target.dataset?.lang;
    if (lang && lang !== LANG) { save(); setLang(lang); return; }
    if (id === 'fb-x') { const t = $('#fb-text').value.trim(); if (!t) { $('#fb-text').placeholder = tr('ここに書いてから押してください', 'Write something first, then press'); return; } openX(tr(`【チョウザメ育成へのお願い】${t}\n${TAG}`, `[Request for Sturgeon Keeper] ${t}\n${TAG}`)); }
    if (id === 'beta') openZukan('news');
    const rel = e.target.dataset?.rel;
    if (rel !== undefined && R.released?.[+rel]) showStoryCard(R.released[+rel]); // 放流後の画面は閉じずに、その上に出す
    if (id === 'btn-reset') {
      if (Date.now() - resetArm < 5000) { resetting = true; try { localStorage.removeItem(SAVE_KEY); } catch {} location.reload(); return; }
      resetArm = Date.now(); e.target.textContent = tr('もう一度押すと全部消えます（5秒以内）', 'Press again within 5 s to erase everything');
      setTimeout(() => { if (e.target.isConnected) e.target.textContent = tr('最初からやり直す（全部の子・新しい卵）', 'Start over (all fish, new egg)'); }, 5000);
    }
    // セーブの引っ越し
    if (id === 'exp-photo' || id === 'exp-lite') {
      save();
      const data = JSON.parse(JSON.stringify(R));
      if (id === 'exp-lite') for (const st of data.list) for (const z of Object.values(st.zukan)) z.img = null;
      const code = 'CZ1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      $('#save-code').value = code;
      $('#save-msg').textContent = tr(`書き出しました（${Math.round(code.length / 1024)}KB）。「コピー」を押して、引っ越し先に貼り付けてください。`, `Exported (${Math.round(code.length / 1024)} KB). Press "Copy" and paste it on the other device.`);
    }
    if (id === 'save-copy') {
      const t = $('#save-code'); t.select();
      navigator.clipboard?.writeText(t.value).then(() => { $('#save-msg').textContent = tr('コピーしました', 'Copied'); }).catch(() => { $('#save-msg').textContent = tr('文字を選んだ状態にしました。長押しでコピーしてください', 'The text is selected. Long-press to copy it'); });
    }
    if (id === 'save-load') {
      try {
        const txt = $('#save-code').value.trim();
        if (!txt.startsWith('CZ1:')) throw new Error();
        const data = JSON.parse(decodeURIComponent(escape(atob(txt.slice(4)))));
        if (!data.list?.length) throw new Error();
        if (e.target.dataset.arm !== '1') { e.target.dataset.arm = '1'; e.target.textContent = tr('もう一度押すと上書きします', 'Press again to overwrite'); $('#save-msg').textContent = tr(`${data.list.map(s => s.name).join('・')} を読み込みます。今のセーブは消えます。`, `This will load ${data.list.map(s => s.name).join(', ')}. Your current save will be erased.`); return; }
        R = data; S = R.list[R.active || 0]; save(); resetting = true; location.reload();
      } catch { $('#save-msg').textContent = tr('読み込めませんでした。「CZ1:」で始まる文字をまるごと貼り付けてください。', 'Could not import. Paste the whole text starting with "CZ1:".'); }
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
  if (S.dev < 0 && Object.keys(S.zukan).length <= 1) toast(tr('🥚 チョウザメの受精卵。ふ化まで約130時間（17℃のとき）', '🥚 A sturgeon egg. About 130 hours to hatch (at 17°C)'));
  renderTabs();
  starting = false;
}

// ---------------- 合言葉 ----------------
function showLock() {
  if (licensed() || releasing || moviePlaying) return;
  $('#lock-text').innerHTML = tr(`育てるのは10歳まで、ずっと無料です。<br><b>応援の合言葉（${PRICE}）</b>を入れると、物語カードの飾り（さくら・雪・金）が使えるようになります。<br><small>払っても、育ち方や結果は変わりません。一度入れれば、このスマホでずっと使えます。</small>`,
    `Raising your fish is free all the way to age 10.<br>A <b>supporter code (${PRICE})</b> unlocks story-card decorations (Sakura, Snow, Gold).<br><small>Paying never changes how your fish grow. Enter it once and it stays on this device.</small>`);
  $('#lock-msg').textContent = ''; $('#lock-code').value = '';
  $('#lock').hidden = false;
}
async function checkCode(txt) {
  const norm = txt.normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('chozame:' + norm));
  return LIC_HASH.includes([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''));
}
async function enterCode() {
  const txt = $('#lock-code').value.trim();
  if (!txt) { $('#lock-msg').textContent = tr('合言葉を入れてください', 'Please enter a code'); return; }
  let ok = false;
  try { ok = await checkCode(txt); } catch { $('#lock-msg').textContent = tr('この画面では確かめられませんでした。ホーム画面のアプリから入れてください', 'Could not check it here. Please enter it from the home-screen app'); return; }
  if (!ok) { $('#lock-msg').textContent = tr('合言葉がちがうようです。もう一度たしかめてください', 'That code doesn\'t look right. Please check it again'); return; }
  R.lic = true; try { localStorage.setItem(LIC_KEY, '1'); } catch {}
  save();
  $('#lock').hidden = true;
  audio.chime();
  toast(tr('🔓 合言葉OK！ 物語カードの飾りが全部使えます。ありがとう！', '🔓 Code OK! All card decorations are unlocked. Thank you!'), true);
  if (lastCard && $('#detail').classList.contains('open')) showStoryCard(lastCard.rec);
}

// ---------------- 物語カード ----------------
// その子だけの短いお話（個性・図鑑の記録・なかよし度から作る）
const STORY_EV = EN ? [
  ['barbel', a => `grew barbels (${fmtAge(a)})`], ['scuteAll', a => `got its full armor (${fmtAge(a)})`],
  ['seed', a => `grew bigger than a hand (${fmtAge(a)})`], ['y1', () => 'turned 1'],
  ['y3', () => 'got a grown-up face at 3'], ['y7', () => 'became an adult at 7'],
] : [
  ['barbel', a => `${fmtAge(a)}でヒゲが生えて`], ['scuteAll', a => `${fmtAge(a)}で体じゅうによろいがそろって`],
  ['seed', a => `${fmtAge(a)}で手のひらより大きくなって`], ['y1', () => '1歳の誕生日をむかえて'],
  ['y3', () => '3歳で大人の顔になって'], ['y7', () => '7歳でりっぱなおとなになって'],
];
const fmtDate = (d) => EN ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
function storyOf(st, L, released) {
  const t = ensureTraits(st), z = st.zukan, d = new Date(st.created);
  const ev = STORY_EV.filter(([id]) => z[id]).slice(-2).map(([id, f]) => f(z[id].age));
  const last = released ? 'どこかの海で、元気に泳いでいますように。'
    : (st.aff || 0) >= 60 ? 'なでると鼻を上げてよろこぶ、なかよしの子。'
    : t.sniffy > 1.2 ? 'ごはんの時は、だれより先に鼻をヒクヒクさせる。'
    : t.curious > 1.2 ? 'よく水面を見上げて、こちらをのぞきに来る。'
    : t.active < 0.8 ? '底でじっと休むのが、いちばん好き。'
    : 'ゆったり泳ぐ姿に、毎日いやされている。';
  if (EN) {
    const who = `${personality(t)}${t.curious > 1.2 ? ', curious' : ''}${st.sexKnown ? ' ' + sexName(st.sex) : ''} sturgeon`;
    const s = [`${st.name} arrived as an egg on ${fmtDate(d)} — a ${who} with ${SPOT[t.spotShape]}.`];
    const did = ev.length ? `It ${ev.join(' and ')}. ` : '';
    if (released) s.push(`${did}At ${fmtAge(st.age)} and ${fmtLength(L)} long, it set off for the sea.`);
    else if (st.dev < 0) s.push('For now it is still inside the egg, waiting to hatch.');
    else s.push(`${did}Now it is ${fmtLength(L)} long.`);
    s.push(released ? 'I hope it is swimming happily somewhere in the sea.'
      : (st.aff || 0) >= 60 ? 'A close friend that lifts its nose with joy when petted.'
      : t.sniffy > 1.2 ? 'At mealtime it is always the first to twitch its nose.'
      : t.curious > 1.2 ? 'It often looks up at the surface to peek at me.'
      : t.active < 0.8 ? 'Resting quietly on the bottom is its favorite thing.'
      : 'Watching it swim calmly makes my day.');
    return s.join(' ');
  }
  const who = `${personality(t)}${t.curious > 1.2 ? 'で好奇心おうせい' : ''}な${st.sexKnown ? st.sex + 'の' : ''}チョウザメ`;
  const s = [`${st.name}は${fmtDate(d)}に卵でやってきた、${SPOT[t.spotShape]}の${who}。`];
  if (released) s.push(`${ev.length ? ev.join('、') + '、' : ''}${fmtAge(st.age)}・全長${fmtLength(L)}で海へ旅立った。`);
  else if (st.dev < 0) s.push('いまはまだ卵の中で、ふ化の日を待っている。');
  else s.push(`${ev.length ? ev.join('、') + '、' : ''}いまは全長${fmtLength(L)}。`);
  s.push(last);
  return s.join('');
}
// カードの飾り。「海」は無料、ほかは応援の合言葉で使える（結果は変わらない）
const DECOS = [
  { id: 'umi', name: tr('海', 'Sea'), top: '#0d4152', bot: '#04161e', acc: '#5fd3a0', tx: '#e9f6f8', sub: '#9fc3cb', free: true },
  { id: 'sakura', name: tr('さくら', 'Sakura'), top: '#7a3a55', bot: '#2a1020', acc: '#ffb7cf', tx: '#fff2f6', sub: '#e6b9c9', petal: '#ffc6d9' },
  { id: 'yuki', name: tr('雪', 'Snow'), top: '#3b5a7a', bot: '#101c2c', acc: '#cfe8ff', tx: '#f4faff', sub: '#b9cde0', petal: '#ffffff' },
  { id: 'kin', name: tr('金', 'Gold'), top: '#4a3a12', bot: '#120d02', acc: '#f0c75e', tx: '#fff6dd', sub: '#d9c38a', frame: '#e0b850' },
];
let decoId = 'umi';
try { decoId = localStorage.getItem('chozame-deco') || 'umi'; } catch {}
const decoNow = () => { const d = DECOS.find(x => x.id === decoId) || DECOS[0]; return d.free || licensed() ? d : DECOS[0]; };
function pickDeco(id) {
  const d = DECOS.find(x => x.id === id); if (!d) return;
  if (!d.free && !licensed()) { showLock(); return; }
  decoId = id; try { localStorage.setItem('chozame-deco', id); } catch {}
  if (lastCard) showStoryCard(lastCard.rec);
}
const loadImg = (src) => new Promise((ok, ng) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ng; im.src = src; });
// 投稿にそのまま使える縦長の画像（写真・名前・お話・公式URL）
async function drawCard({ name, sub, story, img, egg }) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), FONT = '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif', D = decoNow();
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, D.top); bg.addColorStop(1, D.bot);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (D.petal) { // 花びら・雪をちらす（毎回同じ位置）
    let k = 7; const rnd = () => (k = (k * 16807) % 2147483647) / 2147483647;
    g.fillStyle = D.petal;
    for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, a = 0.25 + rnd() * 0.5; if (y > 720 && y < 1240 && x > 40 && x < 1040) continue; g.globalAlpha = a; g.beginPath(); g.ellipse(x, y, 6 + rnd() * 10, 4 + rnd() * 6, rnd() * 3, 0, Math.PI * 2); g.fill(); } // 文字の上にはちらさない
    g.globalAlpha = 1;
  }
  if (D.frame) { g.strokeStyle = D.frame; g.lineWidth = 6; g.strokeRect(12, 12, W - 24, H - 24); g.lineWidth = 2; g.strokeRect(24, 24, W - 48, H - 48); }
  const px = 60, py = 60, pw = 960, ph = 640;
  g.save(); g.beginPath(); g.roundRect(px, py, pw, ph, 24); g.clip();
  g.fillStyle = '#1d5f72'; g.fillRect(px, py, pw, ph);
  if (img) { try { const im = await loadImg(img); const r = Math.max(pw / im.width, ph / im.height); g.drawImage(im, px + (pw - im.width * r) / 2, py + (ph - im.height * r) / 2, im.width * r, im.height * r); } catch {} }
  else { g.font = `200px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(egg ? '🥚' : '🐟', W / 2, py + ph / 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
  g.restore();
  g.fillStyle = D.tx; g.font = `800 66px ${FONT}`; g.fillText(name, px, 800);
  g.fillStyle = D.sub; g.font = `500 34px ${FONT}`; g.fillText(sub, px, 856);
  // お話を折り返す（日本語は、。」で行が始まらないように。英語は単語で折る）
  g.fillStyle = D.tx; g.font = `500 ${EN ? 36 : 38}px ${FONT}`;
  const lines = []; let cur = '';
  for (const ch of EN ? story.split(/(?<= )/) : story) {
    if (cur && g.measureText((cur + ch).trimEnd()).width > pw && !(!EN && '、。」）'.includes(ch))) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  lines.slice(0, 5).forEach((l, i) => g.fillText(l.trimEnd(), px, 936 + i * 58));
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(px, 1222, pw, 2);
  g.fillStyle = D.acc; g.font = `700 32px ${FONT}`; g.fillText(`${GAME} β`, px, 1272);
  g.textAlign = 'right'; g.fillText(TAG, px + pw, 1272);
  g.fillStyle = D.sub; g.font = `500 28px ${FONT}`; g.textAlign = 'left';
  g.fillText(OFFICIAL_URL.replace('https://', '').replace(/\/$/, ''), px, 1316);
  return c;
}
let lastCard = null;
async function showStoryCard(rec) {
  let name, sub, story, img;
  if (rec) { ({ name, story, img } = rec); sub = tr(`${fmtAge(rec.age)}・全長 ${fmtLength(rec.len)}・海へ放流`, `${fmtAge(rec.age)} · ${fmtLength(rec.len)} · released`); }
  else {
    const L = len(); name = S.name; story = storyOf(S, L, false);
    sub = S.dev < 0 ? tr('受精卵・直径3.2mm', 'Egg · 3.2 mm across') : `${fmtAge(S.age)}${SEP}${tr('全長 ', '')}${fmtLength(L)}${SEP}${fmtWeight(weightOf(L))}`;
    img = S.dev >= 0 ? takeSnap() : (ZUKAN.map(z => S.zukan[z.id]?.img).filter(Boolean).pop() || null);
  }
  const c = await drawCard({ name, sub, story, img, egg: !rec && S.dev < 0 });
  lastCard = { c, name, rec, text: `${story}\n${TAG}\n${OFFICIAL_URL}` };
  const cur = decoNow().id;
  const decos = DECOS.map(d => `<button data-deco="${d.id}" class="${d.id === cur ? 'on' : ''}">${d.free || licensed() ? '' : '🔒'}${d.name}</button>`).join('');
  showDetail(tr(`${name}の物語`, `${name}'s story`), null, `<img class="card-img" src="${c.toDataURL('image/jpeg', 0.9)}" alt="${tr(`${name}の物語カード`, `${name}'s story card`)}" style="width:100%;display:block">
    <div class="card-btns"><button id="card-share">${tr('共有する', 'Share')}</button><button id="card-save">${tr('画像を保存', 'Save image')}</button><button id="card-x">${tr('Xに投稿する', 'Post on X')}</button></div>
    <div class="deco-row">${decos}</div>
    <p style="font-size:12px;color:var(--sub)">${tr('飾り：「海」は無料。🔒は応援の合言葉で使えます（育ち方は変わりません）。<br>スマホは画像を長押しでも保存できます。Xに投稿する時は、保存した画像を添付してください。', 'Decorations: "Sea" is free. 🔒 ones unlock with a supporter code (it doesn\'t change how fish grow).<br>On phones you can also long-press the image to save it. When posting on X, attach the saved image.')}</p>`);
}
function cardBlob() { return new Promise(ok => lastCard.c.toBlob(ok, 'image/jpeg', 0.9)); }
const cardFile = () => tr(`${lastCard.name}の物語.jpg`, `${lastCard.name}-story.jpg`);
async function saveCard() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(await cardBlob()); a.download = cardFile();
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function shareCard() {
  const file = new File([await cardBlob()], cardFile(), { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: lastCard.text }); } catch {} }
  else { saveCard(); toast(tr('この画面では共有できないので、画像を保存しました', 'Sharing isn\'t available here, so the image was saved')); }
}
const openX = (text) => open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

// ---------------- 思い出ムービー ----------------
const zukanDone = (st) => ZUKAN.every(z => st.zukan[z.id]);
function offerMovie() {
  if (releasing || moviePlaying) return;
  $('#movie-ask-text').innerHTML = tr(`🎉 図鑑がぜんぶうまりました！<br><b>${S.name}</b>の思い出ムービーを見る？`, `🎉 The book is complete!<br>Watch <b>${S.name}</b>'s memory movie?`);
  $('#movie-ask').hidden = false;
}
function startMovie(trial = false) {
  $('#movie-ask').hidden = true; $('#zukan').classList.remove('open'); $('#detail').classList.remove('open');
  const st = S, L = len();
  const entries = ZUKAN.filter(z => st.zukan[z.id]).map(z => {
    const r = st.zukan[z.id];
    return { title: z.title, sub: `${fmtAge(r.age)}${SEP}${r.age < 0 ? tr('直径3.2mm', '3.2 mm across') : tr('全長 ', '') + fmtLength(r.len)}`, img: r.img, line: z.line, emoji: r.age < 0 ? '🥚' : '🐟' };
  });
  const finale = `${tr('全長 ', '')}${fmtLength(L)}${SEP}${fmtWeight(weightOf(L))}${st.sexKnown ? SEP + sexName(st.sex) : ''}<br>${tr('図鑑', 'Book')} ${entries.length} / ${ZUKAN.length}`;
  const wasOn = audio.on; audio.stop();
  moviePlaying = true;
  $('#hud').hidden = true; $('#bottom').hidden = true; $('#ruler').hidden = true; $('#toasts').innerHTML = ''; toastQ = [];
  const opts = trial ? { heading: tr(`${st.name}の思い出`, `Memories of ${st.name}`), subheading: tr(`ここまでの${entries.length}まい（お試し）`, `${entries.length} photos so far (preview)`), lines: [tr('ここまで大きくなったね。', 'Look how big you\'ve grown.'), tr(`これからもよろしくね、${st.name}。`, `Let\'s keep going, ${st.name}.`)] } : {};
  playMemoryMovie({ name: st.name, entries, finale, ...opts, onDone: () => {
    moviePlaying = false; if (!trial) st.movieSeen = true; save();
    $('#hud').hidden = false; $('#bottom').hidden = false; $('#ruler').hidden = false;
    if (wasOn) audio.start();
    last = performance.now();
  } });
}

// ---------------- 海へ放流 ----------------
function askRelease() {
  $('#release-ask-text').innerHTML = tr(`<b>${S.name}</b>（${fmtAge(S.age)}・全長 ${fmtLength(len())}）を海へ放流しますか？<br>放流すると、この子はもう水槽には戻りません。図鑑の「思い出」に記録が残ります。`, `Release <b>${S.name}</b> (${fmtAge(S.age)}, ${fmtLength(len())}) to the sea?<br>Once released, it won't come back to the tank. Its record stays in Book → Memories.`);
  $('#release-ask').hidden = false;
}
function startRelease() {
  $('#release-ask').hidden = true;
  $('#zukan').classList.remove('open'); $('#food-sheet').classList.remove('open');
  releasing = true;
  $('#hud').hidden = true; $('#bottom').hidden = true; $('#ruler').hidden = true; $('#toasts').innerHTML = ''; toastQ = [];
  for (const f of foods.splice(0)) scene.remove(f.mesh);
  const st = S, L = len();
  const rec = { name: st.name, age: st.age, len: L, w: weightOf(L), sex: st.sexKnown ? st.sex : null, date: Date.now(), img: null, zukan: Object.keys(st.zukan).length, story: storyOf(st, L, true) };
  playRelease({
    renderer, st, len: L, look: lookFor(st.dev, L), traits: ensureTraits(st), audio,
    onSnap: (cv) => {
      const c = document.createElement('canvas'); c.width = 360; c.height = 240;
      const r = Math.min(cv.width / 360, cv.height / 240);
      c.getContext('2d').drawImage(cv, (cv.width - 360 * r) / 2, (cv.height - 240 * r) / 2, 360 * r, 240 * r, 0, 0, 360, 240);
      rec.img = c.toDataURL('image/jpeg', 0.8);
    },
    onDone: () => {
      (R.released ||= []).push(rec);
      R.list.splice(R.list.indexOf(st), 1);
      save();
      releasing = false; resize();
      showReleaseDone(rec);
    },
  });
}
function showReleaseDone(rec) {
  $('#release-done-img').innerHTML = rec.img ? `<img src="${rec.img}" alt="">` : '';
  $('#release-done-text').innerHTML = `${tr(`<b>${rec.name}</b>を海へ放流しました。`, `<b>${rec.name}</b> was released to the sea.`)}<br>${fmtAge(rec.age)}${SEP}${tr('全長 ', '')}${fmtLength(rec.len)}${SEP}${fmtWeight(rec.w)}<br>${tr('大きく育ってね。元気でね！', 'Grow up big. Take care!')}<br><button class="story-btn" style="width:100%;margin-top:8px" data-rel="${R.released.length - 1}">${tr('🖼 物語カードを作る', '🖼 Make a story card')}</button>`;
  const room = R.list.length < MAX_FISH;
  $('#release-new').hidden = !room;
  $('#release-new-name').hidden = !room;
  $('#release-new-name').value = '';
  $('#release-close').hidden = R.list.length === 0; // ほかに子がいなければ、新しい卵を育てる
  $('#release-done-q').textContent = R.list.length === 0 ? tr('水槽があいたよ。新しい卵を育てよう！', 'The tank is free. Let\'s raise a new egg!') : room ? tr('水槽があいたよ。もう1匹、卵から育てる？', 'A tank is free. Raise another one from an egg?') : '';
  $('#release-done').hidden = false;
}
function afterRelease(newName) {
  $('#release-done').hidden = true;
  $('#hud').hidden = false; $('#bottom').hidden = false; $('#ruler').hidden = false;
  if (newName) {
    const ns = newState(newName.slice(0, 12)); ns.autofeed = R.list[0]?.autofeed ?? false;
    R.list.push(ns); save();
    R.active = -1; switchTo(R.list.length - 1);
    toast(tr(`🥚 ${ns.name}の卵を受け取った！`, `🥚 You got ${ns.name}'s egg!`));
  } else { R.active = -1; switchTo(0); }
  tabsKey = ''; renderTabs();
}

// ---------------- 何匹も育てる ----------------
// 引っ越しの時、あいた水槽でもう1匹育てるか聞く
function offerNewFish(st, newTank) {
  if (R.list.length >= MAX_FISH || !$('#newfish').hidden) return;
  $('#newfish-text').innerHTML = tr(`${st.name}が<b>${newTank.name}</b>へ引っ越して、前の水槽があいたよ。<br>もう1匹、卵から育てる？（最大${MAX_FISH}匹・あと${MAX_FISH - R.list.length}匹）`, `${st.name} moved to the <b>${newTank.name}</b>, so the old tank is free.<br>Raise another one from an egg? (up to ${MAX_FISH} fish, ${MAX_FISH - R.list.length} more)`);
  $('#newfish-name').value = '';
  $('#newfish').hidden = false;
}
function addFish(name) {
  const ns = newState(name);
  ns.temp = 17; ns.autofeed = S.autofeed;
  R.list.push(ns); save();
  switchTo(R.list.length - 1);
  toast(tr(`🥚 ${name}の卵を受け取った！ 上の名前ボタンで見る子を切りかえられるよ`, `🥚 You got ${name}'s egg! Switch fish with the name buttons at the top`));
}
// 見る子を切りかえる
function switchTo(i) {
  if (i === R.active && S === R.list[i]) return;
  if (S && !R.list.includes(S)) pendingSnaps = []; // 放流した子の撮り残しは捨てる
  if (pendingSnaps.length && R.list.includes(S)) { (S.snapLater ||= []).push(...pendingSnaps); pendingSnaps = []; }
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
  const short = (st) => st.dev < 0 ? tr('卵', 'egg') : st.age < 365 ? tr(`${Math.floor(st.age)}日`, `day ${Math.floor(st.age)}`) : tr(`${Math.floor(st.age / 365)}歳`, `${Math.floor(st.age / 365)} yr`);
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

$('#newfish-go').onclick = () => { $('#newfish').hidden = true; addFish(($('#newfish-name').value || (EN ? ['Stella', 'Rocky', 'Pearl'] : ['チョウ子', 'チョウ吉', 'チョウ美'])[R.list.length % 3]).slice(0, 12)); };
$('#newfish-no').onclick = () => { $('#newfish').hidden = true; toast(tr('また次の引っ越しの時に聞くね', 'I\'ll ask again at the next move')); };
$('#intro-beta').textContent = `${BETA} ／ ${tr('配信・動画・スクショOK', 'streaming, videos & screenshots OK')}`;
$('#intro-lang').textContent = EN ? '🌐 日本語で遊ぶ' : '🌐 Play in English';
$('#intro-lang').onclick = () => setLang(EN ? 'ja' : 'en');
if (!S) {
  $('#intro').hidden = false;
  $('#intro-go').onclick = () => {
    S = newState(($('#intro-name').value || tr('チョウ太', 'Sturgie')).slice(0, 12));
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
  if (releasing || moviePlaying) return; // 放流やムービーを流している間は、水槽は止める
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
    updateFish(dt);
    updateFoods(dt, paused ? 0 : dt * SPEEDS[R.speed].d);
    tank.update(dt, time, camera, camTarget);
    others.update(dt, time, S.dev >= 0 ? F.pos : egg.position, Math.max(len() * 0.6, 1));
    updateCamera(dt);
    if ((time * 4 | 0) !== ((time - dt) * 4 | 0)) { updateHUD(); renderTabs(); }
  }
  renderer.render(scene, camera);
  if (pendingSnaps.length && S) { // 図鑑の写真は描いた直後に撮る
    const img = takeSnap();
    for (const id of pendingSnaps) if (S.zukan[id]) S.zukan[id].img = img;
    pendingSnaps = []; save();
  }
}
requestAnimationFrame(loop);

// 確認用
window.__cz = { audio, startMovie, offerMovie, get S() { return S; }, get R() { return R; }, switchTo, addFish, offerNewFish, reset() { resetting = true; localStorage.removeItem(SAVE_KEY); location.reload(); }, F, foods, feed, sim, camera, cam, camTarget, others, fish, frame, updateHUD, showLock, licensed, showStoryCard, setDev(d) { S.dev = d; S.age = d; } };

// アプリとして使えるように（ホーム画面に追加・オフライン）
if ('serviceWorker' in navigator && isSecureContext && !new URLSearchParams(location.search).has('test')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
