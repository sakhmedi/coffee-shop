/**
 * Корзина. Бэкенда нет, состояние живёт в localStorage.
 *
 * В хранилище кладём ТОЛЬКО id и количество: [{ id, qty }].
 * Названия и цены сохранять нельзя — корзина застрянет на старом языке
 * и на старых ценах. Всё остальное всегда берём из data/menu.js по id.
 */

import { menu } from './data/menu.js';

const STORAGE_KEY = 'dala:cart';
const MAX_QTY = 99;

export const CART_CHANGE_EVENT = 'dala:cartchange';

/** @type {{ id: string, qty: number }[]} */
let items = [];

/** @param {string} id */
export function findDrink(id) {
  return menu.find((drink) => drink.id === id) ?? null;
}

/**
 * Читает хранилище с недоверием: там могли остаться позиции, которых
 * больше нет в меню, мусор из другой версии или чужие данные.
 */
function readStorage() {
  let raw;
  try {
    raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const byId = new Map();
  for (const entry of raw) {
    const id = typeof entry?.id === 'string' ? entry.id : null;
    const qty = Math.floor(Number(entry?.qty));
    if (!id || !findDrink(id) || !Number.isFinite(qty) || qty < 1) continue;
    byId.set(id, Math.min((byId.get(id) ?? 0) + qty, MAX_QTY));
  }

  return [...byId].map(([id, qty]) => ({ id, qty }));
}

function writeStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* приватный режим или переполненное хранилище: корзина доживёт до перезагрузки */
  }
}

/**
 * reason нужен, чтобы UI различал источник изменения: добавление из меню
 * показывает тост, а «−» и «+» внутри панели — только объявление в aria-live.
 * @param {{ reason: 'add'|'increment'|'decrement'|'remove'|'clear', id?: string }} detail
 */
function emit(detail) {
  document.dispatchEvent(
    new CustomEvent(CART_CHANGE_EVENT, { detail: { items: getItems(), ...detail } }),
  );
}

/** Копия, чтобы снаружи нельзя было поменять состояние мимо API. */
export function getItems() {
  return items.map((item) => ({ ...item }));
}

/** Общее количество напитков — число на счётчике в шапке. */
export function getCount() {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/** Сумма в тенге. Цены берём из меню, а не из хранилища. */
export function getTotal() {
  return items.reduce((sum, item) => {
    const drink = findDrink(item.id);
    return drink ? sum + drink.price * item.qty : sum;
  }, 0);
}

/** @param {string} id @param {'add'|'increment'} reason */
function bump(id, reason) {
  if (!findDrink(id)) return;

  const existing = items.find((item) => item.id === id);
  if (existing) {
    if (existing.qty >= MAX_QTY) return;
    existing.qty += 1;
  } else {
    items.push({ id, qty: 1 });
  }

  writeStorage();
  emit({ reason, id });
}

/** Добавление из меню или промо-блока: показывает тост. */
export function addItem(id) {
  bump(id, 'add');
}

/** «+» в корзине: тоста нет, только объявление. */
export function incrementItem(id) {
  bump(id, 'increment');
}

/** «−» в корзине. На единице убирает позицию целиком. */
export function decrementItem(id) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return;

  const isLast = items[index].qty <= 1;
  if (isLast) items.splice(index, 1);
  else items[index].qty -= 1;

  writeStorage();
  emit({ reason: isLast ? 'remove' : 'decrement', id });
}

export function clearCart() {
  if (items.length === 0) return;
  items = [];
  writeStorage();
  emit({ reason: 'clear' });
}

/**
 * @param {(detail: {
 *   items: { id: string, qty: number }[],
 *   reason: 'add'|'increment'|'decrement'|'remove'|'clear',
 *   id?: string,
 * }) => void} handler
 * @returns {() => void} отписка
 */
export function onCartChange(handler) {
  const listener = (event) => handler(event.detail);
  document.addEventListener(CART_CHANGE_EVENT, listener);
  return () => document.removeEventListener(CART_CHANGE_EVENT, listener);
}

/** Поднимает сохранённую корзину. Вызывать до инициализации UI. */
export function initCart() {
  items = readStorage();
  // Хранилище могло быть подчищено (позиция исчезла из меню) — сохраняем
  // нормализованный вид сразу, чтобы мусор не тянулся дальше.
  writeStorage();
}
