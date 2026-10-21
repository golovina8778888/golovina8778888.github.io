# PLIPLY static site

The existing HTML/CSS/JS design and GitHub Pages hosting remain. No framework or
runtime package installation is required. The current Pages source is main:/;
merging into main publishes the site, feature-branch updates do not.

## Checks and local review

```sh
python3 _tools/preview.py
# http://127.0.0.1:8879/
python3 _tools/harden.py --check
python3 _tools/check-static.py
node --test _tests/*.test.cjs
npm audit --omit=dev --prefix _tools/dependencies
```

`_tools/preview.py` binds to loopback by default, denies excluded/private paths,
and has local-only `/__test/` fixtures. These never send email. It is not a backend.

- `index.html`, `main.css`, `main.js`: existing EN/RU home and accessible dialog.
- `scene.js`, `vendor/`: the same original 3D libraries, now local with SRI and
  upstream checksum verification. No external JavaScript is loaded by the site.
- `contact-config.js`, `contact-transport.js`: unconnected form adapter. Current
  action prepares a mail draft or copies text, without claiming delivery.
- Nine old Work/Stats URLs show a confidentiality notice. Their former project
  images, root analytics files, evidence, tools and unused app.js are excluded
  from the Pages build. Source history remains public; this is not secure erasure.
- `docs/security-2026-10-21/verification.md`: current verification and limitations.
- `.github/workflows/security.yml`: tests, credential scan, dependency audit and
  actual Jekyll publication checks, with a read-only repository token.

When changing a local script, run `python3 _tools/harden.py` to update its SRI.
A dependency update must update the audit lockfile, vendored bytes, licenses,
manifest and scene loader together, then be reviewed before merging.

Only the EN/RU choice is saved in localStorage. Form drafts stay in page memory;
closing the dialog retains them and reloading loses them. User text is never
inserted as HTML. Offline/WebGL/library failure leaves the core interface working.

See [security scope](SECURITY.md), [HTTPS runbook](docs/stage-1/https.md), and
[form setup](docs/stage-1/form-setup.md). Enforce HTTPS is a host setting, not an
HTML redirect. Form delivery needs a real verified provider endpoint and inbox
receipt test. Domain and corporate email configuration are unchanged.
