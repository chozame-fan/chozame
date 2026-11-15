// みんなの絵：月がわりの限定バッジ・人気投票の候補・絵と票の送り先。
// 毎月ここを書きかえて公開する（手順は 提案/みんなの絵_手順.md）。
//
// GENTEI：その月だけもらえる限定バッジ。month は '2026-12' の形、code はコードネーム、art は絵の文字（art.js の形）。
//         その月のあいだにクイズに合格した人のバッジ帳に入り、月が変わってもその人の手元に残る。
// VOTE  ：人気投票の候補。month の月のあいだだけ図鑑に出る。1位を次の月の GENTEI に入れる。
// HAIKEI：スタンプ帳の台紙の背景。応募された絵のうち、目で確かめて問題のない物をここに足していく（順番は気にしなくてよい）。
//         この中から、毎週（月曜に切りかわる）1枚がかわりばんこで選ばれる。code はコードネーム、art は絵の文字。
// FORM  ：絵と票を受け取る Google フォーム。url が空のあいだは「おくる」と投票のボタンを出さない。
export const GENTEI = [
];

export const HAIKEI = [
];

export const VOTE = { month: '', list: [
] };

// フォーム「チョウザメ みんなの絵」（回答はスプレッドシート「チョウザメ みんなの絵（回答）」にたまる）
// 編集：https://docs.google.com/forms/d/1ebNI7nbiV2HQkzEWwweq6tb0K3nJhIKaQ2g_1FQ0YC0/edit
export const FORM = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSdPPigSr0xjszrq__UA18QbrBatHLBQWH2WYPDHkLKw3FdGlg/formResponse',
  f: { kind: 'entry.1282764522', month: 'entry.260650786', name: 'entry.287970072', data: 'entry.945206418', uid: 'entry.48775132' },
};
