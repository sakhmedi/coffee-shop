/**
 * Секция «Меню»: фильтры по категориям и карточки напитков.
 * Данные — только из data/menu.js, разметка карточки — из <template>.
 */

import { categories, formatPrice, getMenuByCategory } from '../data/menu.js';
import { getLang, onLangChange, t } from '../i18n.js';
import { addItem } from '../cart.js';

const ALL = 'all';

/** Живёт между перерисовками: смена языка не должна сбрасывать фильтр. */
let activeCategory = ALL;

export function initMenuSection() {
  const filtersEl = document.querySelector('[data-menu-filters]');
  const gridEl = document.querySelector('[data-menu-grid]');
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

  const renderCards = () => {
    const lang = getLang();
    const addLabel = t('actions.addToCart');
    const fragment = document.createDocumentFragment();

    for (const drink of getMenuByCategory(activeCategory)) {
      const card = cardTpl.content.firstElementChild.cloneNode(true);
      const nameEl = card.querySelector('[data-name]');
      const badgeEl = card.querySelector('[data-badge]');
      const oldPriceEl = card.querySelector('[data-old-price]');
      const button = card.querySelector('[data-add]');

      nameEl.textContent = drink.name[lang];
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

      button.textContent = addLabel;
      button.dataset.add = drink.id;

      fragment.append(card);
    }

    gridEl.replaceChildren(fragment);
  };

  filtersEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeCategory = button.dataset.filter;
    syncFilters();
    renderCards();
  });

  gridEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add]');
    if (button) addItem(button.dataset.add);
  });

  onLangChange(() => {
    syncFilters();
    renderCards();
  });

  buildFilters();
  syncFilters();
  renderCards();
}
