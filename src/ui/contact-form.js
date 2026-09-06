/**
 * Форма «Написать нам».
 *
 * Своего бэкенда нет: письма принимает Formspree. Валидация всё равно идёт
 * первой — запрос уходит, только если поля прошли проверку, иначе мы бы
 * тратили лимит сервиса на заведомый мусор. Встроенную валидацию браузера
 * отключает novalidate в разметке: её подсказки не переводятся вместе
 * с интерфейсом и звучат не нашим голосом.
 *
 * ЛИМИТ: бесплатный тариф Formspree — 50 писем в месяц на всю форму.
 * Пятьдесят первое письмо сервис не примет, и человек увидит сообщение
 * о неудачной отправке. Если поток вырастет, тариф нужно поднимать
 * или переносить приём на свой обработчик.
 *
 * В состоянии храним КЛЮЧИ ошибок и статусов, а не готовые строки: иначе
 * при переключении языка на экране остались бы русские сообщения.
 */

import { onLangChange, t } from '../i18n.js';

const ENDPOINT = 'https://formspree.io/f/xppzjgzo';

/** Достаточно, чтобы отсечь опечатку, и не настолько строго, чтобы врать. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_RE = /^[\d\s+()-]+$/;

const MIN_NAME = 2;
const MIN_MESSAGE = 10;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

const SUCCESS_KEY = 'form.statusSuccess';
const ERROR_KEY = 'form.statusError';
const NETWORK_KEY = 'form.statusNetwork';

/** @returns {string|null} ключ ошибки или null, если поле в порядке */
function checkName(value) {
  return value.trim().length >= MIN_NAME ? null : 'form.errors.name';
}

/**
 * Одно поле на телефон и почту: человеку не нужно выбирать, каким
 * способом с ним связаться, — он пишет то, что помнит. В Formspree оно
 * уходит под именем contact, а не email: полю email сервис назначает
 * reply-to письма, и телефон в этой роли всё ломает.
 */
function checkContact(value) {
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
  contact: checkContact,
  message: checkMessage,
};

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const statusEl = form.querySelector('[data-form-status]');
  const submitEl = form.querySelector('[data-form-submit]');
  const fields = [...form.querySelectorAll('[data-field]')];
  if (!statusEl || !submitEl || fields.length === 0) return;

  /** @type {Map<string, string>} имя поля → ключ ошибки */
  const errors = new Map();
  /** @type {string|null} */
  let statusKey = null;
  let isSending = false;

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
    // Адрес подставляем из словаря, а не пишем в строку сообщения: почта
    // уже есть в contacts.email, и менять её в двух местах никто не вспомнит.
    statusEl.textContent = statusKey ? t(statusKey, { email: t('contacts.email') }) : '';
    if (!statusKey) delete statusEl.dataset.state;
    // Всё, кроме «спасибо», — состояние error, то есть цвет alert.
    else statusEl.dataset.state = statusKey === SUCCESS_KEY ? 'ok' : 'error';
  };

  const setStatus = (key) => {
    statusKey = key;
    renderStatus();
  };

  /** Подпись кнопки зависит от того, летит ли сейчас запрос. */
  const renderSubmit = () => {
    submitEl.disabled = isSending;
    submitEl.textContent = t(isSending ? 'actions.sending' : 'actions.send');
  };

  const setSending = (value) => {
    isSending = value;
    renderSubmit();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Кнопка на время запроса disabled, но форму можно отправить и Enter'ом
    // из поля — второй заслон от двойной отправки нужен здесь.
    if (isSending) return;

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

    // Старый статус убираем до запроса: «спасибо» от прошлой отправки,
    // висящее рядом с «Отправляем», читается как ответ на новую.
    setStatus(null);

    let delivered = false;
    try {
      setSending(true);

      // Тело собираем из FormData: имена берутся из name= в разметке,
      // так что контракт с Formspree виден прямо в HTML. Сюда же попадает
      // ловушка _gotcha — по ней сервис молча отбрасывает ботов.
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      // Formspree отвечает 4xx на исчерпанный лимит, выключенную форму
      // и заблокированную отправку — для человека это та же неудача,
      // что и оборванная сеть.
      delivered = response.ok;
    } catch {
      // Сеть не ответила: fetch отклоняется до всякого статуса.
      delivered = false;
    } finally {
      setSending(false);
    }

    if (!delivered) {
      // Поля НЕ чистим: набранный текст — единственная копия сообщения,
      // и заставлять писать заново из-за нашей неудачи нельзя.
      setStatus(NETWORK_KEY);
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
    // translateTree уже вернул кнопке «Отправить» по data-i18n — если запрос
    // ещё летит, возвращаем «Отправляем» поверх перевода.
    renderSubmit();
  });
}
