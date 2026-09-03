/**
 * Карта в секции «Адреса».
 *
 * По событию load самого фрейма переключаться нельзя. У кросс-доменного
 * iframe load срабатывает и на странице ошибки Chrome: проверено на
 * несуществующем домене и на отклонённом соединении — в обоих случаях
 * load вызывался, iframe получал data-loaded и серая заглушка браузера
 * закрывала собой запасной блок с адресами. Ровно то, ради чего блок
 * и делался, переставало работать именно тогда, когда было нужно.
 *
 * Поэтому карту показываем только после отдельного подтверждения, что хост
 * отвечает: HEAD-запрос без CORS. Тело не качаем, ответ непрозрачный —
 * достаточно самого факта ответа. Промис отклоняется, если сети нет,
 * и обрывается по таймауту, если хост молчит. Не ответил в отведённое
 * время — на месте карты остаётся блок с адресами.
 *
 * Проверку откладываем до подхода к вьюпорту: у iframe loading="lazy",
 * и тому, кто до адресов не долистал, лишний запрос ни к чему.
 */

const PING_URL = 'https://www.openstreetmap.org/favicon.ico';
const TIMEOUT_MS = 3000;
/** Столько же берём с запасом до вьюпорта, сколько браузер на lazy-загрузку. */
const ROOT_MARGIN = '300px';

/** @param {HTMLIFrameElement} frame */
async function revealIfReachable(frame) {
  try {
    await fetch(PING_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    frame.dataset.loaded = 'true';
  } catch {
    /* сети нет, хост не ответил или не уложился в таймаут — оставляем адреса */
  }
}

export function initMap() {
  const frame = document.querySelector('[data-map]');
  if (!frame) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      revealIfReachable(frame);
    },
    { rootMargin: ROOT_MARGIN },
  );

  observer.observe(frame);
}
