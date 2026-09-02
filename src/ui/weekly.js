/**
 * «Напиток недели» — промо-блок под меню.
 * Напиток задаётся одним id; название и обе цены приходят из data/menu.js.
 */

import { formatPrice } from '../data/menu.js';
import { getLang, onLangChange, t } from '../i18n.js';
import { addItem, findDrink } from '../cart.js';

const WEEKLY_ID = 'ice-latte';

export function initWeekly() {
  const section = document.querySelector('[data-weekly]');
  if (!section) return;

  const drink = findDrink(WEEKLY_ID);
  if (!drink) {
    // Позицию убрали из меню — показывать промо не на что.
    section.remove();
    return;
  }

  const nameEl = section.querySelector('[data-weekly-name]');
  const priceEl = section.querySelector('[data-weekly-price]');
  const oldPriceEl = section.querySelector('[data-weekly-old]');
  const button = section.querySelector('[data-weekly-add]');

  const render = () => {
    nameEl.textContent = drink.name[getLang()];
    priceEl.textContent = formatPrice(drink.price);
    button.textContent = t('actions.addToCart');

    if (drink.oldPrice) oldPriceEl.textContent = formatPrice(drink.oldPrice);
    else oldPriceEl.hidden = true;
  };

  button.addEventListener('click', () => addItem(drink.id));
  onLangChange(render);
  render();
}
