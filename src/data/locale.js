/**
 * Все строки интерфейса. Единственный источник правды для текстов —
 * в разметке и в JS не должно оставаться зашитых слов на русском.
 *
 * Ключи — вложенные, обращение через точку: t('nav.menu').
 * Названия и описания напитков живут отдельно, в data/menu.js.
 */

export const DEFAULT_LANG = 'ru';

/** Порядок здесь = порядок кнопок в переключателе. */
export const LANGS = [
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'kk', short: 'ҚАЗ', label: 'Қазақша' },
];

export const SUPPORTED_LANGS = LANGS.map((lang) => lang.code);

export const locale = {
  ru: {
    meta: {
      title: 'DALA COFFEE — кофейня в Астане',
      description:
        'DALA COFFEE — кофейня в Астане: классика, авторские напитки на местных ' +
        'вкусах и кофе с собой.',
    },
    brand: {
      name: 'DALA COFFEE',
      tagline: 'Кофейня в Астане',
    },
    nav: {
      menu: 'Меню',
      about: 'О нас',
      contacts: 'Контакты',
      addresses: 'Адреса',
    },
    actions: {
      addToCart: 'В корзину',
      more: 'Подробнее',
      allDrinks: 'Все напитки',
      order: 'Заказать',
      toTop: 'Наверх',
      writeUs: 'Написать нам',
      send: 'Отправить',
    },
    info: {
      hours: 'Часы работы',
    },
    hero: {
      title: 'Кофе в центре степи',
      subtitle:
        'Кофейня в Астане. Обжарка своя, зерно приходит на точку через ' +
        'три дня после ростера. Открываемся в 8:00.',
      ctaMenu: 'Смотреть меню',
      ctaFind: 'Как нас найти',
      imageAlt: 'Стакан кофе на деревянной стойке',
    },
    facts: {
      beans: '18 сортов зерна',
      roast: 'Обжариваем в Астане',
      hours: 'Открыто до 22:00',
    },
    a11y: {
      skipToContent: 'Перейти к содержимому',
      langSwitcher: 'Выбор языка',
      switchTo: 'Переключить на русский',
      toHome: 'DALA COFFEE, наверх страницы',
      mainNav: 'Основная навигация',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
    },
  },

  kk: {
    meta: {
      title: 'DALA COFFEE — Астанадағы кофехана',
      description:
        'DALA COFFEE — Астанадағы кофехана: классика, жергілікті дәмдері бар ' +
        'авторлық сусындар және өзіңізбен алатын кофе.',
    },
    brand: {
      name: 'DALA COFFEE',
      tagline: 'Астанадағы кофехана',
    },
    nav: {
      menu: 'Мәзір',
      about: 'Біз туралы',
      contacts: 'Байланыс',
      addresses: 'Мекенжайлар',
    },
    actions: {
      addToCart: 'Себетке',
      more: 'Толығырақ',
      allDrinks: 'Барлық сусындар',
      order: 'Тапсырыс беру',
      toTop: 'Жоғары',
      writeUs: 'Бізге жазу',
      send: 'Жіберу',
    },
    info: {
      hours: 'Жұмыс уақыты',
    },
    hero: {
      title: 'Дала ортасындағы кофе',
      subtitle:
        'Астанадағы кофехана. Дәнді өзіміз қуырамыз, ол ростерден кейін ' +
        'үш күнде нүктеге жетеді. Сағат 8:00-де ашыламыз.',
      ctaMenu: 'Мәзірді қарау',
      ctaFind: 'Бізді қалай табуға болады',
      imageAlt: 'Ағаш сөреде тұрған кофе стақаны',
    },
    facts: {
      beans: '18 түрлі дән',
      roast: 'Астанада қуырамыз',
      hours: '22:00-ге дейін ашық',
    },
    a11y: {
      skipToContent: 'Мазмұнға өту',
      langSwitcher: 'Тіл таңдау',
      switchTo: 'Қазақ тіліне ауысу',
      toHome: 'DALA COFFEE, беттің басына',
      mainNav: 'Негізгі навигация',
      openMenu: 'Мәзірді ашу',
      closeMenu: 'Мәзірді жабу',
    },
  },
};
