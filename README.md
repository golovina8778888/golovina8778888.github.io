# PLIPLY static site

HTML, CSS and browser JavaScript; no framework, package install or backend.
Production is **GitHub Pages, `main:/`, legacy build**, with `CNAME=pliply.pro`.
Pushing a feature branch does not publish it. Merging into `main` publishes it.

## Local review

```sh
python3 _tools/preview.py
# Open http://127.0.0.1:8879/
node --test _tests/*.test.cjs
```

The server binds only to 127.0.0.1. `/__test/<mode>/` routes are local fixtures,
never email handlers. See `_tools/preview.py` for available modes. Their POSTs
stay in memory on this computer. The fixtures never forward to Formspree.
Do not publish the preview server as a backend.

## Site files

- `index.html`, `main.css`, `main.js`: current EN/RU home and accessible dialog.
- `contact-config.js`, `contact-transport.js`: **unconnected** service adapter;
  current action prepares an email draft or copies text, without claiming delivery.
- `scene.js`: optional, pinned Three.js r128 / GSAP 3.12.2 / ScrollTrigger.
  Loaded asynchronously with SRI; reduced motion skips it; failures hide it.
- Other HTML + `styles.css`: retained legacy pages; old `app.js` is no longer
  loaded on Stats because those pages contain no canvas mount.
- `docs/stage-1`: URL decisions, HTTPS/form setup and review evidence.
  Excluded from the Pages build along with local tools/tests by `_config.yml`.

Language is EN on a fresh visit; only the choice `en`/`ru` is saved under
`pliply-language`. Storage failures use the current in-memory choice.
Form drafts stay in the open page's memory, not localStorage or analytics;
closing the dialog retains them, reloading the page loses them.

## Before publication

Read [stage 1 decisions](docs/stage-1/owner-decisions.md),
[URL map](docs/stage-1/url-map.md),
[HTTPS runbook](docs/stage-1/https.md) and
[form setup](docs/stage-1/form-setup.md).
Review `docs/stage-1/verification.md` and repeat the listed checks after changes.
No DNS/MX/SPF/DMARC changes are part of this branch.

Only after separate publication authorization: merge the reviewed PR, wait for
the Pages build, verify HTTPS and all retained paths. Enable Enforce HTTPS in
Pages settings as documented; this is not controlled by an HTML file.
Keep `CNAME`. If necessary, revert the merge commit with a new commit on `main`
and let Pages rebuild; do not rewrite history. Pages settings must be rolled
back separately if changed. Confirm any form receipt in the destination inbox
after an explicitly authorized test; an HTTP acknowledgement is insufficient.
