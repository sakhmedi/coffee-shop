/**
 * Локализация: ru / kk.
 *
 * Разметка размечается атрибутами:
 *   <h1 data-i18n="stub.title">              — переводится текст элемента;
 *   <button data-i18n-aria-label="a11y.x">   — переводится атрибут aria-label;
 *   <meta data-i18n-content="meta.description">
 * Любой атрибут вида data-i18n-<имя> кладёт перевод в атрибут <имя>.
 *
 * Смена языка не перезагружает страницу и не трогает позицию скролла:
 * DOM обновляется точечно, URL — через history.replaceState().
 */

import { locale, LANGS, SUPPORTED_LANGS, DEFAULT_LANG } from './data/locale.js';

const STORAGE_KEY = 'dala:lang';
const URL_PARAM = 'lang';

/** Событие для модулей, которые сами перерисовывают контент (меню и т.п.). */
export const LANG_CHANGE_EVENT = 'dala:langchange';

let currentLang = DEFAULT_LANG;

/** @param {unknown} value @returns {string|null} */
function normalize(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(code) ? code : null;
}

/** localStorage может быть недоступен (приватный режим) — молча переживаем. */
function readStored() {
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStored(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* не критично: язык доживёт до конца сессии в URL */
  }
}

/**
 * Приоритет: ?lang= в URL → localStorage → ru.
 * @returns {string}
 */
export function detectLang() {
  const fromUrl = normalize(
    new URLSearchParams(window.location.search).get(URL_PARAM),
  );
  return fromUrl ?? readStored() ?? DEFAULT_LANG;
}

/** @returns {string} текущий язык интерфейса */
export function getLang() {
  return currentLang;
}

/** @returns {typeof LANGS} */
export function getLangs() {
  return LANGS;
}

/** Достаёт значение по пути 'nav.menu' из словаря. */
function lookup(dict, key) {
  let node = dict;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object' || !(part in node)) return null;
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
}

/**
 * Строка интерфейса по ключу. Если перевода нет — берём русский,
 * если и его нет — отдаём сам ключ, чтобы дырка была заметна.
 * @param {string} key
 * @param {string} [lang]
 * @returns {string}
 */
export function t(key, lang = currentLang) {
  return lookup(locale[lang], key) ?? lookup(locale[DEFAULT_LANG], key) ?? key;
}

/**
 * Переводит поддерево. Вызывать после вставки новой разметки.
 * @param {ParentNode} [root]
 * @param {string} [lang]
 */
export function translateTree(root = document, lang = currentLang) {
  const scope = root instanceof Document ? root.documentElement : root;
  const nodes = [scope, ...scope.querySelectorAll('*')];

  for (const el of nodes) {
    if (!(el instanceof Element)) continue;

    const textKey = el.getAttribute('data-i18n');
    if (textKey) el.textContent = t(textKey, lang);

    for (const attr of el.attributes) {
      if (!attr.name.startsWith('data-i18n-')) continue;
      const target = attr.name.slice('data-i18n-'.length);
      if (target) el.setAttribute(target, t(attr.value, lang));
    }
  }
}

/**
 * Применяет язык ко всей странице: html[lang], тексты, localStorage, ?lang=.
 * @param {string} lang
 * @returns {string} фактически применённый язык
 */
export function applyLang(lang) {
  const next = normalize(lang) ?? DEFAULT_LANG;
  currentLang = next;

  document.documentElement.lang = next;
  translateTree(document, next);
  writeStored(next);

  // replaceState вместо перезагрузки: скролл и фокус остаются на месте,
  // а история не забивается записями на каждый клик по переключателю.
  const url = new URL(window.location.href);
  if (url.searchParams.get(URL_PARAM) !== next) {
    url.searchParams.set(URL_PARAM, next);
    window.history.replaceState(window.history.state, '', url);
  }

  document.dispatchEvent(
    new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang: next } }),
  );

  return next;
}

/**
 * Подписка на смену языка.
 * @param {(lang: string) => void} handler
 * @returns {() => void} отписка
 */
export function onLangChange(handler) {
  const listener = (event) => handler(event.detail.lang);
  document.addEventListener(LANG_CHANGE_EVENT, listener);
  return () => document.removeEventListener(LANG_CHANGE_EVENT, listener);
}

/**
 * Стартовая инициализация: определяет язык и применяет его.
 * @returns {string}
 */
export function initI18n() {
  // Переход «назад» на URL с другим ?lang= должен менять язык.
  window.addEventListener('popstate', () => applyLang(detectLang()));
  return applyLang(detectLang());
}
