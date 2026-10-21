"""Local-only review server; fixtures never send mail or contact Formspree.
Run: python3 _tools/preview.py. Not a production form handler.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import time

ROOT = Path(__file__).resolve().parent.parent
COUNTS = {}
MODES = {'no-three', 'no-gsap', 'no-cdn', 'no-webgl', 'storage-denied', 'reduced-motion', 'no-js', 'accepted', 'rateLimited', 'rejected', 'unavailable', 'unknown', 'timeout'}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_bytes(self, data, content_type='text/html; charset=utf-8', status=200):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__test/counts':
            return self.send_bytes(json.dumps(COUNTS).encode(), 'application/json')
        if path.startswith('/__test/'):
            parts = path.strip('/').split('/')
            mode = parts[1] if len(parts) > 1 else ''
            resource = parts[2] if len(parts) > 2 else ''
            if mode not in MODES:
                return self.send_error(404)
            if not resource:
                s = (ROOT / 'index.html').read_text()
                s = s.replace('<head>', '<head><base href="/">')
                for name in ('scene.js', 'contact-config.js', 'contact-transport.js'):
                    s = s.replace('src="'+name+'"', 'src="/__test/'+mode+'/'+name+'"')
                if mode == 'storage-denied':
                    s = s.replace('<head>', '<head><script>Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage denied fixture")}});</script>')
                if mode == 'reduced-motion':
                    s = s.replace('<head>', '<head><script>const originalMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>q.includes("prefers-reduced-motion")?{matches:true,addEventListener(){}}:originalMatchMedia(q);</script>')
                    # Model the CSS half too; this is a fixture, not actual OS emulation.
                    s = s.replace('</head>', '<style>*,*::before,*::after{animation:none!important;transition:none!important}#canvas-webgl{display:none}</style></head>')
                if mode == 'no-cdn':
                    s = re.sub(r'<link[^>]*href="https://fonts[^>]*>', '', s)
                if mode == 'no-js':
                    s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
                return self.send_bytes(s.encode())
            if resource == 'scene.js':
                s = (ROOT / resource).read_text()
                if mode in ('no-three', 'no-gsap', 'no-cdn'):
                    def block(m):
                        value = m[0]
                        if mode == 'no-cdn' or (mode == 'no-three' and 'three.js' in value) or (mode == 'no-gsap' and '/gsap/' in value):
                            return 'http://127.0.0.1:8879/__blocked/'+mode+'.js'
                        return value
                    s = re.sub(r'https://cdnjs[^" ]+', block, s)
                if mode == 'no-webgl':
                    s = s.replace('const renderer = new THREE.WebGLRenderer(', 'const renderer = new (class {constructor(){throw new Error("WebGL fixture")}})(')
                return self.send_bytes(s.encode(), 'application/javascript')
            if resource == 'contact-config.js':
                connected = mode in ('accepted', 'rateLimited', 'rejected', 'unavailable', 'unknown', 'timeout')
                s = "window.PLIPLY_CONTACT={endpoint:" + json.dumps('https://formspree.io/f/localtest' if connected else '') + '};'
                return self.send_bytes(s.encode(), 'application/javascript')
            if resource == 'contact-transport.js':
                s = (ROOT / resource).read_text()
                # The production transport is exercised, replacing ONLY the network destination.
                s = s.replace('(options.fetch || root.fetch)(url,', "(options.fetch || root.fetch)('/__test/"+mode+"/submit',")
                if mode == 'timeout':
                    s = s.replace('options.timeout || 15000', 'options.timeout || 150')
                return self.send_bytes(s.encode(), 'application/javascript')
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        parts = urlsplit(self.path).path.strip('/').split('/')
        if len(parts) != 3 or parts[0] != '__test' or parts[2] != 'submit' or parts[1] not in MODES:
            return self.send_error(405)
        mode = parts[1]
        # Consume synthetic test data in memory; no persistence or forwarding.
        json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0'))))
        COUNTS[mode] = COUNTS.get(mode, 0) + 1
        if mode == 'accepted':
            time.sleep(.5)  # Gives a meaningful in-flight duplicate-submit check.
        if mode == 'timeout':
            time.sleep(.5)
        status = {'rateLimited':429, 'rejected':422, 'unavailable':503}.get(mode,200)
        body = b'<html>Not an acknowledgement</html>' if mode == 'unknown' else b'{"next":"https://formspree.io/thanks"}'
        try:
            self.send_bytes(body, 'application/json', status)
        except BrokenPipeError:
            pass  # Expected when the timeout fixture aborts.

if __name__ == '__main__':
    print('Local review: http://127.0.0.1:8879 (no real email endpoint)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8879), Handler).serve_forever()
