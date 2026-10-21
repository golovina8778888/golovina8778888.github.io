import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(source, "..");
const built = path.join(source, "dist/client");
const policy = "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src https://formsubmit.co; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'self'; upgrade-insecure-requests";

if (!existsSync(path.join(built, "index.html")) || !existsSync(path.join(built, "partners/index.html"))) {
  throw new Error("Run npm run build before exporting pages");
}

const generated = path.join(root, "site-assets");
rmSync(generated, { recursive: true, force: true });
cpSync(path.join(built, "site-assets"), generated, { recursive: true });
mkdirSync(path.join(root, "partners"), { recursive: true });

function integrity(file) {
  return "sha384-" + createHash("sha384").update(readFileSync(file)).digest("base64");
}

for (const page of ["index.html", "partners/index.html"]) {
  let html = readFileSync(path.join(built, page), "utf8");
  html = html.replace(/\s*<meta name="referrer"[^>]*>/, "");
  html = html.replace(
    /(<meta charset="UTF-8" \/>)/,
    `$1\n<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="referrer" content="no-referrer">`,
  );
  html = html.replace(/(<script\b[^>]*\bsrc="\/site-assets\/([^"]+)"[^>]*)(><\/script>)/g,
    (_, open, filename, close) => `${open} integrity="${integrity(path.join(generated, filename))}"${close}`);
  html = html.replace(/(<link\b[^>]*\bhref="\/site-assets\/([^"]+)"[^>]*)(>)/g,
    (_, open, filename, close) => `${open} integrity="${integrity(path.join(generated, filename))}"${close}`);
  if (!html.includes("Content-Security-Policy") || !html.includes("integrity=")) {
    throw new Error(`Missing production controls in ${page}`);
  }
  writeFileSync(path.join(root, page), html);
}
console.log("Exported two English pages and versioned assets for GitHub Pages");
