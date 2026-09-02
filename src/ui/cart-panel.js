/**
 * Счётчик в шапке и панель корзины.
 *
 * Панель — модальный диалог: пока она открыта, остальная страница помечена
 * inert (не в табуляции и не в дереве доступности), поэтому отдельная
 * ловушка фокуса не нужна.
 */

import { formatPrice } from '../data/menu.js';
import { getLang, onLangChange, t } from '../i18n.js';
import {
  clearCart,
  decrementItem,
  findDrink,
  getCount,
  getItems,
  getTotal,
  incrementItem,
  onCartChange,
} from '../cart.js';
import { showToast } from './toast.js';

/**
 * @param {{ onBeforeOpen?: () => void }} [options]
 */
export function initCartPanel({ onBeforeOpen } = {}) {
  const toggle = document.querySelector('[data-cart-toggle]');
  const panel = document.querySelector('[data-cart-panel]');
  const lineTpl = document.querySelector('[data-template="cart-line"]');
  if (!toggle || !panel || !lineTpl) return;

  const countEl = toggle.querySelector('[data-cart-count]');
  const listEl = panel.querySelector('[data-cart-list]');
  const emptyEl = panel.querySelector('[data-cart-empty]');
  const summaryEl = panel.querySelector('[data-cart-summary]');
  const totalEl = panel.querySelector('[data-cart-total]');
  const closeButton = panel.querySelector('[data-cart-close]');
  const liveEl = panel.querySelector('[data-cart-live]');

  let isOpen = false;

  /* ---------------------------------------------------------------- рендер */

  const renderCounter = () => {
    const count = getCount();
    countEl.textContent = String(count);
    countEl.hidden = count === 0;
    toggle.setAttribute('aria-label', t('a11y.openCart', { count }));
  };

  /**
   * Список пересобирается целиком, поэтому кнопка под фокусом исчезает.
   * Запоминаем, что было в фокусе, и возвращаемся на ту же кнопку;
   * если позиция удалена — уходим на ближайшую разумную цель.
   */
  const captureFocus = () => {
    const button = document.activeElement?.closest?.('[data-qty]');
    if (!button || !listEl.contains(button)) return null;
    return { action: button.dataset.qty, id: button.closest('li').dataset.id };
  };

  const restoreFocus = (captured) => {
    if (!captured) return;
    const exact = listEl.querySelector(
      `li[data-id="${CSS.escape(captured.id)}"] [data-qty="${captured.action}"]`,
    );
    if (exact) {
      exact.focus();
      return;
    }
    // Позиции больше нет: «+» первой строки, иначе кнопка закрытия.
    const fallback = listEl.querySelector('[data-qty="inc"]');
    (fallback ?? closeButton).focus();
  };

  const renderList = () => {
    const items = getItems();
    const lang = getLang();
    const captured = captureFocus();

    emptyEl.hidden = items.length > 0;
    listEl.hidden = items.length === 0;
    summaryEl.hidden = items.length === 0;

    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const drink = findDrink(item.id);
      if (!drink) continue;

      const line = lineTpl.content.firstElementChild.cloneNode(true);
      line.dataset.id = drink.id;
      line.querySelector('[data-line-name]').textContent = drink.name[lang];
      line.querySelector('[data-line-unit]').textContent =
        `${formatPrice(drink.price)} × ${item.qty}`;
      line.querySelector('[data-line-qty]').textContent = String(item.qty);
      line.querySelector('[data-line-sum]').textContent = formatPrice(
        drink.price * item.qty,
      );

      // На единице «−» не уменьшает, а удаляет — подпись должна это говорить.
      const decreaseKey = item.qty === 1 ? 'a11y.removeItem' : 'a11y.decrease';
      line
        .querySelector('[data-qty="dec"]')
        .setAttribute('aria-label', t(decreaseKey, { name: drink.name[lang] }));
      line
        .querySelector('[data-qty="inc"]')
        .setAttribute('aria-label', t('a11y.increase', { name: drink.name[lang] }));

      fragment.append(line);
    }
    listEl.replaceChildren(fragment);
    restoreFocus(captured);

    totalEl.textContent = formatPrice(getTotal());
  };

  const render = () => {
    renderCounter();
    renderList();
  };

  /* ------------------------------------------------------- открыть/закрыть */

  /** Всё, кроме панели и региона тостов, на время диалога выключаем. */
  const setPageInert = (inert) => {
    for (const element of document.body.children) {
      if (element === panel || element.hasAttribute('data-modal-keep')) continue;
      element.inert = inert;
    }
  };

  const setOpen = (next, { returnFocus = true } = {}) => {
    if (next === isOpen) return;
    if (next) onBeforeOpen?.();
    isOpen = next;

    panel.dataset.open = String(isOpen);
    panel.inert = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.documentElement.classList.toggle('overflow-hidden', isOpen);
    setPageInert(isOpen);

    if (isOpen) closeButton.focus();
    else if (returnFocus) toggle.focus();
  };

  /* ----------------------------------------------------------- обработчики */

  toggle.addEventListener('click', () => setOpen(!isOpen));
  closeButton.addEventListener('click', () => setOpen(false));

  panel.querySelector('[data-cart-backdrop]').addEventListener('click', () => {
    setOpen(false);
  });

  panel.querySelector('[data-cart-clear]').addEventListener('click', () => {
    clearCart();
    // Фокус уезжает вместе с кнопкой — переводим его на «закрыть».
    closeButton.focus();
  });

  panel.querySelector('[data-cart-empty-cta]').addEventListener('click', () => {
    setOpen(false, { returnFocus: false });
    const menuSection = document.querySelector('#menu');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    menuSection?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
  });

  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-qty]');
    if (!button) return;
    const id = button.closest('li').dataset.id;
    if (button.dataset.qty === 'inc') incrementItem(id);
    else decrementItem(id);
  });

  /**
   * Добавление из меню показывает тост, действия внутри панели — только
   * объявление в невидимом регионе: панель уже открыта, число видно глазами.
   */
  const announce = ({ reason, id, items }) => {
    const drink = id ? findDrink(id) : null;
    const name = drink?.name[getLang()];

    if (reason === 'add') {
      if (name) showToast(t('toast.added', { name }));
      return;
    }

    if (reason === 'clear') {
      liveEl.textContent = t('cart.announceCleared');
      return;
    }
    if (!name) return;

    if (reason === 'remove') {
      liveEl.textContent = t('cart.announceRemoved', { name });
      return;
    }
    const qty = items.find((item) => item.id === id)?.qty;
    if (qty) liveEl.textContent = t('cart.announceQty', { name, qty });
  };

  onCartChange((detail) => {
    render();
    announce(detail);
  });

  onLangChange(render);

  panel.inert = true;
  render();
}
