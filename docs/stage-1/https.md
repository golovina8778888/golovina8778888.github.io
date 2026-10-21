# HTTPS и перенаправления GitHub Pages

Проверено 21.10.2026. Сырые ответы: [https-before.json](https-before.json),
[Pages API](pages-before.json). Сертификат approved, домены pliply.pro и
www.pliply.pro, срок из API — 17.01.2027; `https_enforced=false`.

| Начальный URL | Сейчас | Цель после отдельного релиза |
|---|---|---|
| https://pliply.pro/ | 200 | 200 |
| http://pliply.pro/ | 200, HTTPS не навязывается | HTTP redirect → HTTPS |
| https://www.pliply.pro/ | 301 → https://pliply.pro/ | То же |
| http://www.pliply.pro/ | 301 → http://pliply.pro/ | Конечный адрес HTTPS; проверить всю цепочку |
| https://golovina8778888.github.io/ | 301 → http://pliply.pro/ | Конечный адрес HTTPS |

## Подготовленные настройки

- `CNAME` остаётся `pliply.pro`. Источник — ветка main, `/`, legacy build.
- Canonical и sitemap используют HTTPS на pliply.pro; robots ссылается на этот sitemap.
- `_config.yml` исключает инструкции, исходные архивы доказательств и локальные
  инструменты из публикации. Публичные старые HTML пока сохранены.
- HTML не содержит JavaScript-перехода с HTTP на HTTPS. Такой переход не был бы
  серверным 301 и не защищал бы исходный HTTP-запрос.

## Действие администратора после разрешения на релиз

В [Settings → Pages](https://github.com/golovina8778888/golovina8778888.github.io/settings/pages)
включить **Enforce HTTPS**. Это реальная настройка GitHub Pages, не файл в репозитории.
Право admin необходимо. Сертификат уже одобрен, поэтому не требуется удалять CNAME
или менять DNS. Настройка не менялась в этой задаче.

После распространения настройки проверить `curl -I` и полные цепочки `curl -IL`
для пяти адресов выше, а также `/contact.html?source=review` и `/work.html` через
HTTP/www/github.io: путь и query должны сохраниться, конечная схема — HTTPS,
без циклов и понижения до HTTP. Зафиксировать реальные коды; не обещать заранее
301 для каждого шага, пока GitHub не вернул его.

GitHub Pages не выполняет nginx-конфиги, `.htaccess`, Netlify `_redirects` или
произвольные HTTP-правила для старых путей. Включение HTTPS решает схему и
канонический домен, но не перенаправляет `/stats_old3.html` на новый кейс.
Для таких адресов после решения владельца доступны:

1. На Pages — сохранённая лёгкая HTML-страница с явной ссылкой/canonical;
   при согласовании meta refresh (HTTP **200**, не 301).
2. Настоящие HTTP 301/308 для произвольных путей — внешний HTTP-слой/другой
   хостинг с отдельным согласованием и настройкой. Сейчас не подключался.

HSTS, X-Frame-Options и Permissions-Policy нельзя включить файлом `_headers`
на GitHub Pages; meta-теги не заменяют эти HTTP-заголовки. Не добавлены фиктивные
конфиги. Сначала выполнить штатную настройку HTTPS и перепроверить ответы.

Источник: [официальная инструкция GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
