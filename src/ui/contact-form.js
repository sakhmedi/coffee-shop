/**
 * Форма «Написать нам».
 *
 * Бэкенда нет: submit обрабатывается здесь, никуда ничего не уходит,
 * при успехе форма просто очищается. Встроенную валидацию браузера
 * отключает novalidate в разметке — её подсказки не переводятся вместе
 * с интерфейсом и звучат не нашим голосом.
 *
 * В состоянии храним КЛЮЧИ ошибок, а не готовые строки: иначе при
 * переключении языка на экране остались бы русские сообщения.
 */

import { onLangChange, t } from '../i18n.js';

/** Достаточно, чтобы отсечь опечатку, и не настолько строго, чтобы врать. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_RE = /^[\d\s+()-]+$/;

const MIN_NAME = 2;
const MIN_MESSAGE = 10;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

const SUCCESS_KEY = 'form.statusSuccess';
const ERROR_KEY = 'form.statusError';

/** @returns {string|null} ключ ошибки или null, если поле в порядке */
function checkName(value) {
  return value.trim().length >= MIN_NAME ? null : 'form.errors.name';
}

/**
 * Одно поле на телефон и почту: человеку не нужно выбирать, каким
 * способом с ним связаться, — он пишет то, что помнит.
 */
function checkReply(value) {
  const raw = value.trim();
  if (!raw) return 'form.errors.contactEmpty';

  // Собака есть — значит, человек писал почту, и проверять надо её,
  // иначе «а@б» уехало бы в ветку телефона и получило чужое сообщение.
  if (raw.includes('@')) {
    return EMAIL_RE.test(raw) ? null : 'form.errors.contactInvalid';
  }

  const digits = raw.replace(/\D/g, '');
  const looksLikePhone =
    PHONE_ALLOWED_RE.test(raw) &&
    digits.length >= MIN_PHONE_DIGITS &&
    digits.length <= MAX_PHONE_DIGITS;

  return looksLikePhone ? null : 'form.errors.contactInvalid';
}

function checkMessage(value) {
  const raw = value.trim();
  if (!raw) return 'form.errors.messageEmpty';
  return raw.length >= MIN_MESSAGE ? null : 'form.errors.messageShort';
}

const CHECKS = {
  name: checkName,
  reply: checkReply,
  message: checkMessage,
};

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const statusEl = form.querySelector('[data-form-status]');
  const fields = [...form.querySelectorAll('[data-field]')];
  if (!statusEl || fields.length === 0) return;

  /** @type {Map<string, string>} имя поля → ключ ошибки */
  const errors = new Map();
  /** @type {string|null} */
  let statusKey = null;

  const validate = (field) => CHECKS[field.dataset.field]?.(field.value) ?? null;

  const renderField = (field) => {
    const key = errors.get(field.dataset.field) ?? null;
    const errorEl = form.querySelector(`[data-error="${field.dataset.field}"]`);

    // aria-invalid снимаем целиком, а не ставим "false": так поле не
    // упоминается в дереве доступности лишний раз.
    if (key) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');

    if (!errorEl) return;
    errorEl.textContent = key ? t(key) : '';
    errorEl.hidden = !key;
  };

  const renderStatus = () => {
    statusEl.textContent = statusKey ? t(statusKey) : '';
    if (!statusKey) delete statusEl.dataset.state;
    else statusEl.dataset.state = statusKey === SUCCESS_KEY ? 'ok' : 'error';
  };

  const setStatus = (key) => {
    statusKey = key;
    renderStatus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    errors.clear();
    for (const field of fields) {
      const key = validate(field);
      if (key) errors.set(field.dataset.field, key);
      renderField(field);
    }

    if (errors.size > 0) {
      setStatus(ERROR_KEY);
      // Фокус на первое поле с ошибкой: его сообщение прочитается
      // из aria-describedby, и сразу видно, куда смотреть.
      fields.find((field) => errors.has(field.dataset.field))?.focus();
      return;
    }

    form.reset();
    setStatus(SUCCESS_KEY);
  });

  form.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field) return;

    // Ответ уже получен, человек снова пишет — старое «спасибо» убираем.
    if (statusKey === SUCCESS_KEY) setStatus(null);

    if (!errors.has(field.dataset.field)) return;
    // Пока поле правят, новую ошибку не подсказываем: сообщение «слишком
    // коротко» на втором введённом символе — придирка. Снимаем старую,
    // когда значение стало корректным.
    if (validate(field)) return;

    errors.delete(field.dataset.field);
    renderField(field);
    if (errors.size === 0 && statusKey === ERROR_KEY) setStatus(null);
  });

  onLangChange(() => {
    for (const field of fields) renderField(field);
    renderStatus();
  });
}
