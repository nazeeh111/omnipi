import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
const port = Number(process.env.PORT) || 4173;
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(path)).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', pathname.includes('/data/') ? 'public, max-age=86400' : 'no-cache');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`OmniPi at http://127.0.0.1:${port}`));
