"""Local review of Pages exclusions and failure cases. Never sends real email."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import argparse
import re
import time

ROOT = Path(__file__).resolve().parent.parent
COUNTS = {}
MODES = {'no-three', 'no-gsap', 'no-cdn', 'no-webgl', 'storage-denied', 'reduced-motion', 'no-js', 'accepted', 'rateLimited', 'rejected', 'unavailable', 'unknown', 'timeout', 'transport-error'}
EXCLUDED = [line[4:] for line in (ROOT / '_config.yml').read_text().splitlines() if line.startswith('  - ')]


def excluded(path):
    parts = unquote(path).strip('/').split('/')
    return any(part.startswith('.') for part in parts) or any('/'.join(parts) == item or '/'.join(parts).startswith(item + '/') for item in EXCLUDED)


def fixture_resource(mode, name):
    s = (ROOT / name).read_text()
    if name == 'scene.js':
        if mode in {'no-three', 'no-gsap', 'no-cdn'}:
            def block(m):
                value = m[0]
                if mode == 'no-cdn' or (mode == 'no-three' and '/three-' in value) or (mode == 'no-gsap' and '/gsap-' in value):
                    return '/__blocked/' + mode + '.js'
                return value
            s = re.sub(r'/vendor/[^" ]+', block, s)
        if mode == 'no-webgl':
            s = s.replace('const renderer = new THREE.WebGLRenderer(', 'const renderer = new (class {constructor(){throw new Error("WebGL fixture")}})(')
    if name == 'contact-config.js':
        connected = mode in {'accepted', 'rateLimited', 'rejected', 'unavailable', 'unknown', 'timeout', 'transport-error'}
        s = 'window.PLIPLY_CONTACT={endpoint:' + json.dumps('https://formspree.io/f/localtest' if connected else '') + '};'
    if name == 'contact-transport.js':
        s = s.replace('(options.fetch || root.fetch)(url,', "(options.fetch || root.fetch)('/__test/" + mode + "/submit',")
        if mode == 'timeout':
            s = s.replace('options.timeout || 15000', 'options.timeout || 150')
        if mode == 'transport-error':
            s = s.replace("if (!endpoint(url)) return { state: 'unconfigured' };", 'throw new Error("Unexpected transport fixture");')
    return s


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_bytes(self, data, content_type='text/html; charset=utf-8', status=200, head=False):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if not head:
            self.wfile.write(data)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_HEAD(self):
        if excluded(urlsplit(self.path).path):
            return self.send_error(404)
        return super().do_HEAD()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__test/counts':
            return self.send_bytes(json.dumps(COUNTS).encode(), 'application/json')
        if path == '/__test/viewports':
            frames = ''.join('<h2>' + str(w) + ' px</h2><iframe title="' + str(w) + 'px" src="/" style="width:' + str(w) + 'px;height:844px;border:1px solid #555"></iframe>' for w in (320,390,768,1440))
            return self.send_bytes(('<!doctype html><title>Local viewport review</title>' + frames).encode())
        if path == '/__test/csp':
            s = (ROOT / 'index.html').read_text().replace('href="main.css"', 'href="/main.css"')
            s = re.sub(r'src="([a-z-]+\.js)"', r'src="/\1"', s)
            s = s.replace('</body>', '<script>document.body.dataset.inlineExecuted="yes"</script><button id="inline-handler-probe" onclick="document.body.dataset.handlerExecuted=\'yes\'">CSP test</button><script src="https://example.invalid/probe.js"></script></body>')
            return self.send_bytes(s.encode())
        if path.startswith('/__test/'):
            parts = path.strip('/').split('/')
            mode = parts[1] if len(parts) > 1 else ''
            resource = parts[2] if len(parts) > 2 else ''
            if mode not in MODES:
                return self.send_error(404)
            if resource == 'setup.js':
                s = ''
                if mode == 'storage-denied':
                    s = 'Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage denied fixture")}});'
                if mode == 'reduced-motion':
                    s = 'const originalMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>q.includes("prefers-reduced-motion")?{matches:true,addEventListener(){}}:originalMatchMedia(q);'
                return self.send_bytes(s.encode(), 'application/javascript')
            if resource in {'scene.js','contact-config.js','contact-transport.js'}:
                return self.send_bytes(fixture_resource(mode,resource).encode(),'application/javascript')
            if resource:
                return self.send_error(404)
            s = (ROOT / 'index.html').read_text().replace('href="main.css"', 'href="/main.css"')
            s = s.replace('connect-src https://formsubmit.co;', "connect-src 'self';")
            s = s.replace('src="main.js"', 'src="/main.js"')
            for name in ('scene.js','contact-config.js','contact-transport.js'):
                s = re.sub(r'<script src="' + re.escape(name) + r'"[^>]*></script>', '<script src="/__test/' + mode + '/' + name + '" defer></script>', s)
            if mode in {'storage-denied','reduced-motion'}:
                s = s.replace('<link rel="stylesheet" href="/main.css">', '<script src="/__test/' + mode + '/setup.js"></script><link rel="stylesheet" href="/main.css">')
            if mode == 'reduced-motion':
                s = s.replace('</head>', '<style>*,*::before,*::after{animation:none!important;transition:none!important}#canvas-webgl{display:none}</style></head>')
            if mode == 'no-cdn':
                s = re.sub(r'<link[^>]*href="https://fonts[^>]*>', '', s)
            if mode == 'no-js':
                s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
            return self.send_bytes(s.encode())
        if excluded(path):
            return self.send_error(404)
        # GitHub Pages also exposes existing .html pages without their extension.
        if not Path(path).suffix and path != '/' and (ROOT / (path.lstrip('/') + '.html')).is_file():
            return self.send_bytes((ROOT / (path.lstrip('/') + '.html')).read_bytes())
        return super().do_GET()

    def do_POST(self):
        parts = urlsplit(self.path).path.strip('/').split('/')
        if len(parts) != 3 or parts[0] != '__test' or parts[2] != 'submit' or parts[1] not in MODES:
            return self.send_error(405)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 1 or length > 16384:
                return self.send_error(413)
            json.loads(self.rfile.read(length))
        except (ValueError, json.JSONDecodeError):
            return self.send_error(400)
        mode = parts[1]
        COUNTS[mode] = COUNTS.get(mode, 0) + 1
        if mode in {'accepted','timeout'}:
            time.sleep(.5)
        status = {'rateLimited':429,'rejected':422,'unavailable':503}.get(mode,200)
        body = b'<html>Not an acknowledgement</html>' if mode == 'unknown' else b'{"next":"https://formspree.io/thanks"}'
        try:
            self.send_bytes(body,'application/json',status)
        except BrokenPipeError:
            pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8879)
    args = parser.parse_args()
    print(f'Local review: http://{args.host}:{args.port} (no real email endpoint)', flush=True)
    ThreadingHTTPServer((args.host,args.port),Handler).serve_forever()
