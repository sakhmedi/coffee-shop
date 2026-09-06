/**
 * Первый экран: в казахской версии заголовок показывается латиницей.
 *
 * Разметка держит два span'а с одним ключом hero.title — видимый
 * (aria-hidden) и sr-only. translateTree наполняет оба кириллицей, здесь
 * мы только подменяем видимый на латиницу и переключаем ему шрифт.
 * Доступное имя h1 при этом всегда собирается из sr-only, то есть остаётся
 * кириллическим на обоих языках.
 */

import { getLang, onLangChange } from '../i18n.js';
import { HERO_TITLE_LATIN, LATIN_LANG } from '../data/hero-latin.js';

export function initHero() {
  const visual = document.querySelector('[data-hero-title]');
  if (!visual) return;

  const apply = (lang) => {
    const isLatin = lang === LATIN_LANG;

    // На русском не трогаем текст вообще: translateTree только что положил
    // сюда кириллицу по ключу hero.title, писать поверх нечего.
    if (isLatin) visual.textContent = HERO_TITLE_LATIN;

    // Unbounded — единственное место на странице, кроме логотипа. Снимаем
    // класс на русском: кириллица на нём даёт фолбэк вместо букв.
    visual.classList.toggle('font-wide', isLatin);
  };

  // Порядок важен: applyLang сначала прогоняет translateTree и лишь потом
  // шлёт событие, поэтому наша подмена всегда ложится поверх перевода.
  onLangChange(apply);
  apply(getLang());
}
