"""Check published root HTML/CSS references without external requests."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re
import json

ROOT = Path(__file__).resolve().parent.parent
references, failures = [], []
def check(value, source):
    u = urlsplit(value)
    if u.scheme or u.netloc or not u.path:
        return
    path = ROOT / unquote(u.path.lstrip('/'))
    references.append({'source':source, 'path':str(path.relative_to(ROOT))})
    if not path.exists(): failures.append(references[-1])

class Parser(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.source=source; self.h1=0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'h1': self.h1 += 1
        key = 'src' if tag in ('script', 'img') else 'href' if tag in ('link','a') else ''
        if key and a.get(key): check(a[key],self.source)

pages=[]
for f in ROOT.glob('*.html'):
    s=f.read_text();p=Parser(f.name);p.feed(s)
    pages.append({'page':f.name,'h1':p.h1})
    if p.h1!=1: failures.append({'source':f.name,'error':'Expected exactly one H1'})
    for match in re.findall(r'url\([\'"]?(.*?)[\'"]?\)',s): check(match,f.name)
for f in ROOT.glob('*.css'):
    s=f.read_text()
    for match in re.findall(r'url\([\'"]?(.*?)[\'"]?\)',s): check(match,f.name)
    if s.count('{') != s.count('}'): failures.append({'source':f.name,'error':'Unbalanced braces'})
s=(ROOT/'main.js').read_text()
dictionary=json.loads(re.search(r'const translations = (\{.*?\});\nconst modal',s,re.S)[1])
keys=set(re.findall(r'data-i18n="([^"]+)"',(ROOT/'index.html').read_text()))
for lang, values in dictionary.items():
    if keys-set(values): failures.append({'source':'main.js','missing_translation':list(keys-set(values)),'lang':lang})
result={'pages':pages,'local_references_checked':len(references),'failures':failures}
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(bool(failures))
