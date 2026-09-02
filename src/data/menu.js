/**
 * Меню DALA COFFEE.
 *
 * Позиция: { id, category, name: {ru, kk}, desc: {ru, kk}, price, oldPrice?, badge? }
 * price / oldPrice — число в тенге. Форматирует formatPrice().
 */

export const categories = [
  { id: 'classic', name: { ru: 'Классика', kk: 'Классикалық' } },
  { id: 'milk', name: { ru: 'На молоке', kk: 'Сүтті кофе' } },
  { id: 'ice', name: { ru: 'Айс', kk: 'Мұзды кофе' } },
  { id: 'author', name: { ru: 'Авторские', kk: 'Авторлық' } },
  { id: 'sweet', name: { ru: 'Сладкие', kk: 'Тәтті' } },
];

export const menu = [
  // --- Классика ---
  {
    id: 'espresso',
    category: 'classic',
    name: { ru: 'Эспрессо', kk: 'Эспрессо' },
    desc: { ru: 'Чистый крепкий кофе, 30 мл', kk: 'Таза күшті кофе, 30 мл' },
    price: 900,
  },
  {
    id: 'doppio',
    category: 'classic',
    name: { ru: 'Доппио', kk: 'Доппио' },
    desc: { ru: 'Двойной эспрессо', kk: 'Қос эспрессо' },
    price: 1100,
  },
  {
    id: 'americano',
    category: 'classic',
    name: { ru: 'Американо', kk: 'Американо' },
    desc: { ru: 'Эспрессо и горячая вода', kk: 'Эспрессо және ыстық су' },
    price: 1100,
  },
  {
    id: 'lungo',
    category: 'classic',
    name: { ru: 'Лунго', kk: 'Лунго' },
    desc: { ru: 'Долгий эспрессо, больше воды', kk: 'Ұзақ эспрессо, суы көбірек' },
    price: 1150,
  },

  // --- На молоке ---
  {
    id: 'cappuccino',
    category: 'milk',
    name: { ru: 'Капучино', kk: 'Капучино' },
    desc: {
      ru: 'Эспрессо и плотная молочная пена',
      kk: 'Эспрессо және қалың сүт көбігі',
    },
    price: 1400,
  },
  {
    id: 'latte',
    category: 'milk',
    name: { ru: 'Латте', kk: 'Латте' },
    desc: { ru: 'Много молока, тонкая пена', kk: 'Көп сүт, жұқа көбік' },
    price: 1500,
  },
  {
    id: 'flat-white',
    category: 'milk',
    name: { ru: 'Флэт уайт', kk: 'Флэт уайт' },
    desc: {
      ru: 'Двойной эспрессо и микропена',
      kk: 'Қос эспрессо және микрокөбік',
    },
    price: 1500,
  },
  {
    id: 'cortado',
    category: 'milk',
    name: { ru: 'Кортадо', kk: 'Кортадо' },
    desc: {
      ru: 'Эспрессо пополам с молоком',
      kk: 'Эспрессо мен сүт тең мөлшерде',
    },
    price: 1300,
  },
  {
    id: 'macchiato',
    category: 'milk',
    name: { ru: 'Макиато', kk: 'Макиато' },
    desc: {
      ru: 'Эспрессо с ложкой пены',
      kk: 'Бір қасық көбігі бар эспрессо',
    },
    price: 1250,
  },

  // --- Айс ---
  {
    id: 'ice-latte',
    category: 'ice',
    name: { ru: 'Айс латте', kk: 'Мұзды латте' },
    desc: {
      ru: 'Холодное молоко, лёд, двойной эспрессо',
      kk: 'Салқын сүт, мұз, қос эспрессо',
    },
    price: 1700,
    oldPrice: 2000,
    badge: '−15%',
  },
  {
    id: 'ice-americano',
    category: 'ice',
    name: { ru: 'Айс американо', kk: 'Мұзды американо' },
    desc: { ru: 'Эспрессо, лёд, вода', kk: 'Эспрессо, мұз, су' },
    price: 1300,
  },
  {
    id: 'cold-brew',
    category: 'ice',
    name: { ru: 'Колд брю', kk: 'Колд брю' },
    desc: {
      ru: 'Настаивается 16 часов на холоде',
      kk: '16 сағат суықта тұнады',
    },
    price: 1800,
  },
  {
    id: 'espresso-tonic',
    category: 'ice',
    name: { ru: 'Эспрессо-тоник', kk: 'Эспрессо-тоник' },
    desc: { ru: 'Тоник, лёд, эспрессо', kk: 'Тоник, мұз, эспрессо' },
    price: 1750,
  },

  // --- Авторские ---
  {
    id: 'saryarka-latte',
    category: 'author',
    name: { ru: 'Латте «Сарыарқа»', kk: '«Сарыарқа» латте' },
    desc: { ru: 'Латте с облепихой', kk: 'Шырғанақты латте' },
    price: 2000,
  },
  {
    id: 'apricot-latte',
    category: 'author',
    name: { ru: 'Латте с курагой', kk: 'Өрікті латте' },
    desc: { ru: 'Сироп из кураги и корицы', kk: 'Өрік пен даршын сиропы' },
    price: 1900,
  },
  {
    id: 'baked-milk-raf',
    category: 'author',
    name: { ru: 'Раф на топлёном молоке', kk: 'Қаймақты раф' },
    desc: { ru: 'Сливочный, с ванилью', kk: 'Ваниль қосылған кілегейлі' },
    price: 1950,
  },
  {
    id: 'coffee-baursak',
    category: 'author',
    name: { ru: 'Кофе с баурсаком', kk: 'Бауырсақпен кофе' },
    desc: { ru: 'Американо и три баурсака', kk: 'Американо және үш бауырсақ' },
    price: 2200,
  },

  // --- Сладкие ---
  {
    id: 'mocha',
    category: 'sweet',
    name: { ru: 'Мокко', kk: 'Мокко' },
    desc: { ru: 'Эспрессо, шоколад, молоко', kk: 'Эспрессо, шоколад, сүт' },
    price: 1800,
  },
  {
    id: 'caramel-latte',
    category: 'sweet',
    name: { ru: 'Карамельный латте', kk: 'Карамельді латте' },
    desc: { ru: 'Солёная карамель', kk: 'Тұзды карамель' },
    price: 1800,
  },
  {
    id: 'vienna-coffee',
    category: 'sweet',
    name: { ru: 'Венский кофе', kk: 'Вена кофесі' },
    desc: {
      ru: 'Эспрессо и взбитые сливки',
      kk: 'Эспрессо және шайқалған кілегей',
    },
    price: 1700,
  },
  {
    id: 'hot-chocolate',
    category: 'sweet',
    name: { ru: 'Горячий шоколад', kk: 'Ыстық шоколад' },
    desc: { ru: 'Без кофе, 70% какао', kk: 'Кофесіз, 70% какао' },
    price: 1600,
  },
];

/** Узкий неразрывный пробел: и разделитель разрядов, и отбивка перед ₸. */
const NNBSP = '\u202F';

/**
 * 1400 → «1 400 ₸». Не через Intl: нужен один и тот же вид в обеих локалях.
 * @param {number} value
 * @returns {string}
 */
export function formatPrice(value) {
  const grouped = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  return `${grouped}${NNBSP}₸`;
}

/**
 * Позиции одной категории; без аргумента — всё меню в исходном порядке.
 * @param {string} [categoryId]
 * @returns {typeof menu}
 */
export function getMenuByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return menu;
  return menu.filter((item) => item.category === categoryId);
}
