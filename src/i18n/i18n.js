// 言葉の切り替えと文の引き方。画面の文字は全部ここを通す（英語が先・分からない言葉は英語）
import ja from './ja.js?v=3';
import en from './en.js?v=3';

export const TABLES = { ja, en };
export const LANGS = ['en', 'ja'];
const KEY = 'ninja.lang';
let lang = 'en';

export const getLang = () => lang;
export const detectLang = (navLang) => (String(navLang ?? '').toLowerCase().startsWith('ja') ? 'ja' : 'en');

export function loadLang(storage) {
  try { const v = storage?.getItem(KEY); return LANGS.includes(v) ? v : null; } catch { return null; }
}

export function setLang(l, storage) {
  if (!LANGS.includes(l)) return;
  lang = l;
  try { storage?.setItem(KEY, l); } catch { /* 保存できない端末でも切り替えは効かせる */ }
}

export function initLang(storage, navLang) {
  lang = loadLang(storage) ?? detectLang(navLang);
  return lang;
}

// t('play.stage', { n: 3 }) → 「第3の間」。{n} を埋める。無い鍵は鍵そのもの（気づけるように）
export function t(key, vars) {
  const s = TABLES[lang][key] ?? TABLES.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}
