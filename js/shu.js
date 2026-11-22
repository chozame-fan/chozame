// チョウザメの種類（標津サーモン科学館で会える7種類）。
// 卵を受け取る時に選べる（ベステル種（白）は選べず、館の卵からまれに生まれる・大きい水槽でまれに見かける当たり）。
// 色は fish.js の SP_LOOK、読みものは note.js の KAN_SHU。育つ早さ・大きさはどの種類もシベリアチョウザメの目安のまま（見た目だけ変わる）。
import { tr } from './i18n.js';
import { KAN_SHU } from './note.js';

// traits：見た目の個性を種類らしく寄せる（色み hue・濃さ sat は種類の色を生かすため 0・1 にそろえる）
const TRAITS = {
  siberia: {},
  russia: { hue: 0, sat: 1, snout: 0.86, scute: 1.3, scuteLight: 1, plump: 1.04 },  // 口先が短め・骨板が大きく白い
  shiro: { hue: 0, sat: 1, snout: 0.86, plump: 1.08, spotN: 0.6 },                   // 口先が丸く、どっしり
  bester: { hue: 0, sat: 1, snout: 1.1, finYellow: 0.3 },
  'bester-w': { hue: 0, sat: 1, light: 1, snout: 1.1, spotDark: 0.08, spotN: 0.3, finYellow: 0, iris: 1 },
  karumika: { hue: 0, sat: 1, snout: 1.2, plump: 0.92, finYellow: 0.9 },              // 小さく、口先がすらり
  amur: { hue: 0, sat: 1, snout: 1.04 },
};
export const SHU = KAN_SHU.map(k => ({ id: k.id, name: k.name, c: k.c, traits: TRAITS[k.id] || {}, rare: k.id === 'bester-w' }));
export const shuById = (id) => SHU.find(s => s.id === id) || SHU[0];
export const PICK = SHU.filter(s => !s.rare);               // 卵の時に選べる種類
export const RARE_KAN = 0.12;                                // 館の卵が「白」になる確率
export const RARE_MATE = 0.06;                               // 水そうのなかまが「白」になる確率
// 館の卵：7種類のどれか（白はまれ）
export const rollKan = () => Math.random() < RARE_KAN ? 'bester-w' : PICK[Math.floor(Math.random() * PICK.length)].id;
// 種類の短い説明（卵を選ぶ画面）
export const PICK_NOTE = {
  siberia: tr('このゲームの数字の元・ふつうの子', 'The standard — the game\'s numbers are based on it'),
  russia: tr('大きく白い骨板・口先が短め', 'Big white scutes, short snout'),
  shiro: tr('子どもは黒く、大きくなるとベージュに', 'Black when young, beige when grown'),
  bester: tr('かけあわせの子・口先が長め', 'A cross-bred kind with a longer snout'),
  karumika: tr('黄色っぽく、口先すらり', 'Yellowish, with a slim snout'),
  amur: tr('灰色がかった体', 'Greyish body'),
};
