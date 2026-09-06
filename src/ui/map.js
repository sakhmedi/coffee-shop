/**
 * Карта в секции «Адреса». Leaflet + светлые тайлы CARTO Positron.
 *
 * Карта здесь дополнение, а не источник информации: те же название, адрес
 * и часы лежат текстом в карточках под ней и видны всегда. Отсюда два решения.
 *
 * Первое: контейнер помечен aria-hidden, а не role="img". role="img" обещает
 * скринридеру картинку, которая что-то сообщает, — а сообщать ей нечего, всё
 * уже прочитано ниже. К тому же role="img" не убирает фокусируемые потомки
 * из табуляции, и фокус попадал бы на узлы, которых нет в дереве доступности.
 * Поэтому фокусируемых элементов внутри не остаётся вовсе: у карты
 * keyboard: false (Leaflet иначе вешает tabindex на контейнер), у маркеров
 * тоже, у кнопок зума tabindex="-1", всплывашка без кнопки закрытия.
 * Табуляция проходит секцию насквозь и в карте не застревает.
 *
 * Второе: атрибуция вынесена из контейнера в обычный текст под ним. Внутри
 * aria-hidden её ссылки были бы недоступны и скринридеру, и клавиатуре,
 * а атрибуция OpenStreetMap и CARTO обязательна.
 *
 * Библиотека грузится динамически и только при подходе к вьюпорту: Leaflet
 * с css весит больше всей остальной страницы, и тому, кто до адресов
 * не долистал, он не нужен. Отсюда же способ обработки отказа — любой сбой
 * (не загрузился модуль, не пришли тайлы) прячет контейнер целиком вместе
 * с атрибуцией. Пустая серая коробка на месте карты хуже, чем её отсутствие:
 * адреса-то на странице есть.
 */

import { places } from '../data/places.js';
import { onLangChange, t } from '../i18n.js';

/** Столько же, сколько браузер берёт с запасом на lazy-загрузку. */
const ROOT_MARGIN = '300px';

/**
 * Тайлы Esri World Light Gray Canvas: светлая минималистичная подложка
 * без цветных дорог и парков, рядом с тёплой палитрой сайта не спорит.
 *
 * Изначально сюда планировался CARTO Positron, но он с некоторых пор требует
 * API-ключ: без ключа тайлы приходят с диагональной надписью «API KEY
 * REQUIRED» по всему полотну — во всех вариантах (light_all, light_nolabels,
 * 1x, 2x) и на старом эндпоинте fastly тоже. Если ключ появится, вернуться
 * к Positron — это одна строка здесь и одна в атрибуции.
 *
 * Порядок координат у Esri {z}/{y}/{x}, а не {z}/{x}/{y}, как у большинства:
 * перепутать местами y и x означает получить карту другого места без ошибки.
 *
 * Атрибуция обязательна и лежит в разметке под картой: Esri и OpenStreetMap.
 */
const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/' +
  'Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const MAX_ZOOM = 16;

/** Если за это время не пришёл ни один тайл, считаем карту несостоявшейся. */
const TILE_TIMEOUT_MS = 8000;

/** Отступ от маркеров до краёв карты при fitBounds, в пикселях. */
const FIT_PADDING = 48;

const ICON_SIZE = [26, 34];

export function initMap() {
  const wrap = document.querySelector('[data-map-wrap]');
  const container = document.querySelector('[data-map]');
  const markerTpl = document.querySelector('[data-template="map-marker"]');
  const popupTpl = document.querySelector('[data-template="map-popup"]');
  if (!wrap || !container || !markerTpl || !popupTpl) return;

  let map = null;

  const fail = () => {
    map?.remove();
    map = null;
    wrap.hidden = true;
  };

  /**
   * Всплывашка: название, адрес и часы точки. У точки может не быть улицы
   * (парк), тогда строку убираем. Отсутствие ключа видно по тому, что t()
   * возвращает сам ключ, — это его задокументированное поведение.
   */
  const buildPopup = (place) => {
    const node = popupTpl.content.firstElementChild.cloneNode(true);
    const streetKey = `addresses.${place.id}.street`;
    const street = t(streetKey);

    node.querySelector('[data-popup-name]').textContent = t(`addresses.${place.id}.name`);
    node.querySelector('[data-popup-hours]').textContent = t(`addresses.${place.id}.hours`);

    const streetEl = node.querySelector('[data-popup-street]');
    if (street === streetKey) streetEl.remove();
    else streetEl.textContent = street;

    return node;
  };

  const build = async (L) => {
    // keyboard: false снимает tabindex с самого контейнера, attributionControl:
    // false — встроенную подпись: она лежала бы внутри aria-hidden.
    map = L.map(container, {
      keyboard: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    // Иконку собираем на каждый маркер отдельно, а не один раз на всех:
    // divIcon с готовым узлом вставляет его через appendChild, а тот
    // ПЕРЕНОСИТ узел, а не копирует. Один общий icon означал бы, что булавка
    // уезжает к последнему маркеру, а остальные остаются пустыми.
    // className пустой намеренно: leaflet-div-icon по умолчанию рисует белый
    // квадрат с рамкой, и он торчал бы из-под нашей булавки.
    const buildIcon = () =>
      L.divIcon({
        html: markerTpl.content.firstElementChild.cloneNode(true),
        className: '',
        iconSize: ICON_SIZE,
        iconAnchor: [ICON_SIZE[0] / 2, ICON_SIZE[1]],
        popupAnchor: [0, -ICON_SIZE[1] + 4],
      });

    const markers = places.map((place) => {
      const marker = L.marker(place.coords, {
        icon: buildIcon(),
        keyboard: false,
      }).addTo(map);
      marker.bindPopup(buildPopup(place), { closeButton: false });
      return { place, marker };
    });

    // Зум не задаём числом: обе точки должны попасть в кадр на любой ширине,
    // а на 375 и на 1440 для этого нужен разный масштаб.
    map.fitBounds(L.latLngBounds(places.map((place) => place.coords)), {
      padding: [FIT_PADDING, FIT_PADDING],
    });

    for (const link of container.querySelectorAll('.leaflet-control-zoom a')) {
      link.tabIndex = -1;
    }

    // Тайлы могут не прийти (нет сети, CDN недоступен). Слушаем оба исхода:
    // первый успешный тайл снимает подозрение, ошибка до него прячет карту.
    let tileSeen = false;
    const timer = setTimeout(() => {
      if (!tileSeen) fail();
    }, TILE_TIMEOUT_MS);

    const tiles = L.tileLayer(TILE_URL, { maxZoom: MAX_ZOOM });

    tiles.on('tileload', () => {
      tileSeen = true;
      clearTimeout(timer);
    });
    tiles.on('tileerror', () => {
      if (tileSeen) return;
      clearTimeout(timer);
      fail();
    });

    tiles.addTo(map);

    onLangChange(() => {
      for (const { place, marker } of markers) {
        marker.setPopupContent(buildPopup(place));
      }
    });
  };

  const start = async () => {
    try {
      // css тянем вместе с библиотекой: без него Leaflet раскладывает тайлы
      // в столбик, а не в сетку.
      const [leaflet] = await Promise.all([
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ]);
      await build(leaflet.default);
    } catch {
      // Модуль не загрузился или Leaflet упал на старте — карты не будет.
      fail();
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { rootMargin: ROOT_MARGIN },
  );

  observer.observe(container);
}
