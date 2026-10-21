"""Verify the GitHub Pages artifact contains only the English site."""
from pathlib import Path
from html.parser import HTMLParser
import sys
from harden import Controls, POLICY

root = Path(__file__).resolve().parent.parent
published = Path(sys.argv[1]).resolve()
required = {
    'index.html', 'partners/index.html', '404.html', 'favicon.png',
    'CNAME', 'robots.txt', 'sitemap.xml',
    # GitHub Pages' default theme can add this file.
    'assets/css/style.css',
}
required.update('site-assets/' + p.name for p in (root / 'site-assets').iterdir() if p.is_file())
actual = {p.relative_to(published).as_posix() for p in published.rglob('*') if p.is_file()}
errors = [f'Missing: {p}' for p in sorted(required - actual)]
errors += [f'Unexpected publication: {p}' for p in sorted(actual - required)]

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src', '').startswith('/site-assets/'):
            self.assets.append(attrs)
        if tag == 'link' and attrs.get('href', '').startswith('/site-assets/'):
            self.assets.append(attrs)

for name in ('index.html', 'partners/index.html', '404.html'):
    file = published / name
    if not file.is_file():
        continue
    html = file.read_text()
    if POLICY not in html:
        errors.append(f'{name}: missing CSP')
    if '<html lang="en"' not in html:
        errors.append(f'{name}: not English')
    controls = Controls()
    controls.feed(html)
    errors += [f'{name}: {failure}' for failure in controls.failures]
    if name != '404.html':
        links = Links()
        links.feed(html)
        if not links.assets or any(not link.get('integrity', '').startswith('sha384-') for link in links.assets):
            errors.append(f'{name}: missing generated assets or integrity')
        if 'noindex' in html.lower():
            errors.append(f'{name}: indexing disabled')

print(f'Published files checked: {len(actual)}')
for error in errors:
    print(error)
raise SystemExit(bool(errors))
