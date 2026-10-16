// ゲームの元データ（資料で調べた値。数字は「目安」）
// 種類はシベリアチョウザメ（Acipenser baerii）を基本にしている。

// ふ化後の日数 → 全長(cm) の目安。間は対数で補間する
export const GROWTH = [
  [0, 1.05], [9, 2.0], [27, 4.0], [60, 8], [91, 12], [120, 16.5],
  [180, 25], [365, 45], [730, 65], [1095, 80], [1825, 98],
  [2555, 115], [3650, 130], [7300, 160], [18250, 190],
];

export const HATCH_DAYS = 130 / 24; // 受精からふ化まで 約130時間（約17℃）

export function expectedLength(d) {
  if (d <= 0) return GROWTH[0][1];
  for (let i = 1; i < GROWTH.length; i++) {
    const [d1, l1] = GROWTH[i];
    if (d <= d1) {
      const [d0, l0] = GROWTH[i - 1];
      const k = (d - d0) / (d1 - d0);
      return Math.exp(Math.log(l0) + (Math.log(l1) - Math.log(l0)) * k);
    }
  }
  return GROWTH[GROWTH.length - 1][1];
}

// 全長(cm) → 体重(g) の目安
export function weightOf(L) {
  return 0.0019 * Math.pow(L, 3.15) * (1 + 1.2 * Math.exp(-L / 4));
}

export function fmtWeight(g) {
  if (g < 1) return `約${Math.round(g * 1000)}mg`;
  if (g < 1000) return `約${g < 10 ? g.toFixed(1) : Math.round(g)}g`;
  return `約${(g / 1000).toFixed(1)}kg`;
}
export function fmtLength(cm) {
  if (cm < 3) return `${(cm * 10).toFixed(1)}mm`;
  if (cm < 100) return `${cm.toFixed(1)}cm`;
  return `${(cm / 100).toFixed(2)}m`;
}
export function fmtAge(d) {
  if (d < 0) return `受精後 ${Math.floor((d + HATCH_DAYS) * 24)}時間`;
  if (d < 60) return `ふ化後 ${Math.floor(d)}日`;
  if (d < 365) return `ふ化後 ${Math.floor(d / 30.4)}か月（${Math.floor(d)}日）`;
  const y = Math.floor(d / 365 + 1e-4), m = Math.min(11, Math.max(0, Math.floor((d - y * 365) / 30.4)));
  return `${y}歳${m ? m + 'か月' : ''}`;
}

// 水槽（大きくなると引っ越す）。単位cm
export const TANKS = [
  { id: 'incubator', name: 'ふ化盆', w: 24, d: 14, h: 10, maxL: 3 },
  { id: 't45', name: '45cm水槽', w: 45, d: 30, h: 30, maxL: 8 },
  { id: 't90', name: '90cm水槽', w: 90, d: 45, h: 45, maxL: 22 },
  { id: 't180', name: '180cm水槽', w: 180, d: 60, h: 60, maxL: 50 },
  { id: 't360', name: '大型水槽（3.6m）', w: 360, d: 150, h: 90, maxL: 100 },
  { id: 'pond', name: '屋外の池（8m）', w: 800, d: 400, h: 150, maxL: 1e9 },
];
export function tankFor(L) { return TANKS.find(t => L < t.maxL); }

// 餌。minL/maxL は食べられる魚の全長(cm)。minD はふ化後の日数
export const FOODS = [
  {
    id: 'artemia', name: 'ブラインシュリンプ', icon: '🟠', minD: 8, minL: 0, maxL: 8,
    size: 0.05, color: 0xff8a3d, shape: 'dot', count: 40, sink: 0.25, swim: true, quality: 1.15,
    zukan: '生まれたてのエビの仲間（ノープリウス幼生）。体長0.5mmほどで、動くので仔魚が食いつきやすい。卵黄を使い切った直後（ふ化後8〜20日）の最初の餌として研究でも使われる。',
  },
  {
    id: 'ito', name: 'イトミミズ', icon: '🪱', minD: 12, minL: 2.2, maxL: 40,
    size: 2.0, color: 0x9c3b2c, shape: 'worm', thin: 0.035, count: 10, sink: 1.2, wiggle: true, quality: 1.1,
    zukan: '細くて赤いミミズの仲間。川底の泥に住む。稚魚が好んで食べ、配合飼料に慣らす前の餌にも使われる。',
  },
  {
    id: 'akamushi', name: 'アカムシ（冷凍）', icon: '🔴', minD: 15, minL: 2.5, maxL: 60,
    size: 1.3, color: 0xc4182b, shape: 'worm', thin: 0.06, count: 10, sink: 1.5, quality: 1.15,
    zukan: 'ユスリカの幼虫。野生のチョウザメが川底で食べているおもな餌のひとつ。ヒゲで底をさぐって、下向きの口で吸い込む。',
  },
  {
    id: 'pellet_s', name: '沈むペレット（小粒1.5mm）', icon: '🟤', minD: 25, minL: 3.5, maxL: 40,
    size: 0.15, color: 0x6b4a2b, shape: 'dot', count: 30, sink: 2.0, quality: 1.0,
    zukan: 'チョウザメ用の配合飼料。底で食べる魚なので「沈むタイプ」を使う。養殖場ではこの餌に慣らして育てるのが基本。',
  },
  {
    id: 'pellet_l', name: '沈むペレット（大粒6mm）', icon: '🟫', minD: 120, minL: 25, maxL: 999,
    size: 0.6, color: 0x5a3c22, shape: 'dot', count: 24, sink: 4, quality: 1.0,
    zukan: '大きくなったチョウザメ用の配合飼料。栄養のバランスがよく、養殖場の主食。',
  },
  {
    id: 'krill', name: 'クリル（オキアミ）', icon: '🦐', minD: 90, minL: 12, maxL: 999,
    size: 2.5, color: 0xf2a08a, shape: 'shrimp', count: 8, sink: 3, quality: 1.05,
    zukan: '小さなエビの仲間。野生のチョウザメも甲殻類（エビ・ヨコエビなど）をよく食べる。',
  },
  {
    id: 'shijimi', name: 'シジミ', icon: '🐚', minD: 300, minL: 30, maxL: 999,
    size: 1.6, color: 0x3d3428, shape: 'shell', count: 8, sink: 6, quality: 1.0,
    zukan: '川の貝。大きなチョウザメは貝を殻ごと吸い込んで食べる。歯がないので丸のみ。',
  },
  {
    id: 'wakasagi', name: 'ワカサギ', icon: '🐟', minD: 600, minL: 50, maxL: 999,
    size: 7, color: 0xc9d3dc, shape: 'fish', count: 5, sink: 6, quality: 1.05,
    zukan: '小魚。大きく育ったチョウザメは小魚も食べる（大型種ほど魚を多く食べる）。',
  },
  {
    id: 'float', name: '浮くエサ（金魚用）', icon: '🟡', minD: 0, minL: 999, maxL: 0,
    size: 0.25, color: 0xf2c94c, shape: 'flake', count: 20, sink: 0, quality: 0,
    zukan: 'チョウザメは口が体の下側にあり、底の餌を吸い込む魚。水面に浮く餌はほとんど食べられず、残ると水が汚れる。',
  },
];
export const foodById = Object.fromEntries(FOODS.map(f => [f.id, f]));

export function canEat(food, d, L) {
  return d >= food.minD && L >= food.minL && L <= food.maxL;
}
// 自動給餌で選ぶ餌
export function bestFood(d, L) {
  const order = L < 4 ? ['artemia', 'ito'] : L < 15 ? ['akamushi', 'ito', 'pellet_s'] : L < 30 ? ['pellet_s', 'akamushi'] : ['pellet_l', 'krill'];
  return order.map(id => foodById[id]).find(f => canEat(f, d, L));
}

// 図鑑（成長の記録）。at: ふ化後の日数（マイナスは卵の時期）
export const ZUKAN = [
  { id: 'egg', at: -HATCH_DAYS, title: '受精卵', hint: 'はじめから',
    text: '直径およそ3mm。黒っぽい色で、ねばりがあり川底の石にくっつく。16〜19℃くらいの水で育てる。水温が高すぎると弱りやすい。' },
  { id: 'embryo', at: -HATCH_DAYS * 0.45, title: '卵の中の胚', hint: '受精後 約3日',
    text: '卵の中で体ができてくる。黒い卵黄のまわりに、細長い体が巻きつくように育っていく。ときどきピクッと動く。' },
  { id: 'hatch', at: 0, title: 'ふ化', hint: '受精後 約130時間',
    text: '全長およそ10.5mm。お腹に大きな卵黄のう（栄養の袋）を持ち、口はまだ使えない。体は半透明で、背中からしっぽまでヒレの膜がつながっている。群れになって水中を上下に泳ぐ。' },
  { id: 'barbel', at: 4, title: 'ヒゲが生えた', hint: 'ふ化後 数日',
    text: '口の前に4本のヒゲが伸びてくる。ヒゲには味やにおいを感じる細胞があり、目の小さいチョウザメはこれで底の餌を探す。（日数は目安）' },
  { id: 'firstfeed', at: 9, title: '卵黄を使い切る', hint: 'ふ化後 約9日',
    text: '全長およそ2cm。群れをやめて底に散らばりはじめたら、自分で餌を食べる合図。最初の餌はブラインシュリンプなど生きた小さな餌。ここで食べられないと弱ってしまう、いちばん大事な時期。' },
  { id: 'meta', at: 27, title: '小さなチョウザメの形に', hint: 'ふ化後 約1か月',
    text: 'ヒレの膜が背ビレ・尻ビレ・尾ビレに分かれ、とがった口先と平たい頭ができる。体長およそ4cmで、もう大人と同じ形のミニチュア。' },
  { id: 'scuteD', at: 59, title: '背中の骨板（模様①）', hint: 'ふ化後 約2か月',
    text: '背中の一列の骨板（こつばん）がそろって硬くなる。チョウザメの「サメ」っぽいゴツゴツはウロコではなく、この骨の板。若いうちはトゲが白く目立つ。' },
  { id: 'scuteAll', at: 91, title: '5列の骨板がそろう（模様②）', hint: 'ふ化後 約3か月',
    text: '体の横と腹の骨板もそろい、背中1列・横2列・腹2列の合計5列が完成。体の断面が五角形っぽく見えるのはこのため。' },
  { id: 'seed', at: 120, title: '稚魚（全長16cm）', hint: 'ふ化後 約4か月',
    text: '養殖場に「種苗（しゅびょう）」として運ばれるくらいの大きさ。京都府の養殖試験では全長約165mm・体重約13gの稚魚から育て始めている。' },
  { id: 'y1', at: 365, title: '1歳', hint: '1年後',
    text: '全長40〜50cmほど（目安）。飼い方と水温で大きく変わる。冬に水温が下がると、食べる量も成長もゆっくりになる。' },
  { id: 'y2', at: 730, title: '2歳', hint: '2年後',
    text: '全長60cmほど（目安）。成長につれて口先が少し短く丸くなり、若いころの鋭い骨板のトゲは角がとれて目立たなくなっていく。' },
  { id: 'y3', at: 1095, title: '3歳・オスメスが分かる', hint: '3年後',
    text: '食用として出荷できるのが約3年。チョウザメは外見ではオスとメスがほぼ分からず、養殖場ではエコー（超音波）などで調べて分ける。' },
  { id: 'y5', at: 1825, title: '5歳', hint: '5年後',
    text: '全長1mに近づく（目安）。底をゆったり泳ぎ、ヒゲで砂をなでるように餌をさがす。' },
  { id: 'y7', at: 2555, title: '7歳・おとなになる', hint: '7年後',
    text: 'メスが卵を持ち、キャビアが取れるようになる目安が約7年。チョウザメは成長がとても遅い魚で、ここまで来るのが一番の手間。' },
  { id: 'y10', at: 3650, title: '10歳', hint: '10年後',
    text: '全長1.3mほど（目安）。シベリアチョウザメは野生では2m近くになり、50年以上生きることもある。チョウザメの仲間は約2億年前からほとんど姿が変わっていない「生きた化石」。' },
];

export const SOURCES = [
  ['シベリアチョウザメの仔魚期の形態発達（ふ化時10.4〜11.1mm、ふ化後9〜10日で摂餌開始・19.7〜21.6mm）', 'https://hal.inrae.fr/hal-02578015'],
  ['ふ化は受精後130時間・平均全長10.5mm、ふ化後27日で変態完了', 'https://www.infish.com.pl/wydawnictwo/Archives/Fasc/work_pdf/Vol8Fasc2/Vol8Fasc2%20-%20w05.pdf'],
  ['18℃でふ化後9日に給餌開始（群れが散らばる時期）', 'https://riviste.unimi.it/index.php/haf/article/view/7088'],
  ['卵黄期の水温16〜19℃が成長とストレスのバランスがよい', 'https://air.unimi.it/handle/2434/623828'],
  ['骨板：背側はふ化後59日、横・腹は91日で骨化完了（ショートノーズチョウザメ）', 'https://www.kennebecestuary.org/s/11-Altenritter-et-al-2015-EBF.pdf'],
  ['京都府：食肉まで約3年・キャビアまで約7年、種苗 約165mm・13g', 'https://www.pref.kyoto.jp/kaiyo/documents/2108-02.pdf'],
  ['外見では雌雄が分からない（新しい判別法の発表）', 'https://agri.mynavi.jp/prtimes/2025_03_19_303673/'],
];
