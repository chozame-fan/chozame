// 海への放流シーン：夕暮れの海に放す → 水中で青い海の奥へ泳いでいく
// 単位は cm（魚の大きさと同じ）
import * as THREE from 'three';
import { Fish, lookFor } from './fish.js';

const SKY_TOP = new THREE.Color('#1d3a6e'), SKY_MID = new THREE.Color('#e88a5a'), SKY_LOW = new THREE.Color('#ffd29a');
const SUN_DIR = new THREE.Vector3(0, 0.07, -1).normalize();

// 空：上は深い青、水平線は夕焼けのオレンジ。太陽のにじみ
function makeSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: SKY_TOP }, uMid: { value: SKY_MID }, uLow: { value: SKY_LOW }, uSun: { value: SUN_DIR } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uTop, uMid, uLow, uSun; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 c = mix(uLow, uMid, smoothstep(-0.02, 0.12, h));
        c = mix(c, uTop, smoothstep(0.1, 0.55, h));
        float s = max(dot(normalize(vDir), uSun), 0.0);
        c += vec3(1.0, 0.75, 0.45) * pow(s, 18.0) * 0.6 + vec3(1.0, 0.95, 0.8) * pow(s, 900.0) * 3.0; // 太陽
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(400000, 32, 16), m);
}

// 海面：いくつもの波を重ねて動かす。空の映り込みと、太陽の光の道
function makeOcean() {
  const g = new THREE.PlaneGeometry(600000, 600000, 8, 8); g.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uTop: { value: SKY_TOP }, uMid: { value: SKY_MID }, uLow: { value: SKY_LOW }, uSun: { value: SUN_DIR } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: `uniform float uTime; uniform vec3 uTop, uMid, uLow, uSun; varying vec3 vW;
      vec3 sky(vec3 r){ float h = r.y; vec3 c = mix(uLow, uMid, smoothstep(-0.02, 0.12, h)); return mix(c, uTop, smoothstep(0.1, 0.55, h)); }
      void main(){
        vec2 p = vW.xz;
        float dist = length(p - cameraPosition.xz);
        float fadeK = 1.0 / (1.0 + dist / 4000.0); // 遠くの細かい波は弱める（ちらつき防止）
        vec2 n = vec2(0.0);
        vec2 d; float a, k, w, f;
        d = normalize(vec2(1.0, 0.6));  a = 26.0; k = 0.0035; w = 0.9; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f);
        d = normalize(vec2(-0.7, 1.0)); a = 14.0; k = 0.006;  w = 1.3; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f);
        d = normalize(vec2(0.2, -1.0)); a = 7.0;  k = 0.013;  w = 1.9; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f) * fadeK;
        d = normalize(vec2(1.0, -0.3)); a = 3.5;  k = 0.03;   w = 2.7; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f) * fadeK;
        d = normalize(vec2(-0.3, -0.8)); a = 1.6; k = 0.07;   w = 3.6; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f) * fadeK;
        d = normalize(vec2(0.9, 0.9));  a = 0.7;  k = 0.15;   w = 4.4; f = dot(d, p) * k + uTime * w; n -= d * a * k * cos(f) * fadeK;
        vec3 N = normalize(vec3(n.x, 1.0, n.y));
        vec3 V = normalize(cameraPosition - vW);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 deep = vec3(0.02, 0.11, 0.18);
        vec3 c = mix(deep, sky(R), fres);
        float s = max(dot(R, uSun), 0.0);
        c += vec3(1.0, 0.8, 0.55) * (pow(s, 90.0) * 1.6 + pow(s, 700.0) * 6.0); // 夕日の光の道（きらきら）
        c = mix(c, uLow * 0.92, smoothstep(40000.0, 250000.0, dist)); // 遠くは水平線の色に
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return new THREE.Mesh(g, m);
}

function softDot() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// 水中の砂地（波の模様）
function sandTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = '#b9a77e'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) for (let x = 0; x < 512; x += 2) {
    const v = Math.sin(x * 0.07 + Math.sin(y * 0.03) * 2.5) * 0.5 + Math.random() * 0.3;
    g.fillStyle = `rgba(${v > 0.3 ? '255,240,210' : '90,75,50'},${Math.abs(v) * 0.15})`; g.fillRect(x, y, 2, 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function playRelease({ renderer, st, len, look, traits, audio, onSnap, onDone }) {
  const W = () => innerWidth, H = () => innerHeight;
  const L = len;
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 5, 900000);
  const tex = softDot();

  // ---------- 海の上 ----------
  const top = new THREE.Scene();
  top.add(makeSky());
  const ocean = makeOcean(); top.add(ocean);
  top.add(new THREE.HemisphereLight(0xffe2c4, 0x23465a, 1.6));
  const sunL = new THREE.DirectionalLight(0xffc89a, 2.2); sunL.position.copy(SUN_DIR).multiplyScalar(1000); top.add(sunL);
  const fishTop = new Fish(); fishTop.setTraits(traits); fishTop.build(look); fishTop.group.scale.setScalar(L); top.add(fishTop.group);
  // しぶき
  const NS = 260, sp = new Float32Array(NS * 3), sv = [];
  for (let i = 0; i < NS; i++) sv.push(new THREE.Vector3());
  const splashG = new THREE.BufferGeometry(); splashG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const splash = new THREE.Points(splashG, new THREE.PointsMaterial({ map: tex, size: 18, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0 }));
  top.add(splash);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; top.add(ring);

  // ---------- 水の中 ----------
  const under = new THREE.Scene();
  const uw = new THREE.Color('#1a6d8c');
  under.background = uw; under.fog = new THREE.FogExp2(uw, 0.0011);
  under.add(new THREE.HemisphereLight(0xbfefff, 0x2c4a3a, 1.8));
  const ul = new THREE.DirectionalLight(0xffffff, 1.4); ul.position.set(200, 1000, 300); under.add(ul);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ map: sandTex(), roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -900; under.add(floor);
  // 光の柱
  const rays = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(150 + Math.random() * 250, 2600), new THREE.MeshBasicMaterial({ map: tex, color: 0xd8f6ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set((Math.random() - 0.5) * 3000, -200, -Math.random() * 3000);
    m.rotation.z = 0.25 + Math.random() * 0.15; m.userData.ph = Math.random() * 6;
    under.add(m); rays.push(m);
  }
  // ちりと泡
  const ND = 900, dp = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) { dp[i * 3] = (Math.random() - 0.5) * 3000; dp[i * 3 + 1] = -900 + Math.random() * 900; dp[i * 3 + 2] = -Math.random() * 3500 + 500; }
  const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  under.add(new THREE.Points(dustG, new THREE.PointsMaterial({ map: tex, size: 6, transparent: true, opacity: 0.55, depthWrite: false, color: 0xe8fff8 })));
  const NB = 40, bp = new Float32Array(NB * 3);
  const bubG = new THREE.BufferGeometry(); bubG.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bubbles = new THREE.Points(bubG, new THREE.PointsMaterial({ map: tex, size: 10, transparent: true, opacity: 0.8, depthWrite: false }));
  under.add(bubbles);
  const fishU = new Fish(); fishU.setTraits(traits); fishU.build(look); fishU.group.scale.setScalar(L); under.add(fishU.group);
  // 海の小魚の群れ
  const school = [];
  const sg = new THREE.SphereGeometry(1, 10, 6); sg.scale(1, 0.25, 0.12);
  const sm = new THREE.MeshStandardMaterial({ color: 0xcfe6ee, metalness: 0.6, roughness: 0.3 });
  for (let i = 0; i < 60; i++) {
    const m = new THREE.Mesh(sg, sm); m.scale.setScalar(14 + Math.random() * 6);
    m.userData = { o: new THREE.Vector3((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 220, (Math.random() - 0.5) * 300), ph: Math.random() * 6 };
    under.add(m); school.push(m);
  }

  // ---------- 文字と最後のカード ----------
  const ov = document.getElementById('release');
  const msg = document.getElementById('release-msg'), fade = document.getElementById('release-fade'), card = document.getElementById('release-card');
  ov.hidden = false; card.hidden = true; msg.textContent = ''; msg.className = '';
  const say = (text) => { msg.textContent = text; msg.className = 'show'; };
  const hush = () => { msg.className = ''; };

  let t = 0, last = performance.now(), done = false, splashed = false, snapped = false;
  const fishTopPos = new THREE.Vector3();
  const skip = () => { t = Math.max(t, 15.5); };
  document.getElementById('release-skip').onclick = skip;

  const step = (now) => {
    if (done) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    camera.aspect = W() / H(); camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    let scene;
    if (t < 4.2) {
      // 海の上：夕暮れの海へ、そっと放す
      scene = top;
      ocean.material.uniforms.uTime.value = t + 3;
      camera.position.set(60 + Math.sin(t * 0.15) * 20, 230 - t * 6, 760 - t * 25);
      camera.lookAt(0, 30, -900);
      const k = Math.min(1, Math.max(0, (t - 1.0) / 1.7)); // 放す動き
      // カメラの前から、弧をえがいて海へ飛びこむ
      // 手前の左から、横向きの姿を見せながら弧をえがいて海へ
      fishTopPos.set(-160 + 200 * k, 170 * (1 - k) + 70 * Math.sin(Math.PI * k), 500 - 330 * k);
      fishTop.group.position.copy(fishTopPos);
      fishTop.group.rotation.set(0, 1.05, 0.45 - k * 1.4);
      fishTop.setSwim(t * 9, 0.05, 0, 0.3); fishTop.setExpr(0.3, 0, 0, 0);
      fishTop.group.visible = k < 0.98;
      if (!splashed && k >= 0.97) {
        splashed = true; audio?.splash(true);
        for (let i = 0; i < NS; i++) {
          sp[i * 3] = fishTopPos.x; sp[i * 3 + 1] = 0; sp[i * 3 + 2] = fishTopPos.z;
          const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 160;
          sv[i].set(Math.cos(a) * r, 220 + Math.random() * 380, Math.sin(a) * r);
        }
        ring.position.set(fishTopPos.x, 2, fishTopPos.z);
      }
      if (splashed) {
        for (let i = 0; i < NS; i++) { sv[i].y -= 900 * dt; sp[i * 3] += sv[i].x * dt; sp[i * 3 + 1] = Math.max(-5, sp[i * 3 + 1] + sv[i].y * dt); sp[i * 3 + 2] += sv[i].z * dt; }
        splashG.attributes.position.needsUpdate = true;
        splash.material.opacity = Math.max(0, 1 - (t - 2.7) * 0.8);
        const rs = (t - 2.7) * 260; ring.scale.setScalar(rs); ring.material.opacity = Math.max(0, 0.6 - (t - 2.7) * 0.4);
      }
      if (t > 1.2 && t < 3.6) say('大きく育ってね');
      if (t > 3.4) hush();
      fade.style.opacity = t < 0.8 ? 1 - t / 0.8 : t > 3.6 ? Math.min(1, (t - 3.6) / 0.6) : 0;
      fade.style.background = t > 3.6 ? '#bfe9f5' : '#000';
    } else {
      // 水の中：青い海の奥へ泳いでいく
      scene = under;
      const u = t - 4.2;
      fade.style.opacity = u < 0.8 ? 1 - u / 0.8 : t > 14.6 ? Math.min(1, (t - 14.6) / 0.9) : 0;
      fade.style.background = t > 14.6 ? '#0c2f40' : '#bfe9f5';
      const fx = Math.sin(u * 0.35) * 120, fz = 100 - u * 55 - u * u * 6; // ゆっくり奥へ
      const fy = -420 - u * 18 + Math.sin(u * 0.8) * 25;
      fishU.group.position.set(fx, fy, fz);
      const yaw = Math.PI / 2 + Math.cos(u * 0.35) * 0.3;
      fishU.group.rotation.set(0, yaw, -0.06);
      fishU.setSwim(u * (5 + u * 0.5), 0.035, -Math.sin(u * 0.35) * 0.04, 0.2 * Math.sin(u * 2));
      fishU.setExpr(0.1 * Math.sin(u), 0, -0.3, 0.1 * Math.sin(u * 2));
      // 斜め後ろからついていき、だんだん離れて見送る
      camera.position.set(fx + 230 - u * 6, fy + 50 + Math.sin(u * 0.5) * 10, fz + 240 + u * u * 4.5);
      camera.lookAt(fx, fy + 5, fz - 40);
      for (const r of rays) r.material.opacity = 0.05 + 0.05 * Math.sin(t * 0.5 + r.userData.ph);
      for (let i = 0; i < NB; i++) { bp[i * 3] = fx + Math.sin(i * 7.3) * 30; bp[i * 3 + 1] = fy + ((u * 120 + i * 37) % 600); bp[i * 3 + 2] = fz + Math.cos(i * 3.1) * 30 + 60; }
      bubG.attributes.position.needsUpdate = true;
      bubbles.material.opacity = Math.max(0, 0.8 - u * 0.15);
      for (const m of school) {
        const o = m.userData.o, sx = -1600 + u * 260;
        m.position.set(sx + o.x + Math.sin(t * 2 + m.userData.ph) * 20, -250 + o.y, -1300 + o.z);
        m.rotation.set(0, 0, Math.sin(t * 8 + m.userData.ph) * 0.1);
      }
      if (u > 2.6 && u < 8.6) say(`元気でね、${st.name}！`); else hush();
      if (!snapped && u > 3.2) { snapped = true; renderer.render(scene, camera); onSnap?.(renderer.domElement); }
    }
    renderer.render(scene, camera);
    if (t > 15.6) { finish(); return; }
    requestAnimationFrame(step);
  };
  const finish = () => {
    done = true; hush();
    fade.style.opacity = 0; ov.hidden = true;
    for (const s of [top, under]) s.traverse(o => { o.geometry?.dispose?.(); });
    onDone?.();
  };
  // 確認用：時間を進める
  window.__rel = { tick(sec) { last = performance.now() - sec * 1000; step(performance.now()); }, get t() { return t; } };
  requestAnimationFrame((n) => { last = n; step(n); });
}
