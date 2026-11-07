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
// 6つとも形も描き方も変える。魚は節目ごとに大きくなる（1歳はちっちゃく、10歳は顔がはみ出すほど）
// 1歳 シール／2歳 刺しゅうワッペン／3歳 ハートのピン／5歳 図鑑の絵／7歳 うちの子の写真／10歳 本物の写真／マイスター 金メダル
let photoOf = () => null; // 7歳の写真：その子の図鑑の写真（main.js から渡す）
export const setPhotoSource = (f) => { photoOf = f; };
const REAL = new URL('../img/badge-oomono.jpg', import.meta.url).href; // 10歳：水族館で撮ったチョウザメの顔

const ribbon = (txt, col, y = 90) => `<path d="M26,${y} Q60,${y + 10} 94,${y} L92,${y + 14} Q60,${y + 22} 28,${y + 14} Z" fill="${col}"/><text x="60" y="${y + 13}" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing=".5">${txt}</text>`;
const BABY = 'M44,60 Q46,52.5 57,52 Q69,51.6 75,56.5 L82,51.5 Q79.6,58 82,64.5 L75,60.5 Q67,66 57,65.4 Q46.4,65 44,60 Z';
// 図鑑の絵の魚（左向き）。骨板は背・わき・腹の列を点で並べる
function realFish(ink = '#3a2c1a') {
  const row = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
  const dorsal = row(9, i => { const t = (i + 0.5) / 9, x = 36 + 48 * t, y = 50 - 10 * t * (1 - t) - 0.6; return `<path d="M${x - 2},${y + 0.6} L${x},${y - 2.4} L${x + 2},${y + 0.6} Z" fill="#e9dfc4" stroke="${ink}" stroke-width=".5"/>`; });
  const side = row(11, i => { const x = 34 + i * 5, y = 58.4 - Math.sin(i / 10 * Math.PI) * 1.2; return `<path d="M${x - 1.8},${y} L${x},${y - 1.4} L${x + 1.8},${y} L${x},${y + 1.4} Z" fill="#d9cfb2" stroke="${ink}" stroke-width=".4"/>`; });
  const belly = row(7, i => `<circle cx="${40 + i * 6}" cy="${64.6 + Math.sin(i / 6 * Math.PI) * 0.8}" r=".9" fill="${ink}" opacity=".55"/>`);
  return `<defs><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4e4a3c"/><stop offset=".55" stop-color="#8d8670"/><stop offset="1" stop-color="#e6dcc0"/></linearGradient></defs>
    <path d="M80,50.6 L86,42 L90,50.4 Z" fill="#6b6552" stroke="${ink}" stroke-width=".6"/>
    <path d="M12,58 Q22,52 36,50 Q60,45 84,50 Q92,51 96,47 L109,35 Q104,50 106,56 Q103,62 109,75 L96,62 Q90,62 84,64 Q60,70 36,67 Q24,65 12,58 Z" fill="url(#rf)" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M34,66 L27,77 L43,67.4 Z" fill="#7d7660" stroke="${ink}" stroke-width=".6"/><path d="M66,67.6 L63,74 L72,67 Z" fill="#7d7660" stroke="${ink}" stroke-width=".5"/><path d="M82,64 L84,71 L88.6,63 Z" fill="#7d7660" stroke="${ink}" stroke-width=".5"/>
    ${dorsal}${side}${belly}
    <path d="M30,52.6 Q32,58 30,64" fill="none" stroke="${ink}" stroke-width=".6" opacity=".7"/>
    <circle cx="24.4" cy="55.6" r="1.4" fill="${ink}"/><circle cx="24.8" cy="55.2" r=".4" fill="#fff"/>
    <path d="M15.5,59.6 l-.6,4.2 M17.6,60.2 l-.2,4.4 M19.7,60.6 l.2,4.4 M21.8,61 l.6,4.2" stroke="${ink}" stroke-width=".55" stroke-linecap="round"/>`;
}
// まだの時に見せる形（灰色＋？）
const SHAPE = {
  y1: '<circle cx="60" cy="60" r="54"/>',
  y2: '<path d="M60,7 L104,22 L101,70 Q93,99 60,112 Q27,99 19,70 L16,22 Z"/>',
  y3: '<path d="M60,106 C18,80 6,52 20,33 C33,17 54,22 60,38 C66,22 87,17 100,33 C114,52 102,80 60,106 Z"/>',
  y5: '<rect x="6" y="18" width="108" height="84" rx="8"/>',
  y7: '<circle cx="60" cy="60" r="55"/>',
  y10: '<circle cx="60" cy="60" r="55"/>',
  master: '<circle cx="60" cy="54" r="46"/>',
};
const ART = {
  y1: () => `<defs><radialGradient id="g-y1" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f4fff9"/><stop offset=".5" stop-color="#bff0dc"/><stop offset="1" stop-color="#7fd6c0"/></radialGradient></defs>
    <circle cx="60" cy="60" r="57" fill="#fff"/><circle cx="60" cy="60" r="51" fill="url(#g-y1)"/>
    ${[[30, 36, 4], [38, 28, 2.4], [86, 34, 3], [92, 46, 1.8], [24, 52, 2], [80, 74, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width=".8"/>`).join('')}
    <g transform="translate(60,58) scale(.95) translate(-62,-58)">
      <path d="${BABY}" fill="#5f97a3"/><path d="M48,61.4 Q57,65.6 68,62.6 Q60,66 52,64.4 Z" fill="#dff1ef"/>
      <path d="M46,62 l-.4,3 M48.4,62.8 l0,3" stroke="#5f97a3" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="52" cy="57" r="2.8" fill="#10232a"/><circle cx="52.9" cy="56" r="1" fill="#fff"/><ellipse cx="56" cy="61" rx="2.2" ry="1.2" fill="#ff8fa8" opacity=".8"/>
    </g>
    <text x="60" y="44" font-size="8" font-weight="700" fill="#2a7f6a" text-anchor="middle">${tr('ちっちゃいね', 'tiny!')}</text>
    ${ribbon(tr('1歳', 'Age 1'), '#2fa385')}`,
  y2: () => `<defs><pattern id="g-y2" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#2d6a96"/><path d="M0,3 L3,0" stroke="#3a7aa8" stroke-width=".7"/></pattern></defs>
    <path d="M60,7 L104,22 L101,70 Q93,99 60,112 Q27,99 19,70 L16,22 Z" fill="url(#g-y2)" stroke="#f1dfb0" stroke-width="7" stroke-linejoin="round"/>
    <path d="M60,13 L98,26 L95.6,69 Q88.6,94 60,105.6 Q31.4,94 24.4,69 L22,26 Z" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.2 2.2" opacity=".85"/>
    <g transform="translate(60,54) scale(.68) translate(-60,-60)">
      <path d="M100,50 Q96,60 101,74 L88,64 Z M20,62 Q28,51 48,49 Q72,46 90,56 Q92,61 90,64 Q70,74 46,72 Q28,71 20,62 Z" fill="#9fd0e6" stroke="#f1dfb0" stroke-width="2.4" stroke-dasharray="3 1.6"/>
      ${[48, 58, 68, 78].map(x => `<path d="M${x - 2.4},${48.4} l4.8,4.8 M${x + 2.4},${48.4} l-4.8,4.8" stroke="#2d6a96" stroke-width="1.8"/>`).join('')}
      <circle cx="38" cy="58" r="2.6" fill="#173c56"/><path d="M27,66 l-1,6 M31,67 l0,6" stroke="#f1dfb0" stroke-width="1.6" stroke-dasharray="1.6 1.2"/>
    </g>
    <text x="60" y="88" font-size="14" font-weight="800" fill="#f1dfb0" text-anchor="middle" letter-spacing="1" stroke="#1d4a6c" stroke-width=".6">${tr('2歳', 'AGE 2')}</text>
    <text x="60" y="32" font-size="6.5" font-weight="700" fill="#f1dfb0" text-anchor="middle" letter-spacing="1.5">ARMOR</text>`,
  y3: () => `<defs><linearGradient id="g-y3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc2d6"/><stop offset="1" stop-color="#e2537f"/></linearGradient><linearGradient id="g-y3r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#d4a43c"/><stop offset="1" stop-color="#8a6416"/></linearGradient></defs>
    <path d="M60,106 C18,80 6,52 20,33 C33,17 54,22 60,38 C66,22 87,17 100,33 C114,52 102,80 60,106 Z" fill="url(#g-y3)" stroke="url(#g-y3r)" stroke-width="5" stroke-linejoin="round"/>
    <path d="M26,40 Q32,28 44,30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <g transform="translate(61,60) scale(.62) translate(-44,-58)"><path d="${BABY}" fill="#3d6f82"/><circle cx="51" cy="57" r="2.2" fill="#10232a"/><circle cx="51.7" cy="56.3" r=".8" fill="#fff"/></g>
    <g transform="translate(59,60) scale(-.62,.62) translate(-44,-58)"><path d="${BABY}" fill="#7a5d8f"/><circle cx="51" cy="57" r="2.2" fill="#10232a"/><circle cx="51.7" cy="56.3" r=".8" fill="#fff"/></g>
    <text x="38" y="50" font-size="9" font-weight="800" fill="#fff" text-anchor="middle">♀</text><text x="82" y="50" font-size="9" font-weight="800" fill="#fff" text-anchor="middle">♂</text>
    <path d="M60,46 c-1.6,-2.6 -5,-1.2 -3.4,1.4 L60,51 L63.4,47.4 c1.6,-2.6 -1.8,-4 -3.4,-1.4 Z" fill="#fff"/>
    <text x="60" y="84" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" stroke="#a8345c" stroke-width=".5">${tr('3歳', 'Age 3')}</text>`,
  y5: () => `<rect x="6" y="18" width="108" height="84" rx="8" fill="#f3ead2" stroke="#8a6a3a" stroke-width="2.4"/>
    <rect x="10" y="22" width="100" height="76" rx="5" fill="none" stroke="#8a6a3a" stroke-width=".6"/>
    <text x="14" y="31" font-size="6" font-style="italic" fill="#5a4426">Acipenser baerii</text><text x="14" y="38" font-size="5" fill="#7a6040">${tr('シベリアチョウザメ・5歳', 'Siberian sturgeon · age 5')}</text>
    <g transform="translate(0,6)">${realFish()}</g>
    <path d="M14,90 L106,90 ${Array.from({ length: 24 }, (_, i) => `M${14 + i * 4},90 l0,${i % 5 === 0 ? -3.4 : -1.8}`).join(' ')}" stroke="#5a4426" stroke-width=".5" fill="none"/>
    <circle cx="98" cy="32" r="9" fill="none" stroke="#c0392b" stroke-width="1.6"/><text x="98" y="35.4" font-size="8.5" font-weight="800" fill="#c0392b" text-anchor="middle">${tr('5歳', '5')}</text>`,
  y7: () => { const ph = photoOf('y7');
    return `<defs><linearGradient id="g-y7" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6fbfd"/><stop offset=".45" stop-color="#9fb0b8"/><stop offset=".7" stop-color="#e3ecf0"/><stop offset="1" stop-color="#6d7f88"/></linearGradient><clipPath id="c-y7"><circle cx="60" cy="58" r="45"/></clipPath><radialGradient id="w-y7" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#3f8aa0"/><stop offset="1" stop-color="#0f3a4a"/></radialGradient></defs>
    <circle cx="60" cy="60" r="56" fill="url(#g-y7)"/><circle cx="60" cy="58" r="46.5" fill="#1b2a30"/>
    <g clip-path="url(#c-y7)">${ph ? `<image href="${ph}" x="-6" y="13" width="132" height="90" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="0" y="0" width="120" height="120" fill="url(#w-y7)"/><g transform="translate(60,58) scale(.8) translate(-60,-58)" opacity=".9">${realFish('#1a1a14')}</g>`}</g>
    <path d="M24,38 Q40,16 72,16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".25"/>
    <rect x="30" y="94" width="60" height="16" rx="8" fill="#2b3a40" stroke="#c9d6dc" stroke-width="1.2"/><text x="60" y="105.6" font-size="9.5" font-weight="800" fill="#fff" text-anchor="middle">${tr('7歳・うちの子', 'Age 7 · mine')}</text>`; },
  y10: () => `<defs><linearGradient id="g-y10" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#d4a43c"/><stop offset=".7" stop-color="#ffe28a"/><stop offset="1" stop-color="#8a6416"/></linearGradient><clipPath id="c-y10"><circle cx="60" cy="58" r="46"/></clipPath></defs>
    <circle cx="60" cy="60" r="57" fill="url(#g-y10)"/>
    ${Array.from({ length: 36 }, (_, i) => { const a = i / 36 * Math.PI * 2; return `<circle cx="${(60 + Math.cos(a) * 52.5).toFixed(1)}" cy="${(60 + Math.sin(a) * 52.5).toFixed(1)}" r="1.3" fill="#fff6d0" opacity=".9"/>`; }).join('')}
    <circle cx="60" cy="58" r="47.5" fill="#2a2210"/>
    <g clip-path="url(#c-y10)"><image href="${REAL}" x="8" y="6" width="104" height="104" preserveAspectRatio="xMidYMid slice"/></g>
    <rect x="34" y="94" width="52" height="16" rx="8" fill="#8a6416" stroke="#fff1b8" stroke-width="1.2"/><text x="60" y="105.6" font-size="10" font-weight="800" fill="#fff" text-anchor="middle">${tr('10歳', 'Age 10')}</text>`,
  master: () => `<defs><linearGradient id="g-m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c2"/><stop offset=".4" stop-color="#e6b440"/><stop offset=".65" stop-color="#fff0a8"/><stop offset="1" stop-color="#9a6a10"/></linearGradient></defs>
    <path d="M44,86 L34,116 L44,110 L50,118 L58,90 Z" fill="#c0392b"/><path d="M76,86 L86,116 L76,110 L70,118 L62,90 Z" fill="#2a6fb0"/>
    ${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.58 + i * 0.064); const x = 60 + Math.cos(a) * 52, y = 54 + Math.sin(a) * 52, r = (a * 180 / Math.PI) + 90; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="7" transform="rotate(${r.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#7fae4a"/><ellipse cx="${(120 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="7" transform="rotate(${(-r).toFixed(0)} ${(120 - x).toFixed(1)} ${y.toFixed(1)})" fill="#7fae4a"/>`; }).join('')}
    <circle cx="60" cy="54" r="44" fill="url(#g-m)" stroke="#8a5a08" stroke-width="1.2"/><circle cx="60" cy="54" r="37" fill="none" stroke="#9a6a10" stroke-width="1" opacity=".6"/>
    <g transform="translate(60,52) scale(.62) translate(-60,-58)"><g transform="translate(.8,.8)" opacity=".5">${realFish('#7a4e06').replace(/url\(#rf\)/, '#a87818').replace(/fill="#[0-9a-f]{6}"/g, 'fill="#a87818"')}</g><g>${realFish('#fff3c4').replace(/url\(#rf\)/, '#d9a632').replace(/fill="#[0-9a-f]{6}"/g, 'fill="#e8bb48"')}</g></g>
    <path d="M60,20 l2.4,5 l5.4,.6 l-4,3.6 l1.2,5.4 l-5,-2.8 l-5,2.8 l1.2,-5.4 l-4,-3.6 l5.4,-.6 Z" fill="#fff6d0" stroke="#9a6a10" stroke-width=".6"/>
    <text x="60" y="84" font-size="8" font-weight="800" fill="#6a4406" text-anchor="middle" letter-spacing="1">${tr('マイスター', 'MEISTER')}</text>`,
};
// まるいステッカーなどのバッジ（SVG）。got=false は灰色の形と「？」
export function badgeSVG(b, got = true, size = 96) {
  const k = b ? b.id : 'master';
  const inner = got ? ART[k]() : `<g fill="#3a4c51" stroke="#5a6e74" stroke-width="2">${SHAPE[k]}</g><text x="60" y="70" font-size="30" font-weight="800" fill="#8aa3a9" text-anchor="middle">?</text>${b ? `<text x="60" y="95" font-size="10" font-weight="800" fill="#8aa3a9" text-anchor="middle">${b.when}</text>` : ''}`;
  return `<svg class="badge-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
