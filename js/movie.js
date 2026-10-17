// 図鑑が完成した時の「思い出ムービー」：写真がゆっくり流れ、やさしい音楽が鳴る
// 音楽はその場で作る（ピアノ・弦・メロディー）。コードは F G Em Am / F G C C（よく泣ける進行）

const BAR = 2.6; // 1小節の長さ（秒）
const CHORDS = [ // 低い根音と和音（MIDI）
  [41, [65, 69, 72]], [43, [67, 71, 74]], [40, [64, 67, 71]], [45, [69, 72, 76]],
  [41, [65, 69, 72]], [43, [67, 71, 74]], [36, [64, 67, 72]], [36, [64, 67, 72]],
];
// メロディー：[小節, 拍, 音, 長さ(拍)]。前半は静かに、後半は高く
const MELODY = [
  [0, 0, 72, 2], [0, 2, 74, 1], [0, 3, 76, 1], [1, 0, 74, 2], [1, 2, 71, 1], [1, 3, 74, 1],
  [2, 0, 76, 2], [2, 2, 79, 2], [3, 0, 76, 3], [3, 3, 72, 1],
  [4, 0, 77, 2], [4, 2, 76, 1], [4, 3, 74, 1], [5, 0, 74, 2], [5, 2, 79, 2], [6, 0, 76, 3], [6, 3, 74, 1], [7, 0, 72, 4],
  [8, 0, 81, 2], [8, 2, 79, 1], [8, 3, 77, 1], [9, 0, 79, 2], [9, 2, 74, 2], [10, 0, 76, 1], [10, 1, 79, 1], [10, 2, 83, 2], [11, 0, 81, 4],
  [12, 0, 77, 2], [12, 2, 81, 2], [13, 0, 79, 2], [13, 2, 83, 1], [13, 3, 81, 1], [14, 0, 79, 4], [15, 0, 72, 4],
];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

class Music {
  constructor() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.out = ctx.createGain(); this.out.gain.value = 0.0001; this.out.connect(ctx.destination);
    // 残響（ホールのような響き）
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.rev = ctx.createConvolver(); this.rev.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55; this.rev.connect(wet); wet.connect(this.out);
    this.dry = ctx.createGain(); this.dry.gain.value = 0.75; this.dry.connect(this.out); this.dry.connect(this.rev);
  }
  // ピアノのような音：いくつかの倍音が、すっと立ち上がって消えていく
  piano(t, m, vel, dur) {
    const ctx = this.ctx, f = hz(m), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(1.2, dur * 1.6));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2), t + 1.2);
    for (const [mul, amp] of [[1, 1], [2, 0.42], [3, 0.18], [4, 0.09]]) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = f * mul * (1 + (mul - 1) * 0.0007); og.gain.value = amp;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + Math.max(1.3, dur * 1.7));
    }
    lp.connect(g); g.connect(this.dry);
  }
  // 弦のやわらかい和音（ゆっくり立ち上がる）
  pad(t, notes, dur, vol) {
    const ctx = this.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    for (const m of notes) for (const det of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
      const og = ctx.createGain(); og.gain.value = 0.18; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.7);
    }
    lp.connect(g); g.connect(this.dry);
  }
  // 曲を最初から最後まで予約する
  play(total) {
    const ctx = this.ctx, t0 = ctx.currentTime + 0.3, bars = Math.ceil(total / BAR);
    this.out.gain.setValueAtTime(0.0001, ctx.currentTime); this.out.gain.exponentialRampToValueAtTime(0.9, t0 + 2);
    const beat = BAR / 4;
    for (let b = 0; b < bars; b++) {
      const last = b === bars - 1;
      const [root, tri] = last ? [36, [64, 67, 72]] : CHORDS[b % 8];
      const t = t0 + b * BAR, sec = Math.floor(b / 8); // 8小節ごとに少しずつ盛り上げる
      const lift = Math.min(1, 0.55 + sec * 0.2);
      this.pad(t, tri.map(n => n - 12), BAR, 0.03 + 0.03 * lift);
      // 左手：根音と、ゆっくりした分散和音
      this.piano(t, root, 0.22, BAR);
      const arp = [root + 12, tri[0], tri[1], tri[2], tri[1], tri[0], root + 19, tri[1]];
      if (!last) for (let i = 0; i < 8; i++) this.piano(t + i * beat / 2, arp[i] - (i % 2 ? 0 : 0), 0.06 + 0.03 * lift, beat);
      // 右手：メロディー（最初の4小節はなし）
      if (b >= 4 && !last) for (const [mb, bt, m, d] of MELODY) if (mb === (b - 4) % 16) this.piano(t + bt * beat, m, 0.16 + 0.06 * lift, d * beat);
      if (last) this.piano(t, 72, 0.18, BAR * 2);
    }
    this.end = t0 + bars * BAR;
  }
  fadeOut(sec = 2) { const t = this.ctx.currentTime; this.out.gain.cancelScheduledValues(t); this.out.gain.setValueAtTime(this.out.gain.value, t); this.out.gain.exponentialRampToValueAtTime(0.0001, t + sec); setTimeout(() => this.ctx.close(), sec * 1000 + 300); }
}

// entries: [{ title, sub, img, note }]
export function playMemoryMovie({ name, entries, finale, onDone }) {
  const root = document.getElementById('movie');
  const A = root.querySelector('.m-img.a'), B = root.querySelector('.m-img.b');
  const cap = root.querySelector('.m-cap'), title = root.querySelector('.m-title'), end = root.querySelector('.m-end');
  root.hidden = false; end.hidden = true; cap.className = 'm-cap'; title.className = 'm-title';
  const PER = 5.2, INTRO = 5.5, OUTRO = 16;
  const total = INTRO + entries.length * PER + OUTRO;
  let music = null;
  try { music = new Music(); music.play(total); } catch (e) { console.warn(e); }

  const timers = [];
  const at = (sec, fn) => timers.push(setTimeout(fn, sec * 1000));
  let front = A, back = B;
  const show = (e, i) => {
    back.style.backgroundImage = e.img ? `url(${e.img})` : 'none';
    back.classList.toggle('noimg', !e.img); back.dataset.emoji = e.emoji || '🐟';
    // 写真ごとに、ゆっくり寄る／引く方向を変える
    const dir = i % 2 ? 1 : -1;
    back.style.transition = 'none'; back.style.transform = `scale(1.02) translate(${dir * -1.5}%, 0)`;
    void back.offsetWidth;
    back.style.transition = `opacity 1.4s ease, transform ${PER + 1.5}s linear`;
    back.style.opacity = 1; back.style.transform = `scale(1.14) translate(${dir * 1.5}%, -1%)`;
    front.style.opacity = 0;
    [front, back] = [back, front];
    cap.className = 'm-cap';
    setTimeout(() => {
      cap.innerHTML = `<div class="m-t">${e.title}</div><div class="m-s">${e.sub}</div>${e.note ? `<div class="m-n">${e.note}</div>` : ''}`;
      cap.className = 'm-cap show';
    }, 500);
  };

  // はじまり
  title.innerHTML = `<div class="m-big">${name}の10年</div><div class="m-small">ふ化から、おとなになるまで</div>`;
  at(0.6, () => { title.className = 'm-title show'; });
  at(INTRO - 1.2, () => { title.className = 'm-title'; });
  // 思い出
  entries.forEach((e, i) => at(INTRO + i * PER, () => show(e, i)));
  // おわり
  const tEnd = INTRO + entries.length * PER;
  at(tEnd, () => { cap.className = 'm-cap'; A.style.opacity = B.style.opacity = 0; });
  at(tEnd + 1.6, () => {
    end.hidden = false;
    end.innerHTML = `<p class="l1">よくここまで育ったね。</p><p class="l2">ありがとう、${name}。</p><p class="l3">${finale}</p><div class="m-btns"><button id="movie-again">もう一度見る</button><button id="movie-close">閉じる</button></div>`;
    end.querySelectorAll('p').forEach((p, k) => setTimeout(() => p.classList.add('show'), 400 + k * 2600));
    setTimeout(() => end.querySelector('.m-btns').classList.add('show'), 400 + 3 * 2600);
    end.querySelector('#movie-close').onclick = () => close();
    end.querySelector('#movie-again').onclick = () => { close(true); playMemoryMovie({ name, entries, finale, onDone }); };
  });
  const close = (again) => {
    timers.forEach(clearTimeout);
    music?.fadeOut(again ? 0.3 : 1.5);
    root.hidden = true; A.style.opacity = B.style.opacity = 0;
    if (!again) onDone?.();
  };
  root.querySelector('#movie-skip').onclick = () => close();
}
