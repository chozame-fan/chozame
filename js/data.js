// ゲームの元データ（資料で調べた値。数字は「目安」）
// 種類はシベリアチョウザメ（Acipenser baerii）を基本にしている。
import { tr, EN } from './i18n.js';

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
  const about = tr('約', '~');
  if (g < 1) return `${about}${Math.round(g * 1000)}mg`;
  if (g < 1000) return `${about}${g < 10 ? g.toFixed(1) : Math.round(g)}g`;
  return `${about}${(g / 1000).toFixed(1)}kg`;
}
export function fmtLength(cm) {
  if (cm < 3) return `${(cm * 10).toFixed(1)}mm`;
  if (cm < 100) return `${cm.toFixed(1)}cm`;
  return `${(cm / 100).toFixed(2)}m`;
}
export function fmtAge(d) {
  if (d < 0) return tr(`受精後 ${Math.floor((d + HATCH_DAYS) * 24)}時間`, `${Math.floor((d + HATCH_DAYS) * 24)} h after fertilization`);
  if (d < 60) return tr(`ふ化後 ${Math.floor(d)}日`, `Day ${Math.floor(d)} after hatching`);
  if (d < 365) return tr(`ふ化後 ${Math.floor(d / 30.4)}か月（${Math.floor(d)}日）`, `${Math.floor(d / 30.4)} months (day ${Math.floor(d)})`);
  const y = Math.floor(d / 365 + 1e-4), m = Math.min(11, Math.max(0, Math.floor((d - y * 365) / 30.4)));
  return EN ? `${y} yr${m ? ` ${m} mo` : ''}` : `${y}歳${m ? m + 'か月' : ''}`;
}
// 性別（セーブには日本語で入っている）
export const sexName = (s) => tr(s, s === 'メス' ? 'female' : 'male');

// 水槽（大きくなると引っ越す）。単位cm
export const TANKS = [
  { id: 'incubator', name: tr('ふ化盆', 'hatching tray'), w: 24, d: 14, h: 10, maxL: 3 },
  { id: 't45', name: tr('45cm水槽', '45 cm tank'), w: 45, d: 30, h: 30, maxL: 8 },
  { id: 't90', name: tr('90cm水槽', '90 cm tank'), w: 90, d: 45, h: 45, maxL: 22 },
  { id: 't180', name: tr('180cm水槽', '180 cm tank'), w: 180, d: 60, h: 60, maxL: 50 },
  { id: 't360', name: tr('大型水槽（3.6m）', 'big tank (3.6 m)'), w: 360, d: 150, h: 90, maxL: 100 },
  { id: 'pond', name: tr('屋外の池（8m）', 'outdoor pond (8 m)'), w: 800, d: 400, h: 150, maxL: 1e9 },
];
export function tankFor(L) { return TANKS.find(t => L < t.maxL); }

// 餌。minL/maxL は食べられる魚の全長(cm)。minD はふ化後の日数
export const FOODS = [
  {
    id: 'artemia', name: tr('ブラインシュリンプ', 'Brine shrimp'), icon: '🟠', minD: 8, minL: 0, maxL: 8,
    size: 0.05, color: 0xff8a3d, shape: 'dot', count: 40, sink: 0.25, swim: true, quality: 1.15,
    zukan: tr('生まれたてのエビの仲間（ノープリウス幼生）。体長0.5mmほどで、動くので仔魚が食いつきやすい。卵黄を使い切った直後（ふ化後8〜20日）の最初の餌として研究でも使われる。',
      'Newly hatched shrimp larvae (nauplii), about 0.5 mm long. They move, so larvae snap at them easily. Studies use them as the very first food right after the yolk runs out (day 8–20 after hatching).'),
  },
  {
    id: 'ito', name: tr('イトミミズ', 'Tubifex worms'), icon: '🪱', minD: 12, minL: 2.2, maxL: 40,
    size: 2.0, color: 0x9c3b2c, shape: 'worm', thin: 0.035, count: 10, sink: 1.2, wiggle: true, quality: 1.1,
    zukan: tr('細くて赤いミミズの仲間。川底の泥に住む。稚魚が好んで食べ、配合飼料に慣らす前の餌にも使われる。',
      'Thin red worms that live in river mud. Young fish love them, and they are used before switching to pellets.'),
  },
  {
    id: 'akamushi', name: tr('アカムシ（冷凍）', 'Bloodworms (frozen)'), icon: '🔴', minD: 15, minL: 2.5, maxL: 60,
    size: 1.3, color: 0xc4182b, shape: 'worm', thin: 0.06, count: 10, sink: 1.5, quality: 1.15,
    zukan: tr('ユスリカの幼虫。野生のチョウザメが川底で食べているおもな餌のひとつ。ヒゲで底をさぐって、下向きの口で吸い込む。',
      'Midge larvae — one of the main foods of wild sturgeon on the river bed. They feel the bottom with their barbels and suck food in with their downward mouth.'),
  },
  {
    id: 'pellet_s', name: tr('沈むペレット（小粒1.5mm）', 'Sinking pellets (1.5 mm)'), icon: '🟤', minD: 25, minL: 3.5, maxL: 40,
    size: 0.15, color: 0x6b4a2b, shape: 'dot', count: 30, sink: 2.0, quality: 1.0,
    zukan: tr('チョウザメ用の配合飼料。底で食べる魚なので「沈むタイプ」を使う。養殖場ではこの餌に慣らして育てるのが基本。',
      'Sturgeon feed. They eat on the bottom, so the pellets must sink. Farms raise sturgeon by getting them used to this food.'),
  },
  {
    id: 'pellet_l', name: tr('沈むペレット（大粒6mm）', 'Sinking pellets (6 mm)'), icon: '🟫', minD: 120, minL: 25, maxL: 999,
    size: 0.6, color: 0x5a3c22, shape: 'dot', count: 24, sink: 4, quality: 1.0,
    zukan: tr('大きくなったチョウザメ用の配合飼料。栄養のバランスがよく、養殖場の主食。',
      'Feed for grown sturgeon. Well balanced — the staple food on farms.'),
  },
  {
    id: 'krill', name: tr('クリル（オキアミ）', 'Krill'), icon: '🦐', minD: 90, minL: 12, maxL: 999,
    size: 2.5, color: 0xf2a08a, shape: 'shrimp', count: 8, sink: 3, quality: 1.05,
    zukan: tr('小さなエビの仲間。野生のチョウザメも甲殻類（エビ・ヨコエビなど）をよく食べる。',
      'Small shrimp-like animals. Wild sturgeon eat lots of crustaceans too (shrimp, amphipods).'),
  },
  {
    id: 'shijimi', name: tr('シジミ', 'Freshwater clams'), icon: '🐚', minD: 300, minL: 30, maxL: 999,
    size: 1.6, color: 0x3d3428, shape: 'shell', count: 8, sink: 6, quality: 1.0,
    zukan: tr('川の貝。大きなチョウザメは貝を殻ごと吸い込んで食べる。歯がないので丸のみ。',
      'River clams. Big sturgeon suck them in shell and all — they have no teeth, so they swallow them whole.'),
  },
  {
    id: 'wakasagi', name: tr('ワカサギ', 'Smelt'), icon: '🐟', minD: 600, minL: 50, maxL: 999,
    size: 7, color: 0xc9d3dc, shape: 'fish', count: 5, sink: 6, quality: 1.05,
    zukan: tr('小魚。大きく育ったチョウザメは小魚も食べる（大型種ほど魚を多く食べる）。',
      'Small fish. Grown sturgeon eat small fish too (the bigger the species, the more fish they eat).'),
  },
  {
    id: 'float', name: tr('浮くエサ（金魚用）', 'Floating flakes (goldfish)'), icon: '🟡', minD: 0, minL: 999, maxL: 0,
    size: 0.25, color: 0xf2c94c, shape: 'flake', count: 20, sink: 0, quality: 0,
    zukan: tr('チョウザメは口が体の下側にあり、底の餌を吸い込む魚。水面に浮く餌はほとんど食べられず、残ると水が汚れる。',
      'A sturgeon\'s mouth is on the underside of its head, made for sucking food off the bottom. It can hardly eat floating food, and leftovers make the water dirty.'),
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
  { id: 'egg', line: tr('きみと出会った日', 'The day we met'), at: -HATCH_DAYS, title: tr('受精卵', 'Fertilized egg'), hint: tr('はじめから', 'from the start'),
    text: tr('直径およそ3mm。黒っぽい色で、ねばりがあり川底の石にくっつく。16〜19℃くらいの水で育てる。水温が高すぎると弱りやすい。',
      'About 3 mm across. Dark and sticky, so it clings to stones on the river bed. Keep it in water around 16–19°C — too warm and it gets weak.') },
  { id: 'embryo', line: tr('卵の中で、小さな命が動きはじめた', 'A tiny life began to move inside the egg'), at: -HATCH_DAYS * 0.45, title: tr('卵の中の胚', 'Embryo in the egg'), hint: tr('受精後 約3日', '~3 days after fertilization'),
    text: tr('卵の中で体ができてくる。黒い卵黄のまわりに、細長い体が巻きつくように育っていく。ときどきピクッと動く。',
      'The body forms inside the egg, a slim body curling around the dark yolk. Now and then it twitches.') },
  { id: 'hatch', line: tr('はじめまして。生まれてきてくれてありがとう', 'Nice to meet you. Thank you for being born'), at: 0, title: tr('ふ化', 'Hatching'), hint: tr('受精後 約130時間', '~130 h after fertilization'),
    text: tr('全長およそ10.5mm。お腹に大きな卵黄のう（栄養の袋）を持ち、口はまだ使えない。体は半透明で、背中からしっぽまでヒレの膜がつながっている。群れになって水中を上下に泳ぐ。',
      'About 10.5 mm long. It carries a big yolk sac (a bag of food) on its belly and can\'t use its mouth yet. The body is see-through, with one fin fold from back to tail. Larvae swim up and down in a group.') },
  { id: 'barbel', line: tr('小さなヒゲが、ちょこんと生えたね', 'Look — tiny whiskers!'), at: 4, title: tr('ヒゲが生えた', 'Barbels appear'), hint: tr('ふ化後 数日', 'a few days after hatching'),
    text: tr('口の前に4本のヒゲが伸びてくる。ヒゲには味やにおいを感じる細胞があり、目の小さいチョウザメはこれで底の餌を探す。（日数は目安）',
      'Four barbels grow in front of the mouth. They can taste and smell, and the small-eyed sturgeon uses them to find food on the bottom. (Days are approximate.)') },
  { id: 'firstfeed', line: tr('はじめてのごはん、上手に食べられたね', 'Your first meal — well done!'), at: 9, title: tr('卵黄を使い切る', 'Yolk used up'), hint: tr('ふ化後 約9日', '~9 days after hatching'),
    text: tr('全長およそ2cm。群れをやめて底に散らばりはじめたら、自分で餌を食べる合図。最初の餌はブラインシュリンプなど生きた小さな餌。ここで食べられないと弱ってしまう、いちばん大事な時期。',
      'About 2 cm long. When the larvae leave the group and spread over the bottom, they are ready to eat. The first food is tiny live food like brine shrimp. If they can\'t eat now they get weak — the most important stage.') },
  { id: 'meta', line: tr('すっかりチョウザメの形になったね', 'You really look like a sturgeon now'), at: 27, title: tr('小さなチョウザメの形に', 'A mini sturgeon'), hint: tr('ふ化後 約1か月', '~1 month after hatching'),
    text: tr('ヒレの膜が背ビレ・尻ビレ・尾ビレに分かれ、とがった口先と平たい頭ができる。体長およそ4cmで、もう大人と同じ形のミニチュア。',
      'The fin fold splits into dorsal, anal and tail fins, and a pointed snout and flat head form. About 4 cm — a miniature of the adult.') },
  { id: 'scuteD', line: tr('背中のトゲが、かっこよくなってきた', 'Your back spikes look cool'), at: 59, title: tr('背中の骨板（模様①）', 'Back scutes (pattern 1)'), hint: tr('ふ化後 約2か月', '~2 months after hatching'),
    text: tr('背中の一列の骨板（こつばん）がそろって硬くなる。チョウザメの「サメ」っぽいゴツゴツはウロコではなく、この骨の板。若いうちはトゲが白く目立つ。',
      'The row of bony plates (scutes) on the back hardens. The shark-like bumps of a sturgeon are not scales but these bone plates. In young fish the spikes are white and stand out.') },
  { id: 'scuteAll', line: tr('からだじゅうに、よろいができたね', 'Armor all over your body'), at: 91, title: tr('5列の骨板がそろう（模様②）', 'All 5 rows of scutes (pattern 2)'), hint: tr('ふ化後 約3か月', '~3 months after hatching'),
    text: tr('体の横と腹の骨板もそろい、背中1列・横2列・腹2列の合計5列が完成。体の断面が五角形っぽく見えるのはこのため。',
      'The side and belly scutes are done too: 1 row on the back, 2 on the sides, 2 on the belly — 5 rows in all. That is why the body looks a bit like a pentagon in cross-section.') },
  { id: 'seed', line: tr('手のひらより大きくなったね', 'Bigger than my hand now'), at: 120, title: tr('稚魚（全長16cm）', 'Juvenile (16 cm)'), hint: tr('ふ化後 約4か月', '~4 months after hatching'),
    text: tr('養殖場に「種苗（しゅびょう）」として運ばれるくらいの大きさ。京都府の養殖試験では全長約165mm・体重約13gの稚魚から育て始めている。',
      'The size at which young fish are shipped to farms. A Kyoto Prefecture farming trial started with juveniles of about 165 mm and 13 g.') },
  { id: 'y1', line: tr('1歳のお誕生日、おめでとう', 'Happy 1st birthday'), at: 365, title: tr('1歳', 'Age 1'), hint: tr('1年後', 'after 1 year'),
    text: tr('全長40〜50cmほど（目安）。飼い方と水温で大きく変わる。冬に水温が下がると、食べる量も成長もゆっくりになる。',
      'About 40–50 cm long (approx.). Care and water temperature make a big difference. In winter, when the water cools, eating and growth slow down.') },
  { id: 'y2', line: tr('ゆったり泳ぐ姿が、たのもしい', 'Swimming so calmly — so reliable'), at: 730, title: tr('2歳', 'Age 2'), hint: tr('2年後', 'after 2 years'),
    text: tr('全長60cmほど（目安）。成長につれて口先が少し短く丸くなり、若いころの鋭い骨板のトゲは角がとれて目立たなくなっていく。',
      'About 60 cm (approx.). The snout gets a little shorter and rounder, and the sharp scute spikes of youth wear smooth.') },
  { id: 'y3', line: tr('もう、りっぱな大人の顔だね', 'Such a grown-up face'), at: 1095, title: tr('3歳・オスメスが分かる', 'Age 3 — male or female?'), hint: tr('3年後', 'after 3 years'),
    text: tr('食用として出荷できるのが約3年。チョウザメは外見ではオスとメスがほぼ分からず、養殖場ではエコー（超音波）などで調べて分ける。',
      'Farmed sturgeon are sold for meat at about 3 years. You can hardly tell males from females by looks, so farms check with ultrasound.') },
  { id: 'y5', line: tr('いっしょに過ごした5年間', 'Five years together'), at: 1825, title: tr('5歳', 'Age 5'), hint: tr('5年後', 'after 5 years'),
    text: tr('全長1mに近づく（目安）。底をゆったり泳ぎ、ヒゲで砂をなでるように餌をさがす。',
      'Nearly 1 m long (approx.). It cruises along the bottom, brushing the sand with its barbels to find food.') },
  { id: 'y7', line: tr('大きく、たくましく育ったね', 'You grew so big and strong'), at: 2555, title: tr('7歳・おとなになる', 'Age 7 — adult'), hint: tr('7年後', 'after 7 years'),
    text: tr('メスが卵を持ち、キャビアが取れるようになる目安が約7年。チョウザメは成長がとても遅い魚で、ここまで来るのが一番の手間。',
      'Females carry eggs (caviar) at about 7 years. Sturgeon grow very slowly — getting this far is the hardest part.') },
  { id: 'y10', line: tr('10年間、ほんとうにありがとう', 'Thank you for these ten years'), at: 3650, title: tr('10歳', 'Age 10'), hint: tr('10年後', 'after 10 years'),
    text: tr('全長1.3mほど（目安）。シベリアチョウザメは野生では2m近くになり、50年以上生きることもある。チョウザメの仲間は約2億年前からほとんど姿が変わっていない「生きた化石」。',
      'About 1.3 m (approx.). In the wild, Siberian sturgeon reach nearly 2 m and can live over 50 years. Sturgeon have barely changed in about 200 million years — a "living fossil".') },
];

export const SOURCES = [
  [tr('シベリアチョウザメの仔魚期の形態発達（ふ化時10.4〜11.1mm、ふ化後9〜10日で摂餌開始・19.7〜21.6mm）', 'Larval development of Siberian sturgeon (10.4–11.1 mm at hatching; first feeding at day 9–10, 19.7–21.6 mm)'), 'https://hal.inrae.fr/hal-02578015'],
  [tr('ふ化は受精後130時間・平均全長10.5mm、ふ化後27日で変態完了', 'Hatching 130 h after fertilization at 10.5 mm; metamorphosis done by day 27'), 'https://www.infish.com.pl/wydawnictwo/Archives/Fasc/work_pdf/Vol8Fasc2/Vol8Fasc2%20-%20w05.pdf'],
  [tr('18℃でふ化後9日に給餌開始（群れが散らばる時期）', 'At 18°C, feeding starts on day 9 (when the group spreads out)'), 'https://riviste.unimi.it/index.php/haf/article/view/7088'],
  [tr('卵黄期の水温16〜19℃が成長とストレスのバランスがよい', '16–19°C during the yolk stage balances growth and stress'), 'https://air.unimi.it/handle/2434/623828'],
  [tr('骨板：背側はふ化後59日、横・腹は91日で骨化完了（ショートノーズチョウザメ）', 'Scutes: back rows ossify by day 59, side and belly by day 91 (shortnose sturgeon)'), 'https://www.kennebecestuary.org/s/11-Altenritter-et-al-2015-EBF.pdf'],
  [tr('京都府：食肉まで約3年・キャビアまで約7年、種苗 約165mm・13g', 'Kyoto Prefecture: ~3 years to meat, ~7 years to caviar; juveniles ~165 mm, 13 g (Japanese)'), 'https://www.pref.kyoto.jp/kaiyo/documents/2108-02.pdf'],
  [tr('外見では雌雄が分からない（新しい判別法の発表）', 'Sex cannot be told by looks (a new method announced, Japanese)'), 'https://agri.mynavi.jp/prtimes/2025_03_19_303673/'],
];
