// 組んでいる館・町（ご当地チョウザメ）。館のQRの ?kan=〇〇 から来た人に、その館の名前つきの卵をわたす
// confirmed:false の間は「試作」と出す（館の確認が取れるまで公開しない）
import { tr } from './i18n.js';

export const PARTNERS = {
  shibetsu: {
    id: 'shibetsu', confirmed: false,
    name: tr('標津サーモン科学館', 'Shibetsu Salmon Museum'),
    place: tr('北海道 標津町', 'Shibetsu, Hokkaido'),
    url: 'https://s-salmon.com/',
    color: '#f0a83c',
    fishName: tr('パク', 'Paku'),
    seed: 4242,
    // 指パクの子なので、鼻ヒクヒク・水面をのぞく回数を多めに、ヒレのふちは黄色く
    traits: { sniffy: 1.45, curious: 1.35, finYellow: 0.9 },
    welcome: tr('標津サーモン科学館から来た方へ。<br>指パクで有名な館にちなんだ、特別な卵「パク」をどうぞ。', 'Welcome from the Shibetsu Salmon Museum!<br>Here is a special egg, "Paku", named after the museum\'s famous finger-nibble.'),
    page: tr(`<p>サケの仲間を中心に展示している、北海道標津町の科学館です。世界でもここだけと言われる<b>「チョウザメ指パク体験」</b>では、水面にそっと指を出すと、歯のないチョウザメが口で吸い込むように食べにきます。</p>
      <p>ゲームで育てた子がどんなふうに指を吸うのか、本物で確かめてみてください。</p>
      <p class="mine">住所：北海道標津郡標津町北1条西6丁目1番1-1号 標津サーモンパーク内<br>開館：9:30〜17:00（受付は16:30まで）<br>休館：12〜1月は冬季休館、2・3・4・11月は水曜（祝日なら翌日）</p>`,
      `<p>A science museum in Shibetsu, Hokkaido, focused on salmon and their relatives. Its <b>sturgeon "finger-nibble" experience</b> is said to be one of a kind: hold a finger at the water surface and a toothless sturgeon comes to suck it in.</p>
      <p>Go and feel how a real sturgeon does it.</p>
      <p class="mine">Address: Shibetsu Salmon Park, Kita 1-jo Nishi 6-chome 1-1-1, Shibetsu, Hokkaido<br>Open 9:30–17:00 (last entry 16:30)<br>Closed Dec–Jan; Wednesdays in Feb, Mar, Apr and Nov</p>`),
  },
};

const q = new URLSearchParams(location.search).get('kan');
export const VISIT = PARTNERS[q] || null;
