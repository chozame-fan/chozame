// 水の音をその場で作る（録音した音は使わない）
// せせらぎ・エアーの泡・ときどき鳥の声。手を入れる音、指パクの音も。
export class WaterAudio {
  constructor() { this.ctx = null; this.on = false; this.birds = true; }

  // 音はユーザーが画面を触った後でないと鳴らせないので、ボタンから呼ぶ
  start() {
    if (!this.ctx) this.build();
    this.ctx.resume();
    this.on = true;
    this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.8);
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
    const layer = (buf, type, freq, q, gain, lfoRate, lfoDepth, pan) => {
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      const lfo = ctx.createOscillator(); lfo.frequency.value = lfoRate;
      const lg = ctx.createGain(); lg.gain.value = gain * lfoDepth; lfo.connect(lg); lg.connect(g.gain);
      const fl = ctx.createGain(); fl.gain.value = freq * 0.25; lfo.connect(fl); fl.connect(f.frequency);
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      src.connect(f); f.connect(g); g.connect(p); p.connect(this.master);
      src.start(0, Math.random() * 5); lfo.start();
    };
    layer(brown, 'lowpass', 500, 0.5, 0.35, 0.07, 0.4, 0);       // 低い水の流れ
    layer(pink, 'bandpass', 900, 0.8, 0.18, 0.23, 0.6, -0.4);   // さらさら
    layer(pink, 'bandpass', 1700, 1.2, 0.1, 0.37, 0.8, 0.4);    // ちょろちょろ
    layer(pink, 'highpass', 5000, 0.5, 0.025, 0.11, 0.5, 0);    // きらきらした高い音
    this.loop();
  }

  // 泡・ちゃぷちゃぷ・鳥を、ばらばらの間隔で鳴らす
  loop() {
    const tick = () => {
      if (this.ctx && this.on) {
        if (Math.random() < 0.55) this.bubble(0.04 + Math.random() * 0.05);
        if (Math.random() < 0.08) this.drip();
        if (this.birds && Math.random() < 0.018) this.bird();
      }
      setTimeout(tick, 120 + Math.random() * 260);
    };
    tick();
  }

  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }

  // エアーの泡：ぽこっ（音程が上がる短い音）
  bubble(vol = 0.06) {
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    const f0 = 250 + Math.random() * 500;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (2 + Math.random()), t + 0.06);
    this.env(g, t, 0.005, vol, 0.07); p.pan.value = -0.6 + Math.random() * 0.3;
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
