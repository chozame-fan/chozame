// 毎日のスタンプ帳と、かいた絵のマイカード。
// スタンプ帳：1日1回（本物の日）スタンプがおせる。休んでも消えず、7個たまるとごほうび「大好物のごはん」。
//   台紙の背景は「今週の1位の絵」（gentei.js の WEEK）。まだ無い週は、ふつうの海の台紙。
// マイカード：かいた絵（アルバム R.album）を、コードネームと魚のひとこと入りのカード画像にする。
import { tr, EN } from './i18n.js';
import { drawArt, validArt } from './art.js';
import { WEEK } from './gentei.js';

export const STAMP_N = 7;
// 何個目のスタンプで何がもらえるか（7個目は大好物）
export const STAMP_GIFT = [
  { ic: '📒', t: tr('豆知識', 'A fun fact') },
  { ic: '💕', t: tr('なかよし +2', 'Bond +2'), aff: 2 },
  { ic: '📒', t: tr('豆知識', 'A fun fact') },
  { ic: '💕', t: tr('なかよし +3', 'Bond +3'), aff: 3 },
  { ic: '📒', t: tr('豆知識', 'A fun fact') },
  { ic: '💕', t: tr('なかよし +3', 'Bond +3'), aff: 3 },
  { ic: '🌟', t: tr('大好物のごはん', 'Favourite treat'), gochi: 1 },
];
export const GOCHI_AFF = 8; // 大好物をあげた時に上がるなかよし（1日の上限とは別）

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// 今週の背景：from が今日より前で、いちばん新しい物
export function weekNow(d = new Date()) {
  const k = ymd(d);
  return WEEK.filter(w => w.from <= k && validArt(w.art)).sort((a, b) => (a.from < b.from ? 1 : -1))[0] || null;
}

// ---- マイカード ----
export const MSGS = [
  tr('かいてくれて ありがとう！', 'Thank you for drawing me!'),
  tr('ぼくに にてる？', 'Does it look like me?'),
  tr('また会いに来てね', 'Come and see me again'),
  tr('いっしょに大きくなろうね', "Let's grow up together"),
  tr('この絵、宝物にするね', "I'll treasure this picture"),
  tr('ヒゲまで かいてくれたの？', 'You even drew my barbels?'),
  tr('海に行っても わすれないよ', "I won't forget, even in the sea"),
  tr('きょうも 水が気持ちいいよ', 'The water feels great today'),
];
const FONT = '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif';
// e: { d, name, date, fish, msg }, no: アルバムの番号, foot: 下の文字
export function drawMyCard(e, no, { game, tag, url }) {
  const W = 1080, H = 1512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d4152'); bg.addColorStop(1, '#04161e');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, W, H, 56); g.fill();
  g.strokeStyle = '#5fd3a0'; g.lineWidth = 10; g.beginPath(); g.roundRect(22, 22, W - 44, H - 44, 40); g.stroke();
  // 上の帯
  g.fillStyle = '#5fd3a0'; g.font = `800 44px ${FONT}`; g.textBaseline = 'middle';
  g.fillText(tr('🐟 マイカード', '🐟 My Card'), 80, 104);
  g.textAlign = 'right'; g.fillStyle = '#9fc3cb'; g.font = `700 36px ${FONT}`; g.fillText(`No.${String(no).padStart(3, '0')}`, W - 80, 104);
  g.textAlign = 'left';
  // 絵（白いわく）
  const s = 840, x = (W - s) / 2, y = 170;
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 18, y - 18, s + 36, s + 36, 30); g.fill();
  const art = document.createElement('canvas'); art.width = art.height = s; drawArt(art.getContext('2d'), s, e.d);
  g.save(); g.beginPath(); g.roundRect(x, y, s, s, 18); g.clip(); g.drawImage(art, x, y); g.restore();
  // コードネーム
  g.fillStyle = '#e9f6f8'; g.font = `800 64px ${FONT}`; g.textBaseline = 'alphabetic';
  g.fillText(e.name ? tr(`${e.name} さんの絵`, `By ${e.name}`) : tr('わたしの絵', 'My drawing'), 80, 1130);
  // 魚のひとこと（ふきだし）
  const msg = MSGS[(e.msg || 0) % MSGS.length], who = e.fish ? tr(`— ${e.fish}より`, `— from ${e.fish}`) : '';
  g.font = `700 44px ${FONT}`;
  const bw = Math.min(W - 160, g.measureText(`「${msg}」`).width + 80);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(80, 1170, bw, 96, 48); g.fill();
  g.beginPath(); g.moveTo(130, 1264); g.lineTo(118, 1300); g.lineTo(170, 1264); g.fill();
  g.fillStyle = '#10232a'; g.textBaseline = 'middle'; g.fillText(EN ? `"${msg}"` : `「${msg}」`, 120, 1219);
  g.fillStyle = '#9fc3cb'; g.font = `500 34px ${FONT}`; g.textBaseline = 'alphabetic';
  g.fillText(`${who}${who ? '　' : ''}${new Date(e.date || Date.now()).toLocaleDateString(tr('ja-JP', 'en-US'))}`, 190, 1336);
  // 下
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(80, 1380, W - 160, 2);
  g.fillStyle = '#5fd3a0'; g.font = `700 32px ${FONT}`; g.fillText(`${game} β`, 80, 1430);
  g.textAlign = 'right'; g.fillText(tag, W - 80, 1430);
  g.textAlign = 'left'; g.fillStyle = '#9fc3cb'; g.font = `500 26px ${FONT}`; g.fillText(url.replace('https://', '').replace(/\/$/, ''), 80, 1470);
  return c;
}
