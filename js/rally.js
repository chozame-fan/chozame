// 館内の「重ねるスタンプラリー」（試作）。
// 館の中の4か所にQRを置く。読むたびに1色の版が重なり、4つそろうと1枚の絵になる（重ね押しスタンプと同じ考え方）。
//   QRの中身： https://…/chozame/?spot=合言葉   （QRの下の合言葉を、アプリに手で入れても同じ）
//   合言葉そのものはここに書かず、合言葉から作った「指紋」だけを置く。合言葉は 提案/rally-qr.html（公開しない）にある。
// open:false のあいだは、QRを読んだ人にだけ画面が出る（館の確認が取れてから true にする）。
// 絵は仮の物。館の写真やイラストに差しかえる時は、下の「版」の絵をかきかえる。
import { tr, EN } from './i18n.js';

export const RALLY = {
  kan: 'shibetsu', open: false,
  spots: [
    { id: 'suiso', h: '7c53b81e6d13821e357b4c9f4e032cb77352494ecdd5f004abaebf9ffd07df2f', ic: '🌊', name: tr('水そう', 'The tank'), hint: tr('大きな水そうの前', 'In front of the big tank') },
    { id: 'chozame', h: '8c4b05889f941580e4b5257baf59f0312b0e028144c1a5a5754715cd685b56a3', ic: '🐟', name: tr('チョウザメ', 'The sturgeon'), hint: tr('えさやり・指パクのところ', 'By the feeding spot') },
    { id: 'shiiku', h: 'd4285ef815a99391b02b85d30c1f620fbb0d25be2197db82a0c00d60a041b065', ic: '🧑‍🔧', name: tr('飼育員さん', 'The keeper'), hint: tr('飼育員さんのお話のところ', 'Where the keepers talk') },
    { id: 'moji', h: '519d60ab5c40e7b2239abaad8c4bb98381254f3e377e9c221cd80611134c7fd7', ic: '✨', name: tr('しあげの文字', 'The lettering'), hint: tr('出口の近く', 'Near the exit') },
  ],
};
export const SPOT_CODE = new URLSearchParams(location.search).get('spot');
export const SPOT_AFF = 3;    // 1か所読むごとに上がるなかよし
export const DONE_GOCHI = 3;  // 4つそろえた時の「大好物のごはん」
export const BACK_GOCHI = 1;  // 完成したあと、別の日にまた来た時

export async function spotOf(code) {
  const norm = String(code ?? '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!norm) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('chozame-rally:' + norm));
  const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return RALLY.spots.find(s => s.h === h) || null;
}

// 色のちがう版。base は初めての完成、あとは「また来た季節」の色
export const VERS = {
  base: { name: tr('はじめての色', 'First colours'), ic: '🎨', c: ['#fbf6e8', '#58bfe6', '#ffd23f', '#ff7a8a', '#1d3f6e'] },
  haru: { name: tr('春の色', 'Spring'), ic: '🌸', c: ['#fff4f7', '#8fd6e4', '#ffd76a', '#ff8fb5', '#7a3d6b'] },
  natsu: { name: tr('夏の色', 'Summer'), ic: '🌻', c: ['#f2fbff', '#2fb4e8', '#ffe14d', '#ff7a59', '#0d4a7a'] },
  aki: { name: tr('秋の色', 'Autumn'), ic: '🍁', c: ['#fff3e0', '#6fb9c9', '#ffb02e', '#e8603c', '#5a2d18'] },
  fuyu: { name: tr('冬の色', 'Winter'), ic: '❄️', c: ['#f4f8ff', '#8fb8e8', '#efe6b8', '#c59ad6', '#1d2f5a'] },
};
export const seasonOf = (d = new Date()) => { const m = d.getMonth() + 1; return m >= 3 && m <= 5 ? 'haru' : m >= 6 && m <= 8 ? 'natsu' : m >= 9 && m <= 11 ? 'aki' : 'fuyu'; };

// ---- 版の絵（1080マスの中にかく。1つの版は1色で、こさだけ変える） ----
const FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const dot = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); };
function fishPath(g) { // 左向きのチョウザメ
  g.beginPath(); g.moveTo(210, 668);
  g.bezierCurveTo(300, 610, 400, 580, 520, 590); g.bezierCurveTo(620, 598, 700, 625, 770, 640);
  g.lineTo(890, 540); g.bezierCurveTo(872, 600, 850, 640, 815, 668); g.lineTo(862, 732);
  g.bezierCurveTo(820, 705, 790, 690, 765, 682); g.bezierCurveTo(680, 702, 560, 722, 440, 716);
  g.bezierCurveTo(350, 712, 270, 700, 210, 668); g.closePath();
}
function finPaths(g) {
  g.beginPath();
  g.moveTo(640, 606); g.lineTo(708, 556); g.lineTo(722, 628); g.closePath();   // 背びれ
  g.moveTo(396, 712); g.lineTo(452, 776); g.lineTo(474, 716); g.closePath();   // 胸びれ
  g.moveTo(616, 702); g.lineTo(652, 748); g.lineTo(672, 694); g.closePath();   // 腹びれ
}
const PLATES = {
  suiso(g) {
    g.save(); rr(g, 90, 330, 900, 600, 36); g.clip();
    g.globalAlpha = .5; g.fillRect(90, 330, 900, 600);
    g.globalAlpha = .14; g.fillRect(90, 520, 900, 410); g.fillRect(90, 720, 900, 210);
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .4; // 光のすじ
    for (const [x, w] of [[190, 70], [420, 44], [640, 90]]) { g.beginPath(); g.moveTo(x, 330); g.lineTo(x + w, 330); g.lineTo(x + w - 150, 930); g.lineTo(x - 190, 930); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = .55; // 底の砂
    g.beginPath(); g.moveTo(90, 880); for (let x = 90; x <= 990; x += 60) g.quadraticCurveTo(x + 30, 862 + (x / 60 % 2) * 22, x + 60, 880); g.lineTo(990, 930); g.lineTo(90, 930); g.fill();
    g.restore();
    g.globalAlpha = 1; g.lineWidth = 5; // あわ
    for (const [x, y, r] of [[160, 800, 14], [182, 740, 9], [150, 690, 6], [930, 760, 12], [912, 700, 8], [935, 650, 5], [560, 830, 8]]) { dot(g, x, y, r); g.stroke(); }
    g.lineWidth = 9; g.beginPath(); g.moveTo(96, 334); for (let x = 96; x < 980; x += 68) g.quadraticCurveTo(x + 17, 318, x + 34, 334), g.quadraticCurveTo(x + 51, 350, x + 68, 334); g.stroke(); // 水面
  },
  chozame(g) {
    g.globalAlpha = .85; fishPath(g); g.fill(); finPaths(g); g.fill();
    g.globalAlpha = 1; // 背中のかたいウロコ（硬鱗）
    for (let i = 0; i < 9; i++) { const x = 340 + i * 46, y = 650 + Math.sin(i / 8 * 3.1) * -8; g.beginPath(); g.moveTo(x - 15, y); g.lineTo(x, y - 12); g.lineTo(x + 15, y); g.lineTo(x, y + 12); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; dot(g, 300, 652, 13); g.fill();
  },
  shiiku(g) {
    g.globalAlpha = .8; rr(g, 724, 286, 164, 200, 44); g.fill();             // からだ
    g.lineWidth = 36; g.beginPath(); g.moveTo(748, 330); g.quadraticCurveTo(660, 360, 604, 436); g.stroke(); // うで
    g.globalAlpha = .6; dot(g, 804, 216, 62); g.fill();                      // かお
    g.globalAlpha = 1; g.beginPath(); g.arc(804, 200, 66, Math.PI, 0); g.fill(); rr(g, 716, 190, 110, 20, 10); g.fill(); // ぼうし
    for (const [x, y, r] of [[596, 486, 9], [572, 524, 8], [606, 552, 7]]) { dot(g, x, y, r); g.fill(); } // えさ
    g.beginPath(); g.moveTo(286, 560); g.bezierCurveTo(250, 520, 262, 496, 286, 516); g.bezierCurveTo(310, 496, 322, 520, 286, 560); g.fill(); // ハート
    g.globalCompositeOperation = 'destination-out';
    dot(g, 782, 226, 7); g.fill(); dot(g, 824, 226, 7); g.fill();
    g.lineWidth = 6; g.beginPath(); g.arc(803, 240, 20, .25, Math.PI - .25); g.stroke();
  },
  moji(g, date) {
    g.lineWidth = 6; rr(g, 30, 30, 1020, 1020, 44); g.stroke();
    g.textBaseline = 'middle';
    g.font = `900 ${EN ? 46 : 64}px ${FONT}`; g.fillText(tr('標津サーモン科学館', 'Shibetsu Salmon Museum'), 90, 130);
    g.font = `700 34px ${FONT}`; g.fillText(tr('チョウザメ スタンプラリー', 'Sturgeon stamp rally'), 92, 204);
    g.lineWidth = 10; rr(g, 90, 330, 900, 600, 36); g.stroke();               // 水そうのふち
    g.lineWidth = 6; fishPath(g); g.stroke(); finPaths(g); g.stroke();        // 魚のりんかく
    dot(g, 300, 652, 7); g.fill();
    g.lineWidth = 5; g.beginPath(); g.moveTo(352, 640); g.quadraticCurveTo(372, 662, 356, 700); g.stroke(); // えら
    for (const x of [248, 262, 276, 290]) { g.beginPath(); g.moveTo(x, 684); g.lineTo(x - 4, 712); g.stroke(); } // ヒゲ4本
    for (const [x, y, r] of [[660, 110, 16], [704, 150, 9], [960, 250, 12]]) { // きらきら
      g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, k = i % 2 ? r * .38 : r; g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } g.fill();
    }
    g.textAlign = 'center'; g.font = `800 40px ${FONT}`;
    g.fillText(`${date ? new Date(date).toLocaleDateString(tr('ja-JP', 'en-US')) + '　' : ''}${tr('チョウザメに会ってきたよ', 'I met the sturgeon')}`, 540, 992);
  },
};

// got：読んだ場所（{ id: 時刻 }）。そろった版だけを、紙の上に「かけ算」で重ねる（重なった所は色がまざる）
export function drawRally(got = {}, ver = 'base', size = 1080, date = 0) {
  const pal = (VERS[ver] || VERS.base).c;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'multiply';
  RALLY.spots.forEach((s, i) => {
    if (!got[s.id]) return;
    const p = document.createElement('canvas'); p.width = p.height = size;
    const g = p.getContext('2d'); g.scale(size / 1080, size / 1080); g.fillStyle = g.strokeStyle = pal[i + 1]; g.lineCap = g.lineJoin = 'round';
    PLATES[s.id](g, date); ctx.drawImage(p, 0, 0);
  });
  if (!Object.keys(got).length) {
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#b9b3a0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${size * .05}px ${FONT}`; ctx.fillText(tr('QRを読むと、ここに絵が重なるよ', 'Scan a QR to start the picture'), size / 2, size / 2);
  }
  return c;
}
