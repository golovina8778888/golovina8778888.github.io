/* Core UI: deliberately independent of Three.js, GSAP and WebGL. */
(function () {
'use strict';
const translations = {
    "en": {
        "heroTitle": "Global Growth.",
        "heroTitleSpan": "Since Day One.",
        "heroDesc": "Content, strategy and growth. We lead channels from first views to millions of global audience.",
        "heroDescSpan": "Strategy / Content / Automation / Monetization",
        "whyItWorksTitle": "Why It Works",
        "whyItWorksDesc": "We combine years of platform expertise with a data‑driven creative process. Always improving CTR, retention and revenue.",
        "statOwners": "Content Owners",
        "statRights": "Rights Managed",
        "statGrowth": "Growth Rate",
        "statUptime": "System Uptime",
        "capabilities": "Ca­pa­bi­li­ties",
        "service01Title": "01. Administration",
        "service01Desc": "Full channel management and optimization. Tech routine is on us, creativity is on you.",
        "service02Title": "02. AI Automation",
        "service02Desc": "Automation of processes with AI. Content adaptation, tagging and metadata generation.",
        "service03Title": "03. Monetization & Rights",
        "service03Desc": "Maximizing revenue and rights management (Content ID). Protecting your assets.",
        "service04Title": "04. Deep Analytics",
        "service04Desc": "Analytics and distribution. Combining expertise with data to improve CTR.",
        "ctaHeading": "Ready for Next Level?",
        "ctaButton": "Start Project",
        "footerCompanyTitle": "PLIPLY LTD.",
        "footerHQTitle": "Headquarters",
        "footerContactTitle": "Contact",
        "contactModalTitle": "Write to us",
        "contactModalLabel": "Your message (required, up to 4,000 characters)",
        "send": "Send",
        "cancel": "Cancel",
        "emailLabel": "Your email (required)",
        "emailHelp": "Compose an email to adm@pliply.pro. You will send it from your email app.",
        "serviceHelp": "Send your email address and message to PLIPLY via Formspree. Please do not include sensitive information.",
        "openEmail": "Open email app",
        "copyMessage": "Copy message",
        "directEmail": "Or email us directly:",
        "emailRequired": "Enter a valid email address so we can reply.",
        "messageRequired": "Enter a message (up to 4,000 characters).",
        "emailOpened": "Your email app was requested. Nothing has been sent by this website. If it did not open, copy your message and email adm@pliply.pro.",
        "longEmail": "This message is too long for a reliable email link. Copy it and send it to adm@pliply.pro from your email app.",
        "copied": "Message copied. Paste it into an email to adm@pliply.pro.",
        "copyFailed": "Copy was unavailable. Select the message text and copy it manually, then email adm@pliply.pro.",
        "sending": "Submitting…",
        "accepted": "The form service accepted your message. Email delivery has not been confirmed. Your text is kept here.",
        "rateLimited": "The form service limit was reached. Please wait before retrying, or email adm@pliply.pro. Your text is kept here.",
        "rejected": "The form service could not accept these details. Check the fields or email adm@pliply.pro. Your text is kept here.",
        "unavailable": "The form service is unavailable. Your text is kept here. You can retry or email adm@pliply.pro.",
        "unknown": "We could not confirm whether your message was accepted. Your text is kept here. Before retrying, consider emailing adm@pliply.pro to avoid duplicates.",
        "unconfigured": "Online submission is not connected. Please use your email app or copy the message.",
        "blocked": "The message could not be submitted. Please email adm@pliply.pro."
    },
    "ru": {
        "heroTitle": "Глобальный рост.",
        "heroTitleSpan": "С первого дня.",
        "heroDesc": "Контент, стратегия и рост. Мы ведём каналы от первых просмотров до миллионов аудитории по всему миру.",
        "heroDescSpan": "Стратегия / Контент / Автоматизация / Монетизация",
        "whyItWorksTitle": "Почему это работает",
        "whyItWorksDesc": "Мы комбинируем многолетнюю экспертизу платформы с креативным процессом, основанным на данных. Постоянно улучшаем CTR, удержание и доход.",
        "statOwners": "Контент‑владельцы",
        "statRights": "Управляемые права",
        "statGrowth": "Темп роста",
        "statUptime": "Стабильность системы",
        "capabilities": "Возмож­ности",
        "service01Title": "01. Администрирование",
        "service01Desc": "Полное администрирование и оптимизация каналов. Техническая рутина на нас, творчество — на вас.",
        "service02Title": "02. AI Автоматизация",
        "service02Desc": "Автоматизация процессов с помощью AI. Адаптация контента, тегирование и генерация метаданных.",
        "service03Title": "03. Монетизация и права",
        "service03Desc": "Максимизация дохода и управление правами (Content ID). Защищаем ваши активы.",
        "service04Title": "04. Глубокая аналитика",
        "service04Desc": "Аналитика и дистрибуция контента. Мы комбинируем экспертизу с данными для улучшения CTR.",
        "ctaHeading": "Готовы выйти на новый уровень?",
        "ctaButton": "Начать проект",
        "footerCompanyTitle": "PLIPLY LTD.",
        "footerHQTitle": "Штаб‑квартира",
        "footerContactTitle": "Контакты",
        "contactModalTitle": "Напишите нам",
        "contactModalLabel": "Ваше сообщение (обязательно, до 4 000 символов)",
        "send": "Отправить",
        "cancel": "Отмена",
        "emailLabel": "Ваша почта (обязательно)",
        "emailHelp": "Подготовьте письмо на adm@pliply.pro. Отправить его нужно из своей почтовой программы.",
        "serviceHelp": "Ваша почта и сообщение будут переданы PLIPLY через Formspree. Не указывайте конфиденциальные данные.",
        "openEmail": "Открыть почту",
        "copyMessage": "Копировать сообщение",
        "directEmail": "Или напишите напрямую:",
        "emailRequired": "Укажите корректный адрес почты для ответа.",
        "messageRequired": "Введите сообщение (до 4 000 символов).",
        "emailOpened": "Запрошено открытие почты. Сайт ничего не отправлял. Если почта не открылась, скопируйте сообщение и напишите на adm@pliply.pro.",
        "longEmail": "Сообщение слишком длинное для надёжной почтовой ссылки. Скопируйте его и отправьте на adm@pliply.pro из своей почты.",
        "copied": "Сообщение скопировано. Вставьте его в письмо на adm@pliply.pro.",
        "copyFailed": "Копирование недоступно. Выделите текст сообщения, скопируйте вручную и напишите на adm@pliply.pro.",
        "sending": "Передаём сообщение…",
        "accepted": "Сервис формы принял сообщение. Доставка письма не подтверждена. Ваш текст сохранён в этом окне.",
        "rateLimited": "Достигнут лимит сервиса. Подождите перед повтором или напишите на adm@pliply.pro. Текст остался в окне.",
        "rejected": "Сервис не принял эти данные. Проверьте поля или напишите на adm@pliply.pro. Текст остался в окне.",
        "unavailable": "Сервис формы недоступен. Текст остался в окне. Можно повторить попытку или написать на adm@pliply.pro.",
        "unknown": "Не удалось подтвердить приём сообщения. Текст остался в окне. Перед повтором лучше уточнить по adm@pliply.pro, чтобы избежать дублей.",
        "unconfigured": "Веб-отправка не подключена. Откройте почту или скопируйте сообщение.",
        "blocked": "Не удалось передать сообщение. Напишите на adm@pliply.pro."
    }
};
const modal = document.getElementById('contact-modal');
const form = document.getElementById('contact-form');
const email = document.getElementById('contact-email');
const message = document.getElementById('contact-message');
const submitButton = document.getElementById('contact-submit');
const transport = window.PliplyContact;
const endpoint = transport?.endpoint(window.PLIPLY_CONTACT?.endpoint);
let currentLang = 'en';
let statusKey = '';
let busy = false;
let accepted = false;
let opener;
let previousOverflow;

function t(key) { return translations[currentLang][key] || translations.en[key] || key; }
function readLanguage() {
    try { return localStorage.getItem('pliply-language') === 'ru' ? 'ru' : 'en'; }
    catch (_) { return 'en'; }
}
function setStatus(key) {
    statusKey = key;
    document.getElementById('contact-status').textContent = key ? t(key) : '';
}
function setLanguage(lang, remember = false) {
    currentLang = lang === 'ru' ? 'ru' : 'en';
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-lang]').forEach(button => {
        const active = button.dataset.lang === currentLang;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('nav').setAttribute('aria-label', currentLang === 'ru' ? 'Язык' : 'Language');
    document.getElementById('contact-help').textContent = t(endpoint ? 'serviceHelp' : 'emailHelp');
    updateSubmit();
    setStatus(statusKey);
    [email, message].forEach(field => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    if (remember) { try { localStorage.setItem('pliply-language', currentLang); } catch (_) { /* Memory-only choice still works. */ } }
}
function updateSubmit() {
    submitButton.textContent = t(busy ? 'sending' : endpoint ? 'send' : 'openEmail');
    submitButton.disabled = busy || accepted;
    email.readOnly = busy;
    message.readOnly = busy;
}
function validateField(field) {
    const valid = Boolean(field.value.trim()) && field.validity.valid &&
        field.value.length <= (field === email ? 254 : 4000);
    const error = document.getElementById(field === email ? 'email-error' : 'message-error');
    error.hidden = valid;
    error.textContent = valid ? '' : t(field === email ? 'emailRequired' : 'messageRequired');
    field.setAttribute('aria-invalid', String(!valid));
    return valid;
}
function draft() { return 'Reply to: ' + email.value.trim() + '\n\n' + message.value; }

document.querySelectorAll('[data-lang]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang, true));
});
document.getElementById('open-contact').addEventListener('click', event => {
    // The anchor remains an honest mailto fallback in browsers without dialog.
    if (typeof modal.showModal !== 'function') return;
    event.preventDefault();
    if (modal.open) return;
    opener = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    email.focus();
});
document.getElementById('close-contact').addEventListener('click', () => modal.close());
modal.addEventListener('cancel', event => { event.preventDefault(); modal.close(); });
modal.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow || '';
    if (opener?.isConnected) opener.focus({ preventScroll: true });
});
modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button:not(:disabled), input:not([tabindex="-1"]), textarea, a[href]')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
        event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
    }
});
[email, message].forEach(field => field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    // Editing explicitly permits a new submission; closing/reopening alone does not.
    if (accepted) { accepted = false; setStatus(''); updateSubmit(); }
}));

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || accepted) return;
    const emailValid = validateField(email), messageValid = validateField(message);
    if (!emailValid || !messageValid) { (!emailValid ? email : message).focus(); return; }
    if (document.getElementById('contact-website').value) { setStatus('blocked'); return; }
    if (!endpoint) {
        const link = transport?.mailto(email.value.trim(), message.value);
        if (!link) { setStatus('unconfigured'); return; }
        if (link.length > 1800) { setStatus('longEmail'); return; }
        setStatus('emailOpened');
        window.location.assign(link);
        return;
    }
    busy = true;
    updateSubmit();
    form.setAttribute('aria-busy', 'true');
    setStatus('sending');
    // Snapshot before awaiting; never send edits entered during a request.
    const sentEmail = email.value.trim(), sentMessage = message.value;
    try {
        const result = await transport.submit(endpoint, { email: sentEmail, message: sentMessage, language: currentLang, _gotcha: '' });
        accepted = result.state === 'accepted' && email.value.trim() === sentEmail && message.value === sentMessage;
        setStatus(result.state);
    } catch (_) {
        setStatus('unknown');
    } finally {
        busy = false;
        form.removeAttribute('aria-busy');
        updateSubmit();
    }
});
document.getElementById('copy-message').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(draft()); setStatus('copied'); }
    catch (_) { setStatus('copyFailed'); message.focus(); message.select(); }
});
setLanguage(readLanguage());
})();
