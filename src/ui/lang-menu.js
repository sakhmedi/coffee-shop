/**
 * Меню выбора языка: кнопка с глобусом и кодом текущего языка, по клику
 * раскрывается список языков.
 *
 * Меню на странице два — в шапке и в подвале, — поэтому модуль работает
 * со всеми сразу. Общего состояния у них нет и не нужно: единственный
 * источник правды — getLang(), единственный канал синхронизации —
 * onLangChange(). Выбор в одном меню подсвечивается в другом просто потому,
 * что оба слушают одно событие.
 *
 * Разметка обоих экземпляров лежит в index.html: у шапки и подвала разные
 * палитры и разное направление раскрытия, и через общий <template> это
 * потребовало бы вариантов классов по родителю — сложнее того, что экономит.
 */

import { LANGS, locale } from '../data/locale.js';
import { applyLang, getLang, onLangChange } from '../i18n.js';

/**
 * Один переключатель.
 * @param {Element} root
 * @returns {{ close: () => void, sync: (lang: string) => void } | null}
 */
function setup(root) {
  const toggle = root.querySelector('[data-lang-menu-toggle]');
  const list = root.querySelector('[data-lang-menu-list]');
  if (!toggle || !list) return null;

  const code = toggle.querySelector('[data-lang-menu-code]');
  const items = [...list.querySelectorAll('[data-lang]')];
  if (items.length === 0) return null;

  // Названия языков не переводятся: пункт «Қазақша» подписан так же и в
  // русском интерфейсе. Рядом обязателен lang — иначе синтезатор прочитает
  // казахское название русским голосом.
  for (const item of items) {
    const lang = LANGS.find((entry) => entry.code === item.dataset.lang);
    if (!lang) continue;
    item.textContent = lang.label;
    item.lang = lang.code;
    item.setAttribute('aria-label', locale[lang.code].a11y.switchTo);
  }

  let isOpen = false;

  const currentItem = () =>
    items.find((item) => item.dataset.lang === getLang()) ?? items[0];

  /**
   * hidden вместо утилиты display: в base-слое он усилен !important
   * и побеждает grid на самом списке. Анимации нет намеренно — меню
   * должно появляться сразу, а не «выезжать» под курсором.
   */
  const setOpen = (next, { focusItem = null, returnFocus = true } = {}) => {
    if (next === isOpen) return;
    isOpen = next;

    list.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) (focusItem ?? currentItem()).focus();
    else if (returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(!isOpen));

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!isOpen) return;
      event.preventDefault();
      setOpen(false);
      return;
    }

    // Стрелки на кнопке открывают меню и сразу уводят фокус внутрь:
    // вниз — на текущий язык, вверх — на последний пункт.
    if (event.target === toggle) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const target = event.key === 'ArrowUp' ? items.at(-1) : currentItem();
      if (isOpen) target.focus();
      else setOpen(true, { focusItem: target });
      return;
    }

    const index = items.indexOf(event.target);
    if (index === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(index + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        break;
      case 'End':
        event.preventDefault();
        items.at(-1).focus();
        break;
      // Tab не перехватываем: возвращаем фокус на кнопку и отпускаем событие.
      // Браузер продолжит обход от неё — то есть с того места страницы, где
      // человек и находился, когда открыл меню.
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  });

  list.addEventListener('click', (event) => {
    const item = event.target.closest('[data-lang]');
    if (!item || !list.contains(item)) return;
    applyLang(item.dataset.lang);
    setOpen(false);
  });

  // Клик вне: pointerdown срабатывает раньше click, поэтому сам переключатель
  // из проверки исключаем — иначе кнопка закрыла бы и тут же открыла меню.
  // Побочный эффект здесь нужен: открытие меню в шапке гасит меню в подвале.
  document.addEventListener('pointerdown', (event) => {
    if (!isOpen || root.contains(event.target)) return;
    setOpen(false, { returnFocus: false });
  });

  const sync = (lang) => {
    const active = LANGS.find((entry) => entry.code === lang);
    if (code && active) code.textContent = active.short;

    for (const item of items) {
      if (item.dataset.lang === lang) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    }
  };

  list.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');

  return {
    close: () => setOpen(false, { returnFocus: false }),
    sync,
  };
}

/**
 * @returns {{ closeAll: () => void } | null}
 */
export function initLangMenus() {
  const instances = [...document.querySelectorAll('[data-lang-menu]')]
    .map(setup)
    .filter(Boolean);
  if (instances.length === 0) return null;

  const sync = (lang) => {
    for (const instance of instances) instance.sync(lang);
  };

  onLangChange(sync);
  sync(getLang());

  return {
    closeAll: () => {
      for (const instance of instances) instance.close();
    },
  };
}
