// おえかき：自分でかいたチョウザメの絵を、丸いバッジにする。
// 絵は「線の集まり」を短い文字にして持つ（写真より小さく、どの大きさでもきれいに出せる）。
//   形： 背景の番号 | 線,線,線…    線＝ 色(0〜b、e は消しゴム) + 太さ(0〜2) + 点(x,y を16進2けたずつ、0〜255)
// 絵はこのスマホの中だけに保存する。「おくる」を押した時だけ、絵とコードネームを外へ送る（gentei.js）。
import { tr } from './i18n.js';

export const PAL = ['#10232a', '#ffffff', '#3b6f7e', '#8fd3e8', '#2f9478', '#5fd3a0', '#ffd76a', '#ff9f43', '#ff6b6b', '#ff8fa8', '#9b7bd6', '#8a5a3b'];
export const BGS = ['#bfe9f5', '#5fd3a0', '#ffd76a', '#ff8fa8', '#b9a3ec', '#ffffff', '#1d4a5c', '#ffb37a'];
export const WID = [4, 9, 18]; // 256マスの中での線の太さ
export const MAX_PTS = 6000;   // 点が多すぎると送れなくなるので、ここまで
export const NAME_MAX = 8;

const OK = /^[0-9a-f]\|((e|[0-9a-b])[0-2]([0-9a-f]{4})+(,(e|[0-9a-b])[0-2]([0-9a-f]{4})+)*)?$/;
export const validArt = (d) => typeof d === 'string' && d.length <= MAX_PTS * 4 + 4000 && OK.test(d);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const cleanName = (s) => [...String(s ?? '').replace(/[\u0000-\u001f<>&"'`\\]/g, '').trim()].slice(0, NAME_MAX).join('');
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const monthLabel = (key) => { const m = +String(key).split('-')[1]; return tr(`${m}月`, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || ''); };

export function parseArt(data) {
  const [bg, body = ''] = validArt(data) ? data.split('|') : ['0', ''];
  return { bg: parseInt(bg, 16) % BGS.length, strokes: body ? body.split(',') : [] };
}
export const packArt = (bg, strokes) => `${bg.toString(16)}|${strokes.join(',')}`;
export const countPts = (strokes) => strokes.reduce((n, s) => n + (s.length - 2) / 4, 0);

export function drawArt(ctx, size, data) {
  const { bg, strokes } = parseArt(data), k = size / 256;
  ctx.fillStyle = BGS[bg]; ctx.fillRect(0, 0, size, size);
  const lay = document.createElement('canvas'); lay.width = lay.height = size;
  const c = lay.getContext('2d'); c.lineCap = c.lineJoin = 'round';
  for (const s of strokes) {
    const er = s[0] === 'e';
    c.globalCompositeOperation = er ? 'destination-out' : 'source-over';
    c.strokeStyle = er ? '#000' : PAL[parseInt(s[0], 16)];
    c.lineWidth = WID[+s[1]] * k * (er ? 1.6 : 1);
    c.beginPath();
    let x = 0, y = 0;
    for (let i = 2; i + 3 < s.length; i += 4) {
      x = parseInt(s.substr(i, 2), 16) * k; y = parseInt(s.substr(i + 2, 2), 16) * k;
      if (i === 2) c.moveTo(x, y); else c.lineTo(x, y);
    }
    if (s.length === 6) c.lineTo(x + .01, y); // 点を1つだけ打った時
    c.stroke();
  }
  ctx.drawImage(lay, 0, 0);
}

const urls = new Map();
export function artURL(data, size = 240) {
  const key = size + ':' + data;
  if (!urls.has(key)) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    drawArt(cv.getContext('2d'), size, data);
    if (urls.size > 60) urls.clear();
    urls.set(key, cv.toDataURL('image/png'));
  }
  return urls.get(key);
}

// 絵の入った丸いバッジ（もとのバッジと同じ、白いふち・点線・リボンの形）
let seq = 0;
export function artBadgeSVG(data, { label = '', mark = '🎨', got = true, size = 96, ribbon = '#c2557a' } = {}) {
  const id = 'ac' + (++seq), fs = [...label].length > 6 ? 8.5 : [...label].length > 4 ? 10 : 11;
  return `<svg class="badge-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
  <defs><clipPath id="${id}"><circle cx="60" cy="60" r="51"/></clipPath></defs>
  <circle cx="60" cy="60" r="57" fill="#fff" opacity="${got ? 1 : .35}"/>
  ${data ? `<image href="${artURL(data)}" x="9" y="9" width="102" height="102" clip-path="url(#${id})" ${got ? '' : 'style="filter:grayscale(1) brightness(.55)"'}/>` : '<circle cx="60" cy="60" r="51" fill="#34474d"/>'}
  <circle cx="60" cy="60" r="45" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="3 4"/>
  ${got ? `<text x="92" y="34" font-size="20" text-anchor="middle">${mark}</text>` : '<text x="90" y="36" font-size="22" font-weight="800" fill="#c8d6da" text-anchor="middle">?</text>'}
  <path d="M26,90 Q60,100 94,90 L92,104 Q60,112 28,104 Z" fill="${got ? ribbon : '#3a4c51'}"/>
  <text x="60" y="103" font-size="${fs}" font-weight="800" fill="#fff" text-anchor="middle">${esc(label)}</text>
</svg>`;
}

// ---- かく画面 ----
// open(data, name, onSave)：onSave(data, name) は「ほぞん」を押した時に呼ばれる
export function makeEditor(root) {
  const $ = (q) => root.querySelector(q);
  const cv = $('#art-cv'), ctx = cv.getContext('2d');
  let strokes = [], bg = 0, col = 0, wid = 1, eraser = false, cur = null, onSave = null, dirty = false, clearArm = 0;
  const SIZE = cv.width;

  const paint = () => { dirty = false; drawArt(ctx, SIZE, packArt(bg, cur ? [...strokes, cur] : strokes)); };
  const ask = () => { if (!dirty) { dirty = true; requestAnimationFrame(paint); } };
  const sync = () => {
    root.querySelectorAll('[data-col]').forEach(b => b.classList.toggle('on', !eraser && +b.dataset.col === col));
    root.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('on', +b.dataset.bg === bg));
    root.querySelectorAll('[data-wid]').forEach(b => b.classList.toggle('on', +b.dataset.wid === wid));
    $('[data-art="eraser"]').classList.toggle('on', eraser);
    const left = MAX_PTS - countPts(strokes);
    $('#art-left').textContent = left < 800 ? tr(`あと少しでいっぱい（のこり${Math.max(0, Math.round(left / 60))}%）`, `Almost full (${Math.max(0, Math.round(left / 60))}% left)`) : '';
  };
  $('#art-cols').innerHTML = PAL.map((c, i) => `<button data-col="${i}" style="background:${c}" aria-label="${c}"></button>`).join('');
  $('#art-bgs').innerHTML = BGS.map((c, i) => `<button data-bg="${i}" style="background:${c}" aria-label="${c}"></button>`).join('');

  const hex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 255, (e.clientY - r.top) / r.height * 255]; };
  let lx = 0, ly = 0;
  cv.addEventListener('pointerdown', (e) => {
    if (countPts(strokes) >= MAX_PTS) return;
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {}
    [lx, ly] = pos(e);
    cur = (eraser ? 'e' : col.toString(16)) + wid + hex(lx) + hex(ly); ask();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!cur) return;
    const [x, y] = pos(e);
    if (Math.hypot(x - lx, y - ly) < 2 || countPts(strokes) + (cur.length - 2) / 4 >= MAX_PTS) return;
    lx = x; ly = y; cur += hex(x) + hex(y); ask();
  });
  const end = () => { if (!cur) return; strokes.push(cur); cur = null; sync(); ask(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.col) { col = +t.dataset.col; eraser = false; }
    else if (t.dataset.bg) bg = +t.dataset.bg;
    else if (t.dataset.wid) wid = +t.dataset.wid;
    else if (t.dataset.art === 'eraser') eraser = !eraser;
    else if (t.dataset.art === 'undo') strokes.pop();
    else if (t.dataset.art === 'clear') {
      if (Date.now() - clearArm < 4000) { strokes = []; clearArm = 0; t.textContent = tr('🗑 ぜんぶけす', '🗑 Clear'); }
      else { clearArm = Date.now(); t.textContent = tr('もう一回おすと ぜんぶきえるよ', 'Tap again to clear all'); setTimeout(() => { if (clearArm) { clearArm = 0; t.textContent = tr('🗑 ぜんぶけす', '🗑 Clear'); } }, 4000); }
    }
    else if (t.dataset.art === 'cancel') { root.hidden = true; return; }
    else if (t.dataset.art === 'save') {
      if (!strokes.length) { $('#art-left').textContent = tr('まだ何もかいていないよ', 'Nothing drawn yet'); return; }
      root.hidden = true; onSave?.(packArt(bg, strokes), cleanName($('#art-name').value)); return;
    } else return;
    sync(); ask();
  });

  return {
    open(data, name, cb) {
      const a = parseArt(data || '0|'); strokes = a.strokes.slice(); bg = a.bg; col = 0; wid = 1; eraser = false; cur = null; onSave = cb;
      $('#art-name').value = name || ''; root.hidden = false; sync(); paint();
    },
  };
}
