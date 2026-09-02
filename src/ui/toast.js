/**
 * Короткое подтверждение действия.
 *
 * Регион живёт в разметке постоянно и помечен aria-live="polite":
 * скринридер объявляет смену текста. Если бы элемент создавался
 * на лету или прятался через display:none, объявления бы не было.
 */

const VISIBLE_MS = 2600;
const FADE_MS = 220;

let hideTimer = null;
let clearTimer = null;

/** @param {string} message */
export function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;

  clearTimeout(hideTimer);
  clearTimeout(clearTimer);

  toast.textContent = message;
  toast.dataset.visible = 'true';

  hideTimer = setTimeout(() => {
    delete toast.dataset.visible;
    // Текст убираем только после анимации: иначе тост схлопнется на глазах.
    clearTimer = setTimeout(() => {
      toast.textContent = '';
    }, FADE_MS);
  }, VISIBLE_MS);
}
