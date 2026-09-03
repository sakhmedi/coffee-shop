import { LANGS, locale } from './data/locale.js';
import { initI18n, applyLang, getLang, onLangChange, t } from './i18n.js';
import { initCart } from './cart.js';
import { initMenuSection } from './ui/menu.js';
import { initWeekly } from './ui/weekly.js';
import { initCartPanel } from './ui/cart-panel.js';
import { initContactForm } from './ui/contact-form.js';
import { initMap } from './ui/map.js';

const DESKTOP_QUERY = '(min-width: 64rem)'; /* совпадает с брейкпоинтом lg */

/**
 * Шапка: прозрачная в самом верху страницы, при скролле получает
 * фон --milk и нижнюю границу. Состояние — атрибут data-scrolled,
 * оформление навешано вариантом data-scrolled: в разметке.
 */
function initHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  // Без requestAnimationFrame намеренно: в кадре мы только читаем scrollY
  // (лейаут не пересчитывается), а DOM трогаем лишь на смене состояния.
  // Через rAF шапка зависела бы от того, рисует ли вкладка кадры вообще.
  let isScrolled = null;

  const update = () => {
    const next = window.scrollY > 8;
    if (next === isScrolled) return;
    isScrolled = next;
    header.toggleAttribute('data-scrolled', next);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * Переключатели языков. Их два — в шапке и в подвале, — поэтому работаем
 * со всеми сразу: нажатие в одном должно подсветиться и в другом.
 *
 * Подписи (RU / ҚАЗ) берём из LANGS, а не из словаря: название языка
 * не переводится — кнопка «ҚАЗ» подписана так же и в русском интерфейсе.
 */
function initLangSwitcher() {
  const switchers = [...document.querySelectorAll('[data-lang-switcher]')];
  if (switchers.length === 0) return;

  const buttons = switchers.flatMap((switcher) => [
    ...switcher.querySelectorAll('[data-lang]'),
  ]);

  for (const button of buttons) {
    const lang = LANGS.find((item) => item.code === button.dataset.lang);
    if (!lang) continue;
    button.textContent = lang.short;
    // Подпись для скринридера — на языке самой кнопки.
    button.setAttribute('aria-label', locale[lang.code].a11y.switchTo);
  }

  const sync = (lang) => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    }
  };

  for (const switcher of switchers) {
    switcher.addEventListener('click', (event) => {
      const button = event.target.closest('[data-lang]');
      if (!button || !switcher.contains(button)) return;
      applyLang(button.dataset.lang);
    });
  }

  onLangChange(sync);
  sync(getLang());
}

/**
 * Полноэкранное меню на мобильном.
 * Закрывается по Esc, по клику на ссылку, по клику вне и при переходе
 * на десктопную ширину. Пока закрыто — inert: не в табуляции и не в
 * дереве доступности, хотя физически остаётся в DOM ради анимации.
 */
function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  let isOpen = false;

  const syncLabel = () => {
    toggle.setAttribute('aria-label', t(isOpen ? 'a11y.closeMenu' : 'a11y.openMenu'));
  };

  const setOpen = (next, { returnFocus = true } = {}) => {
    if (next === isOpen) return;
    isOpen = next;

    menu.dataset.open = String(isOpen);
    menu.inert = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.documentElement.classList.toggle('overflow-hidden', isOpen);
    syncLabel();

    if (isOpen) menu.querySelector('a')?.focus();
    else if (returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(!isOpen));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false, { returnFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
  });

  // Клик вне: pointerdown срабатывает раньше click, поэтому отсекаем
  // и саму кнопку-бургер, иначе она закрыла бы и тут же открыла меню.
  document.addEventListener('pointerdown', (event) => {
    if (!isOpen) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false, { returnFocus: false });
  });

  // На десктопной ширине меню скрыто через lg:hidden, но состояние должно
  // сброситься — иначе при возврате к узкому экрану оно окажется открытым.
  // Ссылку на MediaQueryList держим в переменной: список без ссылок теряет
  // подписку, если до него доберётся сборщик мусора.
  const desktop = window.matchMedia(DESKTOP_QUERY);
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false, { returnFocus: false });
  });

  onLangChange(syncLabel);

  menu.inert = true;
  syncLabel();

  return { close: () => setOpen(false, { returnFocus: false }) };
}

initI18n();
initCart();
initHeader();
initLangSwitcher();
const mobileMenu = initMobileMenu();
initMenuSection();
initWeekly();
initMap();
initContactForm();
// Корзина открывается поверх всего, поэтому мобильное меню перед ней закрываем.
initCartPanel({ onBeforeOpen: () => mobileMenu?.close() });
