"""Fail a real Jekyll build if it publishes private evidence or extra files."""
from pathlib import Path
import sys
from harden import Controls, POLICY

root = Path(__file__).resolve().parent.parent
published = Path(sys.argv[1]).resolve()
allowed = {p.name for p in root.glob('*.html')} | {
    'main.css', 'styles.css', 'main.js', 'scene.js', 'contact-config.js',
    'contact-transport.js', 'favicon.png', 'preview-logo.png', 'logo.png',
    'robots.txt', 'sitemap.xml', 'CNAME',
}
allowed |= {'vendor/' + p.name for p in (root / 'vendor').iterdir() if p.suffix in {'.js', '.txt'}}
files = [p for p in published.rglob('*') if p.is_file()]
failures = []
actual = {p.relative_to(published).as_posix() for p in files}
failures.extend('Missing public asset: ' + name for name in sorted(allowed - actual))
if not (published / 'index.html').is_file():
    failures.append('No built index.html')
for path in files:
    name = path.relative_to(published).as_posix()
    if name not in allowed:
        failures.append('Unexpected publication: ' + name)
    if path.suffix == '.html':
        text = path.read_text()
        if POLICY not in text:
            failures.append('Missing content policy: ' + name)
        parser = Controls()
        parser.feed(text)
        failures.extend(name + ': ' + x for x in parser.failures)
print(f'Published files checked: {len(files)}')
for failure in failures:
    print(failure)
raise SystemExit(bool(failures))
