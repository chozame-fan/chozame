// 節目のチョウザメクイズとバッジ。
// 1歳・2歳・3歳・5歳・7歳・10歳になった時にクイズが出て、3問中2問正解でバッジがもらえる。
// 6つ全部そろうと称号「チョウザメ・マイスター」。そのあと、放流（エンディング）か育て続けるかを選べる。
// 問題の答えは、図鑑の「参考にした資料」と同じく一般に知られている目安。
import { tr } from './i18n.js';

export const PASS = 2; // 3問中、これだけ正解で合格
export const MASTER = tr('チョウザメ・マイスター', 'Sturgeon Meister');

// a の1つ目が正解（出す時に並べかえる）
export const BADGES = [
  {
    id: 'y1', color: '#5fd3a0', deep: '#1f8a64', mark: '🎂', when: tr('1歳', 'Age 1'),
    name: tr('はじめましてバッジ', 'Hello Badge'), theme: tr('チョウザメってどんな魚？', 'What kind of fish is a sturgeon?'),
    qs: [
      { q: tr('チョウザメの口のまわりにあるヒゲは、何本？', 'How many barbels (whiskers) does a sturgeon have by its mouth?'),
        a: [tr('4本', '4'), tr('2本', '2'), tr('6本', '6'), tr('10本', '10')],
        why: tr('口の前に4本のヒゲが1列にならんでいます。図鑑の「ヒゲが生えた」で見たヒゲです。', 'Four barbels sit in a row in front of the mouth — the ones you saw in "Barbels appear".') },
      { q: tr('チョウザメは、サメのなかま？', 'Is a sturgeon a kind of shark?'),
        a: [tr('サメとは別のなかま（古代魚）', 'No — a different, ancient group of fish'), tr('サメのなかま', 'Yes, a shark'), tr('クジラのなかま', 'A kind of whale'), tr('イルカのなかま', 'A kind of dolphin')],
        why: tr('名前に「鮫（サメ）」とつきますが、サメとは別のなかま。大昔から姿が変わらない「古代魚」です。', 'Its Japanese name contains "shark", but it isn\'t one. It\'s an "ancient fish" that has barely changed for ages.') },
      { q: tr('卵黄を使い切った赤ちゃんが、はじめに食べる生きたえさは？', 'After the yolk runs out, what live food do babies eat first?'),
        a: [tr('ブラインシュリンプ', 'Brine shrimp'), tr('ザリガニ', 'Crayfish'), tr('小さなカエル', 'Small frogs'), tr('海藻', 'Seaweed')],
        why: tr('生まれたてのブラインシュリンプ（0.5mmほどのエビの仲間）は動くので、仔魚が食いつきやすいえさです。', 'Newly hatched brine shrimp (about 0.5 mm) move around, so tiny larvae snap at them easily.') },
    ],
  },
  {
    id: 'y2', color: '#5fb4e8', deep: '#1f5f8f', mark: '🛡', when: tr('2歳', 'Age 2'),
    name: tr('よろいバッジ', 'Armor Badge'), theme: tr('からだのひみつ', 'Body secrets'),
    qs: [
      { q: tr('チョウザメの体にある、よろいのような「骨板」は何列？', 'How many rows of armor plates (scutes) run along a sturgeon\'s body?'),
        a: [tr('5列', '5'), tr('1列', '1'), tr('3列', '3'), tr('8列', '8')],
        why: tr('背中に1列、左右のわきに1列ずつ、お腹の両側に1列ずつで、合わせて5列です。', 'One on the back, one on each side, and one on each side of the belly — 5 rows in all.') },
      { q: tr('「蝶鮫（チョウザメ）」の「蝶」は、どこから来た名前？', 'In Japanese it\'s "butterfly shark". Where does "butterfly" come from?'),
        a: [tr('骨板の形が蝶に似ているから', 'Its scutes are shaped like butterflies'), tr('蝶を食べるから', 'It eats butterflies'), tr('ひれが蝶のように動くから', 'Its fins flap like wings'), tr('春に生まれるから', 'It\'s born in spring')],
        why: tr('うろこが変わった骨板の形が蝶に、体つきがサメに似ているので「蝶鮫」と呼ばれます。', 'The scutes look like butterflies and the body looks like a shark, so it was named "butterfly shark".') },
      { q: tr('チョウザメの口は、頭のどこにある？', 'Where is a sturgeon\'s mouth?'),
        a: [tr('頭の下側', 'Under its head'), tr('鼻先の一番前', 'At the very tip of the snout'), tr('頭の上', 'On top of its head'), tr('目の横', 'Next to its eyes')],
        why: tr('口は頭の下側。筒のようにのばして、水底のえさを吸いこみます。', 'The mouth is underneath. It sticks out like a tube to suck up food from the bottom.') },
    ],
  },
  {
    id: 'y3', color: '#f0a3c0', deep: '#a8456c', mark: '💞', when: tr('3歳', 'Age 3'),
    name: tr('たまごバッジ', 'Egg Badge'), theme: tr('オスとメス・卵', 'Males, females and eggs'),
    qs: [
      { q: tr('高級食材「キャビア」は、何からできている？', 'What is caviar made from?'),
        a: [tr('チョウザメの卵', 'Sturgeon eggs'), tr('サケの卵', 'Salmon eggs'), tr('チョウザメの肝', 'Sturgeon liver'), tr('海藻', 'Seaweed')],
        why: tr('キャビアはチョウザメの卵を塩漬けにしたもの。サケの卵はイクラです。', 'Caviar is salted sturgeon eggs. Salmon eggs are a different food (ikura).') },
      { q: tr('大きなメスは、一度にどれくらい卵を産む？', 'How many eggs can a big female lay at once?'),
        a: [tr('数十万粒以上', 'Hundreds of thousands or more'), tr('10粒くらい', 'About 10'), tr('100粒くらい', 'About 100'), tr('1000粒くらい', 'About 1,000')],
        why: tr('大きなメスは一度に数十万〜数百万粒の卵を産みます。', 'A big female lays hundreds of thousands — even millions — of eggs at once.') },
      { q: tr('チョウザメのオスとメスは、見た目ですぐ見分けられる？', 'Can you easily tell male and female sturgeon apart by looking?'),
        a: [tr('ほとんど見分けられない', 'Hardly at all'), tr('色でかんたんに分かる', 'Easily, by color'), tr('ヒゲの数で分かる', 'By the number of barbels'), tr('しっぽの形で分かる', 'By the shape of the tail')],
        why: tr('外からはほとんど区別できないので、養殖場ではエコー（超音波）などでお腹の中を調べます。このゲームでも3歳で分かります。', 'They look almost the same, so farms check inside with ultrasound. In this game you find out at age 3.') },
    ],
  },
  {
    id: 'y5', color: '#b48ef0', deep: '#5b3fa0', mark: '📡', when: tr('5歳', 'Age 5'),
    name: tr('ヒゲセンサーバッジ', 'Sensor Badge'), theme: tr('えさを探すしくみ', 'How they find food'),
    qs: [
      { q: tr('4本のヒゲは、何に使っている？', 'What are the four barbels for?'),
        a: [tr('えさの味やにおいを感じる', 'Sensing the taste and smell of food'), tr('泳ぐ速さを上げる', 'Swimming faster'), tr('敵をおどかす', 'Scaring enemies'), tr('卵を守る', 'Guarding eggs')],
        why: tr('ヒゲには味を感じるしくみがあり、水底を探って砂の中のえさを見つけます。', 'The barbels can taste. They drag along the bottom to find food in the sand.') },
      { q: tr('チョウザメの鼻先は、ある「見えないもの」を感じとれる。それは？', 'A sturgeon\'s snout can sense something invisible. What?'),
        a: [tr('生き物が出す弱い電気', 'Weak electricity from living things'), tr('天気の変化', 'Changes in the weather'), tr('人の声', 'Human voices'), tr('月の光', 'Moonlight')],
        why: tr('鼻先の下に電気を感じる小さな穴がたくさんあり、砂にかくれた生き物の弱い電気でえさを探します。', 'Tiny pores under the snout sense electricity, so it can find animals hiding in the sand.') },
      { q: tr('おとなのチョウザメの口には、歯がある？', 'Do adult sturgeon have teeth?'),
        a: [tr('ない', 'No'), tr('するどい歯がたくさん', 'Lots of sharp teeth'), tr('前歯だけ2本', 'Just two front teeth'), tr('サメのように何列も', 'Many rows, like a shark')],
        why: tr('おとなになると歯はなく、えさを丸ごと吸いこんで食べます。', 'Adults have no teeth. They suck their food in whole.') },
    ],
  },
  {
    id: 'y7', color: '#e8b25a', deep: '#9a6418', mark: '🦕', when: tr('7歳', 'Age 7'),
    name: tr('古代魚バッジ', 'Ancient Fish Badge'), theme: tr('長い長い歴史', 'A very long history'),
    qs: [
      { q: tr('チョウザメのなかまは、いつごろから地球にいる？', 'Since when have sturgeon been on Earth?'),
        a: [tr('約2億年前（恐竜の時代）', 'About 200 million years ago (dinosaur times)'), tr('約1万年前', 'About 10,000 years ago'), tr('約100万年前', 'About 1 million years ago'), tr('約1000年前', 'About 1,000 years ago')],
        why: tr('恐竜がいた時代から、ほとんど姿を変えずに生きてきた「生きた化石」です。', 'They\'ve lived since the dinosaurs with hardly any change — a "living fossil".') },
      { q: tr('昔、北海道の石狩川や天塩川にものぼってきたチョウザメの名前は？', 'Which sturgeon once swam up rivers in Hokkaido, Japan?'),
        a: [tr('ミカドチョウザメ', 'Sakhalin sturgeon (Mikado)'), tr('ベルーガ', 'Beluga'), tr('シロチョウザメ', 'White sturgeon'), tr('コチョウザメ', 'Sterlet')],
        why: tr('ミカドチョウザメは昔、北海道の川にものぼってきましたが、今は日本の川では見られなくなりました。', 'The Sakhalin sturgeon once came up Hokkaido\'s rivers, but it\'s no longer seen in Japan.') },
      { q: tr('チョウザメの年齢は、どうやって調べる？', 'How do scientists find a sturgeon\'s age?'),
        a: [tr('胸びれのトゲの輪を数える', 'Count the rings in a pectoral fin spine'), tr('ヒゲの長さを測る', 'Measure the barbels'), tr('骨板の数を数える', 'Count the scutes'), tr('泳ぐ速さを測る', 'Time how fast it swims')],
        why: tr('胸びれの太いトゲを輪切りにすると、木の年輪のような輪が見えます。それを数えます。', 'A slice of the thick pectoral fin spine shows rings like a tree. They count those.') },
    ],
  },
  {
    id: 'y10', color: '#ff8f6b', deep: '#b0442a', mark: '🌍', when: tr('10歳', 'Age 10'),
    name: tr('おおものバッジ', 'Giant Badge'), theme: tr('世界のチョウザメ', 'Sturgeon of the world'),
    qs: [
      { q: tr('世界最大のチョウザメ「オオチョウザメ（ベルーガ）」は、大きいもので全長どれくらい？', 'How long can the biggest sturgeon, the beluga, grow?'),
        a: [tr('5m以上', 'Over 5 m'), tr('1mくらい', 'About 1 m'), tr('2mくらい', 'About 2 m'), tr('3mくらい', 'About 3 m')],
        why: tr('記録では全長7mをこえたとされるものもいます。今は大きな個体はとても少なくなりました。', 'Some records say over 7 m. Very few giants are left today.') },
      { q: tr('長生きなチョウザメのなかまは、何歳くらいまで生きる？', 'How long can long-lived sturgeon live?'),
        a: [tr('100歳以上', 'Over 100 years'), tr('5歳くらい', 'About 5 years'), tr('10歳くらい', 'About 10 years'), tr('30歳くらい', 'About 30 years')],
        why: tr('北アメリカのレイクスタージョンでは、150歳をこえると考えられた記録もあります。', 'One lake sturgeon in North America was estimated to be over 150 years old.') },
      { q: tr('世界のチョウザメは、今どうなっている？', 'What is happening to sturgeon around the world?'),
        a: [tr('多くの種類が絶滅の危機', 'Many species are endangered'), tr('増えすぎて困っている', 'There are too many'), tr('どこにでもたくさんいる', 'They\'re common everywhere'), tr('すでに全部いなくなった', 'They\'re all extinct')],
        why: tr('とりすぎや川のダムで数が減り、多くの種類が絶滅の危機です。1998年からすべてのチョウザメが国際的な取引の決まり（ワシントン条約）で守られ、育てた稚魚を川に放流して増やす取り組みも続いています。', 'Overfishing and dams made them rare. Since 1998 all sturgeon are protected by an international trade treaty (CITES), and people release young fish to help them recover.') },
    ],
  },
];
export const badgeById = (id) => BADGES.find(b => b.id === id);

// ---------------- バッジの絵 ----------------
// 金属のふち＋色を流しこんだ「ピンバッジ」でそろえて、形と色はバッジごとに変える。
// 魚は節目ごとに大きくなる（1歳はちっちゃく、10歳は本物の写真で顔いっぱい）
let photoOf = () => null; // 7歳の写真：その子の図鑑の写真（main.js から渡す）
export const setPhotoSource = (f) => { photoOf = f; };
const REAL = new URL('../img/badge-oomono.jpg', import.meta.url).href; // 10歳：水族館で撮ったチョウザメの顔

const METAL = { gold: ['#fff6cf', '#e3b64e', '#a8741c'], silver: ['#ffffff', '#c7d1d6', '#7d8c94'], copper: ['#ffe1c4', '#d48c5c', '#8c4d28'] };
const metal = (id, m) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${METAL[m][0]}"/><stop offset=".5" stop-color="${METAL[m][1]}"/><stop offset="1" stop-color="${METAL[m][2]}"/></linearGradient>`;
const enamel = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const shine = (d) => `<path d="${d}" fill="#fff" opacity=".28"/>`;
// 下の小さな金属の札
const plate = (txt, m, y = 96, w = 34) => `<rect x="${60 - w / 2}" y="${y}" width="${w}" height="14" rx="7" fill="url(#${m})" stroke="#00000022" stroke-width=".6"/><text x="60" y="${y + 10.4}" font-size="9.5" font-weight="800" fill="#4a3208" text-anchor="middle">${txt}</text>`;

// チョウザメ（左向き・長さ約106）。c: 色、line: 金属の線
function fish(cx, cy, s, c, line, rot = 0, flip = false) {
  const sc = Array.from({ length: 7 }, (_, i) => { const x = 30 + i * 7, y = 13.2 - Math.sin((i + 1) / 8 * Math.PI) * 1.4; return `<path d="M${x - 2.6},${y} L${x},${y - 2.8} L${x + 2.6},${y} L${x},${y + 2.2} Z" fill="${c.scute}" stroke="${line}" stroke-width=".7"/>`; }).join('');
  const dots = Array.from({ length: 8 }, (_, i) => `<circle cx="${30 + i * 7}" cy="${22.4 - Math.sin(i / 7 * Math.PI) * .6}" r="1.1" fill="${c.scute}"/>`).join('');
  return `<g transform="translate(${cx},${cy}) rotate(${rot}) scale(${flip ? -s : s},${s}) translate(-53,-22)">
    <path d="M74,14.4 L80.5,5.5 L84.5,15.4 Z M76,30.6 L79,37.5 L83.4,29.8 Z M58,33.4 L56,39.6 L64.4,33 Z" fill="${c.fin}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M0,22 C6,17 16,14 30,13 C52,11 70,12 82,16 C86,17 89,16 92,13 L104,2 C101,12 101,18 103,22 C101,26 101,32 106,42 L92,30 C88,28 85,28 82,29 C68,34 50,35 32,33 C18,32 8,28 0,22 Z" fill="${c.body}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M7,25.4 C17,30.2 31,32 46,32 C62,32 74,30.2 83,28.4 C72,33.6 52,35.4 33,34.6 C20,33.8 12,30.4 7,25.4 Z" fill="${c.belly}"/>
    <path d="M26,31 L19,42.5 L36.5,33 Z" fill="${c.fin}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
    ${sc}${dots}
    <path d="M5,25 l-.8,4.6 M7.6,26 l-.3,4.8 M10.2,26.8 l.2,4.8 M12.8,27.4 l.6,4.6" stroke="${line}" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="14.5" cy="19.2" r="2.6" fill="#13252b"/><circle cx="15.4" cy="18.3" r=".9" fill="#fff"/>
  </g>`;
}
const SHAPES = {
  y1: 'M60,8 C86,8 102,44 102,70 C102,96 84,112 60,112 C36,112 18,96 18,70 C18,44 34,8 60,8 Z',
  y2: 'M60,8 L105,34 L105,86 L60,112 L15,86 L15,34 Z',
  y3: 'M60,108 C20,82 6,56 18,36 C30,16 52,20 60,38 C68,20 90,16 102,36 C114,56 100,82 60,108 Z',
  y5: 'M60,6 A54,54 0 1 1 59.9,6 Z',
  y7: 'M18,10 L102,14 L100,112 L16,108 Z',
  y10: Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, r = i % 2 ? 51 : 56; return `${i ? 'L' : 'M'}${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`; }).join(' ') + ' Z',
  master: 'M60,16 A42,42 0 1 1 59.9,16 Z',
};
const ART = {
  // 1歳：卵の形。ちっちゃい赤ちゃんが顔を出す
  y1: () => `<defs>${metal('m1', 'gold')}${enamel('e1', '#c9f5e6', '#7fd8bd')}</defs>
    <path d="${SHAPES.y1}" fill="url(#e1)" stroke="url(#m1)" stroke-width="6"/>
    <path d="M22,82 L32,75 L42,83 L52,75 L60,82 L68,75 L78,83 L88,75 L98,82 C98,100 82,108 60,108 C38,108 22,100 22,82 Z" fill="#fdf7e6" stroke="url(#m1)" stroke-width="2" stroke-linejoin="round"/>
    ${fish(60, 62, .34, { body: '#5f98a6', belly: '#e3f4f1', fin: '#4d8593', scute: '#ffffff' }, '#a8741c')}
    ${[[40, 40, 4.5], [50, 30, 2.6], [78, 36, 3.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffffcc" stroke="url(#m1)" stroke-width="1.2"/>`).join('')}
    ${shine('M40,20 C50,13 62,13 70,16 C58,16 48,22 42,30 Z')}
    ${plate(tr('1歳', 'Age 1'), 'm1', 90, 30)}`,
  // 2歳：骨板の六角形。よろいの骨板が金色
  y2: () => `<defs>${metal('m2', 'silver')}${enamel('e2', '#3f78ad', '#1f4470')}</defs>
    <path d="${SHAPES.y2}" fill="url(#e2)" stroke="url(#m2)" stroke-width="6" stroke-linejoin="round"/>
    <path d="M60,18 L96,39 L96,81 L60,102 L24,81 L24,39 Z" fill="none" stroke="url(#m2)" stroke-width="1.2" opacity=".7"/>
    ${fish(60, 56, .62, { body: '#8fc6e4', belly: '#e6f4fb', fin: '#6aa9cc', scute: '#ffd25e' }, '#7d8c94')}
    ${shine('M24,38 L60,17 L78,27 C60,24 40,32 26,46 Z')}
    ${plate(tr('2歳', 'Age 2'), 'm2', 84, 30)}`,
  // 3歳：ハート。オスとメスが向き合う
  y3: () => `<defs>${metal('m3', 'gold')}${enamel('e3', '#ffc3d7', '#ec6f98')}</defs>
    <path d="${SHAPES.y3}" fill="url(#e3)" stroke="url(#m3)" stroke-width="6" stroke-linejoin="round"/>
    ${fish(42, 60, .36, { body: '#8a6fb8', belly: '#efe6fb', fin: '#755aa6', scute: '#fff' }, '#a8741c', -28, true)}
    ${fish(78, 60, .36, { body: '#4f8fb0', belly: '#e3f3fa', fin: '#3f7c9c', scute: '#fff' }, '#a8741c', 28)}
    <path d="M60,40 c-2.4,-4 -8,-2 -5.4,2.4 L60,48 L65.4,42.4 c2.6,-4.4 -3,-6.4 -5.4,-2.4 Z" fill="#fff" stroke="url(#m3)" stroke-width="1.2"/>
    ${shine('M24,38 C30,24 44,22 52,30 C42,28 32,32 26,44 Z')}
    ${plate(tr('3歳', 'Age 3'), 'm3', 78, 30)}`,
  // 5歳：水の中。ヒゲで砂の中のえさを探す（波紋）
  y5: () => `<defs>${metal('m5', 'copper')}${enamel('e5', '#6c5bbf', '#2f2470')}</defs>
    <path d="${SHAPES.y5}" fill="url(#e5)" stroke="url(#m5)" stroke-width="6"/>
    <path d="M10,80 C30,74 50,82 70,77 C88,73 100,78 110,80 A54,54 0 0 1 10,80 Z" fill="#e9d4a8" stroke="url(#m5)" stroke-width="1.6"/>
    ${[6, 11, 16].map(r => `<path d="M27,${64 - r} A${r},${r} 0 0 0 27,${64 + r}" fill="none" stroke="#d6caff" stroke-width="1.8" stroke-linecap="round" opacity="${1.15 - r / 22}"/>`).join('')}
    ${fish(66, 64, .76, { body: '#9a8fd6', belly: '#efeafd', fin: '#8174c4', scute: '#ffd9a8' }, '#8c4d28', 6)}
    <circle cx="90" cy="86" r="2.4" fill="#c9ad78"/><circle cx="96" cy="90" r="1.6" fill="#c9ad78"/>
    ${shine('M22,36 C32,18 52,10 72,12 C52,16 36,26 26,44 Z')}
    ${plate(tr('5歳', 'Age 5'), 'm5', 96, 30)}`,
  // 7歳：うちの子の写真（ポラロイド風・少し傾けて画びょうで留める）
  y7: () => { const ph = photoOf('y7');
    return `<defs>${metal('m7', 'gold')}<clipPath id="c7"><rect x="24" y="20" width="72" height="66"/></clipPath><linearGradient id="w7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a9cb4"/><stop offset="1" stop-color="#123f50"/></linearGradient></defs>
    <g transform="rotate(-4 60 60)">
      <rect x="16" y="12" width="88" height="100" rx="3" fill="#fffdf6" stroke="#d9d2c0" stroke-width="1"/>
      <g clip-path="url(#c7)">${ph ? `<image href="${ph}" x="10" y="20" width="100" height="66" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="24" y="20" width="72" height="66" fill="url(#w7)"/>${fish(60, 54, .6, { body: '#4d7d8a', belly: '#d7ebee', fin: '#3f6d79', scute: '#e9f6f8' }, '#1d3a42')}`}</g>
      <rect x="24" y="20" width="72" height="66" fill="none" stroke="#00000022"/>
      <text x="60" y="102" font-size="10" font-weight="700" fill="#4a4030" text-anchor="middle">${tr('7歳のきみ', 'you at 7')}</text>
    </g>
    <circle cx="60" cy="13" r="5.5" fill="#e2574c" stroke="#9e2f26" stroke-width="1"/><circle cx="58.4" cy="11.4" r="1.6" fill="#fff" opacity=".7"/>`; },
  // 10歳：本物の写真。金のロゼット＋赤いリボン
  y10: () => `<defs>${metal('m10', 'gold')}<clipPath id="c10"><circle cx="60" cy="58" r="42"/></clipPath></defs>
    <path d="M44,92 L36,118 L46,112 L52,119 L58,96 Z" fill="#c8392f"/><path d="M76,92 L84,118 L74,112 L68,119 L62,96 Z" fill="#c8392f"/>
    <path d="${SHAPES.y10}" fill="url(#m10)" stroke="#a8741c" stroke-width="1"/>
    <circle cx="60" cy="58" r="45" fill="#7a5410"/>
    <g clip-path="url(#c10)"><image href="${REAL}" x="14" y="12" width="92" height="92" preserveAspectRatio="xMidYMid slice"/></g>
    ${shine('M24,44 C30,26 46,16 64,16 C46,22 34,32 28,50 Z')}
    <path d="M30,90 Q60,100 90,90 L88,104 Q60,113 32,104 Z" fill="#c8392f" stroke="url(#m10)" stroke-width="1.4"/>
    <text x="60" y="103" font-size="10" font-weight="800" fill="#fff3c4" text-anchor="middle">${tr('10歳', 'Age 10')}</text>`,
  // マイスター：王冠つきの金メダル
  master: () => `<defs>${metal('mm', 'gold')}${enamel('em', '#2a5b8c', '#153454')}</defs>
    <path d="M42,88 L34,118 L44,112 L50,119 L57,92 Z" fill="#c8392f"/><path d="M78,88 L86,118 L76,112 L70,119 L63,92 Z" fill="#2a6fb0"/>
    <path d="${SHAPES.master}" fill="url(#em)" stroke="url(#mm)" stroke-width="7"/>
    <path d="M42,20 L43,4 L52,12 L60,1 L68,12 L77,4 L78,20 Q60,15 42,20 Z" fill="url(#mm)" stroke="#a8741c" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="60" cy="8" r="2" fill="#e2574c"/><circle cx="47.5" cy="12" r="1.4" fill="#5fb4e8"/><circle cx="72.5" cy="12" r="1.4" fill="#5fd3a0"/>
    <circle cx="60" cy="58" r="33" fill="none" stroke="url(#mm)" stroke-width="1.2" stroke-dasharray="1 3" stroke-linecap="round"/>
    ${fish(60, 56, .5, { body: '#f0c75a', belly: '#fff0b8', fin: '#d9a838', scute: '#fff8dc' }, '#8a5a10')}
    ${[[38, 38], [84, 42], [80, 76]].map(([x, y]) => `<path d="M${x},${y - 4} l1.2,2.8 l2.8,1.2 l-2.8,1.2 l-1.2,2.8 l-1.2,-2.8 l-2.8,-1.2 l2.8,-1.2 Z" fill="#fff6cf"/>`).join('')}
    ${shine('M26,50 C30,32 44,22 62,20 C46,26 34,36 30,54 Z')}
    ${plate(tr('マイスター', 'Meister'), 'mm', 86, 46)}`,
};
// バッジ（SVG）。got=false は灰色の形と「？」
export function badgeSVG(b, got = true, size = 96) {
  const k = b ? b.id : 'master';
  const inner = got ? ART[k]() : `<path d="${SHAPES[k]}" fill="#3a4c51" stroke="#5a6e74" stroke-width="3" stroke-linejoin="round"/><text x="60" y="70" font-size="30" font-weight="800" fill="#8aa3a9" text-anchor="middle">?</text>${b ? `<text x="60" y="94" font-size="10" font-weight="800" fill="#8aa3a9" text-anchor="middle">${b.when}</text>` : ''}`;
  return `<svg class="badge-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
