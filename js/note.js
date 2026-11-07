// チョウザメ ノート（手書きのノートをもとにした読みもの）と、育てている途中に出る豆知識。
// 図鑑の「📒 ノート」タブで読める。クイズの解説からも、ノートのどこに書いてあるか案内する。
// ※元のノートの「骨の大部分が硬い骨」は事実と逆なので、「骨の多くは軟骨」と書きかえて載せている。
import { tr } from './i18n.js';

const M = (s) => `<mark>${s}</mark>`; // ノートのピンクのマーカー

export const NOTE = [
  { id: 'name', title: tr('名前の由来', 'Where the name comes from'), lines: [
    tr('「蝶（チョウ）」と「サメ」の2つの言葉が合わさったもの。', 'In Japanese, "chō-zame" joins two words: "butterfly" and "shark".'),
    tr('蝶 → うろこが羽を広げた蝶に似ているため。', 'Butterfly → its scales look like a butterfly with open wings.'),
    tr('サメ → 体全体の形や、尾びれが上下アンバランスな形をしているのが、サメによく似ているため。', 'Shark → the body shape, and a tail fin that is uneven top and bottom, look a lot like a shark.'),
    tr(`しかしサメのなかま（軟骨魚類）ではなく、ふつうの魚と同じ「硬骨魚」のグループに入る${M('古代魚')}。`, `But it is not a shark (a cartilaginous fish). It belongs with ordinary bony fish, and is an ${M('ancient fish')}.`),
    tr('恐竜が栄えていた時代（約2億年前）から、ほとんど姿を変えていない。', 'It has hardly changed since the age of dinosaurs, about 200 million years ago.'),
  ] },
  { id: 'body', title: tr('体の特徴', 'Body'), lines: [
    tr(`うろこが変化した硬い${M('骨板')}が、体の表面に縦に何列もならんでいる（5列）。`, `Hard ${M('scutes')} — changed scales — run in rows along the body (5 rows).`),
    tr('尾びれは上下で形がちがう（上のほうが長い）。', 'The tail fin is uneven: the top part is longer.'),
    tr('体の骨の多くは、やわらかい軟骨でできている。', 'Most of its skeleton is made of soft cartilage.'),
  ] },
  { id: 'face', title: tr('顔まわり', 'Face'), lines: [
    tr('口は顔の下側にあり、歯はない。', 'The mouth is under the head, and it has no teeth.'),
    tr(`口の近くに4本の${M('ヒゲ')}があり、これで川底の泥や砂をさぐってエサを見つける。`, `Four ${M('barbels')} near the mouth feel through the mud and sand of the riverbed to find food.`),
  ] },
  { id: 'home', title: tr('生息地', 'Where they live'), lines: [
    tr('主に北半球の温帯〜寒帯（ユーラシア大陸や北アメリカ）に分布している。', 'Mainly in cool and cold parts of the Northern Hemisphere (Eurasia and North America).'),
  ] },
  { id: 'life', title: tr('くらし方', 'How they live'), lines: [
    tr(`多くの種類は海で成長し、産卵のために川をのぼる${M('回遊魚')}。`, `Most kinds grow up in the sea and swim up rivers to lay eggs — ${M('migratory fish')}.`),
    tr('しかし、一生を川や湖（淡水）だけで過ごす種類もいる。', 'Some kinds spend their whole life in rivers and lakes (fresh water).'),
  ] },
  { id: 'grow', title: tr('寿命と成長', 'Lifespan and growth'), lines: [
    tr('成長がとても遅く、おとなになるまでに何年もかかる。', 'They grow very slowly and take many years to become adults.'),
    tr('そのかわり寿命がとても長く、種類によっては50年から100年近く生きるものもいる。', 'But they live a very long time — some kinds live 50 to nearly 100 years.'),
  ] },
];
export const noteById = (id) => NOTE.find(n => n.id === id);

// 節目の少し前に1回だけ出る豆知識（そのあとのクイズのヒントになる）
export const TIPS = {
  y1: { note: 'name', t: tr('「チョウザメ」は「蝶」＋「サメ」。でもサメのなかまではない古代魚なんだって。', '"Chō-zame" means "butterfly shark" — but it isn\'t a shark. It\'s an ancient fish.') },
  y2: { note: 'body', t: tr('体の骨板は5列。骨の多くはやわらかい軟骨でできているよ。', 'There are 5 rows of scutes, and most of the skeleton is soft cartilage.') },
  y3: { note: 'grow', t: tr('チョウザメは成長がゆっくり。おとなになるまで何年もかかるよ。', 'Sturgeon grow slowly. It takes years to become an adult.') },
  y5: { note: 'face', t: tr('4本のヒゲで川底の泥や砂をさぐって、エサを見つけているよ。', 'The four barbels feel through mud and sand to find food.') },
  y7: { note: 'name', t: tr('チョウザメは、恐竜がいた約2億年前から姿がほとんど変わっていないよ。', 'Sturgeon have barely changed since the dinosaurs, about 200 million years ago.') },
  y10: { note: 'life', t: tr('多くのチョウザメは海で育って、卵を産みに川をのぼる「回遊魚」だよ。', 'Most sturgeon grow up in the sea and swim up rivers to spawn — "migratory fish".') },
};
// ふだんのふきだしに時々まぜる一言
export const MAME = [
  tr('📒 口は頭の下。歯はないよ', '📒 The mouth is underneath — no teeth'),
  tr('📒 しっぽは上のほうが長い', '📒 The top of the tail is longer'),
  tr('📒 北半球の冷たい水が好き', '📒 Loves the cool waters of the north'),
  tr('📒 長生きで50〜100年', '📒 Can live 50–100 years'),
];
