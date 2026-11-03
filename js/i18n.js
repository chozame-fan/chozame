// 言葉の切りかえ（日本語 / English）。選んだら読み込み直して全部の文字を入れかえる
const KEY = 'chozame-lang';
let saved = null;
try { saved = localStorage.getItem(KEY); } catch {}
const q = new URLSearchParams(location.search).get('lang');
// はじめての人は、スマホ・パソコンの言語に合わせる（日本語以外は英語）
export const LANG = (q === 'en' || q === 'ja') ? q : saved || ((navigator.language || 'ja').startsWith('ja') ? 'ja' : 'en');
export const EN = LANG === 'en';
export const tr = (ja, en) => (EN ? en : ja);
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch {} const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u); }

// HTMLに書いた文字：data-en（文字）・data-en-html（タグ入り）・data-en-ph（入力欄の例）を英語に入れかえる
export function applyStatic() {
  document.documentElement.lang = LANG;
  if (!EN) return;
  document.title = 'Sturgeon Keeper';
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = el.dataset.en; });
  document.querySelectorAll('[data-en-html]').forEach(el => { el.innerHTML = el.dataset.enHtml; });
  document.querySelectorAll('[data-en-ph]').forEach(el => { el.placeholder = el.dataset.enPh; });
  document.querySelectorAll('[data-en-title]').forEach(el => { el.title = el.dataset.enTitle; });
  document.querySelectorAll('[data-en-aria]').forEach(el => { el.setAttribute('aria-label', el.dataset.enAria); });
}
