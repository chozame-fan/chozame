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

// バッジごとの表情（目・口・ほっぺ）。座標は魚の絵の中（目の中心は 39,58）
const EYE = '<circle cx="39" cy="58" r="3.6" fill="#10232a"/><circle cx="40.2" cy="56.8" r="1.3" fill="#fff"/>';
const BLUSH = '<ellipse cx="44" cy="64" rx="3.6" ry="2" fill="#ff8fa8" opacity=".75"/>';
const LINE = 'fill="none" stroke="#10232a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const FACES = {
  y1: `<path d="M35.5,59 Q39,54.6 42.5,59" ${LINE}/><path d="M25.5,63 Q28.5,66 31.5,63.2" ${LINE}/>${BLUSH}`, // にっこり
  y2: `${EYE}<path d="M34.5,52.6 L43.5,54.8" ${LINE} stroke-width="2.2"/><path d="M26,64 L31,63.6" ${LINE}/>`, // キリッ
  y3: `<path d="M35.6,57 L39,59 L35.6,61" ${LINE}/><ellipse cx="44" cy="64" rx="4.6" ry="2.6" fill="#ff7c9c" opacity=".85"/><path d="M41.5,62.6 l1.2,1.8 M44,62.4 l1.2,1.8 M46.5,62.6 l1.2,1.8" stroke="#fff" stroke-width=".9" stroke-linecap="round"/><path d="M26,63.4 Q28,64.8 30,63.4" ${LINE} stroke-width="1.4"/>`, // てれ顔
  y5: `<circle cx="39" cy="58" r="4.8" fill="#10232a"/><path d="M40.6,54.6 l.7,1.6 l1.6,.7 l-1.6,.7 l-.7,1.6 l-.7,-1.6 l-1.6,-.7 l1.6,-.7 Z" fill="#fff"/><circle cx="37.4" cy="60" r=".9" fill="#fff"/><path d="M25.5,62.8 Q28.5,66.4 31.5,63" ${LINE}/>${BLUSH}`, // キラキラ
  y7: `${EYE}<path d="M34.6,55.6 Q39,54 43.6,55.6 L43.6,57 Q39,55.8 34.6,57 Z" fill="#3b6f7e"/><path d="M34.6,56 Q39,54.6 43.6,56" ${LINE} stroke-width="1.5"/><path d="M25.8,63.8 Q29,64.6 31.8,62.2" ${LINE}/>`, // ドヤ顔
  y10: `<path d="M35.2,55.8 L39.6,58 L35.2,60.2" ${LINE}/><path d="M25.2,62.4 Q28.6,62 32,62.6 Q31,67.6 28,67.4 Q25.6,67 25.2,62.4 Z" fill="#10232a"/><ellipse cx="28.6" cy="66" rx="2" ry="1.1" fill="#ff7c9c"/>${BLUSH}`, // 大笑い
  master: `<circle cx="39" cy="58" r="4.4" fill="#10232a"/><path d="M40.4,54.8 l.6,1.4 l1.4,.6 l-1.4,.6 l-.6,1.4 l-.6,-1.4 l-1.4,-.6 l1.4,-.6 Z" fill="#fff"/><path d="M25.5,62.8 Q28.5,66.4 31.5,63" ${LINE}/>${BLUSH}`,
};
// バッジごとのかぶり物（頭の上）
const crown = (s) => `<g transform="translate(37,50) scale(${s}) translate(-37,-50)"><path d="M29.5,50 L30.5,41 L34,45.5 L37.5,38.5 L41,45.5 L44.5,41 L45.5,50 Z" fill="#ffd23f" stroke="#b07a10" stroke-width="1" stroke-linejoin="round"/><circle cx="37.5" cy="46.5" r="1.6" fill="#ff5f7e"/><circle cx="33" cy="47.5" r="1.1" fill="#5fb4e8"/><circle cx="42" cy="47.5" r="1.1" fill="#5fd3a0"/></g>`;
const HATS = {
  y1: `<path d="M30,52 L37,33 L44,50.5 Z" fill="#ffd76a" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/><path d="M32.6,45 L41.2,43.6 M34.8,39 L39.4,38.4" stroke="#ff8fa8" stroke-width="2.4" stroke-linecap="round"/><circle cx="37" cy="33" r="2.8" fill="#ff8fa8"/>`, // パーティー帽
  y2: `<path d="M27.5,54 Q29,42 38,41.5 Q47,41.5 48.5,51 Z" fill="#c9d6dc" stroke="#6f8790" stroke-width="1"/><path d="M27.5,54 Q38,49 48.5,51" fill="none" stroke="#6f8790" stroke-width="1.6"/><path d="M38,41.5 Q41,34 47,33.5 Q43,37 42,42" fill="#e8584a"/>`, // かぶと
  y3: `<path d="M44,49.5 L37.5,44.5 L38,53 Z M44,49.5 L50.5,44 L50.5,53.5 Z" fill="#ff7caa" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/><circle cx="44" cy="49.3" r="2.2" fill="#ffd1e0"/>`, // リボン
  y5: `<path d="M24.5,57 Q27,43.5 40,43 Q51,43.5 52.5,53.5 Q45,49.6 37,50.6 Q29.5,51.8 24.5,57 Z" fill="#8a6ad6" stroke="#fff" stroke-width=".8"/><circle cx="31" cy="48.8" r="1" fill="#fff" opacity=".7"/><path d="M40,43.2 Q40.5,37 44,34" fill="none" stroke="#5b3fa0" stroke-width="1.6" stroke-linecap="round"/><circle cx="44.4" cy="33.6" r="2.6" fill="#ffd76a"/>`, // アンテナ付きフード
  y7: `<path d="M31,50.5 Q31.5,41.5 38.5,41.5 Q45.5,41.5 46,50 Z" fill="#cfb27a"/><path d="M31.3,47.4 Q38.5,45.8 45.8,47.2 L45.9,49.4 Q38.5,47.8 31.2,49.6 Z" fill="#7a5a2a"/><ellipse cx="38.5" cy="50.6" rx="13" ry="2.6" fill="#b8955a"/>`, // 探検帽
  y10: crown(1),
  master: crown(1.25),
};
// まるいステッカーのバッジ（SVG）。got=false は灰色のシルエット
export function badgeSVG(b, got = true, size = 96) {
  const k = b ? b.id : 'master';
  const c1 = got ? (b ? b.color : '#ffd76a') : '#5a6e74', c2 = got ? (b ? b.deep : '#b07a10') : '#34474d';
  const body = got ? '#3b6f7e' : '#24363b', belly = got ? '#cfe6e8' : '#2c3f44';
  const mark = got ? (b ? b.mark : '👑') : '';
  const label = b ? b.when : tr('マイスター', 'MEISTER');
  return `<svg class="badge-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
  <defs><radialGradient id="bg-${k}-${got ? 1 : 0}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
  <circle cx="60" cy="60" r="57" fill="#fff" opacity="${got ? 1 : .35}"/>
  <circle cx="60" cy="60" r="51" fill="url(#bg-${k}-${got ? 1 : 0})"/>
  <circle cx="60" cy="60" r="45" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="3 4"/>
  <g transform="translate(0,-4)">
    <path d="M100,50 Q96,60 101,74 L88,64 Z" fill="${body}"/>
    <path d="M84,50 L90,43 L92,54 Z" fill="${body}"/>
    <path d="M20,62 Q28,51 48,49 Q72,46 90,56 Q92,61 90,64 Q70,74 46,72 Q28,71 20,62 Z" fill="${body}"/>
    <path d="M28,66 Q46,73 70,69 Q60,76 44,75 Q32,73 28,66 Z" fill="${belly}"/>
    <path d="M50,70 L46,80 L58,72 Z" fill="${body}"/>
    ${[50, 59, 68, 77].map((x, i) => `<path d="M${x},${49 - (i === 0 ? 0 : 0.5)} l3,-3 l3,3 l-3,3 Z" fill="${got ? '#e9f6f8' : '#3d5258'}"/>`).join('')}
    <path d="M27,66 l-1,7 M31,67 l0,7 M35,68 l1,6" stroke="${body}" stroke-width="1.8" stroke-linecap="round"/>
    ${got ? (FACES[k] || FACES.y1) + `<g transform="translate(0,${k === 'y3' ? 0 : 2.8})">${HATS[k] || ''}</g>` : ''}
  </g>
  ${mark ? `<text x="88" y="38" font-size="20" text-anchor="middle">${mark}</text>` : `<text x="86" y="40" font-size="22" font-weight="800" fill="#8aa3a9" text-anchor="middle">?</text>`}
  <path d="M26,90 Q60,100 94,90 L92,104 Q60,112 28,104 Z" fill="${got ? c2 : '#3a4c51'}"/>
  <text x="60" y="103" font-size="${b ? 11 : 9.5}" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing=".5">${label}</text>
  ${got ? '<path d="M92,22 l1.6,4 l4,1.6 l-4,1.6 l-1.6,4 l-1.6,-4 l-4,-1.6 l4,-1.6 Z M24,30 l1,2.6 l2.6,1 l-2.6,1 l-1,2.6 l-1,-2.6 l-2.6,-1 l2.6,-1 Z" fill="#fff" opacity=".9"/>' : ''}
</svg>`;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
