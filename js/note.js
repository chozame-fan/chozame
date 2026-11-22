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

// 標津サーモン科学館で会えるチョウザメ（館の解説パネルを2026年11月に撮影して書き写した。写真は使っていない）。
// c は体の色のめやす（図鑑の色の点）。札の文が読めなかった所は書かない。
export const KAN_SHU = [
  { id: 'siberia', c: '#9a6b55', name: tr('シベリアチョウザメ', 'Siberian sturgeon'), tag: tr('このゲームの子と同じ種類', 'Same kind as your fish'), lines: [
    tr('シベリアのオビ川やエニセイ川などにすむ。', 'Lives in Siberian rivers such as the Ob and the Yenisei.'),
    tr(`体長は2mをこえる、${M('淡水定着型')}（一生を川ですごす）の種類。`, `Grows over 2 m and is ${M('freshwater-resident')} (spends its whole life in rivers).`),
    tr('保護のためにバルト海にも移され、そこでも広くすんでいる。', 'It was also moved to the Baltic Sea to protect it, and now lives widely there too.'),
  ] },
  { id: 'russia', c: '#5b4a52', name: tr('ロシアチョウザメ', 'Russian sturgeon'), lines: [
    tr(`ウロコ（${M('骨板')}）が大きくて白い。`, `Its scales (${M('scutes')}) are large and white.`),
    tr('大きいものは4mにもなる。黒海・カスピ海の沿岸などにすむ。', 'The biggest reach 4 m. Lives along the Black Sea and the Caspian Sea.'),
    tr('川だけでくらす「陸封型」と、海から川をのぼる「遡河型」がいる。', 'Some stay in fresh water all their lives; others swim from the sea up rivers.'),
  ] },
  { id: 'shiro', c: '#c9b79a', name: tr('シロチョウザメ', 'White sturgeon'), lines: [
    tr('おもに北アメリカの西海岸のあたりにすむ。体長は4m以上になる。', 'Mainly found off the west coast of North America. Grows to over 4 m.'),
    tr(`子どものうちはほとんど黒いが、大きくなるにつれて白っぽくなり、${M('ベージュ色')}になる。`, `Almost black when young, it turns paler as it grows, ending up ${M('beige')}.`),
  ] },
  { id: 'bester', c: '#b59a86', name: tr('ベステル種', 'Bester'), lines: [
    tr(`旧ソ連の時代に、ロシアで${M('オオチョウザメ（ベルーガ）のメス')}と${M('コチョウザメのオス')}をかけあわせて生まれた種類。`, `Bred in Russia in Soviet times by crossing a ${M('female beluga')} with a ${M('male sterlet')}.`),
    tr('アゾフ海（ロシア）で養殖がさかん。キャビアや魚の肉が食べものとして使われている。', 'Widely farmed in the Sea of Azov (Russia). Its caviar and meat are eaten.'),
  ] },
  { id: 'bester-w', c: '#f3e6dc', name: tr('ベステル種（白）', 'White bester'), lines: [
    tr('ベステル種の突然変異で、体が白い。', 'A white mutation of the bester.'),
  ] },
  { id: 'karumika', c: '#a08550', name: tr('カルミカ', 'Karumika'), lines: [
    tr(`大きくても1m前後で、館の札では「チョウザメの中で${M('いちばん小さい')}」とされている。`, `Only about 1 m at most — the museum sign calls it the ${M('smallest')} sturgeon.`),
    tr('水温などの変化に強い。シベリアの川、カスピ海・黒海などにすむ。', 'Copes well with changes in water temperature. Lives in Siberian rivers, the Caspian Sea, the Black Sea and more.'),
  ] },
  { id: 'amur', c: '#8d8f98', name: tr('アムールチョウザメ', 'Amur sturgeon'), lines: [
    tr('アムール川の流域にすむチョウザメ（館の札の文は、シールで一部かくれていた）。', 'A sturgeon of the Amur River basin (part of the museum sign was covered).'),
  ] },
];

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
