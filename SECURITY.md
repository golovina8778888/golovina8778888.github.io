# Security scope

This is a static GitHub Pages site, not a CMS login or a mail server.

- Only reviewed local JavaScript is allowed by the HTML Content Security Policy.
  Local scripts and the original Three.js/GSAP distributions carry SRI hashes.
- No secret credentials belong in site files, form configuration, issues or logs.
- Only the EN/RU preference is stored. Form drafts are not saved in browser storage.
- Form requests are limited to the exact approved HTTPS Formspree URL, omit cookies
  and referrer information, reject redirects, validate lengths and whitelist fields.
  This adapter is **not connected**. The current action opens an email draft.
- Project evidence is excluded from Pages output. Withholding it from the site does
  **not** remove copies already in this public repository, history or search caches.
- `python3 _tools/harden.py --check` verifies CSP and SRI. After editing first-party
  JavaScript, regenerate with `python3 _tools/harden.py` and rerun checks.
- The read-only security workflow scans for exposed credentials and known dependency
  vulnerabilities, then builds Jekyll and checks the real publication inventory.
  It does not deploy or merge. Scheduled checks begin after the workflow reaches main.

## Host and account controls

Enable Enforce HTTPS in GitHub Pages settings and verify all HTTP redirects.
Meta CSP cannot provide HSTS, X-Frame-Options or frame-ancestors; GitHub Pages does
not accept `_headers` or `.htaccess` configuration for these headers.

Protect the GitHub and domain registrar accounts with MFA, review authorized users,
apps and recovery methods, and verify domain ownership in GitHub Pages. Those
account settings cannot be inferred from source review. No account access changes,
password changes, DNS/MX changes or history rewriting are performed by this branch.

A clean source review, gitleaks result or dependency audit is not a guarantee of
absence of malware or account compromise. Report suspected incidents privately to
adm@pliply.pro; do not place credentials or confidential projects in a public issue.
