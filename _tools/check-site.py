"""Check generated pages and asset integrity before GitHub Pages builds them."""
from pathlib import Path
from html.parser import HTMLParser
import base64
import hashlib
import re

root = Path(__file__).resolve().parent.parent
issues = []

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'link', 'img', 'a'):
            url = a.get('src') or a.get('href')
            if url and url.startswith('/') and not url.startswith('//'):
                self.references.append((url, a))

for page in (root / 'index.html', root / 'partners/index.html'):
    html = page.read_text()
    parser = References()
    parser.feed(html)
    if '<html lang="en"' not in html or re.search(r'[А-Яа-яЁё]', html):
        issues.append(f'{page.name}: non-English page')
    if 'name="robots" content="noindex' in html or 'Content-Security-Policy' not in html:
        issues.append(f'{page.name}: incorrect indexing or security metadata')
    if not any(url.endswith('.js') for url, _ in parser.references):
        issues.append(f'{page.name}: missing application bundle')
    for url, attrs in parser.references:
        target = root / url.lstrip('/')
        if not target.is_file() and url not in ('/', '/partners/'):
            issues.append(f'{page.name}: missing {url}')
        if url.startswith('/site-assets/') and target.is_file() and target.suffix in ('.js', '.css'):
            digest = 'sha384-' + base64.b64encode(hashlib.sha384(target.read_bytes()).digest()).decode()
            if attrs.get('integrity') != digest:
                issues.append(f'{page.name}: integrity mismatch {url}')

bundle = '\n'.join(p.read_text() for p in (root / 'site-assets').glob('*.js'))
if re.search(r'[А-Яа-яЁё]', bundle) or 'CMS' in bundle:
    issues.append('Unexpected Russian copy or internal CMS reference in public bundle')

print(f'Checked two English pages and {len(list((root / "site-assets").iterdir()))} assets')
for issue in issues:
    print(issue)
raise SystemExit(bool(issues))
