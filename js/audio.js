// 水の音をその場で作る（録音した音は使わない）
// せせらぎ・エアーの泡・ときどき鳥の声。手を入れる音、指パクの音も。
export class WaterAudio {
  constructor() { this.ctx = null; this.on = false; this.birds = false; }

  // 音はユーザーが画面を触った後でないと鳴らせないので、ボタンから呼ぶ
  start() {
    if (!this.ctx) this.build();
    this.ctx.resume();
    this.on = true;
    this.master.gain.setTargetAtTime(1.6, this.ctx.currentTime, 0.8);
  }
  stop() {
    if (!this.ctx) return;
    this.on = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  noiseBuffer(sec, kind) {
    const ctx = this.ctx, n = ctx.sampleRate * sec, buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else if (kind === 'white') d[i] = w;
        else { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; } // ピンクノイズ
      }
    }
    return buf;
  }

  build() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    // せせらぎ：ノイズをいくつかの帯域に分け、ゆっくり強弱をつける
    const pink = this.noiseBuffer(6, 'pink'), brown = this.noiseBuffer(6, 'brown');
    // 細かくランダムにゆれる音量（水がちょろちょろ落ちる時の、こまかな強弱）
    const white = this.noiseBuffer(4, 'white');
    const flutter = (target, base, rate, depth) => {
      const m = ctx.createBufferSource(); m.buffer = white; m.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = rate;
      const mg = ctx.createGain(); mg.gain.value = base * depth * 4;
      m.connect(lp); lp.connect(mg); mg.connect(target); m.start(0, Math.random() * 3);
    };
    const layer = (buf, type, freq, q, gain, pan, flRate, flDepth) => {
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      if (flRate) flutter(g.gain, gain, flRate, flDepth);
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      src.connect(f); f.connect(g); g.connect(p); p.connect(this.master);
      src.start(0, Math.random() * 5);
    };
    // 水族館の水槽の音：波のような大きなうねりは入れない
    layer(brown, 'lowpass', 260, 0.6, 0.07, 0, 0, 0);              // 水槽の水のこもった低い音（一定）
    layer(pink, 'bandpass', 650, 0.9, 0.26, 0.35, 9, 0.6);         // ろ過器の出口から水が落ちる「じゃー」
    layer(pink, 'bandpass', 1900, 1.4, 0.22, 0.45, 16, 0.9);       // 水面に落ちる「ちょろちょろ」
    layer(pink, 'bandpass', 3600, 1.8, 0.08, 0.3, 22, 1.0);       // 細かい水しぶき
    // ポンプのかすかなうなり
    const hum = ctx.createOscillator(); hum.frequency.value = 100;
    const hg = ctx.createGain(); hg.gain.value = 0.006; hum.connect(hg); hg.connect(this.master); hum.start();
    this.loop();
  }

  // エアーストーンの泡（ぶくぶく）と、ときどき水滴
  loop() {
    const tick = () => {
      if (this.ctx && this.on) {
        this.bubble(0.015 + Math.random() * 0.035, true);
        if (Math.random() < 0.25) this.bubble(0.03 + Math.random() * 0.03, true);
        if (Math.random() < 0.012) this.drip();
        if (this.birds && Math.random() < 0.004) this.bird();
      }
      setTimeout(tick, 35 + Math.random() * 70);
    };
    tick();
  }

  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }

  // エアーの泡：ぽこっ（音程が上がる短い音）
  bubble(vol = 0.06, fine = false) {
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    const f0 = fine ? 700 + Math.random() * 1300 : 250 + Math.random() * 500;
    const len = fine ? 0.025 + Math.random() * 0.02 : 0.06;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (1.6 + Math.random()), t + len);
    this.env(g, t, 0.003, vol, len + 0.01); p.pan.value = -0.55 + Math.random() * 0.25; // エアーストーンは左奥
    o.connect(g); g.connect(p); p.connect(this.master); o.start(t); o.stop(t + 0.1);
  }
  // 水滴：ぴちょん
  drip() {
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    const f0 = 900 + Math.random() * 900;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.8, t + 0.04);
    this.env(g, t, 0.003, 0.05, 0.12); p.pan.value = Math.random() * 2 - 1;
    o.connect(g); g.connect(p); p.connect(this.master); o.start(t); o.stop(t + 0.2);
  }
  // 小鳥：ちゅちゅっ
  bird() {
    const ctx = this.ctx, n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 1800, pan = Math.random() * 2 - 1;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * (0.09 + Math.random() * 0.05), o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.05); o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.08);
      this.env(g, t, 0.01, 0.025, 0.07); p.pan.value = pan;
      o.connect(g); g.connect(p); p.connect(this.master); o.start(t); o.stop(t + 0.1);
    }
  }
  // なでた時のきらっとした音
  chime() {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime, base = 880 * Math.pow(2, Math.floor(Math.random() * 5) / 12);
    for (const [i, m] of [[0, 1], [1, 1.5]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.value = base * m; this.env(g, t + i * 0.07, 0.005, 0.05, 0.35);
      o.connect(g); g.connect(this.master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.45);
    }
  }
  // 手を水に入れる：ちゃぽん
  splash(big = false) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuffer(0.6, 'pink');
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(big ? 900 : 1400, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.4); f.Q.value = 0.8;
    const g = ctx.createGain(); this.env(g, t, 0.01, big ? 0.6 : 0.4, 0.45);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
    for (let i = 0; i < 5; i++) setTimeout(() => this.bubble(0.07), 60 + i * 50);
  }
  // 指パク：ちゅぽっ（吸いこむ音）
  slurp(big = false) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuffer(0.4, 'brown');
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(big ? 900 : 1400, t + 0.12); f.Q.value = 4;
    const g = ctx.createGain(); this.env(g, t, 0.02, big ? 0.9 : 0.6, 0.18);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.setValueAtTime(big ? 120 : 220, t + 0.1); o.frequency.exponentialRampToValueAtTime(big ? 60 : 110, t + 0.22);
    this.env(og, t + 0.1, 0.005, big ? 0.35 : 0.25, 0.12);
    o.connect(og); og.connect(this.master); o.start(t + 0.1); o.stop(t + 0.3);
  }
}
