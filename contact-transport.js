/* Small transport boundary: no email delivery is inferred from HTTP success. */
(function (root) {
    'use strict';
    function endpoint(value) {
        if (typeof value !== 'string') return '';
        if (value !== value.trim()) return '';
        return /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(value) ? value : '';
    }
    function validPayload(payload) {
        return Boolean(payload && typeof payload.email === 'string' &&
            payload.email.trim().length <= 254 && /^[^\s@<>]+@[^\s@<>]+$/.test(payload.email.trim()) &&
            typeof payload.message === 'string' && payload.message.trim() &&
            payload.message.length <= 4000 && !payload._gotcha);
    }
    async function submit(url, payload, options = {}) {
        if (!endpoint(url)) return { state: 'unconfigured' };
        if (!validPayload(payload)) return { state: 'rejected' };
        let timer;
        try {
            const controller = new AbortController();
            timer = setTimeout(() => controller.abort(), options.timeout || 15000);
            const response = await (options.fetch || root.fetch)(url, {
                method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
                body: JSON.stringify({
                    email: payload.email.trim(), message: payload.message,
                    _subject: 'PLIPLY project inquiry', language: payload.language === 'ru' ? 'ru' : 'en', _gotcha: ''
                })
            });
            if (response.status === 429) return { state: 'rateLimited' };
            if (response.status === 422 || response.status === 400) return { state: 'rejected' };
            if (!response.ok) return { state: 'unavailable' };
            const data = await response.json();
            if (data && (typeof data.error === 'string' || Array.isArray(data.errors))) return { state: 'rejected' };
            // Same acknowledgement shape as @formspree/core's
            // isServerSuccessResponse. Never navigate to the returned `next`.
            return { state: data && typeof data.next === 'string' ? 'accepted' : 'unknown' };
        } catch (_) {
            // Timeout, CORS, malformed JSON and a lost response may happen after
            // acceptance. Never retry automatically or claim the message failed.
            return { state: 'unknown' };
        } finally { clearTimeout(timer); }
    }
    function mailto(email, message) {
        return 'mailto:adm@pliply.pro?subject=' + encodeURIComponent('New Project Inquiry') +
            '&body=' + encodeURIComponent('Reply to: ' + email + '\n\n' + message);
    }
    root.PliplyContact = Object.freeze({ endpoint, validPayload, submit, mailto });
})(typeof window === 'undefined' ? globalThis : window);
