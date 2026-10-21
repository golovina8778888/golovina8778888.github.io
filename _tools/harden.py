"""Generate/check controls that GitHub Pages supports in static HTML.

No imitation HTTP headers: frame-ancestors, HSTS and X-Frame-Options need a
server response and deliberately do not appear in this meta policy.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import base64
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
POLICY = (
    "default-src 'none'; script-src 'self'; script-src-attr 'none'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; "
    "connect-src https://formspree.io; object-src 'none'; base-uri 'none'; "
    "form-action 'none'; frame-src 'none'; worker-src 'none'; "
    "media-src 'none'; manifest-src 'self'; upgrade-insecure-requests"
)


def integrity(data):
    return 'sha384-' + base64.b64encode(hashlib.sha384(data).digest()).decode()


def hardened(source):
    source = re.sub(r'\s*<meta\b[^>]*(?:http-equiv="Content-Security-Policy"|name="referrer")[^>]*>', '', source, flags=re.I)
    source = re.sub(r'(<meta\s+charset\s*=\s*[\'"]?[^>]+>)',
                    lambda m: m[0] + '\n<meta http-equiv="Content-Security-Policy" content="' + POLICY + '">\n<meta name="referrer" content="no-referrer">',
                    source, count=1, flags=re.I)

    def script(match):
        path = ROOT / match[1]
        if not path.is_file():
            raise ValueError('Missing local script: ' + match[1])
        return '<script src="' + match[1] + '" integrity="' + integrity(path.read_bytes()) + '" defer></script>'

    return re.sub(r'<script src="([a-z-]+\.js)"[^>]*></script>', script, source)


class Controls(HTMLParser):
    def __init__(self):
        super().__init__()
        self.failures = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if any(k.startswith('on') for k in a):
            self.failures.append('Inline event handler')
        if tag in {'iframe', 'object', 'embed', 'base'}:
            self.failures.append('Unexpected active element: ' + tag)
        for key in ('src', 'href', 'action'):
            value = a.get(key, '').strip().lower()
            if value.startswith(('javascript:', 'http:', '//')):
                self.failures.append('Unsafe URL scheme')
        if tag == 'script' and not a.get('src'):
            self.failures.append('Inline script')
        if tag == 'script' and a.get('src', '').startswith(('http:', 'https:', '//', 'data:')):
            self.failures.append('External script')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    failures = []
    pages = sorted(ROOT.glob('*.html'))
    for page in pages:
        source = page.read_text()
        expected = hardened(source)
        if args.check and expected != source:
            failures.append(page.name + ': stale/missing policy or script integrity')
        elif not args.check:
            page.write_text(expected)
        controls = Controls()
        controls.feed(expected)
        failures.extend(page.name + ': ' + x for x in controls.failures)
    manifest = json.loads((ROOT / 'vendor/manifest.json').read_text())
    packages = json.loads((ROOT / '_tools/dependencies/package.json').read_text())['dependencies']
    expected_vendor = {
        f"vendor/three-{packages['three']}.min.js",
        f"vendor/gsap-{packages['gsap']}.min.js",
        f"vendor/ScrollTrigger-{packages['gsap']}.min.js",
    }
    if {item['path'] for item in manifest} != expected_vendor:
        failures.append('Audit versions and vendored runtime disagree')
    scene_resources = json.loads(re.search(r'const RESOURCES = (\[.*?\]);', (ROOT / 'scene.js').read_text())[1])
    if {(item['url'].lstrip('/'), item['integrity']) for item in scene_resources} != {(item['path'], item['integrity']) for item in manifest}:
        failures.append('Scene loader and vendor manifest disagree')
    for item in manifest:
        data = (ROOT / item['path']).read_bytes()
        if integrity(data) != item['integrity'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            failures.append(item['path'] + ': upstream checksum mismatch')
    print(json.dumps({'pages': len(pages), 'verified_vendor_files': len(manifest), 'failures': failures}, indent=2))
    raise SystemExit(bool(failures))


if __name__ == '__main__':
    main()
