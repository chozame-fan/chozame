// みんなの絵：月がわりの限定バッジ・人気投票の候補・絵と票の送り先。
// 毎月ここを書きかえて公開する（手順は 提案/みんなの絵_手順.md）。
//
// GENTEI：その月だけもらえる限定バッジ。month は '2026-12' の形、code はコードネーム、art は絵の文字（art.js の形）。
//         その月のあいだにクイズに合格した人のバッジ帳に入り、月が変わってもその人の手元に残る。
// VOTE  ：人気投票の候補。month の月のあいだだけ図鑑に出る。1位を次の月の GENTEI に入れる。
// FORM  ：絵と票を受け取る Google フォーム。url が空のあいだは「おくる」と投票のボタンを出さない。
export const GENTEI = [
];

export const VOTE = { month: '', list: [
] };

export const FORM = {
  url: '',
  f: { kind: '', month: '', name: '', data: '', uid: '' },
};
