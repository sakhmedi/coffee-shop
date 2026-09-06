/**
 * Секция «Меню»: фильтры по категориям и карточки напитков.
 * Данные — только из data/menu.js, разметка карточки — из <template>.
 *
 * Состояние карточки собственного нет: сколько порций показывать, карточка
 * всегда спрашивает у корзины. Поэтому количество сходится с панелью в обе
 * стороны — что бы человек ни менял, меняется один и тот же массив в cart.js,
 * а обе картинки перерисовываются по CART_CHANGE_EVENT.
 */

import { categories, formatPrice, getMenuByCategory } from '../data/menu.js';
import { getLang, onLangChange, t } from '../i18n.js';
import {
  decrementItem,
  findDrink,
  getItems,
  incrementItem,
  onCartChange,
} from '../cart.js';

const ALL = 'all';

/** Живёт между перерисовками: смена языка не должна сбрасывать фильтр. */
let activeCategory = ALL;

export function initMenuSection() {
  const filtersEl = document.querySelector('[data-menu-filters]');
  const gridEl = document.querySelector('[data-menu-grid]');
  const liveEl = document.querySelector('[data-menu-live]');
  const filterTpl = document.querySelector('[data-template="filter-button"]');
  const cardTpl = document.querySelector('[data-template="drink-card"]');
  if (!filtersEl || !gridEl || !filterTpl || !cardTpl) return;

  // «Все напитки» — из словаря, названия категорий — из данных меню.
  const filters = [
    { id: ALL, labelKey: 'actions.allDrinks' },
    ...categories.map((category) => ({ id: category.id, name: category.name })),
  ];

  const buildFilters = () => {
    const fragment = document.createDocumentFragment();
    for (const filter of filters) {
      const button = filterTpl.content.firstElementChild.cloneNode(true);
      button.dataset.filter = filter.id;
      fragment.append(button);
    }
    filtersEl.append(fragment);
  };

  /** Подписи и активное состояние — без пересборки кнопок, чтобы не терять фокус. */
  const syncFilters = () => {
    const lang = getLang();
    for (const button of filtersEl.querySelectorAll('[data-filter]')) {
      const filter = filters.find((item) => item.id === button.dataset.filter);
      if (!filter) continue;
      button.textContent = filter.labelKey ? t(filter.labelKey) : filter.name[lang];
      button.setAttribute('aria-pressed', String(filter.id === activeCategory));
    }
  };

  /**
   * Приводит карточки к текущему состоянию корзины: «+» или счётчик.
   * Узлы не пересобираются — переключается hidden, поэтому фокус на кнопке
   * переживает и добавление, и правку количества из панели.
   */
  const syncCards = () => {
    const lang = getLang();
    const quantities = new Map(getItems().map((item) => [item.id, item.qty]));

    for (const card of gridEl.children) {
      const drink = findDrink(card.dataset.id);
      if (!drink) continue;

      const qty = quantities.get(drink.id) ?? 0;
      const name = drink.name[lang];

      card.querySelector('[data-add]').hidden = qty > 0;
      card.querySelector('[data-card-stepper]').hidden = qty === 0;
      if (qty === 0) continue;

      card.querySelector('[data-card-qty]').textContent = String(qty);
      // На единице «−» не уменьшает, а удаляет — подпись должна это говорить.
      const decreaseKey = qty === 1 ? 'a11y.removeItem' : 'a11y.decrease';
      card
        .querySelector('[data-qty="dec"]')
        .setAttribute('aria-label', t(decreaseKey, { name }));
    }
  };

  const renderCards = () => {
    const lang = getLang();
    const fragment = document.createDocumentFragment();

    for (const drink of getMenuByCategory(activeCategory)) {
      const card = cardTpl.content.firstElementChild.cloneNode(true);
      const nameEl = card.querySelector('[data-name]');
      const badgeEl = card.querySelector('[data-badge]');
      const oldPriceEl = card.querySelector('[data-old-price]');
      const name = drink.name[lang];

      card.dataset.id = drink.id;
      nameEl.textContent = name;
      card.querySelector('[data-desc]').textContent = drink.desc[lang];
      card.querySelector('[data-price]').textContent = formatPrice(drink.price);

      if (drink.badge) {
        badgeEl.textContent = drink.badge;
        // Освобождаем место под плашку только там, где она есть,
        // иначе у всех остальных названий висел бы лишний отступ.
        nameEl.classList.add('pe-20');
      } else {
        badgeEl.remove();
      }

      if (drink.oldPrice) oldPriceEl.textContent = formatPrice(drink.oldPrice);
      else oldPriceEl.remove();

      // Кнопок в сетке много, поэтому у каждой подпись с названием напитка:
      // «В корзину» без уточнения в списке из пятнадцати штук бесполезно.
      card
        .querySelector('[data-add]')
        .setAttribute('aria-label', t('a11y.addToCart', { name }));
      card
        .querySelector('[data-qty="inc"]')
        .setAttribute('aria-label', t('a11y.increase', { name }));

      fragment.append(card);
    }

    gridEl.replaceChildren(fragment);
    syncCards();
  };

  filtersEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeCategory = button.dataset.filter;
    syncFilters();
    renderCards();
  });

  gridEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add], [data-qty]');
    const card = event.target.closest('[data-id]');
    if (!button || !card) return;

    const drink = findDrink(card.dataset.id);
    if (!drink) return;

    const name = drink.name[getLang()];
    const isDecrease = button.dataset.qty === 'dec';

    if (isDecrease) decrementItem(drink.id);
    else incrementItem(drink.id);

    // Событие корзины синхронное: syncCards уже отработал, и кнопка, на которую
    // мы переводим фокус, видима. Без этого фокус ушёл бы в body вместе
    // со спрятанной кнопкой — с клавиатуры карточка становилась бы тупиком.
    // «+» степпера стоит там же, где стоял одиночный «+», поэтому после
    // добавления палец и курсор остаются на месте.
    const collapsed = card.querySelector('[data-card-stepper]').hidden;
    const next = collapsed ? '[data-add]' : isDecrease ? '[data-qty="dec"]' : '[data-qty="inc"]';
    card.querySelector(next).focus();

    if (!liveEl) return;
    const qty = getItems().find((item) => item.id === drink.id)?.qty;
    liveEl.textContent = qty
      ? t('cart.announceQty', { name, qty })
      : t('cart.announceRemoved', { name });
  });

  onLangChange(() => {
    syncFilters();
    renderCards();
  });

  // Количество могли поменять в панели корзины — карточка обязана показать то же.
  onCartChange(syncCards);

  buildFilters();
  syncFilters();
  renderCards();
}
