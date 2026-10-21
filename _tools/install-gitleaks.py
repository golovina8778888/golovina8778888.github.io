"""Install only the checksum-pinned upstream Linux x64 release for CI."""
from pathlib import Path
import hashlib
import io
import sys
import tarfile
import urllib.request

URL = 'https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz'
SHA256 = '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'
data = urllib.request.urlopen(URL, timeout=60).read()
if hashlib.sha256(data).hexdigest() != SHA256:
    raise SystemExit('Gitleaks archive integrity mismatch')
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
    binary = archive.extractfile('gitleaks').read()
target = Path(sys.argv[1])
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(binary)
target.chmod(0o755)
print('Gitleaks 8.30.1: verified official release SHA-256')
